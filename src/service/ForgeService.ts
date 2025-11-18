/**
 * ForgeService - Service Coordination Layer
 * 
 * Coordinates application layer use cases and provides a clean public API.
 * Depends on application layer (A).
 * 
 * Pattern: Rust-style service coordinator
 * ```rust
 * struct ForgeService<A> {
 *     app: A,
 * }
 * 
 * impl<A> ForgeService<A> {
 *     pub fn new(app: A) -> Self {
 *         Self { app }
 *     }
 * }
 * 
 * impl<A: ForgeApp> ForgeService<A> {
 *     pub async fn copy_file_reference(&self) -> Result<()> {
 *         self.app.copy_file_reference(None).await
 *     }
 * }
 * ```
 * 
 * Generic Type Parameter:
 * - A: Application type (must provide use case methods)
 * 
 * This creates the chain: ForgeService<ForgeApp<ForgeInfra>>
 */
export class ForgeService<A> {
  /**
   * Constructor without type bounds (like Rust impl<A>)
   * 
   * @param app - Application layer providing use cases
   */
  constructor(private readonly app: A) {}

  /**
   * Copy file reference to clipboard using configured format
   * 
   * Type bound: A must have copyFileReference method
   */
  public async copyFileReference(
    this: ForgeService<A & { copyFileReference(format?: 'absolute' | 'relative'): Promise<void> }>
  ): Promise<void> {
    try {
      await this.app.copyFileReference();
    } catch (error) {
      console.error('[ForgeService] Error copying file reference:', error);
      throw error;
    }
  }

  /**
   * Copy file reference with absolute path format
   * 
   * Type bound: A must have copyFileReference method
   */
  public async copyFileReferenceAbsolute(
    this: ForgeService<A & { copyFileReference(format?: 'absolute' | 'relative'): Promise<void> }>
  ): Promise<void> {
    try {
      await this.app.copyFileReference('absolute');
    } catch (error) {
      console.error('[ForgeService] Error copying absolute file reference:', error);
      throw error;
    }
  }

  /**
   * Copy file reference with relative path format
   * 
   * Type bound: A must have copyFileReference method
   */
  public async copyFileReferenceRelative(
    this: ForgeService<A & { copyFileReference(format?: 'absolute' | 'relative'): Promise<void> }>
  ): Promise<void> {
    try {
      await this.app.copyFileReference('relative');
    } catch (error) {
      console.error('[ForgeService] Error copying relative file reference:', error);
      throw error;
    }
  }

  /**
   * Start a new Forge session in a new terminal
   * 
   * Type bound: A must have startForgeSession method
   */
  public async startNewForgeSession(
    this: ForgeService<A & { startForgeSession(): Promise<void> }>
  ): Promise<void> {
    try {
      await this.app.startForgeSession();
    } catch (error) {
      console.error('[ForgeService] Error starting Forge session:', error);
      throw error;
    }
  }
}
