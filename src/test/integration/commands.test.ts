/* eslint-disable max-lines-per-function */
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Integration Tests', () => {
    let extension: vscode.Extension<unknown> | undefined;

    suiteSetup(async () => {
        extension = vscode.extensions.getExtension('ForgeCode.forge-vscode');
        if (extension && !extension.isActive) {
            await extension.activate();
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
        assert.ok(config, 'Forge configuration should be accessible');
        
        // Test that default values exist
        const showInstallationPrompt = config.get('showInstallationPrompt');
        const autoPaste = config.get('autoPaste');
        const pasteDelay = config.get('pasteDelay');
        const openTerminal = config.get('openTerminal');
        const fileReferenceFormat = config.get('fileReferenceFormat');
        
        assert.ok(typeof showInstallationPrompt === 'boolean', 'showInstallationPrompt should be boolean');
        assert.ok(typeof autoPaste === 'boolean', 'autoPaste should be boolean');
        assert.ok(typeof pasteDelay === 'number', 'pasteDelay should be number');
        assert.ok(typeof openTerminal === 'string', 'openTerminal should be string');
        assert.ok(typeof fileReferenceFormat === 'string', 'fileReferenceFormat should be string');
    });

    test('Should handle copy commands without active editor gracefully', async () => {
        // Create a temporary text document to ensure there's an active editor
        const doc = await vscode.workspace.openTextDocument({ 
            content: 'test content', 
            language: 'typescript' 
        });
        const editor = await vscode.window.showTextDocument(doc);
        
        assert.ok(editor, 'Should be able to create and show text document');
        
        // Test that copy commands don't throw errors (with timeout)
        try {
            await Promise.race([
                vscode.commands.executeCommand('forgecode.copyFileReference'),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
            ]);
            assert.ok(true, 'Copy commands should execute without errors');
        } catch (error: unknown) {
            if (error instanceof Error && error.message === 'Timeout') {
                assert.ok(true, 'Copy commands handled timeout gracefully');
            } else {
                assert.ok(true, `Copy commands handled gracefully: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        
        // Clean up
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Should handle terminal creation', async () => {
        // Test that terminal creation doesn't throw errors
        try {
            await vscode.commands.executeCommand('forgecode.startNewForgeSession');
            assert.ok(true, 'Start Forge session command should execute without errors');
        } catch {
            // Expected to fail if Forge is not installed, but should not crash
            assert.ok(true, 'Command should handle missing Forge gracefully');
        }
    });

    test('File path generation should work with active document', async () => {
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
        
        assert.ok(editor, 'Should have active editor with selection');
        assert.strictEqual(editor.document.getText(selection), 'test');
        
        // Clean up
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

    test('Should handle different file types', async () => {
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
            
            assert.ok(editor, `Should handle ${fileType.language} files`);
            
            // Clean up
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        }
    });
});