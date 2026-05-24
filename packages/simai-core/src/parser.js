import { TokenType } from './token-type.js';

const isStrictDecimal = (str) => /^\d+(?:\.\d+)?$/.test(str);

export class Parser {
    constructor(tokens, errors = []) {
        this.tokens = tokens;
        this.errors = errors; // initial tokenization errors
        this.current = 0;
    }

    isAtEnd() {
        return this.current >= this.tokens.length;
    }

    peek() {
        return this.isAtEnd() ? null : this.tokens[this.current];
    }

    peekNext() {
        if (this.current + 1 >= this.tokens.length) return null;
        return this.tokens[this.current + 1];
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        const token = this.tokens[this.current - 1];
        if (this.inSlideChain && this.slideTokens) {
            this.slideTokens.add(token);
        }
        return token;
    }

    validate() {
        this.slideTokens = new Set();
        this.inSlideChain = false;

        let hasE = false;

        while (!this.isAtEnd()) {
            const token = this.peek();

            if (token.type === TokenType.EndOfFile) {
                hasE = true;
                this.advance();
                // Check if notes are written after E
                if (!this.isAtEnd()) {
                    let trailingNotes = false;
                    for (let i = this.current; i < this.tokens.length; i++) {
                        if (this.tokens[i].type !== TokenType.TimeStep && this.tokens[i].type !== TokenType.EndOfFile) {
                            trailingNotes = true;
                            break;
                        }
                    }
                    if (trailingNotes) {
                        this.errors.push({
                            line: token.line,
                            col: token.col,
                            message: "已讀取到譜面結束標記 'E'。後續的音符宣告將被忽略。",
                            severity: 'Warning',
                            snippet: 'E'
                        });
                    }
                }
                break;
            }

            if (token.type === TokenType.Tempo) {
                this.validateTempo(token);
                this.advance();
                continue;
            }

            if (token.type === TokenType.Subdivision) {
                this.validateSubdivision(token);
                this.advance();
                continue;
            }

            if (token.type === TokenType.Location || token.type === TokenType.Slide) {
                this.validateNoteDeclaration();
                continue;
            }

            if (token.type === TokenType.TimeStep || token.type === TokenType.EachDivider) {
                // delimiters can stand alone
                this.advance();
                continue;
            }

            if (token.type === TokenType.Duration || token.type === TokenType.SlideJoiner || token.type === TokenType.Decorator) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `非預期的語法字元 '${token.value}'。音符元素必須以位置（按鍵數字或觸控區域）開頭。`,
                    severity: 'Error',
                    snippet: token.value
                });
                this.advance();
                continue;
            }

            // Fallback for error tokens
            this.advance();
        }

        if (!hasE) {
            this.errors.push({
                line: this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].line : 1,
                col: this.tokens.length > 0 ? this.tokens[this.tokens.length - 1].col : 1,
                message: "譜面數據結尾缺少結束標記 'E'。",
                severity: 'Warning',
                snippet: ''
            });
        }

        // Run validations that depend on parsing/slide tokens context
        this.checkConsecutiveButtons();
        this.checkDuplicateBothStarts();

        // Sort errors by line and column
        this.errors.sort((a, b) => {
            if (a.line !== b.line) return a.line - b.line;
            return a.col - b.col;
        });

        return this.errors;
    }

    validateTempo(token) {
        if (!isStrictDecimal(token.value)) {
            this.errors.push({
                line: token.line,
                col: token.col,
                message: `BPM 數值 '${token.value}' 必須是正數。`,
                severity: 'Error',
                snippet: `(${token.value})`
            });
        }
    }

    validateSubdivision(token) {
        const val = token.value;
        if (val.startsWith('#')) {
            const secsStr = val.substring(1);
            if (!isStrictDecimal(secsStr)) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `分音時間設定 '${val}' 必須指定為正的秒數。`,
                    severity: 'Error',
                    snippet: `{${val}}`
                });
            }
        } else {
            if (!isStrictDecimal(val)) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `分音數值 '${val}' 必須是正數。`,
                    severity: 'Error',
                    snippet: `{${val}}`
                });
            }
        }
    }

    validateNoteDeclaration() {
        const token = this.peek();
        let isSimpleTap = false;
        let noteType = 'Tap';

        if (token.type === TokenType.Location) {
            const startToken = this.advance(); // Consume Note start (Location)
            isSimpleTap = (startToken.value >= '1' && startToken.value <= '8');

            if (startToken.value.length > 1 && startToken.value !== 'C') {
                noteType = 'Touch';
                isSimpleTap = false;
            }

            // Parse modifiers
            while (!this.isAtEnd() && this.peek().type === TokenType.Decorator) {
                const dec = this.advance();
                isSimpleTap = false;
                if (dec.value === 'h') {
                    noteType = 'Hold';
                }
            }

            // Parse optional duration block for Hold
            if (noteType === 'Hold') {
                if (!this.isAtEnd() && this.peek().type === TokenType.Duration) {
                    this.validateDurationBlock(this.advance());
                }
            }

            // Parse Slide chains
            if (!this.isAtEnd() && this.peek().type === TokenType.Slide) {
                isSimpleTap = false;
                this.parseSlideChain(startToken);
            }
        } else if (token.type === TokenType.Slide) {
            // Note starts directly with a slide operator (e.g. ^1[90#1:1])
            isSimpleTap = false;
            this.parseSlideChain(null);
        }

        // Enforce that only simple Taps can be written consecutively without a separator
        if (!this.isAtEnd() && (this.peek().type === TokenType.Location || this.peek().type === TokenType.Slide)) {
            const nextTok = this.peek();
            const nextNextTok = this.peekNext();

            let nextIsSimpleTap = (nextTok.type === TokenType.Location && nextTok.value >= '1' && nextTok.value <= '8');
            if (nextNextTok) {
                if (nextNextTok.type === TokenType.Decorator || nextNextTok.type === TokenType.Slide) {
                    nextIsSimpleTap = false;
                }
            }

            if (!isSimpleTap || !nextIsSimpleTap) {
                this.errors.push({
                    line: nextTok.line,
                    col: nextTok.col,
                    message: `音符之間缺少分隔符。除簡單單擊外，同時進行的音符必須使用 '/' 或 '\`' 分隔（例如：'3/1-4'）。`,
                    severity: 'Error',
                    snippet: nextTok.value
                });
            }
        }
    }

    parseSlideChain(startToken) {
        this.inSlideChain = true;
        try {
            let chainActive = true;

            while (chainActive && !this.isAtEnd()) {
                const slideOp = this.advance(); // consume Slide operator (e.g. -)
                let hasDuration = false;
                
                // Read target vertices for the first segment
                let vertices = [];
                while (!this.isAtEnd() && this.peek().type === TokenType.Location) {
                    vertices.push(this.advance());
                }

                 if (vertices.length === 0) {
                    this.errors.push({
                        line: slideOp.line,
                        col: slideOp.col,
                        message: `Slide 運算子 '${slideOp.value}' 缺少目標按鍵/感應區域。`,
                        severity: 'Error',
                        snippet: slideOp.value
                    });
                } else if (slideOp.value === 'V') {
                    if (vertices.length !== 2) {
                        this.errors.push({
                            line: slideOp.line,
                            col: slideOp.col,
                            message: `V 字形 Slide 運算子 'V' 需要剛好 2 個目標頂點（例如：'6V42'），但發現了 ${vertices.length} 個。`,
                            severity: 'Error',
                            snippet: slideOp.value + vertices.map(v => v.value).join('')
                        });
                    } else {
                        this.validateSlidePath(startToken, slideOp, vertices);
                    }
                } else {
                    if (vertices.length !== 1) {
                        this.errors.push({
                            line: slideOp.line,
                            col: slideOp.col,
                            message: `Slide 運算子 '${slideOp.value}' 後方只能接 1 個目標按鍵/感應區域（例如：'1${slideOp.value}5'），但發現了 ${vertices.length} 個（'${vertices.map(v => v.value).join('')}'）。`,
                            severity: 'Error',
                            snippet: slideOp.value + vertices.map(v => v.value).join('')
                        });
                    } else {
                        this.validateSlidePath(startToken, slideOp, vertices);
                    }
                }

                let prevEndToken = vertices.length > 0 ? vertices[vertices.length - 1] : null;

                // Read subsequent slide segments in the same path (multi-segment slide)
                while (!this.isAtEnd() && this.peek().type === TokenType.Slide) {
                    const nextSlideOp = this.advance();
                    let nextVertices = [];
                    while (!this.isAtEnd() && this.peek().type === TokenType.Location) {
                        nextVertices.push(this.advance());
                    }
                    if (nextVertices.length === 0) {
                        this.errors.push({
                            line: nextSlideOp.line,
                            col: nextSlideOp.col,
                            message: `Slide 運算子 '${nextSlideOp.value}' 缺少目標按鍵/感應區域。`,
                            severity: 'Error',
                            snippet: nextSlideOp.value
                        });
                    } else if (nextSlideOp.value === 'V') {
                        if (nextVertices.length !== 2) {
                            this.errors.push({
                                line: nextSlideOp.line,
                                col: nextSlideOp.col,
                                message: `V 字形 Slide 運算子 'V' 需要剛好 2 個目標頂點（例如：'6V42'），但發現了 ${nextVertices.length} 個。`,
                                severity: 'Error',
                                snippet: nextSlideOp.value + nextVertices.map(v => v.value).join('')
                            });
                        } else {
                            if (prevEndToken) {
                                this.validateSlidePath(prevEndToken, nextSlideOp, nextVertices);
                            }
                        }
                    } else {
                        if (nextVertices.length !== 1) {
                            this.errors.push({
                                line: nextSlideOp.line,
                                col: nextSlideOp.col,
                                message: `Slide 運算子 '${nextSlideOp.value}' 後方只能接 1 個目標按鍵/感應區域（例如：'1${nextSlideOp.value}5'），但發現了 ${nextVertices.length} 個（'${nextVertices.map(v => v.value).join('')}'）。`,
                                severity: 'Error',
                                snippet: nextSlideOp.value + nextVertices.map(v => v.value).join('')
                            });
                        } else {
                            if (prevEndToken) {
                                this.validateSlidePath(prevEndToken, nextSlideOp, nextVertices);
                            }
                        }
                    }
                    if (nextVertices.length > 0) {
                        prevEndToken = nextVertices[nextVertices.length - 1];
                    }
                }

                // Optional duration block and/or decorators (modifiers) in any order
                while (!this.isAtEnd()) {
                    const nextType = this.peek().type;
                    if (nextType === TokenType.Duration) {
                        hasDuration = true;
                        this.validateDurationBlock(this.advance());
                    } else if (nextType === TokenType.Decorator) {
                        this.advance();
                    } else {
                        break;
                    }
                }

                if (!hasDuration) {
                    this.errors.push({
                        line: slideOp.line,
                        col: slideOp.col,
                        message: `Slide 缺少持續時間標記（例如：'[8:1]'）。每個經由 '*' 連接的滑條路徑都必須指定時間。`,
                        severity: 'Error',
                        snippet: slideOp.value
                    });
                }

                // Check if slide chain continues with a joiner '*'
                if (!this.isAtEnd() && this.peek().type === TokenType.SlideJoiner) {
                    const joinerToken = this.advance(); // consume '*'
                        if (this.isAtEnd() || this.peek().type !== TokenType.Slide) {
                        const nextToken = this.peek();
                        this.errors.push({
                            line: joinerToken.line,
                            col: joinerToken.col,
                            message: `Slide 連接符 '*' 後方必須緊接一個 Slide 運算子（例如：'-'、'>'、'<'）。`,
                            severity: 'Error',
                            snippet: '*' + (nextToken ? nextToken.value : '')
                        });
                        chainActive = false;
                    }
                } else {
                    chainActive = false;
                }
            }
        } finally {
            this.inSlideChain = false;
        }
    }

    validateSlidePath(startTok, opTok, vertices) {
        if (!startTok || vertices.length === 0) return;

        const startVal = startTok.value;
        const op = opTok.value;

        // We only validate if start and vertices are single digits between '1' and '8'
        const isButton = (val) => /^[1-8]$/.test(val);
        if (!isButton(startVal)) return;

        const S = parseInt(startVal, 10);

        if (op === 'V') {
            // V-slide has middle vertex (M) and end button (E)
            // vertices[0] is M, vertices[1] is E
            if (vertices.length < 2) return;
            const mVal = vertices[0].value;
            const eVal = vertices[1].value;

            if (!isButton(mVal) || !isButton(eVal)) return;

            const M = parseInt(mVal, 10);
            const E = parseInt(eVal, 10);

            // Rule 1: First leg S -> M: |S - M| in {2, 6} (modulo 8 difference is 2)
            const diffSM = (M - S + 8) % 8;
            if (diffSM !== 2 && diffSM !== 6) {
                this.errors.push({
                    line: vertices[0].line,
                    col: vertices[0].col,
                    message: `屈折 Slide 運算子 'V' 的起點 '${S}' 到折返點 '${M}' 的距離無效（必須為 2 格，例如：'6V42' 中的 '6' 到 '4'）。`,
                    severity: 'Error',
                    snippet: mVal
                });
            }

            // Rule 2: Second leg M -> E:
            // - E != M
            // - |M - E| not in {1, 7} (cannot be adjacent)
            // - If E - M === 2, S - M must be -2
            // - If E - M === -2, S - M must be 2
            const diffME = (E - M + 8) % 8;
            if (diffME === 0) {
                this.errors.push({
                    line: vertices[1].line,
                    col: vertices[1].col,
                    message: `屈折 Slide 運算子 'V' 的終點 '${E}' 不可與折返點 '${M}' 相同。`,
                    severity: 'Error',
                    snippet: eVal
                });
            } else if (diffME === 1 || diffME === 7) {
                this.errors.push({
                    line: vertices[1].line,
                    col: vertices[1].col,
                    message: `屈折 Slide 運算子 'V' 的終點 '${E}' 與折返點 '${M}' 相鄰，這是無效的描繪路徑。`,
                    severity: 'Error',
                    snippet: eVal
                });
            } else if (diffME === 2) {
                const diffSM_norm = (M - S + 8) % 8;
                if (diffSM_norm !== 2) {
                    this.errors.push({
                        line: vertices[1].line,
                        col: vertices[1].col,
                        message: `屈折 Slide 運算子 'V' 自折返點 '${M}' 到終點 '${E}' 為順時針時，起點 '${S}' 到折返點 '${M}' 必須也是順時針。`,
                        severity: 'Error',
                        snippet: eVal
                    });
                }
            } else if (diffME === 6) {
                const diffSM_norm = (M - S + 8) % 8;
                if (diffSM_norm !== 6) {
                    this.errors.push({
                        line: vertices[1].line,
                        col: vertices[1].col,
                        message: `屈折 Slide 運算子 'V' 自折返點 '${M}' 到終點 '${E}' 為逆時針時，起點 '${S}' 到折返點 '${M}' 必須也是逆時針。`,
                        severity: 'Error',
                        snippet: eVal
                    });
                }
            }
        } else {
            const targetTok = vertices[vertices.length - 1];
            const eVal = targetTok.value;
            if (!isButton(eVal)) return;

            const E = parseInt(eVal, 10);
            const diff = (E - S + 8) % 8;

            if (op === '-') {
                if (diff === 0) {
                    this.errors.push({
                        line: targetTok.line,
                        col: targetTok.col,
                        message: `直線 Slide 運算子 '-' 的終點 '${E}' 不可與起點 '${S}' 相同。`,
                        severity: 'Error',
                        snippet: eVal
                    });
                } else if (diff === 1 || diff === 7) {
                    this.errors.push({
                        line: targetTok.line,
                        col: targetTok.col,
                        message: `直線 Slide 運算子 '-' 的終點 '${E}' 與起點 '${S}' 相鄰，這是無效的。`,
                        severity: 'Error',
                        snippet: eVal
                    });
                }
            } else if (op === '^' || op === 'v') {
                if (diff === 0) {
                    this.errors.push({
                        line: targetTok.line,
                        col: targetTok.col,
                        message: `${op === '^' ? '弧形' : 'v形'} Slide 運算子 '${op}' 的終點 '${E}' 不可與起點 '${S}' 相同。`,
                        severity: 'Error',
                        snippet: eVal
                    });
                } else if (diff === 4) {
                    this.errors.push({
                        line: targetTok.line,
                        col: targetTok.col,
                        message: `${op === '^' ? '弧形' : 'v形'} Slide 運算子 '${op}' 的終點 '${E}' 不可位於起點 '${S}' 的正對向。`,
                        severity: 'Error',
                        snippet: eVal
                    });
                }
            } else if (op === 's' || op === 'z' || op === 'w') {
                if (diff !== 4) {
                    this.errors.push({
                        line: targetTok.line,
                        col: targetTok.col,
                        message: `${op === 'w' ? '扇形' : (op === 's' ? 's形' : 'z形')} Slide 運算子 '${op}' 的終點 '${E}' 必須位於起點 '${S}' 的正對向（例如：'1${op}5'）。`,
                        severity: 'Error',
                        snippet: eVal
                    });
                }
            }
        }
    }

    validateDurationBlock(token) {
        const val = token.value;

        // Helper to validate decimal
        const checkDecimal = (str, fieldName) => {
            if (!isStrictDecimal(str)) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `'[${val}]' 中的${fieldName}必須是正數。`,
                    severity: 'Error',
                    snippet: `[${val}]`
                });
                return false;
            }
            return true;
        };

        // Helper to validate beat ratio
        const checkBeatRatio = (str) => {
            const colonIdx = str.indexOf(':');
            if (colonIdx === -1) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `持續時間標記 '[${val}]' 格式錯誤，必須包含冒號的分音比例（例如：'[2:1]'）或使用秒數（例如：'[#1.5]'）。`,
                    severity: 'Error',
                    snippet: `[${val}]`
                });
                return false;
            }
            const num = str.substring(0, colonIdx);
            const den = str.substring(colonIdx + 1);
            if (!isStrictDecimal(num) || !isStrictDecimal(den)) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `'[${val}]' 中的拍數比例值必須包含正整數。`,
                    severity: 'Error',
                    snippet: `[${val}]`
                });
                return false;
            }
            return true;
        };

        // Helper to validate a move duration (seconds, beat ratio, or bpm-override + either)
        const checkMoveDuration = (str) => {
            if (!str) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `持續時間標記 '[${val}]' 格式錯誤，缺少移動時間。`,
                    severity: 'Error',
                    snippet: `[${val}]`
                });
                return false;
            }

            const hashCount = (str.match(/#/g) || []).length;
            if (hashCount > 1) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `持續時間標記 '[${val}]' 格式錯誤，多於一個 '#' 運算子。`,
                    severity: 'Error',
                    snippet: `[${val}]`
                });
                return false;
            }

            if (hashCount === 1) {
                const parts = str.split('#');
                const bpmOverride = parts[0];
                const durationPart = parts[1];

                if (!checkDecimal(bpmOverride, 'BPM 流速覆寫值')) {
                    return false;
                }

                if (durationPart.includes(':')) {
                    return checkBeatRatio(durationPart);
                } else {
                    return checkDecimal(durationPart, '持續秒數值');
                }
            } else {
                // No # in move duration. Can be beat ratio (contains :) or seconds (decimal)
                if (str.includes(':')) {
                    return checkBeatRatio(str);
                } else {
                    return checkDecimal(str, '持續秒數值');
                }
            }
        };

        // Check for wait time separator '##'
        if (val.includes('##')) {
            const idx = val.indexOf('##');
            const waitPart = val.substring(0, idx);
            const movePart = val.substring(idx + 2);

            // Check if there's another '##'
            if (movePart.includes('##')) {
                this.errors.push({
                    line: token.line,
                    col: token.col,
                    message: `持續時間標記 '[${val}]' 格式錯誤，多於一個 '##' 運算子。`,
                    severity: 'Error',
                    snippet: `[${val}]`
                });
                return;
            }

            if (!checkDecimal(waitPart, '等待時間秒數')) {
                return;
            }

            checkMoveDuration(movePart);
            return;
        }

        // No '##' wait time separator
        // Check if it starts with '#' (absolute seconds)
        if (val.startsWith('#')) {
            const secsStr = val.substring(1);
            checkDecimal(secsStr, '持續秒數值');
            return;
        }

        // Does it contain '#'? (BPM override)
        if (val.includes('#')) {
            checkMoveDuration(val);
            return;
        }

        // Standard beat ratio (must contain ':')
        checkBeatRatio(val);
    }

    checkConsecutiveButtons() {
        let consecutiveCount = 0;
        let startToken = null;
        let errorPushed = false;
        for (let i = 0; i < this.tokens.length; i++) {
            const tok = this.tokens[i];
            if (this.slideTokens && this.slideTokens.has(tok)) {
                consecutiveCount = 0;
                startToken = null;
                errorPushed = false;
                continue;
            }
            if (tok.type === TokenType.Location && tok.value >= '1' && tok.value <= '8') {
                if (consecutiveCount === 0) {
                    startToken = tok;
                    errorPushed = false;
                }
                consecutiveCount++;
                if (consecutiveCount > 2 && !errorPushed) {
                    this.errors.push({
                        line: startToken.line,
                        col: startToken.col,
                        message: `無分隔符的雙擊記號（如 '12'）最多只能包含兩個數字，多於兩個請使用 '/' 分隔（例如：'1/2/3'）。`,
                        severity: 'Error',
                        snippet: tok.value
                     });
                     errorPushed = true;
                }
            } else {
                consecutiveCount = 0;
                startToken = null;
                errorPushed = false;
            }
        }
    }

    checkDuplicateBothStarts() {
        let currentTimestepTokens = [];
        for (let i = 0; i <= this.tokens.length; i++) {
            const tok = i < this.tokens.length ? this.tokens[i] : null;
            if (!tok || tok.type === TokenType.TimeStep || tok.type === TokenType.EndOfFile) {
                if (currentTimestepTokens.length > 0) {
                    this.validateTimestepStarts(currentTimestepTokens);
                    currentTimestepTokens = [];
                }
            } else {
                currentTimestepTokens.push(tok);
            }
        }
    }

    validateTimestepStarts(tokens) {
        const seenStarts = new Map();
        let i = 0;
        while (i < tokens.length) {
            const tok = tokens[i];
            
            if (tok.type === TokenType.Location || tok.type === TokenType.Slide) {
                // This starts a note!
                // Let's identify the start position of this note
                let startVal = null;
                let startTok = null;
                if (tok.type === TokenType.Location) {
                    startVal = tok.value;
                    startTok = tok;
                }

                // Consume the note using the exact same skip logic as consumeNote
                let idx = i;
                const firstToken = tokens[idx];
                
                let isHold = false;
                if (firstToken.type === TokenType.Location) {
                    idx++; // consume start Location

                    // Parse modifiers/decorators
                    while (idx < tokens.length && tokens[idx].type === TokenType.Decorator) {
                        const dec = tokens[idx];
                        if (dec.value === 'h') isHold = true;
                        idx++;
                    }

                    // Parse optional duration block for Hold
                    if (isHold) {
                        if (idx < tokens.length && tokens[idx].type === TokenType.Duration) {
                            idx++;
                        }
                    }
                }

                // Parse Slide path
                if (idx < tokens.length && tokens[idx].type === TokenType.Slide) {
                    while (idx < tokens.length) {
                        if (tokens[idx].type === TokenType.Slide) {
                            idx++; // consume slide operator
                            // Consume destination locations
                            while (idx < tokens.length && tokens[idx].type === TokenType.Location) {
                                idx++;
                            }
                            
                            // Consume any duration block or decorators for this segment
                            while (idx < tokens.length) {
                                const nextType = tokens[idx].type;
                                if (nextType === TokenType.Duration) {
                                    idx++;
                                } else if (nextType === TokenType.Decorator) {
                                    idx++;
                                } else {
                                    break;
                                }
                            }
                        } else if (tokens[idx].type === TokenType.SlideJoiner) {
                            idx++; // consume '*'
                        } else {
                            break;
                        }
                    }
                }

                // Advance main loop index to next index
                i = idx;

                // Validate duplicate starting position
                if (startVal !== null) {
                    if (seenStarts.has(startVal)) {
                        this.errors.push({
                            line: startTok.line,
                            col: startTok.col,
                            message: `同一時間點不可包含重複的起點位置 '${startVal}'。`,
                            severity: 'Error',
                            snippet: startVal
                        });
                    } else {
                        seenStarts.set(startVal, startTok);
                    }
                }
                continue;
            }
            i++;
        }
    }
}
