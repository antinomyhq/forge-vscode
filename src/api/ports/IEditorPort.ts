/**
 * IEditorPort defines the contract for editor operations.
 * This port abstracts editor access, allowing different implementations
 * (VS Code editor, test mocks, etc.)
 */
export interface IEditorPort {
  /**
   * Gets the absolute file path of the active editor
   * @returns The absolute file path, or undefined if no editor is active
   */
  getActiveFilePath(): string | undefined;

  /**
   * Gets the current selection in the active editor
   * Line numbers are 0-based (VS Code format)
   * @returns Selection object with start, end, and isEmpty flag,
   *          or undefined if no editor is active
   */
  getSelection(): { start: number; end: number; isEmpty: boolean } | undefined;

  /**
   * Checks if there is an active text editor
   * @returns true if an editor is currently active
   */
  hasActiveEditor(): boolean;
}
