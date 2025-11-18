import { FilePath } from '../valueObjects/FilePath';
import { LineRange } from '../valueObjects/LineRange';

/**
 * FileReference represents a reference to a file with an optional line range.
 * This is the core domain entity for file references in Forge.
 * 
 * File references can be converted to Forge format: @[path] or @[path:start:end]
 */
export class FileReference {
  /**
   * The file path
   */
  public readonly path: FilePath;

  /**
   * Optional line range for the file reference
   */
  public readonly lineRange?: LineRange;

  /**
   * Private constructor to enforce factory method usage
   * @param path - The file path
   * @param lineRange - Optional line range
   */
  private constructor(path: FilePath, lineRange?: LineRange) {
    this.path = path;
    this.lineRange = lineRange;
  }

  /**
   * Creates a FileReference
   * @param path - The file path
   * @param lineRange - Optional line range
   * @returns A new FileReference instance
   */
  public static create(path: FilePath, lineRange?: LineRange): FileReference {
    return new FileReference(path, lineRange);
  }

  /**
   * Converts the file reference to Forge format
   * Format: @[path] or @[path:start:end]
   * @returns The Forge-formatted string
   */
  public toForgeFormat(): string {
    if (this.lineRange) {
      return `@[${this.path.value}:${this.lineRange.start}:${this.lineRange.end}]`;
    }
    return `@[${this.path.value}]`;
  }

  /**
   * Checks if this file reference has a line selection
   * @returns true if lineRange is defined
   */
  public hasSelection(): boolean {
    return this.lineRange !== undefined;
  }
}
