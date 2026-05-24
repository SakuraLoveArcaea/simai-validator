import { describe, test, expect } from 'vitest';
import { validateSimaiFile } from '../src/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Simai Slide Shape Validation Rules', () => {
    // Helper to extract error messages for a chart content
    const getErrors = (chartText) => {
        const fullText = `&title=Test\n&bpm=150\n&inote_master=\n${chartText}\nE`;
        const diags = validateSimaiFile(fullText);
        return diags.filter(d => d.severity === 'Error').map(d => d.message);
    };

    const runJsonTest = (filename) => {
        const filePath = path.join(__dirname, 'fixtures', filename);
        const testCases = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        for (const tc of testCases) {
            const errors = getErrors(tc.chart);
            expect(errors).toHaveLength(tc.expectedErrors.length);
            for (let i = 0; i < errors.length; i++) {
                expect(errors[i]).toMatch(new RegExp(tc.expectedErrors[i]));
            }
        }
    };

    test('Straight line (-) validation', () => {
        runJsonTest('straight_line.json');
    });

    test('Arc (^) validation', () => {
        runJsonTest('arc.json');
    });

    test('Center V (v) validation', () => {
        runJsonTest('center_v.json');
    });

    test('S/Z shape (s, z) validation', () => {
        runJsonTest('sz_shape.json');
    });

    test('Fan shape (w) validation', () => {
        runJsonTest('fan_shape.json');
    });

    test('Folded V (V) validation', () => {
        runJsonTest('folded_v.json');
    });

    test('Multi-segment and chains validation', () => {
        runJsonTest('multi_segment.json');
    });

    test('Strict slide vertex count validation', () => {
        runJsonTest('strict_vertex_count.json');
    });

    test('Slide duration block validation', () => {
        runJsonTest('slide_durations.json');
    });
});
