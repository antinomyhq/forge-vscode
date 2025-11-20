import * as vscode from "vscode";
import { getFilePathWithFormat } from "../utils/pathUtils";
import { ConfigService } from "./configService";

// Generates file references in Forge's @[path:start:end] format
export class FileReferenceService {
  constructor(private configService: ConfigService) {}

  // Generate file reference: @[path] or @[path:start:end]
  getFileReference(format?: "absolute" | "relative", uri?: vscode.Uri): string | undefined {
    const activeEditor = vscode.window.activeTextEditor;

    // URI provided (context menu or keyboard shortcut with explorer selection)
    if (uri) {
      const filePath = getFilePathWithFormat(uri, format, this.configService);

      // Include line numbers if URI matches active editor with selection
      if (activeEditor &&
          activeEditor.document.uri.toString() === uri.toString() &&
          !activeEditor.selection.isEmpty) {
        const startLine = activeEditor.selection.start.line + 1;
        const endLine = activeEditor.selection.end.line + 1;
        return `@[${filePath}:${startLine}:${endLine}]`;
      }

      return `@[${filePath}]`;
    }

    // No URI (keyboard shortcut fallback)
    if (activeEditor) {
      const filePath = getFilePathWithFormat(
        activeEditor.document.uri,
        format,
        this.configService
      );

      if (activeEditor.selection.isEmpty) {
        return `@[${filePath}]`;
      }

      const startLine = activeEditor.selection.start.line + 1;
      const endLine = activeEditor.selection.end.line + 1;
      return `@[${filePath}:${startLine}:${endLine}]`;
    }

    return;
  }
}

