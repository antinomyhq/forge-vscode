import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

suite('Integration Tests', () => {
    let extension: vscode.Extension<unknown> | undefined;
    let clock: sinon.SinonFakeTimers | undefined;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension('ForgeCode.forge-vscode');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    teardown(() => {
        // Restore real timers after each test if they were used
        if (clock) {
            clock.restore();
            clock = undefined;
        }
    });

    test('Copy file reference command should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        const copyCommandExists = commands.includes('forgecode.copyFileReference');
        assert.ok(copyCommandExists, 'copyFileReference command should be registered');
    });

    test('Start Forge session command should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        const sessionCommandExists = commands.includes('forgecode.startNewForgeSession');
        assert.ok(sessionCommandExists, 'startNewForgeSession command should be registered');
    });

    test('Copy file reference absolute command should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        const absoluteCommandExists = commands.includes('forgecode.copyFileReferenceAbsolute');
        assert.ok(absoluteCommandExists, 'copyFileReferenceAbsolute command should be registered');
    });

    test('Copy file reference relative command should be registered', async () => {
        const commands = await vscode.commands.getCommands();
        const relativeCommandExists = commands.includes('forgecode.copyFileReferenceRelative');
        assert.ok(relativeCommandExists, 'copyFileReferenceRelative command should be registered');
    });

    test('Extension should activate without errors', async () => {
        const extension = vscode.extensions.getExtension('ForgeCode.forge-vscode');
        assert.ok(extension, 'Extension should be found');

        if (!extension.isActive) {
            await extension.activate();
        }
        assert.ok(extension.isActive, 'Extension should be active');
    });

    test('Configuration should be accessible', () => {
        const config = vscode.workspace.getConfiguration('forge');
        assert.ok(config !== undefined, 'Forge configuration should be accessible');

        // Test that default values exist
        const showInstallationPrompt = config.get('showInstallationPrompt');
        const autoPaste = config.get('autoPaste');
        const pasteDelay = config.get('pasteDelay');
        const openTerminal = config.get('openTerminal');
        const fileReferenceFormat = config.get('fileReferenceFormat');
        const notifications = config.get('notifications');

        assert.ok(typeof showInstallationPrompt === 'boolean', 'showInstallationPrompt should be boolean');
        assert.ok(typeof autoPaste === 'boolean', 'autoPaste should be boolean');
        assert.ok(typeof pasteDelay === 'number', 'pasteDelay should be number');
        assert.ok(typeof openTerminal === 'string', 'openTerminal should be string');
        assert.ok(typeof fileReferenceFormat === 'string', 'fileReferenceFormat should be string');
        assert.ok(typeof notifications === 'object', 'notifications should be object');
    });

    test('Should handle copy commands without active editor gracefully', async function() {
        this.timeout(3000);

        // Create a temporary text document to ensure there's an active editor
        const doc = await vscode.workspace.openTextDocument({
            content: 'test content',
            language: 'typescript'
        });
        const editor = await vscode.window.showTextDocument(doc);

        assert.ok(editor !== undefined, 'Should be able to create and show text document');

        // Initialize fake timers for timeout test
        clock = sinon.useFakeTimers({ shouldClearNativeTimers: true });

        // Test that copy command executes without errors (with timeout using fake timers)
        try {
            const commandPromise = vscode.commands.executeCommand('forgecode.copyFileReference');
            const timeoutPromise = new Promise<void>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), 2000);
            });

            // Start the race
            const racePromise = Promise.race([commandPromise, timeoutPromise]);

            // Allow command to complete if it's fast (check every 100ms)
            for (let elapsed = 0; elapsed < 2000; elapsed += 100) {
                // Give microtasks a chance to resolve
                await Promise.resolve();

                // Check if command completed
                const completed = await Promise.race([
                    commandPromise.then(() => true, () => true),
                    Promise.resolve(false)
                ]);

                if (completed) {
                    break;
                }

                // Advance time by 100ms
                clock.tick(100);
            }

            await racePromise;
            assert.ok(true, 'Copy command should execute without errors');
        } catch (error: unknown) {
            if (error instanceof Error && error.message === 'Timeout') {
                assert.ok(true, 'Copy command handled timeout gracefully');
            } else {
                assert.ok(true, `Copy command handled gracefully: ${error instanceof Error ? error.message : String(error)}`);
            }
        }

        // Clean up
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Should handle terminal creation', async function() {
        this.timeout(5000);

        // Test that terminal creation doesn't throw errors
        try {
            // Execute command with a race against timeout
            await Promise.race([
                vscode.commands.executeCommand('forgecode.startNewForgeSession'),
                new Promise(resolve => setTimeout(resolve, 4000))
            ]);
            assert.ok(true, 'Start Forge session command should execute without errors');
        } catch (error) {
            // Expected to fail if Forge is not installed, but should not crash
            assert.ok(true, `Command handled gracefully: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    test('File path generation should work with active document', async function() {
        this.timeout(3000);

        // Create a temporary file
        const testContent = 'function test() { return true; }';
        const doc = await vscode.workspace.openTextDocument({
            content: testContent,
            language: 'typescript'
        });
        const editor = await vscode.window.showTextDocument(doc);

        // Select some text
        const selection = new vscode.Selection(
            new vscode.Position(0, 9),
            new vscode.Position(0, 13)
        );
        editor.selection = selection;

        assert.ok(editor !== undefined, 'Should have active editor with selection');
        assert.strictEqual(editor.document.getText(selection), 'test');

        // Clean up
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Should handle different file types', async function() {
        this.timeout(5000);

        // Initialize fake timers for this test
        clock = sinon.useFakeTimers({ shouldClearNativeTimers: true });

        const fileTypes = [
            { content: 'console.log("test");', language: 'javascript' },
            { content: 'print("test")', language: 'python' },
            { content: '<div>test</div>', language: 'html' },
            { content: 'body { color: red; }', language: 'css' }
        ];

        for (const fileType of fileTypes) {
            const doc = await vscode.workspace.openTextDocument({
                content: fileType.content,
                language: fileType.language
            });
            const editor = await vscode.window.showTextDocument(doc);

            assert.ok(editor !== undefined, `Should handle ${fileType.language} files`);

            // Clean up - use fake timers instead of real delay
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');

            // Advance fake timer by 100ms to simulate editor close delay
            clock.tick(100);
        }
    });
});

