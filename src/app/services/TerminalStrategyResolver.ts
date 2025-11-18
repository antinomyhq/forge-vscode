import { TerminalStrategy } from '../../domain/valueObjects/TerminalStrategy';

/**
 * Resolves the appropriate terminal strategy based on terminal and process counts.
 * This is a pure function module (not a service) with no state or dependencies.
 * 
 * Strategy Resolution Rules:
 * 1. Multiple terminals → COPY_ONLY_MULTIPLE_TERMINALS (just copy, don't auto-paste)
 * 2. Mixed internal/external processes → COPY_ONLY_MIXED_PROCESSES (user must choose)
 * 3. One terminal, no external processes → REUSE_EXISTING_TERMINAL (paste in existing)
 * 4. No terminals, no external processes → CREATE_NEW_TERMINAL (create and paste)
 * 5. External processes exist → PROMPT_FOR_INTERNAL_LAUNCH (ask user)
 * 
 * Rust equivalent: Pure functions, not a struct/impl
 * ```rust
 * pub fn resolve_terminal_strategy(terminal_count: usize, process_count: usize) -> TerminalStrategy {
 *     if terminal_count > 1 {
 *         TerminalStrategy::CopyOnlyMultipleTerminals
 *     } else if terminal_count == 1 && process_count > 0 {
 *         TerminalStrategy::CopyOnlyMixedProcesses
 *     } else if terminal_count == 1 {
 *         TerminalStrategy::ReuseExistingTerminal
 *     } else if process_count == 0 {
 *         TerminalStrategy::CreateNewTerminal
 *     } else {
 *         TerminalStrategy::PromptForInternalLaunch
 *     }
 * }
 * ```
 */

/**
 * Resolves terminal strategy based on terminal and process counts
 * Pure function - no side effects, no dependencies
 * 
 * @param terminalCount - Number of Forge terminals currently open
 * @param processCount - Number of external Forge processes running
 * @returns The appropriate terminal strategy to use
 */
export function resolveTerminalStrategy(
  terminalCount: number,
  processCount: number
): TerminalStrategy {
  // Multiple terminals: User must manually select which terminal to paste into
  if (terminalCount > 1) {
    return TerminalStrategy.COPY_ONLY_MULTIPLE_TERMINALS;
  }

  // One terminal with external processes: Ambiguous - both internal and external exist
  if (terminalCount === 1 && processCount > 0) {
    return TerminalStrategy.COPY_ONLY_MIXED_PROCESSES;
  }

  // One terminal, no external processes: Safe to reuse existing terminal
  if (terminalCount === 1) {
    return TerminalStrategy.REUSE_EXISTING_TERMINAL;
  }

  // No terminals, no external processes: Safe to create new terminal
  if (processCount === 0) {
    return TerminalStrategy.CREATE_NEW_TERMINAL;
  }

  // No terminals, but external processes exist: Ask user if they want internal launch
  return TerminalStrategy.PROMPT_FOR_INTERNAL_LAUNCH;
}

/**
 * Gets a human-readable description of a terminal strategy
 * Pure function - no side effects
 * 
 * @param strategy - The terminal strategy
 * @returns Human-readable description of the strategy
 */
export function getStrategyDescription(strategy: TerminalStrategy): string {
  switch (strategy) {
    case TerminalStrategy.COPY_ONLY_MULTIPLE_TERMINALS:
      return 'Multiple Forge terminals detected. File reference copied to clipboard. ' +
             'Paste it in the desired terminal manually.';
    
    case TerminalStrategy.COPY_ONLY_MIXED_PROCESSES:
      return 'Forge is running both internally and externally. File reference copied to clipboard. ' +
             'Paste it in any forge terminal when ready.';
    
    case TerminalStrategy.REUSE_EXISTING_TERMINAL:
      return 'Reusing existing Forge terminal.';
    
    case TerminalStrategy.CREATE_NEW_TERMINAL:
      return 'Creating new Forge terminal.';
    
    case TerminalStrategy.PROMPT_FOR_INTERNAL_LAUNCH:
      return 'External Forge process detected. Prompting user for internal launch.';
    
    default:
      return 'Unknown strategy';
  }
}
