/**
 * INotificationPort defines the contract for user notifications.
 * This port abstracts notification mechanisms, allowing different implementations
 * (VS Code notifications, test mocks, etc.)
 * 
 * All notification methods respect user preferences for notification visibility.
 */
export interface INotificationPort {
  /**
   * Shows an informational message to the user
   * @param message - The message to display
   * @param actions - Optional action button labels
   * @returns Promise resolving to the selected action label, or undefined if dismissed
   */
  showInfo(message: string, ...actions: string[]): Promise<string | undefined>;

  /**
   * Shows a warning message to the user
   * @param message - The message to display
   * @param actions - Optional action button labels
   * @returns Promise resolving to the selected action label, or undefined if dismissed
   */
  showWarning(message: string, ...actions: string[]): Promise<string | undefined>;

  /**
   * Shows an error message to the user
   * @param message - The message to display
   * @param actions - Optional action button labels
   * @returns Promise resolving to the selected action label, or undefined if dismissed
   */
  showError(message: string, ...actions: string[]): Promise<string | undefined>;

  /**
   * Shows a temporary message in the status bar
   * The message automatically disappears after the specified duration
   * @param message - The message to display in status bar
   * @param durationMs - How long to show the message in milliseconds
   */
  showStatusBar(message: string, durationMs: number): void;
}
