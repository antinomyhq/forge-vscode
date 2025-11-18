import { exec } from 'child_process';
import { promisify } from 'util';
import { IProcessPort } from '../../api/ports/IProcessPort';

const execAsync = promisify(exec);

/**
 * NodeProcessAdapter implements IProcessPort using Node.js child_process API.
 * This adapter inspects running system processes to detect Forge instances.
 */
export class NodeProcessAdapter implements IProcessPort {
  /**
   * Counts the number of running Forge processes
   * @returns Promise resolving to the count of Forge processes
   */
  public async countForgeProcesses(): Promise<number> {
    try {
      const command = this.getProcessCheckCommand();
      const { stdout } = await execAsync(command);
      const count = parseInt(stdout.trim(), 10);
      return isNaN(count) ? 0 : count;
    } catch {
      // If command fails, assume no processes
      return 0;
    }
  }

  /**
   * Checks if there are any external Forge processes running
   * @returns Promise resolving to true if external Forge processes exist
   */
  public async hasExternalForgeProcess(): Promise<boolean> {
    const count = await this.countForgeProcesses();
    return count > 0;
  }

  /**
   * Gets the platform-specific command to check for Forge processes
   * @returns The command string to execute
   */
  private getProcessCheckCommand(): string {
    const platform = process.platform;

    if (platform === 'win32') {
      // Windows: Use tasklist to find forge.exe processes
      return 'tasklist /FI "IMAGENAME eq forge.exe" /FO CSV | find /C "forge.exe"';
    } else {
      // Unix/Linux/Mac: Use pgrep to find forge processes
      return 'pgrep -f "forge" | wc -l';
    }
  }
}
