export const TokenType = {
    Tempo: 'Tempo',             // (180)
    Subdivision: 'Subdivision', // {4}
    Location: 'Location',       // 1-8, A1-A8, B1-B8, C, D1-D8, E1-E8
    Decorator: 'Decorator',     // f, b, x, h, m, !, ?, @, $
    Slide: 'Slide',             // -, >, <, ^, p, pp, q, qq, v, V, s, z, w
    Duration: 'Duration',       // [8:1], [#1.5], [120#8:1]
    SlideJoiner: 'SlideJoiner', // *
    EachDivider: 'EachDivider', // / or `
    TimeStep: 'TimeStep',       // ,
    EndOfFile: 'EndOfFile',     // E
    Error: 'Error'
};
