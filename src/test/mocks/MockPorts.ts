import { IEditorPort } from '../../api/ports/IEditorPort';
import { IClipboardPort } from '../../api/ports/IClipboardPort';
import { ITerminalPort } from '../../api/ports/ITerminalPort';
import { IProcessPort } from '../../api/ports/IProcessPort';
import { IConfigurationPort } from '../../api/ports/IConfigurationPort';
import { INotificationPort } from '../../api/ports/INotificationPort';

/**
 * Type representing the composite infrastructure object returned by createMockInfrastructure
 */
export type MockInfrastructure = IEditorPort & IClipboardPort & ITerminalPort & IProcessPort & IConfigurationPort & INotificationPort & {
  _mocks: {
    editor: MockEditorPort;
    clipboard: MockClipboardPort;
    terminal: MockTerminalPort;
    process: MockProcessPort;
    config: MockConfigurationPort;
    notification: MockNotificationPort;
  };
};

/**
 * Creates a composite infrastructure object from individual mock ports
 * This is used with the generic service pattern where services accept a single I parameter
 *
 * @param ports - Object containing individual mock port instances
 * @returns Composite infrastructure object implementing all port interfaces
 */
export function createMockInfrastructure(ports: {
  editor: MockEditorPort;
  clipboard: MockClipboardPort;
  terminal: MockTerminalPort;
  process: MockProcessPort;
  config: MockConfigurationPort;
  notification: MockNotificationPort;
}): MockInfrastructure {
  return {
    // IEditorPort
    getActiveFilePath: () => ports.editor.getActiveFilePath(),
    getSelection: () => ports.editor.getSelection(),
    hasActiveEditor: () => ports.editor.hasActiveEditor(),
    
    // IClipboardPort
    read: () => ports.clipboard.read(),
    write: (text: string) => ports.clipboard.write(text),
    
    // ITerminalPort
    createForgeTerminal: () => ports.terminal.createForgeTerminal(),
    getForgeTerminals: () => ports.terminal.getForgeTerminals(),
    isForgeTerminal: (terminalId: string) => ports.terminal.isForgeTerminal(terminalId),
    focusTerminal: (terminalId: string) => ports.terminal.focusTerminal(terminalId),
    sendText: (terminalId: string, text: string, delay: number, addNewLine?: boolean) =>
      ports.terminal.sendText(terminalId, text, delay, addNewLine),
    getLastFocusedForgeTerminal: () => ports.terminal.getLastFocusedForgeTerminal(),
    showTerminal: (terminalId: string) => ports.terminal.showTerminal(terminalId),
    
    // IProcessPort
    countForgeProcesses: () => ports.process.countForgeProcesses(),
    hasExternalForgeProcess: () => ports.process.hasExternalForgeProcess(),
    
    // IConfigurationPort
    getFileReferenceFormat: () => ports.config.getFileReferenceFormat(),
    getOpenTerminalMode: () => ports.config.getOpenTerminalMode(),
    getAutoPasteEnabled: () => ports.config.getAutoPasteEnabled(),
    getPasteDelay: () => ports.config.getPasteDelay(),
    isNotificationEnabled: (type: 'info' | 'warning' | 'error') =>
      ports.config.isNotificationEnabled(type),
    showInstallationPrompt: () => ports.config.showInstallationPrompt(),
    
    // INotificationPort
    showInfo: (message: string, ...actions: string[]) =>
      ports.notification.showInfo(message, ...actions),
    showWarning: (message: string, ...actions: string[]) =>
      ports.notification.showWarning(message, ...actions),
    showError: (message: string, ...actions: string[]) =>
      ports.notification.showError(message, ...actions),
    showStatusBar: (message: string, durationMs: number) =>
      ports.notification.showStatusBar(message, durationMs),
    
    // Expose individual mocks for assertions
    _mocks: ports,
  };
}

/**
 * Mock implementations of port interfaces for testing use cases.
 * These mocks allow testing business logic without VS Code dependencies.
 */

/**
 * Mock Editor Port for testing
 */
export class MockEditorPort implements IEditorPort {
    private _activeFilePath: string | undefined;
    private _selection: { start: number; end: number; isEmpty: boolean } | undefined;

    constructor(filePath?: string, selection?: { start: number; end: number }) {
        this._activeFilePath = filePath;
        if (selection) {
            this._selection = { ...selection, isEmpty: false };
        }
    }

    getActiveFilePath(): string | undefined {
        return this._activeFilePath;
    }

    getSelection(): { start: number; end: number; isEmpty: boolean } | undefined {
        return this._selection;
    }

    hasActiveEditor(): boolean {
        return this._activeFilePath !== undefined;
    }

    // Helper methods for testing
    setActiveFile(path: string | undefined): void {
        this._activeFilePath = path;
    }

    setSelection(selection: { start: number; end: number } | undefined): void {
        if (selection) {
            this._selection = { ...selection, isEmpty: false };
        } else {
            this._selection = undefined;
        }
    }
}

/**
 * Mock Clipboard Port for testing
 */
export class MockClipboardPort implements IClipboardPort {
    private _clipboardContent: string = '';
    public writeCallCount: number = 0;

    async write(text: string): Promise<void> {
        this._clipboardContent = text;
        this.writeCallCount++;
    }

    async read(): Promise<string> {
        return this._clipboardContent;
    }

    // Helper methods for testing
    getLastWrittenText(): string {
        return this._clipboardContent;
    }

    reset(): void {
        this._clipboardContent = '';
        this.writeCallCount = 0;
    }
}

/**
 * Mock Terminal Port for testing
 */
export class MockTerminalPort implements ITerminalPort {
    private terminals: Map<string, { name: string; createdAt: number }> = new Map();
    private textSent: string[] = [];
    private lastFocusedTerminal: string | undefined;
    public createCallCount: number = 0;
    public sendTextCallCount: number = 0;
    public showCallCount: number = 0;
    public focusCallCount: number = 0;

    async createForgeTerminal(): Promise<string> {
        this.createCallCount++;
        const id = `terminal-${this.createCallCount}`;
        this.terminals.set(id, { name: 'Forge', createdAt: Date.now() });
        return id;
    }

    async sendText(_terminalId: string, text: string, _delay: number, _addNewLine?: boolean): Promise<void> {
        this.sendTextCallCount++;
        this.textSent.push(text);
    }

    showTerminal(_terminalId: string): void {
        this.showCallCount++;
    }

    async focusTerminal(terminalId: string): Promise<void> {
        this.focusCallCount++;
        this.lastFocusedTerminal = terminalId;
    }

    getForgeTerminals(): string[] {
        return Array.from(this.terminals.keys());
    }

    isForgeTerminal(terminalId: string): boolean {
        return this.terminals.has(terminalId);
    }

    getLastFocusedForgeTerminal(): string | undefined {
        return this.lastFocusedTerminal;
    }

    // Helper methods for testing
    async createTerminal(name: string): Promise<string> {
        this.createCallCount++;
        const id = `terminal-${this.createCallCount}`;
        this.terminals.set(id, { name, createdAt: Date.now() });
        return id;
    }

    getSentText(): string[] {
        return this.textSent;
    }

    getLastSentText(): string | undefined {
        return this.textSent[this.textSent.length - 1];
    }

    reset(): void {
        this.terminals.clear();
        this.textSent = [];
        this.createCallCount = 0;
        this.sendTextCallCount = 0;
        this.showCallCount = 0;
        this.focusCallCount = 0;
        this.lastFocusedTerminal = undefined;
    }
}

/**
 * Mock Process Port for testing
 */
export class MockProcessPort implements IProcessPort {
    private _forgeProcessCount: number = 0;

    constructor(forgeProcessCount: number = 0) {
        this._forgeProcessCount = forgeProcessCount;
    }

    async countForgeProcesses(): Promise<number> {
        return this._forgeProcessCount;
    }

    async hasExternalForgeProcess(): Promise<boolean> {
        return this._forgeProcessCount > 0;
    }

    // Helper methods for testing
    setForgeProcessCount(count: number): void {
        this._forgeProcessCount = count;
    }
}

/**
 * Mock Configuration Port for testing
 */
export class MockConfigurationPort implements IConfigurationPort {
    private config = {
        autoPaste: true,
        pasteDelay: 100,
        openTerminal: 'once' as 'once' | 'always' | 'never',
        fileReferenceFormat: 'absolute' as 'absolute' | 'relative',
        showNotifications: true,
        showInstallationPrompt: true,
    };

    getAutoPasteEnabled(): boolean {
        return this.config.autoPaste;
    }

    getPasteDelay(): number {
        return this.config.pasteDelay;
    }

    getOpenTerminalMode(): 'once' | 'never' {
        // Map 'always' to 'once' for interface compatibility
        return this.config.openTerminal === 'always' ? 'once' : this.config.openTerminal;
    }

    getFileReferenceFormat(): 'absolute' | 'relative' {
        return this.config.fileReferenceFormat;
    }

    isNotificationEnabled(_type: 'info' | 'warning' | 'error'): boolean {
        return this.config.showNotifications;
    }

    showInstallationPrompt(): boolean {
        return this.config.showInstallationPrompt;
    }

    // Helper methods for testing
    setAutoPaste(value: boolean): void {
        this.config.autoPaste = value;
    }

    setOpenTerminal(value: 'once' | 'always' | 'never'): void {
        this.config.openTerminal = value;
    }

    setFileReferenceFormat(value: 'absolute' | 'relative'): void {
        this.config.fileReferenceFormat = value;
    }

    setShowNotifications(value: boolean): void {
        this.config.showNotifications = value;
    }
}

/**
 * Mock Notification Port for testing
 */
export class MockNotificationPort implements INotificationPort {
    public infoMessages: string[] = [];
    public warningMessages: string[] = [];
    public errorMessages: string[] = [];
    public statusBarMessages: string[] = [];

    async showInfo(message: string, ..._actions: string[]): Promise<string | undefined> {
        this.infoMessages.push(message);
        return _actions.length > 0 ? _actions[0] : undefined;
    }

    async showWarning(message: string, ..._actions: string[]): Promise<string | undefined> {
        this.warningMessages.push(message);
        return undefined;
    }

    async showError(message: string, ..._actions: string[]): Promise<string | undefined> {
        this.errorMessages.push(message);
        return undefined;
    }

    showStatusBar(message: string, _durationMs: number): void {
        this.statusBarMessages.push(message);
    }

    // Helper methods for testing
    getLastInfo(): string | undefined {
        return this.infoMessages[this.infoMessages.length - 1];
    }

    getLastWarning(): string | undefined {
        return this.warningMessages[this.warningMessages.length - 1];
    }

    getLastError(): string | undefined {
        return this.errorMessages[this.errorMessages.length - 1];
    }

    getLastStatusBar(): string | undefined {
        return this.statusBarMessages[this.statusBarMessages.length - 1];
    }

    reset(): void {
        this.infoMessages = [];
        this.warningMessages = [];
        this.errorMessages = [];
        this.statusBarMessages = [];
    }
}
