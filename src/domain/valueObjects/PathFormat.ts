/**
 * PathFormat represents the format of a file path in the domain.
 * This is a core domain concept that defines how file paths should be represented.
 * 
 * @enum {string}
 */
export enum PathFormat {
  /**
   * Absolute path format - full path from root
   * Example: /Users/username/project/file.ts
   */
  Absolute = 'absolute',

  /**
   * Relative path format - path relative to workspace root
   * Example: src/file.ts
   */
  Relative = 'relative',
}
