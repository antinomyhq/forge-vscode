import { execFile } from "child_process";

export class PlatformCommandBuilder {
  /**
   * Get platform-specific command and arguments for Forge process checking
   */
  static getForgeProcessCommand(): [string, string[]] {
    if (process.platform === "win32") {
      return ["cmd", ["/c", 'tasklist /FI "IMAGENAME eq forge.exe" /FO CSV | find /C "forge.exe"']];
    } else {
      return ["sh", ["-c", 'pgrep -f "forge" | wc -l']];
    }
  }

  /**
   * Execute a platform-specific command and return the result
   */
  static async executeCommand(command: [string, string[]]): Promise<{ stdout: string; error: Error | null }> {
    return new Promise((resolve) => {
      const [executable, args] = command;
      
      execFile(executable, args, (error: Error | null, stdout: string) => {
        resolve({ stdout: stdout || "", error });
      });
    });
  }

  /**
   * Get platform name for error messages
   */
  static getPlatformName(): string {
    return process.platform === "win32" ? "Windows" : "Unix/macOS";
  }

  /**
   * Parse process count from command output
   */
  static parseProcessCount(stdout: string): number {
    return parseInt(stdout.trim(), 10);
  }
}