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

  const document = editor.document;
  const filePath = getFilePathWithFormat(document.uri, format);
  const selection = editor.selection;

  // If no selection, return the file path in formatted form
  if (selection.isEmpty) {
    return `@[${filePath}]`;
  }

  // Get line numbers (1-based)
  const startLine = selection.start.line + 1;
  const endLine = selection.end.line + 1;

  // Always return file reference without symbol name
  return `@[${filePath}:${startLine}:${endLine}]`;
}

/**
 * Get the file path with a specific format (absolute or relative)
 * If format is not specified, uses the user's preference from settings
 */
function getFilePathWithFormat(
  fileUri: vscode.Uri,
  format?: "absolute" | "relative"
): string {
  // If no format specified, use user's preference from settings
  const pathFormat = format ?? vscode.workspace
    .getConfiguration("forge")
    .get<string>("fileReferenceFormat", "absolute");

  if (pathFormat === "relative") {
    return getWorkspaceRelativePath(fileUri);
  }

  // Default to absolute path
  return fileUri.fsPath;
}

/**
 * Get workspace-relative path for a file URI
 * Falls back to absolute path if file is not in any workspace folder
 */
function getWorkspaceRelativePath(fileUri: vscode.Uri): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

  if (workspaceFolder) {
    // Get relative path from workspace root
    const relativePath = vscode.workspace.asRelativePath(fileUri, false);
    return relativePath;
  }

  // Fallback to absolute path if not in workspace
  return fileUri.fsPath;
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