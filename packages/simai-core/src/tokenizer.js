import { TokenType } from './token-type.js';
import { Token } from './token.js';

export class Tokenizer {
    constructor(text, startLineOffset = 0) {
        this.text = text;
        this.length = text.length;
        this.current = 0;
        this.line = 1 + startLineOffset;
        this.col = 1;
        this.tokens = [];
        this.errors = [];
    }

    isAtEnd() {
        return this.current >= this.length;
    }

    peek() {
        return this.isAtEnd() ? '\0' : this.text[this.current];
    }

    peekNext() {
        if (this.current + 1 >= this.length) return '\0';
        return this.text[this.current + 1];
    }

    advance() {
        const char = this.text[this.current++];
        if (char === '\n') {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }
        return char;
    }

    tokenize() {
        const decorators = new Set(['f', 'b', 'x', 'h', 'm', '!', '?', '@', '$']);
        const slideChars = new Set(['-', '>', '<', '^', 'p', 'q', 'v', 'V', 's', 'z', 'w']);
        const whitespace = new Set([' ', '\t', '\r']);

        while (!this.isAtEnd()) {
            const startLine = this.line;
            const startCol = this.col;
            const startIndex = this.current;
            const char = this.peek();

            // Handle whitespace
            if (whitespace.has(char)) {
                this.advance();
                continue;
            }

            if (char === '\n') {
                this.advance();
                continue;
            }

            // Handle Comments
            if (char === '|' && this.peekNext() === '|') {
                this.advance(); // consume |
                this.advance(); // consume |
                while (!this.isAtEnd() && this.peek() !== '\n') {
                    this.advance();
                }
                continue;
            }

            // Time step delimiter
            if (char === ',') {
                this.advance();
                this.tokens.push(new Token(TokenType.TimeStep, ',', startLine, startCol, startIndex));
                continue;
            }

            // Slide Joiner
            if (char === '*') {
                this.advance();
                this.tokens.push(new Token(TokenType.SlideJoiner, '*', startLine, startCol, startIndex));
                continue;
            }

            // Each dividers
            if (char === '/' || char === '`') {
                this.advance();
                this.tokens.push(new Token(TokenType.EachDivider, char, startLine, startCol, startIndex));
                continue;
            }

            // Chart End
            if (char === 'E') {
                // E should be standalone or followed by separator/delimiter/EOF
                const next = this.peekNext();
                if (next === '\0' || next === ',' || next === '/' || next === '`' || whitespace.has(next) || next === '\n' || next === '|' || next === '*') {
                    this.advance();
                    this.tokens.push(new Token(TokenType.EndOfFile, 'E', startLine, startCol, startIndex));
                    continue;
                }
            }

            // Sections: Parentheses, Braces, Brackets
            if (char === '(') {
                this.scanSection(')', TokenType.Tempo, 'Tempo definition (BPM)');
                continue;
            }
            if (char === '{') {
                this.scanSection('}', TokenType.Subdivision, 'Note length subdivision');
                continue;
            }
            if (char === '[') {
                this.scanSection(']', TokenType.Duration, 'Slide/Hold duration');
                continue;
            }

            // Location: Taps (1-8) and Sensors (A-E followed by 1-8, or C)
            if (char >= '1' && char <= '8') {
                this.advance();
                this.tokens.push(new Token(TokenType.Location, char, startLine, startCol, startIndex));
                continue;
            }

            if (char >= 'A' && char <= 'E') {
                this.advance(); // consume sensor letter
                const next = this.peek();
                if (char === 'C') {
                    // C can be alone (center) or followed by 1 or 2
                    if (next === '1' || next === '2') {
                        this.advance();
                        this.tokens.push(new Token(TokenType.Location, char + next, startLine, startCol, startIndex));
                    } else {
                        this.tokens.push(new Token(TokenType.Location, 'C', startLine, startCol, startIndex));
                    }
                } else {
                    // A, B, D, E must be followed by a button digit 1-8
                    if (next >= '1' && next <= '8') {
                        this.advance();
                        this.tokens.push(new Token(TokenType.Location, char + next, startLine, startCol, startIndex));
                    } else {
                        this.errors.push({
                            line: startLine,
                            col: startCol,
                            message: `感應區域 '${char}' 後方必須接按鍵數字 (1-8)，例如：${char}1`,
                            severity: 'Error',
                            snippet: char + next
                        });
                        // Recover by emitting an error token
                        this.tokens.push(new Token(TokenType.Error, char, startLine, startCol, startIndex));
                    }
                }
                continue;
            }

            // Decorators (Modifiers)
            if (decorators.has(char)) {
                this.advance();
                this.tokens.push(new Token(TokenType.Decorator, char, startLine, startCol, startIndex));
                continue;
            }

            // Slide Operators
            if (slideChars.has(char)) {
                this.advance();
                const next = this.peek();
                // Check double letter slide shapes like 'pp' or 'qq'
                if ((char === 'p' && next === 'p') || (char === 'q' && next === 'q')) {
                    this.advance();
                    this.tokens.push(new Token(TokenType.Slide, char + char, startLine, startCol, startIndex));
                } else {
                    this.tokens.push(new Token(TokenType.Slide, char, startLine, startCol, startIndex));
                }
                continue;
            }

            // Unrecognized character
            this.errors.push({
                line: startLine,
                col: startCol,
                message: `譜面數據中存在無法識別的字元 '${char}'`,
                severity: 'Error',
                snippet: char
            });
            this.advance();
        }

        return { tokens: this.tokens, errors: this.errors };
    }

    scanSection(terminator, type, name) {
        const startLine = this.line;
        const startCol = this.col;
        const startIndex = this.current;

        this.advance(); // consume opening char
        let content = '';

        const nameMap = {
            'Tempo definition (BPM)': 'BPM（流速）定義',
            'Note length subdivision': '分音定義',
            'Slide/Hold duration': 'Slide/Hold 時間長度'
        };
        const transName = nameMap[name] || name;

        while (!this.isAtEnd() && this.peek() !== terminator) {
            const c = this.peek();
            if (c === '\n') {
                this.errors.push({
                    line: startLine,
                    col: startCol,
                    message: `未結束的${transName}：在遇到 '${terminator}' 之前已到達行尾`,
                    severity: 'Error',
                    snippet: this.text.substring(startIndex, this.current)
                });
                return;
            }
            // Check for new opening bracket before finding the closing terminator (e.g. [ inside [)
            if (c === '(' || c === '{' || c === '[') {
                this.errors.push({
                    line: startLine,
                    col: startCol,
                    message: `未結束的${transName}：在遇到 '${terminator}' 之前發現嵌套的開括號 '${c}'`,
                    severity: 'Error',
                    snippet: this.text.substring(startIndex, this.current)
                });
                return; // Stop scanning this section; don't consume the new opening bracket so it can be scanned next
            }
            content += this.advance();
        }

        if (this.isAtEnd()) {
            this.errors.push({
                line: startLine,
                col: startCol,
                message: `未結束的${transName}：在遇到 '${terminator}' 之前已到達檔案結尾`,
                severity: 'Error',
                snippet: this.text.substring(startIndex, this.current)
            });
            return;
        }

        this.advance(); // consume terminator
        this.tokens.push(new Token(type, content, startLine, startCol, startIndex));
    }
}
