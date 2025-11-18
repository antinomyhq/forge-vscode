/**
 * Terminal handling strategies for different scenarios.
 * This enum defines how the extension should behave based on terminal and process state.
 * 
 * Domain Value Object - Pure business concept with no external dependencies
 */
export enum TerminalStrategy {
  /**
   * Multiple Forge terminals exist - only copy to clipboard (no terminal interaction)
   */
  COPY_ONLY_MULTIPLE_TERMINALS = 'COPY_ONLY_MULTIPLE_TERMINALS',

  /**
   * Mixed processes detected (both internal and external) - only copy to clipboard
   */
  COPY_ONLY_MIXED_PROCESSES = 'COPY_ONLY_MIXED_PROCESSES',

  /**
   * Reuse existing single Forge terminal
   */
  REUSE_EXISTING_TERMINAL = 'REUSE_EXISTING_TERMINAL',

  /**
   * Create a new Forge terminal
   */
  CREATE_NEW_TERMINAL = 'CREATE_NEW_TERMINAL',

  /**
   * Prompt user whether to launch Forge internally when external process exists
   */
  PROMPT_FOR_INTERNAL_LAUNCH = 'PROMPT_FOR_INTERNAL_LAUNCH',
}
