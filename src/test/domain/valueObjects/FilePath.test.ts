import * as assert from 'assert';
import { FilePath } from '../../../domain/valueObjects/FilePath';
import { PathFormat } from '../../../domain/valueObjects/PathFormat';

suite('FilePath Value Object Tests', () => {
    
    test('fromAbsolute() should create absolute path', () => {
        const path = FilePath.fromAbsolute('/path/to/file.ts');
        assert.strictEqual(path.value, '/path/to/file.ts');
        assert.strictEqual(path.format, PathFormat.Absolute);
    });

    test('fromAbsolute() should work with Windows paths', () => {
        const path = FilePath.fromAbsolute('C:\\path\\to\\file.ts');
        assert.strictEqual(path.value, 'C:\\path\\to\\file.ts');
        assert.strictEqual(path.format, PathFormat.Absolute);
    });

    test('fromRelative() should create relative path', () => {
        const path = FilePath.fromRelative('src/domain/models/FileReference.ts');
        assert.strictEqual(path.value, 'src/domain/models/FileReference.ts');
        assert.strictEqual(path.format, PathFormat.Relative);
    });

    test('fromRelative() should work with dot notation', () => {
        const path = FilePath.fromRelative('./src/file.ts');
        assert.strictEqual(path.value, './src/file.ts');
        assert.strictEqual(path.format, PathFormat.Relative);
    });

    test('fromAbsolute() should throw error for empty string', () => {
        assert.throws(
            () => FilePath.fromAbsolute(''),
            /cannot be empty or whitespace/
        );
    });

    test('fromRelative() should throw error for empty string', () => {
        assert.throws(
            () => FilePath.fromRelative(''),
            /cannot be empty or whitespace/
        );
    });

    test('fromAbsolute() should throw error for whitespace-only string', () => {
        assert.throws(
            () => FilePath.fromAbsolute('   '),
            /cannot be empty or whitespace/
        );
        assert.throws(
            () => FilePath.fromAbsolute('\t\n'),
            /cannot be empty or whitespace/
        );
    });

    test('fromRelative() should throw error for whitespace-only string', () => {
        assert.throws(
            () => FilePath.fromRelative('   '),
            /cannot be empty or whitespace/
        );
    });

    test('isAbsolute() should return true for absolute paths', () => {
        const path1 = FilePath.fromAbsolute('/path/to/file.ts');
        assert.strictEqual(path1.isAbsolute(), true);

        const path2 = FilePath.fromAbsolute('C:\\Windows\\file.txt');
        assert.strictEqual(path2.isAbsolute(), true);
    });

    test('isAbsolute() should return false for relative paths', () => {
        const path1 = FilePath.fromRelative('src/file.ts');
        assert.strictEqual(path1.isAbsolute(), false);

        const path2 = FilePath.fromRelative('./file.ts');
        assert.strictEqual(path2.isAbsolute(), false);
    });

    test('equals() should return true for same path and format', () => {
        const path1 = FilePath.fromAbsolute('/path/to/file.ts');
        const path2 = FilePath.fromAbsolute('/path/to/file.ts');
        assert.strictEqual(path1.equals(path2), true);
    });

    test('equals() should return false for different paths', () => {
        const path1 = FilePath.fromAbsolute('/path/to/file1.ts');
        const path2 = FilePath.fromAbsolute('/path/to/file2.ts');
        assert.strictEqual(path1.equals(path2), false);
    });

    test('equals() should return false for different formats', () => {
        const path1 = FilePath.fromAbsolute('/path/to/file.ts');
        const path2 = FilePath.fromRelative('/path/to/file.ts');
        assert.strictEqual(path1.equals(path2), false);
    });

    test('equals() should return false for same value but different format', () => {
        const path1 = FilePath.fromAbsolute('src/file.ts');
        const path2 = FilePath.fromRelative('src/file.ts');
        // Even though values are same, formats differ
        assert.strictEqual(path1.equals(path2), false);
    });

    test('Value object should be immutable', () => {
        const path = FilePath.fromAbsolute('/path/to/file.ts');
        assert.strictEqual(path.value, '/path/to/file.ts');
        assert.strictEqual(path.format, PathFormat.Absolute);
        
        // Accessing again should return same values
        assert.strictEqual(path.value, '/path/to/file.ts');
        assert.strictEqual(path.format, PathFormat.Absolute);
    });

    test('Should handle paths with spaces', () => {
        const path = FilePath.fromAbsolute('/path/to/my file.ts');
        assert.strictEqual(path.value, '/path/to/my file.ts');
    });

    test('Should handle paths with special characters', () => {
        const path1 = FilePath.fromAbsolute('/path/to/file-name.ts');
        assert.strictEqual(path1.value, '/path/to/file-name.ts');

        const path2 = FilePath.fromAbsolute('/path/to/file_name.ts');
        assert.strictEqual(path2.value, '/path/to/file_name.ts');
    });
});
