/**
 * Configuration for notification behavior
 * Value object passed to NotificationAdapter to control which notifications to show
 */
export interface NotificationConfig {
  /**
   * Whether to show info notifications
   */
  showInfo: boolean;

  /**
   * Whether to show warning notifications
   */
  showWarning: boolean;

  /**
   * Whether to show error notifications
   */
  showError: boolean;
}
