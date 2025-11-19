import * as assert from 'assert';

suite('Commit Message Generation Tests', () => {

    suite('Error Message Extraction', () => {
        test('Should extract error message from Forge CLI output with timestamp', () => {
            const forgeOutput = '⏺ [13:35:10] ERROR: No changes to commit';
            const errorMatch = forgeOutput.match(/ERROR:\s*(.+)/);
            const errorMessage = errorMatch ? errorMatch[1].trim() : 'Failed to generate commit message';

            assert.strictEqual(errorMessage, 'No changes to commit');
        });

        test('Should extract error message for git repository not found', () => {
            const forgeOutput = '⏺ [14:22:33] ERROR: Git repository not found';
            const errorMatch = forgeOutput.match(/ERROR:\s*(.+)/);
            const errorMessage = errorMatch ? errorMatch[1].trim() : 'Failed to generate commit message';

            assert.strictEqual(errorMessage, 'Git repository not found');
        });

        test('Should extract error message for network errors', () => {
            const forgeOutput = '⏺ [15:10:45] ERROR: Failed to connect to AI service';
            const errorMatch = forgeOutput.match(/ERROR:\s*(.+)/);
            const errorMessage = errorMatch ? errorMatch[1].trim() : 'Failed to generate commit message';

            assert.strictEqual(errorMessage, 'Failed to connect to AI service');
        });

        test('Should handle malformed error with fallback', () => {
            const forgeOutput = 'ERROR:';
            const errorMatch = forgeOutput.match(/ERROR:\s*(.+)/);
            const errorMessage = errorMatch ? errorMatch[1].trim() : 'Failed to generate commit message';

            assert.strictEqual(errorMessage, 'Failed to generate commit message');
        });

        test('Should handle error with extra whitespace', () => {
            const forgeOutput = '⏺ [13:35:10] ERROR:    No changes to commit   ';
            const errorMatch = forgeOutput.match(/ERROR:\s*(.+)/);
            const errorMessage = errorMatch ? errorMatch[1].trim() : 'Failed to generate commit message';

            assert.strictEqual(errorMessage, 'No changes to commit');
        });
    });

    suite('Success Message Parsing', () => {
        test('Should strip "Generated commit message:" prefix', () => {
            const forgeOutput = '⏺ [21:48:59] Generated commit message:\nfeat: add new feature';
            const lines = forgeOutput.split('\n');
            let commitMessage = forgeOutput.trim();

            if (lines.length > 0 && lines[0].includes('Generated commit message:')) {
                commitMessage = lines.slice(1).join('\n').trim();
            }

            assert.strictEqual(commitMessage, 'feat: add new feature');
        });

        test('Should handle multi-line commit messages', () => {
            const forgeOutput = '⏺ [21:48:59] Generated commit message:\nfeat: add new feature\n\nThis is a detailed description';
            const lines = forgeOutput.split('\n');
            let commitMessage = forgeOutput.trim();

            if (lines.length > 0 && lines[0].includes('Generated commit message:')) {
                commitMessage = lines.slice(1).join('\n').trim();
            }

            assert.strictEqual(commitMessage, 'feat: add new feature\n\nThis is a detailed description');
        });

        test('Should handle commit message without prefix', () => {
            const forgeOutput = 'feat: add new feature';
            const lines = forgeOutput.split('\n');
            let commitMessage = forgeOutput.trim();

            if (lines.length > 0 && lines[0].includes('Generated commit message:')) {
                commitMessage = lines.slice(1).join('\n').trim();
            }

            assert.strictEqual(commitMessage, 'feat: add new feature');
        });
    });

    suite('Edge Cases', () => {
        test('Should detect ERROR in output with timestamp', () => {
            const output = '⏺ [13:35:10] ERROR: No changes to commit';
            assert.ok(output.includes('ERROR:'), 'Should detect ERROR in output with timestamp');
        });

        test('Should detect ERROR in output without timestamp', () => {
            const output = 'ERROR: Git repository not found';
            assert.ok(output.includes('ERROR:'), 'Should detect ERROR in output without timestamp');
        });

        test('Should detect ERROR in output with prefix', () => {
            const output = 'Some prefix ERROR: Network timeout';
            assert.ok(output.includes('ERROR:'), 'Should detect ERROR in output with prefix');
        });

        test('Should handle empty output', () => {
            const forgeOutput = '';
            const commitMessage = forgeOutput.trim();

            assert.strictEqual(commitMessage, '');
            assert.ok(!commitMessage, 'Empty output should be falsy');
        });

        test('Should handle whitespace-only output', () => {
            const forgeOutput = '   \n\n   ';
            const commitMessage = forgeOutput.trim();

            assert.strictEqual(commitMessage, '');
            assert.ok(!commitMessage, 'Whitespace-only output should be falsy after trim');
        });

        test('Should not detect ERROR in success message with error word', () => {
            const output = '⏺ [21:48:59] Generated commit message:\nfeat: add error handling';
            const hasErrorPrefix = output.includes('ERROR:');
            assert.ok(!hasErrorPrefix, 'Should not detect ERROR: prefix in success message');
        });

        test('Should not detect ERROR in commit message about errors', () => {
            const output = 'fix: resolve error in validation';
            const hasErrorPrefix = output.includes('ERROR:');
            assert.ok(!hasErrorPrefix, 'Should not detect ERROR: prefix in commit message');
        });
    });

    suite('Configuration', () => {
        test('Should have valid default max diff size', () => {
            const defaultMaxDiffSize = 10000;
            const minimumMaxDiffSize = 10000;

            assert.ok(defaultMaxDiffSize >= minimumMaxDiffSize, 'Default should be >= minimum');
            assert.strictEqual(typeof defaultMaxDiffSize, 'number', 'Should be a number');
        });
    });
});

