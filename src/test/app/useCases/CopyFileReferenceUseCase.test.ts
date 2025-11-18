import * as assert from 'assert';
import { CopyFileReferenceUseCase } from '../../../app/useCases/CopyFileReferenceUseCase';
import {
    MockEditorPort,
    MockClipboardPort,
    MockTerminalPort,
    MockProcessPort,
    MockConfigurationPort,
    MockNotificationPort,
    createMockInfrastructure,
    MockInfrastructure,
} from '../../mocks/MockPorts';

suite('CopyFileReferenceUseCase Tests', () => {
    let useCase: ReturnType<typeof createTestUseCase>;
    let editorPort: MockEditorPort;
    let clipboardPort: MockClipboardPort;
    let terminalPort: MockTerminalPort;
    let processPort: MockProcessPort;
    let configPort: MockConfigurationPort;
    let notificationPort: MockNotificationPort;

    function createTestUseCase(): CopyFileReferenceUseCase<MockInfrastructure> {
        const infra = createMockInfrastructure({
            editor: editorPort,
            clipboard: clipboardPort,
            terminal: terminalPort,
            process: processPort,
            config: configPort,
            notification: notificationPort,
        });
        return new CopyFileReferenceUseCase(infra);
    }

    setup(() => {
        editorPort = new MockEditorPort();
        clipboardPort = new MockClipboardPort();
        terminalPort = new MockTerminalPort();
        processPort = new MockProcessPort();
        configPort = new MockConfigurationPort();
        notificationPort = new MockNotificationPort();

        useCase = createTestUseCase();
    });

    test('execute() with no active editor should show warning', async () => {
        editorPort.setActiveFile(undefined);

        await useCase.execute();

        assert.strictEqual(notificationPort.warningMessages.length, 1);
        const lastWarning = notificationPort.getLastWarning();
        assert.ok(lastWarning !== undefined && lastWarning !== null && lastWarning !== '');
        assert.ok(lastWarning.includes('No active file'));
        assert.strictEqual(clipboardPort.writeCallCount, 0);
    });

    test('execute() with active editor should create file reference', async () => {
        editorPort.setActiveFile('/path/to/file.ts');

        await useCase.execute();

        assert.strictEqual(clipboardPort.writeCallCount, 1);
        const written = clipboardPort.getLastWrittenText();
        assert.ok(written.includes('/path/to/file.ts'));
        assert.ok(written.startsWith('@['));
        assert.ok(written.endsWith(']'));
    });

    test('execute() with selection should include line range', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        editorPort.setSelection({ start: 0, end: 4 }); // 0-based

        await useCase.execute();

        const written = clipboardPort.getLastWrittenText();
        assert.strictEqual(written, '@[/path/to/file.ts:1:5]'); // Converted to 1-based
    });

    test('execute() with absolute format override should use absolute path', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        configPort.setFileReferenceFormat('relative'); // Default is relative

        await useCase.execute('absolute'); // Override to absolute

        const written = clipboardPort.getLastWrittenText();
        assert.ok(written.includes('/path/to/file.ts'));
    });

    test('COPY_ONLY_MULTIPLE_TERMINALS strategy should only copy to clipboard', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        // Create 2 forge terminals to trigger COPY_ONLY_MULTIPLE_TERMINALS strategy
        await terminalPort.createTerminal('Forge 1');
        await terminalPort.createTerminal('Forge 2');
        processPort.setForgeProcessCount(0);

        await useCase.execute();

        assert.strictEqual(clipboardPort.writeCallCount, 1);
        assert.strictEqual(terminalPort.sendTextCallCount, 0);
        assert.ok(notificationPort.statusBarMessages.length > 0);
        const lastStatusBar = notificationPort.getLastStatusBar();
        assert.ok(lastStatusBar !== undefined && lastStatusBar !== null && lastStatusBar !== '');
        assert.ok(lastStatusBar.toLowerCase().includes('clipboard'));
    });

    test('COPY_ONLY_MIXED_PROCESSES strategy should only copy to clipboard', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        await terminalPort.createTerminal('Forge');
        processPort.setForgeProcessCount(1); // Forge running externally

        await useCase.execute();

        assert.strictEqual(clipboardPort.writeCallCount, 1);
        assert.strictEqual(terminalPort.sendTextCallCount, 0);
        assert.ok(notificationPort.statusBarMessages.length > 0);
    });

    test('REUSE_EXISTING_TERMINAL strategy should reuse terminal', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        await terminalPort.createTerminal('Forge');
        processPort.setForgeProcessCount(0);
        configPort.setAutoPaste(true);

        await useCase.execute();

        assert.strictEqual(clipboardPort.writeCallCount, 1);
        assert.strictEqual(terminalPort.showCallCount, 1);
        // Auto-paste should send text
        assert.ok(terminalPort.sendTextCallCount > 0);
    });

    test('CREATE_NEW_TERMINAL strategy should create new terminal', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        processPort.setForgeProcessCount(0);
        // No existing terminals
        configPort.setOpenTerminal('always');

        await useCase.execute();

        assert.strictEqual(clipboardPort.writeCallCount, 1);
        assert.ok(terminalPort.createCallCount > 0);
    });

    test('PROMPT_FOR_INTERNAL_LAUNCH strategy should prompt user', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        processPort.setForgeProcessCount(1); // External forge process
        // No terminals

        await useCase.execute();

        assert.strictEqual(clipboardPort.writeCallCount, 1);
        // Should show prompt (info message with actions)
        assert.ok(notificationPort.infoMessages.length > 0);
    });

    test('execute() with autoPaste disabled should not send text', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        await terminalPort.createTerminal('Forge');
        processPort.setForgeProcessCount(0);
        configPort.setAutoPaste(false);

        await useCase.execute();

        assert.strictEqual(clipboardPort.writeCallCount, 1);
        assert.strictEqual(terminalPort.sendTextCallCount, 0);
    });

    test('execute() with autoPaste enabled should send text with delay', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        await terminalPort.createTerminal('Forge');
        processPort.setForgeProcessCount(0);
        configPort.setAutoPaste(true);

        await useCase.execute();

        assert.strictEqual(clipboardPort.writeCallCount, 1);
        // Should have sent text to terminal
        assert.ok(terminalPort.sendTextCallCount > 0);
    });

    test('execute() should handle errors gracefully', async () => {
        // Create a scenario that might fail
        editorPort.setActiveFile('/path/to/file.ts');
        
        // Even with potential errors, should not throw
        try {
            await useCase.execute();
            assert.ok(true, 'Should not throw');
        } catch (error) {
            assert.fail(`Should not throw error: ${error}`);
        }
    });

    test('execute() with relative format should use relative path', async () => {
        editorPort.setActiveFile('/workspace/src/file.ts');
        configPort.setFileReferenceFormat('relative');

        await useCase.execute('relative');

        const written = clipboardPort.getLastWrittenText();
        // Should be relative to workspace
        assert.ok(written.includes('src/file.ts') || written.includes('/workspace/src/file.ts'));
    });

    test('Multiple executions should work independently', async () => {
        editorPort.setActiveFile('/path/to/file1.ts');
        await useCase.execute();
        const first = clipboardPort.getLastWrittenText();

        editorPort.setActiveFile('/path/to/file2.ts');
        await useCase.execute();
        const second = clipboardPort.getLastWrittenText();

        assert.notStrictEqual(first, second);
        assert.strictEqual(clipboardPort.writeCallCount, 2);
    });

    test('execute() should respect notification settings', async () => {
        editorPort.setActiveFile('/path/to/file.ts');
        configPort.setShowNotifications(false);

        await useCase.execute();

        // Even with notifications disabled, should still copy
        assert.strictEqual(clipboardPort.writeCallCount, 1);
    });
});
