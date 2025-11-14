import { exec } from "child_process";

/**
 * Service for detecting external Forge processes running outside VS Code.
 * Uses platform-specific commands to check for running Forge instances.
 * 
 * Best Practices Applied:
 * - Single Responsibility: Only handles process detection
 * - Platform Abstraction: Handles Windows/Unix differences internally
 * - Promise-based API: Async operations return Promises
 * - Error Handling: Gracefully handles command execution errors
 * - No Side Effects: Pure async functions, no state modification
 */
export class ProcessService {
  /**
   * Get the platform-specific command to check for Forge processes
   * @returns Command string for the current platform
   */
  private getProcessCheckCommand(): string {
    if (process.platform === "win32") {
      return 'tasklist /FI "IMAGENAME eq forge.exe" /FO CSV | find /C "forge.exe"';
    } else {
      return 'pgrep -f "forge" | wc -l';
    }
  }

  /**
   * Execute a shell command and return the output
   * @param command - The command to execute
   * @returns Promise that resolves with stdout or rejects with error
   */
  private executeCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error: any, stdout: string) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }

  /**
   * Parse the process count from command output
   * @param output - The stdout from the process check command
   * @returns The number of Forge processes found
   */
  private parseProcessCount(output: string): number {
    return parseInt((output || "0").toString().trim(), 10);
  }

  /**
   * Check if any external Forge process is running
   * @returns Promise<boolean> - true if at least one Forge process is running, false otherwise
   */
  async checkExternalForgeProcess(): Promise<boolean> {
    return new Promise((resolve) => {
      const processCheckCmd = this.getProcessCheckCommand();
      
      exec(processCheckCmd, (error: any, stdout: string) => {
        if (error) {
          resolve(false);
          return;
        }
        const count = parseInt((stdout || "0").toString().trim(), 10);
        resolve(count > 0);
      });
    });
  }

  /**
   * Get the count of external Forge processes running
   * @returns Promise<number> - The number of Forge processes found
   */
  async checkForgeProcessCount(): Promise<number> {
    return new Promise((resolve) => {
      const processCheckCmd = this.getProcessCheckCommand();
      
      exec(processCheckCmd, (error: any, stdout: string) => {
        if (error) {
          resolve(0);
          return;
        }
        const count = parseInt((stdout || "0").toString().trim(), 10);
        resolve(count);
      });
    });
  }
}

