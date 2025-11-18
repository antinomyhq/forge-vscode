/**
 * IConfigurationPort defines the contract for accessing extension configuration.
 * This port abstracts configuration access, allowing different implementations
 * (VS Code settings, test mocks, etc.)
 * 
 * Implementations should read from the 'forge' configuration namespace.
 */
export interface IConfigurationPort {
  /**
   * Gets the file reference format preference
   * @returns 'absolute' for full paths, 'relative' for workspace-relative paths
   */
  getFileReferenceFormat(): 'absolute' | 'relative';

  /**
   * Gets the terminal opening mode preference
   * @returns 'once' to open terminal once, 'never' to never open automatically
   */
  getOpenTerminalMode(): 'once' | 'never';

  /**
   * Checks if automatic paste is enabled
   * When enabled, file references are automatically pasted into the terminal
   * @returns true if auto-paste is enabled
   */
  getAutoPasteEnabled(): boolean;

  /**
   * Gets the delay in milliseconds before pasting file reference
   * This delay allows the terminal to initialize before receiving input
   * @returns Delay in milliseconds (typically 5000ms)
   */
  getPasteDelay(): number;

  /**
   * Checks if notifications of a specific type are enabled
   * @param type - The notification type to check ('info', 'warning', or 'error')
   * @returns true if notifications of this type should be shown
   */
  isNotificationEnabled(type: 'info' | 'warning' | 'error'): boolean;

  /**
   * Checks if the installation prompt should be shown
   * @returns true if the installation prompt should be displayed
   */
  showInstallationPrompt(): boolean;
}
