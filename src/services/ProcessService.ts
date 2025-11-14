import { PlatformCommandBuilder } from "../utils/PlatformCommandBuilder";
import { handleProcessError } from "../utils/errorHandling";

export class ProcessService {
  /**
   * Unified Forge process checker that can either return boolean or count
   */
  private async checkForgeProcesses(returnCount: boolean = false): Promise<boolean | number> {
    const command = PlatformCommandBuilder.getForgeProcessCommand();
    const { stdout, error } = await PlatformCommandBuilder.executeCommand(command);
    
    if (error) {
      handleProcessError(error, returnCount ? "count Forge processes" : "check Forge process");
      return returnCount ? 0 : false;
    }
    
    const count = PlatformCommandBuilder.parseProcessCount(stdout);
    return returnCount ? count : count > 0;
  }

  /**
   * Check if Forge process is running externally (outside VS Code)
   */
  async checkExternalForgeProcess(): Promise<boolean> {
    return this.checkForgeProcesses(false) as Promise<boolean>;
  }

  /**
   * Check how many Forge processes are running externally
   */
  async checkForgeProcessCount(): Promise<number> {
    return this.checkForgeProcesses(true) as Promise<number>;
  }
}