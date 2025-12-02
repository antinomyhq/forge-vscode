import * as vscode from "vscode";
import { ConfigService } from "../services/configService";
import { BackgroundForgeService } from "../services/backgroundForgeService";

// CodeLens provider to show "Delegate to Forge" above TODO/FIXME/BUG comments
export class ForgeCodeLensProvider implements vscode.CodeLensProvider {
  private readonly _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(
    private configService: ConfigService,
    private backgroundForgeService?: BackgroundForgeService
  ) {
    // Subscribe to task status changes to refresh CodeLens
    if (backgroundForgeService) {
      backgroundForgeService.onTaskStatusChanged(() => this.refresh());
    }
  }

  // Trigger refresh when configuration changes
  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    // Check if CodeLens is enabled
    if (!this.configService.isCodeLensEnabled()) {
      return [];
    }

    const lenses: vscode.CodeLens[] = [];
    const patterns = this.configService.getCodeLensPatterns();
    // Case-insensitive regex to match TODO, todo, Todo, etc. for better UX
    // eslint-disable-next-line security/detect-non-literal-regexp
    const regex = new RegExp(`\\b(${patterns.join("|")})\\b`, "i");
    const filePath = document.uri.fsPath;

    // Scan each line for TODO/FIXME/BUG patterns
    for (let line = 0; line < document.lineCount; line++) {
      const textLine = document.lineAt(line);
      const match = regex.exec(textLine.text);

      if (match) {
        const range = new vscode.Range(line, 0, line, textLine.text.length);

        // Extract full comment block (handles multi-line comments)
        const fullCommentText = this.extractFullCommentBlock(document, line);

        // Check if a task is running for this line
        const taskId = this.backgroundForgeService?.getRunningTaskId(filePath, line);

        if (taskId !== undefined) {
          // Show loading indicator with stop button
          lenses.push(
            new vscode.CodeLens(range, {
              title: "$(sync~spin) Running in background",
              tooltip: "Task is running in the background",
              command: "", // Empty command makes it non-clickable
            }),
            new vscode.CodeLens(range, {
              title: "$(close)",
              tooltip: "Stop this task",
              command: "forgecode.stopTask",
              arguments: [taskId],
            })
          );
        } else {
          // Show delegate button
          lenses.push(
            new vscode.CodeLens(range, {
              title: "$(forge-logo) Delegate to Forge",
              tooltip: "Send this context to Forge CLI",
              command: "forgecode.delegateToForge",
              arguments: [
                {
                  uri: document.uri,
                  line: line,
                  lineText: fullCommentText,
                  tag: match[1], // The matched pattern (TODO, FIXME, etc.)
                },
              ],
            })
          );
        }
      }
    }

    return lenses;
  }

  /**
   * Extract full comment block including multi-line comments
   * Handles both single-line and multi-line comment formats
   */
  private extractFullCommentBlock(document: vscode.TextDocument, startLine: number): string {
    const lines: string[] = [];
    const startLineText = document.lineAt(startLine).text;

    // Check if this is a multi-line comment start (/* or /*)
    const isMultiLineStart = startLineText.includes("/*");

    if (isMultiLineStart) {
      // Collect lines until we find the closing */
      for (let i = startLine; i < document.lineCount; i++) {
        const line = document.lineAt(i).text.trim();
        lines.push(line);

        if (line.includes("*/")) {
          break;
        }
      }

      // Clean block comment markers and preserve line breaks
      return this.cleanBlockComment(lines.join("\n"));
    } else {
      // Single-line comment - just get the current line
      lines.push(startLineText.trim());

      // Check if there are consecutive comment lines below
      for (let i = startLine + 1; i < document.lineCount; i++) {
        const nextLine = document.lineAt(i).text.trim();

        // Continue if it's a comment line (starts with // or #)
        if (nextLine.match(/^(\/\/|#)/)) {
          lines.push(nextLine);
        } else {
          break;
        }
      }

      return lines.join("\n");
    }
  }

  /**
   * Clean block comment markers and asterisks from comment text
   * Removes opening and closing block comment markers and leading asterisks
   * Preserves line breaks for multi-line comments
   * @param text - The raw comment text
   * @returns Cleaned comment text
   */
  private cleanBlockComment(text: string): string {
    return (
      text
        // Remove opening /*
        .replace(/\/\*/g, "")
        // Remove closing */
        .replace(/\*\//g, "")
        // Remove leading asterisks (common in multi-line comments)
        .replace(/^\s*\*+\s*/gm, "")
        // Remove extra whitespace on each line but preserve line breaks
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join("\n")
        .trim()
    );
  }
}

