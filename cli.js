#!/usr/bin/env node

/**
 * simai Chart Validator CLI Tool
 * Usage: node cli.js <path_to_maidata.txt>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateSimaiFile } from 'simai-core';

// ANSI Color Escape Codes
const COLORS = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

function printUsage() {
    console.log(`${COLORS.bold}simai Chart Syntax Validator${COLORS.reset}`);
    console.log(`Usage: node cli.js <path_to_maidata.txt>\n`);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        printUsage();
        console.error(`${COLORS.red}Error: No input file specified.${COLORS.reset}`);
        process.exit(1);
    }
    
    const filePath = path.resolve(args[0]);
    
    if (!fs.existsSync(filePath)) {
        console.error(`${COLORS.red}Error: File not found: ${filePath}${COLORS.reset}`);
        process.exit(1);
    }
    
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
        console.error(`${COLORS.red}Error: Failed to read file: ${err.message}${COLORS.reset}`);
        process.exit(1);
    }
    
    console.log(`${COLORS.cyan}Validating: ${filePath}...${COLORS.reset}\n`);
    
    const diagnostics = validateSimaiFile(content);
    const lines = content.split(/\r?\n/);
    
    let errorCount = 0;
    let warningCount = 0;
    
    if (diagnostics.length === 0) {
        console.log(`${COLORS.green}${COLORS.bold}✓ Success: No syntax errors found! The chart format is valid.${COLORS.reset}`);
        process.exit(0);
    }
    
    // Sort diagnostics by line number
    diagnostics.forEach(diag => {
        if (diag.severity === 'Error') {
            errorCount++;
        } else {
            warningCount++;
        }
        
        const severityColor = diag.severity === 'Error' ? COLORS.red : COLORS.yellow;
        const label = diag.severity === 'Error' ? 'ERROR' : 'WARNING';
        
        console.log(`${severityColor}${COLORS.bold}[${label}]${COLORS.reset} at Line ${COLORS.bold}${diag.line}${COLORS.reset}, Col ${COLORS.bold}${diag.col}${COLORS.reset}:`);
        console.log(`  ${COLORS.bold}${COLORS.white}${diag.message}${COLORS.reset}`);
        
        // Output context line and arrow pointer
        if (diag.line > 0 && diag.line <= lines.length) {
            const errorLine = lines[diag.line - 1];
            // Replace tabs with spaces for alignment in pointer
            const sanitizedLine = errorLine.replace(/\t/g, '    ');
            
            // Calculate column adjustment due to tab expansion
            let colAdjusted = diag.col;
            for (let i = 0; i < Math.min(diag.col - 1, errorLine.length); i++) {
                if (errorLine[i] === '\t') {
                    colAdjusted += 3; // 4 spaces minus original 1 char
                }
            }
            
            console.log(`\n    ${COLORS.gray}${diag.line.toString().padStart(4)} |${COLORS.reset} ${sanitizedLine}`);
            
            // Build indicator arrow
            const padding = ' '.repeat(colAdjusted - 1);
            console.log(`         | ${COLORS.gray}${padding}${severityColor}${COLORS.bold}^${COLORS.reset}\n`);
        } else {
            console.log('');
        }
    });
    
    console.log(`${COLORS.bold}Validation Summary:${COLORS.reset}`);
    if (errorCount > 0) {
        console.log(`  - ${COLORS.red}${COLORS.bold}${errorCount} Error(s)${COLORS.reset}`);
    }
    if (warningCount > 0) {
        console.log(`  - ${COLORS.yellow}${COLORS.bold}${warningCount} Warning(s)${COLORS.reset}`);
    }
    console.log('');
    
    if (errorCount > 0) {
        console.log(`${COLORS.red}${COLORS.bold}✗ Validation failed: Please fix the errors listed above.${COLORS.reset}`);
        process.exit(1);
    } else {
        console.log(`${COLORS.yellow}${COLORS.bold}! Validation passed with warnings.${COLORS.reset}`);
        process.exit(0);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
}
