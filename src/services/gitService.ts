import * as vscode from "vscode";

interface GitExtension {
  getAPI(version: number): GitAPI;
}

interface GitAPI {
  repositories: Repository[];
}

interface Repository {
  inputBox: {
    value: string;
  };
}

// Manages Git API interactions and repository operations
export class GitService {
  private gitExtension: GitExtension | undefined;
  private git: GitAPI | undefined;
  private initialized = false;

  constructor() {}
  private ensureGitExtension(): void {
    if (this.initialized) {
      return;
    }

    this.gitExtension =
      vscode.extensions.getExtension<GitExtension>("vscode.git")?.exports;
    this.git = this.gitExtension?.getAPI(1);
    this.initialized = true;
  }

  // Get the first Git repository
  getRepository(): Repository | null {
    this.ensureGitExtension();

    if (
      this.git?.repositories === undefined ||
      this.git.repositories.length === 0
    ) {
      return null;
    }
    return this.git.repositories[0];
  }

  // Get workspace folder path
  getWorkspacePath(): string | undefined {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  // Check if Git is available
  isGitAvailable(): boolean {
    this.ensureGitExtension();
    return this.git !== undefined;
  }

  // Set commit message in SCM input box
  setCommitMessage(message: string): void {
    const repository = this.getRepository();
    if (repository !== null) {
      repository.inputBox.value = message;
    }
  }
}
