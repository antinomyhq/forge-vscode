import * as vscode from "vscode";
import { getFilePathWithFormat } from "../utils/pathUtils";
import { ConfigService } from "./configService";

// Generates file references in Forge's @[path:start:end] format
export class FileReferenceService {
  constructor(private configService: ConfigService) {}

  // Generate file reference for active editor
  getFileReference(format?: "absolute" | "relative"): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return;
    }

    const document = activeEditor.document;
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

