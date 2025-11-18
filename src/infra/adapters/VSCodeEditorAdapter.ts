import * as vscode from 'vscode';
import { IEditorPort } from '../../api/ports/IEditorPort';

/**
 * VSCodeEditorAdapter implements IEditorPort using VS Code's editor API.
 * This adapter provides access to the active text editor.
 */
export class VSCodeEditorAdapter implements IEditorPort {
  /**
   * Gets the absolute file path of the active editor
   * @returns The absolute file path, or undefined if no editor is active
   */
  public getActiveFilePath(): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return undefined;
    }
    return activeEditor.document.uri.fsPath;
  }

  /**
   * Gets the current selection in the active editor
   * Line numbers are 0-based (VS Code format)
   * @returns Selection object, or undefined if no editor is active
   */
  public getSelection(): { start: number; end: number; isEmpty: boolean } | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return undefined;
    }

    const selection = activeEditor.selection;
    return {
      start: selection.start.line,
      end: selection.end.line,
      isEmpty: selection.isEmpty,
    };
  }

  /**
   * Checks if there is an active text editor
   * @returns true if an editor is currently active
   */
  public hasActiveEditor(): boolean {
    return vscode.window.activeTextEditor !== undefined;
  }
}
