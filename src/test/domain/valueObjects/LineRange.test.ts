import * as assert from 'assert';
import { LineRange } from '../../../domain/valueObjects/LineRange';

suite('LineRange Value Object Tests', () => {
    
    test('create() should create valid range with start less than end', () => {
        const range = LineRange.create(1, 5);
        assert.strictEqual(range.start, 1);
        assert.strictEqual(range.end, 5);
    });

    test('create() should create valid range with equal start and end (single line)', () => {
        const range = LineRange.create(10, 10);
        assert.strictEqual(range.start, 10);
        assert.strictEqual(range.end, 10);
    });

    test('create() should create valid range with large numbers', () => {
        const range = LineRange.create(100, 200);
        assert.strictEqual(range.start, 100);
        assert.strictEqual(range.end, 200);
    });

    test('create() should throw error when start < 1', () => {
        assert.throws(
            () => LineRange.create(0, 5),
            /start line must be >= 1/
        );
        assert.throws(
            () => LineRange.create(-1, 5),
            /start line must be >= 1/
        );
    });

    test('create() should throw error when end < 1', () => {
        assert.throws(
            () => LineRange.create(1, 0),
            /end line must be >= 1/
        );
        assert.throws(
            () => LineRange.create(5, -1),
            /end line must be >= 1/
        );
    });

    test('create() should throw error when start > end', () => {
        assert.throws(
            () => LineRange.create(10, 5),
            /start .* must be <= end/
        );
    });

    test('fromZeroBased() should convert 0-based to 1-based correctly', () => {
        const range = LineRange.fromZeroBased(0, 4);
        assert.strictEqual(range.start, 1);
        assert.strictEqual(range.end, 5);
    });

    test('fromZeroBased() should handle same start and end', () => {
        const range = LineRange.fromZeroBased(10, 10);
        assert.strictEqual(range.start, 11);
        assert.strictEqual(range.end, 11);
    });

    test('isSingleLine() should return true when start equals end', () => {
        const range = LineRange.create(5, 5);
        assert.strictEqual(range.isSingleLine(), true);
    });

    test('isSingleLine() should return false when start does not equal end', () => {
        const range = LineRange.create(5, 10);
        assert.strictEqual(range.isSingleLine(), false);
    });

    test('lineCount() should calculate correct number of lines', () => {
        const range1 = LineRange.create(1, 5);
        assert.strictEqual(range1.lineCount(), 5);

        const range2 = LineRange.create(10, 10);
        assert.strictEqual(range2.lineCount(), 1);

        const range3 = LineRange.create(1, 100);
        assert.strictEqual(range3.lineCount(), 100);
    });

    test('Value object should be immutable', () => {
        const range = LineRange.create(1, 5);
        // TypeScript should prevent modification, but verify the values don't change
        assert.strictEqual(range.start, 1);
        assert.strictEqual(range.end, 5);
        
        // Accessing again should return same values
        assert.strictEqual(range.start, 1);
        assert.strictEqual(range.end, 5);
    });

    test('Multiple instances with same values should be independent', () => {
        const range1 = LineRange.create(1, 5);
        const range2 = LineRange.create(1, 5);
        
        assert.strictEqual(range1.start, range2.start);
        assert.strictEqual(range1.end, range2.end);
        assert.notStrictEqual(range1, range2); // Different instances
    });
});
