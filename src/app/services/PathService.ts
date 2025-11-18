import { IWorkspacePort } from '../../api/ports/IWorkspacePort';
import { IConfigurationPort } from '../../api/ports/IConfigurationPort';

/**
 * PathService handles file path formatting with workspace-relative conversion.
 * Uses generic type parameter for infrastructure dependencies.
 * 
 * @template I - Infrastructure type (must implement required ports)
 * 
 * Pattern: Rust-style generic with trait bounds
 * - Constructor has no type bounds (like Rust impl<I>)
 * - Methods have type bounds where needed (like Rust impl<I: Trait>)
 */
export class PathService<I> {
  /**
   * Constructor without type bounds
   * @param infra - Infrastructure providing workspace and configuration access
   */
  constructor(private readonly infra: I) {}

  /**
   * Gets workspace-relative path if file is in workspace, otherwise returns absolute path
   * 
   * Type bound: I must implement IWorkspacePort
   * 
   * @param filePath - The absolute file path
   * @returns Workspace-relative path or absolute path if not in workspace
   */
  public getWorkspaceRelativePath(
    this: PathService<I & IWorkspacePort>,
    filePath: string
  ): string {
    const workspaceFolder = this.infra.getWorkspaceFolder(filePath);
    
    if (workspaceFolder !== undefined && workspaceFolder !== null && workspaceFolder !== '') {
      return this.infra.getRelativePath(filePath, workspaceFolder);
    }
    
    // File not in workspace, return absolute path
    return filePath;
  }

  /**
   * Gets file path with specified format (absolute or relative)
   * Falls back to configuration if format not specified
   * 
   * Type bound: I must implement IWorkspacePort & IConfigurationPort
   * 
   * @param filePath - The absolute file path
   * @param format - Optional format override ('absolute' or 'relative')
   * @returns Formatted file path
   */
  public getFilePathWithFormat(
    this: PathService<I & IWorkspacePort & IConfigurationPort>,
    filePath: string,
    format?: 'absolute' | 'relative'
  ): string {
    // Use provided format or fall back to configuration
    const pathFormat = format ?? this.infra.getFileReferenceFormat();
    
    if (pathFormat === 'relative') {
      return this.getWorkspaceRelativePath(filePath);
    }
    
    // Default to absolute path
    return filePath;
  }
}
