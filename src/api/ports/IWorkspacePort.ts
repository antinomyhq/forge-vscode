/**
 * IWorkspacePort defines the contract for workspace operations.
 * This port abstracts workspace access, allowing different implementations
 * (VS Code workspace, test mocks, etc.)
 */
export interface IWorkspacePort {
  /**
   * Gets the workspace folder for a given file path
   * @param filePath - The absolute file path
   * @returns The workspace folder path, or undefined if file is not in any workspace
   */
  getWorkspaceFolder(filePath: string): string | undefined;

  /**
   * Converts an absolute file path to a workspace-relative path
   * @param filePath - The absolute file path
   * @param workspaceFolder - The workspace folder path
   * @returns The relative path from the workspace folder
   */
  getRelativePath(filePath: string, workspaceFolder: string): string;
}
