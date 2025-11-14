import * as vscode from "vscode";

// Reusable status bar item and counter for copy notifications
let copyStatusBarItem: vscode.StatusBarItem | null = null;
let copyCount = 0;
let copyTimeout: NodeJS.Timeout | null = null;

/**
 * Show copy reference notification in activity bar
 */
export function showCopyReferenceInActivityBar(message: string): void {
  copyCount++;

  // Create status bar item if it doesn't exist
  if (!copyStatusBarItem) {
    copyStatusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    copyStatusBarItem.command = "forge.copyFileReference";
  }

  // Update status bar item
  copyStatusBarItem.text = `$(clippy) ${copyCount}`;
  copyStatusBarItem.tooltip = message;
  copyStatusBarItem.show();

  // Clear existing timeout
  if (copyTimeout) {
    clearTimeout(copyTimeout);
  }

  // Hide status bar item after 5 seconds
  copyTimeout = setTimeout(() => {
    if (copyStatusBarItem) {
      copyStatusBarItem.hide();
    }
  }, 5000);
}

/**
 * Clean up status bar resources
 */
export function disposeStatusBar(): void {
  if (copyStatusBarItem) {
    copyStatusBarItem.dispose();
    copyStatusBarItem = null;
  }
  if (copyTimeout) {
    clearTimeout(copyTimeout);
    copyTimeout = null;
  }
}