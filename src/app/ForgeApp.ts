import { CopyFileReferenceUseCase } from './useCases/CopyFileReferenceUseCase';
import { StartForgeSessionUseCase } from './useCases/StartForgeSessionUseCase';
import { PathService } from './services/PathService';
import type { IEditorPort } from '../api/ports/IEditorPort';
import type { IClipboardPort } from '../api/ports/IClipboardPort';
import type { ITerminalPort } from '../api/ports/ITerminalPort';
import type { IProcessPort } from '../api/ports/IProcessPort';
import type { IConfigurationPort } from '../api/ports/IConfigurationPort';
import type { INotificationPort } from '../api/ports/INotificationPort';

/**
 * ForgeApp - Application Layer
 * 
 * Wraps all use cases and domain services in the application layer.
 * Depends on infrastructure layer (I).
 * 
 * Pattern: Rust-style application layer
 * ```rust
 * struct ForgeApp<I> {
 *     copy_file_ref_use_case: CopyFileReferenceUseCase<I>,
 *     start_session_use_case: StartForgeSessionUseCase<I>,
 *     strategy_resolver: TerminalStrategyResolver,
 *     path_service: PathService<I>,
 * }
 * 
 * impl<I> ForgeApp<I> {
 *     pub fn new(infra: I) -> Self { ... }
 * }
 * ```
 * 
 * Generic Type Parameter:
 * - I: Infrastructure type (must implement all required port interfaces)
 */
export class ForgeApp<I> {
  // Use cases
  private readonly copyFileRefUseCase: CopyFileReferenceUseCase<I>;
  private readonly startSessionUseCase: StartForgeSessionUseCase<I>;
  
  // Services
  private readonly pathService: PathService<I>;

  /**
   * Constructor without type bounds (like Rust impl<I>)
   * 
   * @param infra - Infrastructure providing all port implementations
   */
  constructor(private readonly infra: I) {
    // Instantiate services (no service-to-service dependencies)
    this.pathService = new PathService(infra);
    
    // Instantiate use cases (no service dependencies - only infra)
    this.copyFileRefUseCase = new CopyFileReferenceUseCase(infra);
    this.startSessionUseCase = new StartForgeSessionUseCase(infra);
  }

  /**
   * Copy file reference to clipboard with optional format override
   * Delegates to CopyFileReferenceUseCase
   * 
   * Type bounds: Requires all ports that CopyFileReferenceUseCase needs
   */
  public async copyFileReference(
    this: ForgeApp<
      I & IEditorPort 
      & IClipboardPort 
      & ITerminalPort 
      & IProcessPort 
      & IConfigurationPort 
      & INotificationPort
    >,
    formatOverride?: 'absolute' | 'relative'
  ): Promise<void> {
    await this.copyFileRefUseCase.execute(formatOverride);
  }

  /**
   * Start a new Forge session
   * Delegates to StartForgeSessionUseCase
   * 
   * Type bounds: Requires all ports that StartForgeSessionUseCase needs
   */
  public async startForgeSession(
    this: ForgeApp<
      I & ITerminalPort 
      & IConfigurationPort 
      & INotificationPort 
      & IEditorPort 
      & IClipboardPort
    >
  ): Promise<void> {
    await this.startSessionUseCase.execute();
  }

  /**
   * Get path service for path operations
   * 
   * @returns PathService instance
   */
  public getPathService(): PathService<I> {
    return this.pathService;
  }
}
