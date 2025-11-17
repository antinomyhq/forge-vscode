import { exec, ExecException } from "child_process";

// Detects external Forge processes using platform-specific commands
export class ProcessService {
  private getProcessCheckCommand(): string {
    if (process.platform === "win32") {
      return 'tasklist /FI "IMAGENAME eq forge.exe" /FO CSV | find /C "forge.exe"';
    } else {
      return 'pgrep -f "forge" | wc -l';
    }
  }

  // Get count of external Forge processes
  async checkForgeProcessCount(): Promise<number> {
    return new Promise((resolve) => {
      const processCheckCmd = this.getProcessCheckCommand();

      // Safe: processCheckCmd is generated from trusted platform-specific commands
      // eslint-disable-next-line security/detect-child-process
      exec(processCheckCmd, (error: ExecException | null, stdout: string) => {
        if (error !== null) {
          resolve(0);
          return;
        }
        const count = parseInt((stdout || "0").toString().trim(), 10);
        resolve(count);
      });
    });
  }

  // Check if any external Forge process is running
  async checkExternalForgeProcess(): Promise<boolean> {
    const count = await this.checkForgeProcessCount();
    return count > 0;
  }
}

