import * as vscode from "vscode";
import * as path from "path";

/**
 * Get file reference in the specified format
 */
export function getFileReference(format?: "absolute" | "relative"): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }

  const filePath = editor.document.uri.fsPath;
  const selection = editor.selection;
  const lineNumber = selection.anchor.line + 1; // Convert to 1-based indexing
  const fileName = path.basename(filePath);
  
  if (format === "relative") {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (workspaceFolder) {
      const relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
      return `${relativePath}:${lineNumber}`;
    }
  }
  
  return `${fileName}:${lineNumber}`;
}

/**
 * Get absolute file path
 */
export function getAbsolutePath(filePath: string): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return filePath;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (workspaceFolder) {
    return path.resolve(workspaceFolder.uri.fsPath, filePath);
  }

  return filePath;
}

/**
 * Get relative file path from workspace root
 */
export function getRelativePath(filePath: string): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return filePath;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (workspaceFolder) {
    return path.relative(workspaceFolder.uri.fsPath, filePath);
  }

  return filePath;
}

/**
 * Get current editor file path
 */
export function getEditorFilePath(): string | undefined {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return undefined;
  }

  return editor.document.uri.fsPath;
}