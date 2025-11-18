import * as assert from 'assert';
import { FileReference } from '../../../domain/models/FileReference';
import { FilePath } from '../../../domain/valueObjects/FilePath';
import { LineRange } from '../../../domain/valueObjects/LineRange';

suite('FileReference Entity Tests', () => {
    
    test('create() with path only should create reference without selection', () => {
        const filePath = FilePath.fromAbsolute('/path/to/file.ts');
        const fileRef = FileReference.create(filePath);
        
        assert.strictEqual(fileRef.path, filePath);
        assert.strictEqual(fileRef.lineRange, undefined);
    });

    test('create() with path and line range should create reference with selection', () => {
        const filePath = FilePath.fromAbsolute('/path/to/file.ts');
        const lineRange = LineRange.create(1, 5);
        const fileRef = FileReference.create(filePath, lineRange);
        
        assert.strictEqual(fileRef.path, filePath);
        assert.strictEqual(fileRef.lineRange, lineRange);
    });

    test('toForgeFormat() should format path only correctly', () => {
        const filePath = FilePath.fromAbsolute('/path/to/file.ts');
        const fileRef = FileReference.create(filePath);
        
        const format = fileRef.toForgeFormat();
        assert.strictEqual(format, '@[/path/to/file.ts]');
    });

    test('toForgeFormat() should format path with line range correctly', () => {
        const filePath = FilePath.fromAbsolute('/path/to/file.ts');
        const lineRange = LineRange.create(1, 5);
        const fileRef = FileReference.create(filePath, lineRange);
        
        const format = fileRef.toForgeFormat();
        assert.strictEqual(format, '@[/path/to/file.ts:1:5]');
    });

    test('toForgeFormat() should handle single line selection', () => {
        const filePath = FilePath.fromAbsolute('/src/test.ts');
        const lineRange = LineRange.create(42, 42);
        const fileRef = FileReference.create(filePath, lineRange);
        
        const format = fileRef.toForgeFormat();
        assert.strictEqual(format, '@[/src/test.ts:42:42]');
    });

    test('toForgeFormat() should handle relative paths', () => {
        const filePath = FilePath.fromRelative('src/domain/models/FileReference.ts');
        const fileRef = FileReference.create(filePath);
        
        const format = fileRef.toForgeFormat();
        assert.strictEqual(format, '@[src/domain/models/FileReference.ts]');
    });

    test('toForgeFormat() should handle relative paths with line range', () => {
        const filePath = FilePath.fromRelative('src/test.ts');
        const lineRange = LineRange.create(10, 20);
        const fileRef = FileReference.create(filePath, lineRange);
        
        const format = fileRef.toForgeFormat();
        assert.strictEqual(format, '@[src/test.ts:10:20]');
    });

    test('hasSelection() should return false when no line range', () => {
        const filePath = FilePath.fromAbsolute('/path/to/file.ts');
        const fileRef = FileReference.create(filePath);
        
        assert.strictEqual(fileRef.hasSelection(), false);
    });

    test('hasSelection() should return true when line range exists', () => {
        const filePath = FilePath.fromAbsolute('/path/to/file.ts');
        const lineRange = LineRange.create(1, 5);
        const fileRef = FileReference.create(filePath, lineRange);
        
        assert.strictEqual(fileRef.hasSelection(), true);
    });

    test('Should handle Windows paths', () => {
        const filePath = FilePath.fromAbsolute('C:\\Users\\test\\file.ts');
        const fileRef = FileReference.create(filePath);
        
        const format = fileRef.toForgeFormat();
        assert.strictEqual(format, '@[C:\\Users\\test\\file.ts]');
    });

    test('Should handle paths with spaces', () => {
        const filePath = FilePath.fromAbsolute('/path/to/my file.ts');
        const lineRange = LineRange.create(5, 10);
        const fileRef = FileReference.create(filePath, lineRange);
        
        const format = fileRef.toForgeFormat();
        assert.strictEqual(format, '@[/path/to/my file.ts:5:10]');
    });

    test('Should handle paths with special characters', () => {
        const filePath = FilePath.fromAbsolute('/path/to/file-name_test.ts');
        const fileRef = FileReference.create(filePath);
        
        const format = fileRef.toForgeFormat();
        assert.strictEqual(format, '@[/path/to/file-name_test.ts]');
    });

    test('Entity should be immutable', () => {
        const filePath = FilePath.fromAbsolute('/path/to/file.ts');
        const lineRange = LineRange.create(1, 5);
        const fileRef = FileReference.create(filePath, lineRange);
        
        // Verify values don't change
        assert.strictEqual(fileRef.path, filePath);
        assert.strictEqual(fileRef.lineRange, lineRange);
        assert.strictEqual(fileRef.toForgeFormat(), '@[/path/to/file.ts:1:5]');
        
        // Accessing again should return same values
        assert.strictEqual(fileRef.path, filePath);
        assert.strictEqual(fileRef.lineRange, lineRange);
    });

    test('Multiple instances should be independent', () => {
        const filePath1 = FilePath.fromAbsolute('/path/to/file1.ts');
        const filePath2 = FilePath.fromAbsolute('/path/to/file2.ts');
        
        const fileRef1 = FileReference.create(filePath1);
        const fileRef2 = FileReference.create(filePath2);
        
        assert.notStrictEqual(fileRef1, fileRef2);
        assert.notStrictEqual(fileRef1.toForgeFormat(), fileRef2.toForgeFormat());
    });
});
