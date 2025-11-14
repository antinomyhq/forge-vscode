import * as vscode from "vscode";

export function showNotificationIfEnabled(message: string, messageType: 'info' | 'warning' | 'error' = 'info', ...items: string[]): Thenable<string | undefined> {
  const notifications = vscode.workspace
    .getConfiguration("forge")
    .get<{info: boolean, warning: boolean, error: boolean}>("notifications");

  // Check if this specific notification type is enabled
  if (!notifications?.[messageType]) {
    return Promise.resolve(undefined);
  }

  switch (messageType) {
    case 'warning':
      return vscode.window.showWarningMessage(message, ...items);
    case 'error':
      return vscode.window.showErrorMessage(message, ...items);
    default:
      return vscode.window.showInformationMessage(message, ...items);
  }
}