import * as vscode from "vscode";

// Get workspace-relative path or absolute if not in workspace
export function getWorkspaceRelativePath(fileUri: vscode.Uri): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

  if (workspaceFolder) {
    const relativePath = vscode.workspace.asRelativePath(fileUri, false);
    return relativePath;
  }

  // Fallback to absolute path if not in workspace
  return fileUri.fsPath;
}

// Get file path with specified format (absolute or relative)
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

