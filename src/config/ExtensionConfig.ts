/**
 * Configuration model for the Forge VS Code extension.
 * This represents the extension's configuration structure.
 */
export interface ExtensionConfig {
  /**
   * Format for file references: 'absolute' or 'relative'
   */
  fileReferenceFormat: 'absolute' | 'relative';

  /**
   * When to open terminal: 'once' or 'never'
   */
  openTerminalMode: 'once' | 'never';

  /**
   * Whether to automatically paste file references into terminal
   */
  autoPasteEnabled: boolean;

  /**
   * Delay in milliseconds before pasting file reference
   */
  pasteDelay: number;

  /**
   * Notification preferences
   */
  notifications: {
    info: boolean;
    warning: boolean;
    error: boolean;
  };

  /**
   * Whether to show installation prompt
   */
  showInstallationPrompt: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ExtensionConfig = {
  fileReferenceFormat: 'absolute',
  openTerminalMode: 'once',
  autoPasteEnabled: true,
  pasteDelay: 5000,
  notifications: {
    info: true,
    warning: true,
    error: true,
  },
  showInstallationPrompt: true,
};
