import { PathFormat } from './PathFormat';

/**
 * FilePath represents a file path with its format in the domain.
 * This is an immutable value object that enforces path validity.
 */
export class FilePath {
  /**
   * The file path string
   */
  public readonly value: string;

  /**
   * The format of the file path (absolute or relative)
   */
  public readonly format: PathFormat;

  /**
   * Private constructor to enforce factory method usage
   * @param value - The file path string
   * @param format - The format of the path
   */
  private constructor(value: string, format: PathFormat) {
    this.value = value;
    this.format = format;
  }

  /**
   * Creates a FilePath with absolute format
   * @param path - The absolute file path
   * @returns A new FilePath instance with absolute format
   * @throws {Error} If path is empty or whitespace
   */
  public static fromAbsolute(path: string): FilePath {
    FilePath.validatePath(path);
    return new FilePath(path, PathFormat.Absolute);
  }

  /**
   * Creates a FilePath with relative format
   * @param path - The relative file path
   * @returns A new FilePath instance with relative format
   * @throws {Error} If path is empty or whitespace
   */
  public static fromRelative(path: string): FilePath {
    FilePath.validatePath(path);
    return new FilePath(path, PathFormat.Relative);
  }

  /**
   * Validates that a path is not empty or whitespace-only
   * @param path - The path to validate
   * @throws {Error} If path is invalid
   */
  private static validatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('File path cannot be empty or whitespace');
    }
  }

  /**
   * Checks if this is an absolute path
   * @returns true if format is Absolute
   */
  public isAbsolute(): boolean {
    return this.format === PathFormat.Absolute;
  }

  /**
   * Checks equality with another FilePath
   * Two FilePaths are equal if they have the same value and format
   * @param other - The other FilePath to compare
   * @returns true if paths are equal
   */
  public equals(other: FilePath): boolean {
    return this.value === other.value && this.format === other.format;
  }
}
