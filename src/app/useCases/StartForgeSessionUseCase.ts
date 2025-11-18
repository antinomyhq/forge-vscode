import { ITerminalPort } from '../../api/ports/ITerminalPort';
import { IConfigurationPort } from '../../api/ports/IConfigurationPort';
import { INotificationPort } from '../../api/ports/INotificationPort';
import { IEditorPort } from '../../api/ports/IEditorPort';
import { IClipboardPort } from '../../api/ports/IClipboardPort';
import { FileReference } from '../../domain/models/FileReference';
import { FilePath } from '../../domain/valueObjects/FilePath';
import { LineRange } from '../../domain/valueObjects/LineRange';

/**
 * Use case for starting a new Forge session in a terminal.
 *
 * This use case uses the generic service pattern with type parameters:
 * - Generic type I represents infrastructure dependencies
 * - Constructor has no type bounds (like Rust impl<I>)
 * - Methods have composed trait bounds (like Rust impl<I: Trait1 + Trait2>)
 * - Single generic parameter for all infrastructure
 *
 * Rust equivalent:
 * ```rust
 * pub struct StartForgeSessionUseCase<I> {
 *     infra: I,
 * }
 *
 * impl<I> StartForgeSessionUseCase<I> {
 *     pub fn new(infra: I) -> Self { ... }
 * }
 *
 * impl<I: ITerminalPort + IConfigurationPort + INotificationPort + ...> StartForgeSessionUseCase<I> {
 *     pub async fn execute(&self) -> Result<()> { ... }
 * }
 * ```
 */
export class StartForgeSessionUseCase<I> {
  /**
   * Creates a new StartForgeSessionUseCase
   * No type bounds on constructor (like Rust impl<I>)
   *
   * @param infra - Infrastructure providing all port implementations
   */
  constructor(private readonly infra: I) {}

  /**
   * Executes the use case: creates a new Forge session
   * Type bounds applied here (like Rust impl<I: Trait1 + Trait2>)
   *
   * @returns Promise that resolves when the session is created
   */
  public async execute(
    this: StartForgeSessionUseCase<
      I & ITerminalPort & IConfigurationPort & INotificationPort & IEditorPort & IClipboardPort
    >
  ): Promise<void> {
    // Create new Forge terminal
    const terminalId = await this.infra.createForgeTerminal();

    // Show the terminal
    this.infra.showTerminal(terminalId);

    // Send "forge" command with auto-submit (addNewLine: true)
    const delay = 0; // No delay for forge command
    await this.infra.sendText(terminalId, 'forge', delay, true);

    // Copy file reference to clipboard if there's an active file
    await this.copyFileReferenceToClipboard();

    // Optionally show success notification
    const showNotifications = this.infra.isNotificationEnabled('info');
    if (showNotifications) {
      await this.infra.showInfo('New Forge session started successfully!');
    }

    // Optionally auto-paste file reference if configured
    const autoPaste = this.infra.getAutoPasteEnabled();
    if (autoPaste) {
      const fileReference = await this.infra.read();
      if (fileReference && fileReference.trim().length > 0) {
        const pasteDelay = this.infra.getPasteDelay();
        // Don't auto-submit the file reference (addNewLine: false)
        await this.infra.sendText(terminalId, fileReference, pasteDelay, false);
      }
    }
  }

  /**
   * Creates a file reference from the active editor and copies it to clipboard
   * Type bounds: requires IEditorPort & IClipboardPort
   *
   * @private
   */
  private async copyFileReferenceToClipboard(
    this: StartForgeSessionUseCase<I & IEditorPort & IClipboardPort>
  ): Promise<void> {
    // Check if there's an active editor
    if (!this.infra.hasActiveEditor()) {
      return; // No active editor, silently skip
    }

    // Get file path
    const filePath = this.infra.getActiveFilePath();
    if (filePath === undefined || filePath.trim().length === 0) {
      return; // No file path available
    }

    // Get selection (if any)
    const selection = this.infra.getSelection();

    // Create domain models
    const filePathVO = FilePath.fromAbsolute(filePath);
    let fileReference: FileReference;

    if (selection && !selection.isEmpty) {
      // Has selection: create with line range
      const lineRange = LineRange.fromZeroBased(selection.start, selection.end);
      fileReference = FileReference.create(filePathVO, lineRange);
    } else {
      // No selection: create without line range
      fileReference = FileReference.create(filePathVO);
    }

    // Convert to Forge format and copy to clipboard
    const forgeFormat = fileReference.toForgeFormat();
    await this.infra.write(forgeFormat);
  }
}
