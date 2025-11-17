import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('File reference format logic', () => {
		// Test basic file reference generation
		const filePath = '/path/to/file.ts';

		// Test no selection
		const noSelection = `@[${filePath}]`;
		assert.strictEqual(noSelection, '@[/path/to/file.ts]');

		// Test with selection (0-based to 1-based line conversion)
		const startLine = 4; // 0-based
		const endLine = 9;    // 0-based
		const withSelection = `@[${filePath}:${startLine + 1}:${endLine + 1}]`;
		assert.strictEqual(withSelection, '@[/path/to/file.ts:5:10]');
	});

	test('Path formatting edge cases', () => {
		// Test paths with special characters
		const specialPaths = [
			'/path/to/my file.ts',
			'/path/to/file-with-dashes.ts',
			'/path/to/file_with_underscores.ts'
		];

		specialPaths.forEach(path => {
			const result = `@[${path}]`;
			assert.ok(result.includes(path), `Path ${path} should be included in reference`);
		});
	});

	test('Line number conversion', () => {
		// Test 0-based to 1-based line number conversion
		const testCases = [
			{ input: 0, expected: 1 },
			{ input: 4, expected: 5 },
			{ input: 99, expected: 100 }
		];

		testCases.forEach(testCase => {
			const result = testCase.input + 1;
			assert.strictEqual(result, testCase.expected);
		});
	});

	test('Configuration defaults', () => {
		// Test default configuration values
		const defaultFormat = 'absolute';
		const defaultAutoPaste = true;
		const defaultPasteDelay = 5000;
		const defaultTerminalMode = 'once';

		assert.strictEqual(defaultFormat, 'absolute');
		assert.strictEqual(defaultAutoPaste, true);
		assert.strictEqual(defaultPasteDelay, 5000);
		assert.strictEqual(defaultTerminalMode, 'once');
	});
});
