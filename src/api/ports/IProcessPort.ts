/**
 * IProcessPort defines the contract for process inspection operations.
 * This port abstracts process management, allowing different implementations
 * (Node.js child_process, test mocks, etc.)
 * 
 * A "Forge process" is any process running the 'forge' executable.
 */
export interface IProcessPort {
  /**
   * Counts the number of running Forge processes
   * This includes all processes with 'forge' in their name/command
   * @returns Promise resolving to the count of Forge processes
   */
  countForgeProcesses(): Promise<number>;

  /**
   * Checks if there are any external Forge processes running
   * An external process is one not managed by this extension
   * @returns Promise resolving to true if external Forge processes exist
   */
  hasExternalForgeProcess(): Promise<boolean>;
}
