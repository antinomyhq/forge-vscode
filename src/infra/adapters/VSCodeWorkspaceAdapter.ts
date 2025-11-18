import * as vscode from 'vscode';
import { IWorkspacePort } from '../../api/ports/IWorkspacePort';

/**
 * VSCodeWorkspaceAdapter implements IWorkspacePort using VS Code's workspace API.
 * Provides workspace folder detection and relative path conversion.
 */
export class VSCodeWorkspaceAdapter implements IWorkspacePort {
  /**
   * Gets the workspace folder for a given file path
   */
  public getWorkspaceFolder(filePath: string): string | undefined {
    const fileUri = vscode.Uri.file(filePath);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
    
    return workspaceFolder?.uri.fsPath;
  }

  /**
   * Converts an absolute file path to a workspace-relative path
   */
  public getRelativePath(filePath: string, _workspaceFolder: string): string {
    const fileUri = vscode.Uri.file(filePath);
    
    // Use VS Code's built-in relative path calculation
    // Note: VS Code's asRelativePath handles workspace folder resolution internally
    return vscode.workspace.asRelativePath(fileUri, false);
  }
}
