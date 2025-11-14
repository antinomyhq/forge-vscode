import * as vscode from "vscode";

/**
 * Utility functions for path manipulation and formatting.
 * These are pure functions with no side effects.
 * 
 * Best Practices Applied:
 * - Pure Functions: No side effects, deterministic output
 * - Single Responsibility: Each function does one thing
 * - Type Safety: Strong TypeScript typing
 * - Documentation: Clear JSDoc comments
 * - Immutability: Doesn't modify input parameters
 */

/**
 * Get workspace-relative path for a file URI.
 * Falls back to absolute path if file is not in any workspace folder.
 * 
 * @param fileUri - The URI of the file
 * @returns Relative path if in workspace, absolute path otherwise
 * 
 * @example
 * // File in workspace: "src/extension.ts"
 * // File outside workspace: "C:/Users/name/file.ts"
 */
export function getWorkspaceRelativePath(fileUri: vscode.Uri): string {
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
 * Get the file path with a specific format (absolute or relative).
 * If format is not specified, uses the user's preference from settings.
 * 
 * @param fileUri - The URI of the file
 * @param format - Optional format override ("absolute" | "relative")
 * @param configService - Optional config service to get user preference
 * @returns Formatted file path
 * 
 * @example
 * getFilePathWithFormat(uri, "absolute") // "C:/workspace/src/file.ts"
 * getFilePathWithFormat(uri, "relative") // "src/file.ts"
 */
export function getFilePathWithFormat(
  fileUri: vscode.Uri,
  format?: "absolute" | "relative",
  configService?: { getFileReferenceFormat(): string }
): string {
  // If no format specified, use user's preference from settings
  let pathFormat = format;
  
  if (!pathFormat && configService) {
    pathFormat = configService.getFileReferenceFormat() as "absolute" | "relative";
  } else if (!pathFormat) {
    // Fallback to reading config directly if no service provided
    pathFormat = vscode.workspace
      .getConfiguration("forge")
      .get<string>("fileReferenceFormat", "absolute") as "absolute" | "relative";
  }

  if (pathFormat === "relative") {
    return getWorkspaceRelativePath(fileUri);
  }

  // Default to absolute path
  return fileUri.fsPath;
}

