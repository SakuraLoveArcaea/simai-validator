export class Token {
    constructor(type, value, line, col, index) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.col = col;
        this.index = index;
    }
}
