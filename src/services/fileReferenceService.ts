import * as vscode from "vscode";
import { getFilePathWithFormat } from "../utils/pathUtils";
import { ConfigService } from "./configService";

/**
 * Service for generating file references in Forge's @[path:start:end] format.
 * Handles both file-only and file-with-selection references.
 * 
 * Best Practices Applied:
 * - Single Responsibility: Only handles file reference generation
 * - Dependency Injection: Accepts ConfigService for configuration
 * - Pure Logic: No side effects, deterministic output
 * - Type Safety: Strong TypeScript typing
 * - Format Support: Handles both absolute and relative paths
 */
export class FileReferenceService {
  constructor(private configService: ConfigService) {}

  /**
   * Generate a file reference for the currently active editor.
   * Returns undefined if no editor is active.
   * 
   * Format:
   * - No selection: @[path]
   * - With selection: @[path:startLine:endLine]
   * 
   * @param format - Optional format override ("absolute" | "relative")
   * @returns File reference string or undefined if no active editor
   * 
   * @example
   * // No selection
   * getFileReference() // "@[C:/workspace/src/file.ts]"
   * 
   * // With selection (lines 10-15)
   * getFileReference() // "@[C:/workspace/src/file.ts:10:15]"
   * 
   * // Relative path
   * getFileReference("relative") // "@[src/file.ts:10:15]"
   */
  getFileReference(format?: "absolute" | "relative"): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = activeEditor.document;

    // Get the file path (with optional format override)
    const filePath = getFilePathWithFormat(
      document.uri,
      format,
      this.configService
    );

    const selection = activeEditor.selection;

    // if no selection, return the file path in formatted form
    if (selection.isEmpty) {
      return `@[${filePath}]`;
    }

    // Get line numbers (1-based)
    const startLine = activeEditor.selection.start.line + 1;
    const endLine = activeEditor.selection.end.line + 1;

    // Always return file reference without symbol name
    return `@[${filePath}:${startLine}:${endLine}]`;
  }
}

