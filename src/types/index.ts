import * as vscode from "vscode";

/**
 * Configuration options for the Forge extension
 */
export interface ForgeConfiguration {
  notifications: {
    info: boolean;
    warning: boolean;
    error: boolean;
  };
  startupDelay: number;
  autoPaste: boolean;
}

/**
 * File reference format options
 */
export type FileReferenceFormat = "absolute" | "relative";

/**
 * Command registration context
 */
export interface CommandContext {
  terminalService: import("../services/TerminalService").TerminalService;
  processService: import("../services/ProcessService").ProcessService;
  clipboardService: import("../services/ClipboardService").ClipboardService;
  copyCommand: import("../commands/CopyCommand").CopyCommand;
  forgeSessionCommand: import("../commands/ForgeSessionCommand").ForgeSessionCommand;
}

/**
 * Extension state
 */
export interface ExtensionState {
  isActivated: boolean;
  lastFocusedForgeTerminal: vscode.Terminal | null;
}