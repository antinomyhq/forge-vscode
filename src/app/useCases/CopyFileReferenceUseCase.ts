import { IEditorPort } from '../../api/ports/IEditorPort';
import { IClipboardPort } from '../../api/ports/IClipboardPort';
import { ITerminalPort } from '../../api/ports/ITerminalPort';
import { IProcessPort } from '../../api/ports/IProcessPort';
import { IConfigurationPort } from '../../api/ports/IConfigurationPort';
import { INotificationPort } from '../../api/ports/INotificationPort';
import { resolveTerminalStrategy } from '../services/terminalStrategyResolver';
import { FileReference } from '../../domain/models/FileReference';
import { FilePath } from '../../domain/valueObjects/FilePath';
import { LineRange } from '../../domain/valueObjects/LineRange';
import { TerminalStrategy } from '../../domain/valueObjects/TerminalStrategy';

/**
 * CopyFileReferenceUseCase orchestrates the workflow of copying file references
 * to the clipboard and optionally pasting them into Forge terminals.
 *
 * This use case uses the generic service pattern with type parameters:
 * - Generic type I represents infrastructure dependencies
 * - Constructor has no type bounds (like Rust impl<I>)
 * - Methods have composed trait bounds (like Rust impl<I: Trait1 + Trait2>)
 * - Single generic parameter for all infrastructure
 *
 * Rust equivalent:
 * ```rust
 * pub struct CopyFileReferenceUseCase<I> {
 *     infra: I,
 *     strategy_resolver: TerminalStrategyResolver,
 * }
 *
 * impl<I> CopyFileReferenceUseCase<I> {
 *     pub fn new(infra: I, strategy_resolver: TerminalStrategyResolver) -> Self { ... }
 * }
 *
 * impl<I: IEditorPort + IClipboardPort + ITerminalPort + ...> CopyFileReferenceUseCase<I> {
 *     pub async fn execute(&self, format_override: Option<String>) -> Result<()> { ... }
 * }
 * ```
 */
export class CopyFileReferenceUseCase<I> {
  /**
   * Creates a new CopyFileReferenceUseCase
   * No type bounds on constructor (like Rust impl<I>)
   * No service dependencies - uses pure functions for business logic
   *
   * @param infra - Infrastructure providing all port implementations
   */
  constructor(private readonly infra: I) {}

  /**
   * Executes the copy file reference workflow
   * Type bounds applied here (like Rust impl<I: Trait1 + Trait2>)
   *
   * @param formatOverride - Optional format override ('absolute' or 'relative')
   */
  public async execute(
    this: CopyFileReferenceUseCase<
      I & IEditorPort & IClipboardPort & ITerminalPort & IProcessPort & IConfigurationPort & INotificationPort
    >,
    formatOverride?: 'absolute' | 'relative'
  ): Promise<void> {
    // Check if we should skip terminal operations
    const openTerminalMode = this.infra.getOpenTerminalMode();
    if (openTerminalMode === 'never') {
      // Only copy to clipboard, don't interact with terminals
      await this.copyToClipboardOnly();
      return;
    }

    // Create file reference from active editor
    const fileReference = this.createFileReference(formatOverride);
    if (!fileReference) {
      await this.infra.showWarning('No active file to copy');
      return;
    }

    // Convert to Forge format and copy to clipboard
    const forgeFormat = fileReference.toForgeFormat();
    await this.infra.write(forgeFormat);

    // Get terminal and process counts for strategy resolution
    const terminalIds = this.infra.getForgeTerminals();
    const terminalCount = terminalIds.length;
    const processCount = await this.infra.countForgeProcesses();

    // Resolve strategy based on current state
    const strategy = resolveTerminalStrategy(terminalCount, processCount);

    // Execute the appropriate strategy
    await this.executeStrategy(strategy, forgeFormat, terminalIds);
  }

  /**
   * Copies file reference to clipboard without terminal interaction
   * Type bounds ensure infra has required capabilities
   */
  private async copyToClipboardOnly(
    this: CopyFileReferenceUseCase<I & IEditorPort & IClipboardPort & IConfigurationPort & INotificationPort>
  ): Promise<void> {
    const fileReference = this.createFileReference();
    if (!fileReference) {
      await this.infra.showWarning('No active file to copy');
      return;
    }

    const forgeFormat = fileReference.toForgeFormat();
    await this.infra.write(forgeFormat);

    this.infra.showStatusBar('File reference copied to clipboard', 3000);
  }

  /**
   * Creates a FileReference from the active editor state
   * Type bounds: requires IEditorPort & IConfigurationPort
   */
  private createFileReference(
    this: CopyFileReferenceUseCase<I & IEditorPort & IConfigurationPort>,
    formatOverride?: 'absolute' | 'relative'
  ): FileReference | undefined {
    if (!this.infra.hasActiveEditor()) {
      return undefined;
    }

    const filePath = this.infra.getActiveFilePath();
    if (filePath === undefined || filePath.trim().length === 0) {
      return undefined;
    }

    // Determine format from override or config
    const format = formatOverride ?? this.infra.getFileReferenceFormat();
    const filePathVO = format === 'relative' ? FilePath.fromRelative(filePath) : FilePath.fromAbsolute(filePath);

    // Get selection if any
    const selection = this.infra.getSelection();
    if (selection && !selection.isEmpty) {
      const lineRange = LineRange.fromZeroBased(selection.start, selection.end);
      return FileReference.create(filePathVO, lineRange);
    }

    return FileReference.create(filePathVO);
  }

  /**
   * Executes the appropriate strategy based on terminal state
   * Type bounds: requires all ports for strategy execution
   */
  private async executeStrategy(
    this: CopyFileReferenceUseCase<
      I & ITerminalPort & IConfigurationPort & INotificationPort
    >,
    strategy: TerminalStrategy,
    forgeFormat: string,
    terminalIds: string[]
  ): Promise<void> {
    switch (strategy) {
      case TerminalStrategy.COPY_ONLY_MULTIPLE_TERMINALS:
        this.infra.showStatusBar(
          'File reference copied to clipboard. Paste it in any forge terminal when ready.',
          5000
        );
        break;

      case TerminalStrategy.COPY_ONLY_MIXED_PROCESSES:
        this.infra.showStatusBar(
          'File reference copied to clipboard. Paste it in any forge terminal when ready.',
          5000
        );
        break;

      case TerminalStrategy.REUSE_EXISTING_TERMINAL:
        await this.reuseTerminal(terminalIds[0], forgeFormat);
        break;

      case TerminalStrategy.CREATE_NEW_TERMINAL:
        await this.createNewTerminal(forgeFormat);
        break;

      case TerminalStrategy.PROMPT_FOR_INTERNAL_LAUNCH:
        await this.promptForLaunch(forgeFormat);
        break;
    }
  }

  /**
   * Reuses an existing terminal
   * Type bounds: requires ITerminalPort & IConfigurationPort & INotificationPort
   */
  private async reuseTerminal(
    this: CopyFileReferenceUseCase<I & ITerminalPort & IConfigurationPort & INotificationPort>,
    terminalId: string,
    forgeFormat: string
  ): Promise<void> {
    await this.infra.focusTerminal(terminalId);
    this.infra.showTerminal(terminalId);

    // Check if auto-paste is enabled
    if (this.infra.getAutoPasteEnabled()) {
      const delay = this.infra.getPasteDelay();
      // Send file reference without newline (don't auto-submit)
      await this.infra.sendText(terminalId, forgeFormat, delay, false);
      this.infra.showStatusBar('File reference pasted to terminal', 5000);
    } else {
      this.infra.showStatusBar('File reference copied to clipboard', 5000);
    }
  }

  /**
   * Creates a new terminal and launches Forge
   * Type bounds: requires ITerminalPort & IConfigurationPort
   */
  private async createNewTerminal(
    this: CopyFileReferenceUseCase<I & ITerminalPort & IConfigurationPort>,
    forgeFormat: string
  ): Promise<void> {
    const terminalId = await this.infra.createForgeTerminal();
    this.infra.showTerminal(terminalId);
    await this.infra.sendText(terminalId, 'forge', 0, true);
    const pasteDelay = this.infra.getPasteDelay();
    await this.infra.sendText(terminalId, forgeFormat, pasteDelay, false);
  }

  /**
   * Prompts user whether to launch Forge internally
   * Type bounds: requires INotificationPort & ITerminalPort & IConfigurationPort
   */
  private async promptForLaunch(
    this: CopyFileReferenceUseCase<I & INotificationPort & ITerminalPort & IConfigurationPort>,
    forgeFormat: string
  ): Promise<void> {
    const response = await this.infra.showInfo(
      'Launch Forge internally?',
      'Yes',
      'No'
    );

    if (response === 'Yes') {
      await this.createNewTerminal(forgeFormat);
    } else {
      this.infra.showStatusBar(
        'File reference copied to clipboard. Paste it in your external forge terminal.',
        5000
      );
    }
  }
}
