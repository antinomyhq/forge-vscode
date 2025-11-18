/**
 * LineRange represents a range of lines in a file (1-based, inclusive).
 * This is an immutable value object that enforces line range validity.
 * 
 * Line numbers are 1-based to match human-readable line numbers in editors.
 */
export class LineRange {
  /**
   * Starting line number (1-based, inclusive)
   */
  public readonly start: number;

  /**
   * Ending line number (1-based, inclusive)
   */
  public readonly end: number;

  /**
   * Private constructor to enforce factory method usage
   * @param start - Starting line number (must be >= 1)
   * @param end - Ending line number (must be >= start)
   */
  private constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
  }

  /**
   * Creates a LineRange from 1-based line numbers
   * @param start - Starting line number (1-based, inclusive)
   * @param end - Ending line number (1-based, inclusive)
   * @returns A new LineRange instance
   * @throws {Error} If validation fails
   */
  public static create(start: number, end: number): LineRange {
    if (start < 1) {
      throw new Error(`Invalid line range: start line must be >= 1, got ${start}`);
    }
    if (end < 1) {
      throw new Error(`Invalid line range: end line must be >= 1, got ${end}`);
    }
    if (start > end) {
      throw new Error(`Invalid line range: start (${start}) must be <= end (${end})`);
    }
    return new LineRange(start, end);
  }

  /**
   * Creates a LineRange from 0-based line numbers (VS Code format)
   * Converts 0-based to 1-based by adding 1 to both values
   * @param start - Starting line number (0-based)
   * @param end - Ending line number (0-based)
   * @returns A new LineRange instance with 1-based line numbers
   */
  public static fromZeroBased(start: number, end: number): LineRange {
    return LineRange.create(start + 1, end + 1);
  }

  /**
   * Checks if this range represents a single line
   * @returns true if start and end are the same
   */
  public isSingleLine(): boolean {
    return this.start === this.end;
  }

  /**
   * Calculates the number of lines in this range (inclusive)
   * @returns The number of lines
   */
  public lineCount(): number {
    return this.end - this.start + 1;
  }
}
