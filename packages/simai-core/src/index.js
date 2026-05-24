import { TokenType } from './token-type.js';
import { Token } from './token.js';
import { Tokenizer } from './tokenizer.js';
import { Parser } from './parser.js';

/**
 * Validates the chart contents of a simai file.
 * If the file contains metadata headers (specifically starting with '&inote_'),
 * it validates ONLY the chart data sections and ignores other metadata.
 * If the file contains no '&inote_' headers, it treats the ENTIRE file as raw chart data.
 */
export function validateSimaiFile(fileContent) {
    const diagnostics = [];
    const lines = fileContent.split(/\r?\n/);
    
    let hasInote = false;
    let inChart = false;
    let chartLines = [];
    let chartStartLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.trim().startsWith('&')) {
            if (inChart) {
                // Finish parsing the previous chart segment
                parseChartData(chartLines.join('\n'), chartStartLine, diagnostics);
                chartLines = [];
                inChart = false;
            }
            
            if (line.trim().startsWith('&inote_')) {
                hasInote = true;
                inChart = true;
                chartStartLine = i + 1;
                const eqIdx = line.indexOf('=');
                if (eqIdx !== -1) {
                    chartLines.push(line.substring(eqIdx + 1));
                } else {
                    chartLines.push('');
                }
            }
        } else {
            if (inChart) {
                chartLines.push(line);
            }
        }
    }
    
    if (inChart) {
        parseChartData(chartLines.join('\n'), chartStartLine, diagnostics);
    }
    
    // If there were no &inote_ headers at all, treat the entire file as pure chart data
    if (!hasInote) {
        parseChartData(fileContent, 1, diagnostics);
    }
    
    return diagnostics;
}

function parseChartData(value, startLine, diagnostics) {
    const tokenizer = new Tokenizer(value, startLine - 1);
    const tokenResult = tokenizer.tokenize();
    
    // Add lexer errors
    diagnostics.push(...tokenResult.errors);
    
    // Run syntactic analysis
    const parser = new Parser(tokenResult.tokens, []);
    const parserErrors = parser.validate();
    
    // Add parser errors
    diagnostics.push(...parserErrors);
}

export {
    TokenType,
    Token,
    Tokenizer,
    Parser
};
