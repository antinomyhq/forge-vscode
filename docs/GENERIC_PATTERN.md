# Generic Service Pattern with Type Parameters

This document shows how to implement Rust-style generic services with trait bounds in TypeScript.

## Core Pattern

### Rust Pattern (Reference)

```rust
pub struct UserService<R> {
    repository: Arc<R>,
}

impl<R> UserService<R> {
    // Constructor without type bounds
    pub fn new(repository: Arc<R>) -> Self {
        Self { repository }
    }
}

impl<R: UserRepository> UserService<R> {
    // Methods with type bounds
    pub fn create_user(&self, email: &str) -> Result<User> {
        self.repository.save(email)
    }
}
```

### TypeScript Equivalent

```typescript
export class UserService<R> {
  // Constructor without type bounds (like Rust)
  constructor(private readonly repository: R) {}
  
  // Methods with type bounds (interface constraints)
  public createUser<T extends R & IUserRepository>(
    this: UserService<T>,
    email: string
  ): Promise<User> {
    return this.repository.save(email);
  }
}
```

## Complete Examples

### Example 1: Simple Service with Single Dependency

**Port Interface**:
```typescript
// src/api/ports/IUserRepository.ts
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

**Generic Service**:
```typescript
// src/app/services/UserService.ts
/**
 * User service with generic repository dependency
 * @template R - Repository type (must implement IUserRepository for methods to work)
 */
export class UserService<R> {
  /**
   * Constructor without type bounds
   * Accepts any type R - bounds applied on methods
   */
  constructor(private readonly repository: R) {}
  
  /**
   * Create a new user
   * Type bound: R must extend IUserRepository
   */
  public async createUser(
    this: UserService<R & IUserRepository>,
    email: string,
    name: string
  ): Promise<User> {
    // Check if user exists
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }
    
    // Create and save
    const user = new User(email, name);
    await this.repository.save(user);
    return user;
  }
  
  /**
   * Find user by email
   * Type bound: R must extend IUserRepository
   */
  public async findUser(
    this: UserService<R & IUserRepository>,
    email: string
  ): Promise<User | null> {
    return this.repository.findByEmail(email);
  }
}

// Usage with type inference
const repo: IUserRepository = new PostgresUserRepository();
const service = new UserService(repo); // Type inferred as UserService<IUserRepository>

// Methods work because IUserRepository satisfies the constraint
await service.createUser('user@example.com', 'John');
```

### Example 2: Service with Multiple Interface Constraints

**Port Interfaces**:
```typescript
// src/api/ports/IFileReader.ts
export interface IFileReader {
  readFile(path: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
}

// src/api/ports/IEnvironment.ts
export interface IEnvironment {
  getMaxFileSize(): number;
  getTempDirectory(): string;
}
```

**Generic Service with Composed Constraints**:
```typescript
// src/app/services/FileService.ts
/**
 * File service with generic infrastructure dependency
 * @template I - Infrastructure type (must implement IFileReader + IEnvironment)
 */
export class FileService<I> {
  /**
   * Constructor without type bounds
   */
  constructor(private readonly infra: I) {}
  
  /**
   * Read file with validation
   * Type bound: I must implement both IFileReader AND IEnvironment
   */
  public async readWithValidation(
    this: FileService<I & IFileReader & IEnvironment>,
    path: string
  ): Promise<string> {
    // Use IFileReader interface
    const exists = await this.infra.fileExists(path);
    if (!exists) {
      throw new Error(`File not found: ${path}`);
    }
    
    const content = await this.infra.readFile(path);
    
    // Use IEnvironment interface
    const maxSize = this.infra.getMaxFileSize();
    if (content.length > maxSize) {
      throw new Error(`File too large: ${content.length} > ${maxSize}`);
    }
    
    return content;
  }
  
  /**
   * Get temp file path
   * Type bound: I must implement IEnvironment only
   */
  public getTempFilePath(
    this: FileService<I & IEnvironment>,
    filename: string
  ): string {
    const tempDir = this.infra.getTempDirectory();
    return `${tempDir}/${filename}`;
  }
}

// Usage
const infra: IFileReader & IEnvironment = new VSCodeInfrastructure();
const service = new FileService(infra);

// Both methods work
const content = await service.readWithValidation('/path/to/file.txt');
const tempPath = service.getTempFilePath('temp.txt');
```

### Example 3: Use Case with Multiple Generic Dependencies

**Port Interfaces**:
```typescript
// src/api/ports/IEditorPort.ts
export interface IEditorPort {
  getActiveFile(): string | undefined;
  getSelection(): { start: number; end: number } | undefined;
}

// src/api/ports/IClipboardPort.ts
export interface IClipboardPort {
  write(text: string): Promise<void>;
  read(): Promise<string>;
}

// src/api/ports/INotificationPort.ts
export interface INotificationPort {
  showInfo(message: string): void;
  showError(message: string): void;
}
```

**Generic Use Case**:
```typescript
// src/app/useCases/CopyFileUseCase.ts
/**
 * Copy file reference use case with generic ports
 * @template E - Editor port type
 * @template C - Clipboard port type
 * @template N - Notification port type
 */
export class CopyFileUseCase<E, C, N> {
  /**
   * Constructor without type bounds
   */
  constructor(
    private readonly editor: E,
    private readonly clipboard: C,
    private readonly notification: N
  ) {}
  
  /**
   * Execute use case
   * Type bounds: E extends IEditorPort, C extends IClipboardPort, N extends INotificationPort
   */
  public async execute(
    this: CopyFileUseCase<E & IEditorPort, C & IClipboardPort, N & INotificationPort>
  ): Promise<void> {
    // Get active file
    const filePath = this.editor.getActiveFile();
    if (!filePath) {
      this.notification.showError('No active file');
      return;
    }
    
    // Get selection
    const selection = this.editor.getSelection();
    const reference = selection
      ? `${filePath}:${selection.start}:${selection.end}`
      : filePath;
    
    // Copy to clipboard
    await this.clipboard.write(reference);
    this.notification.showInfo('File reference copied');
  }
}

// Usage
const useCase = new CopyFileUseCase(
  editorPort,
  clipboardPort,
  notificationPort
);

await useCase.execute();
```

## Alternative Pattern: Separate Type Parameters (Simpler)

For most cases, using separate type parameters is simpler and more practical:

```typescript
/**
 * Service with explicit type parameters for each dependency
 * Simpler than single generic with intersection types
 */
export class FileService<F extends IFileReader, E extends IEnvironment> {
  constructor(
    private readonly fileReader: F,
    private readonly environment: E
  ) {}
  
  public async readWithValidation(path: string): Promise<string> {
    const exists = await this.fileReader.fileExists(path);
    if (!exists) {
      throw new Error(`File not found: ${path}`);
    }
    
    const content = await this.fileReader.readFile(path);
    const maxSize = this.environment.getMaxFileSize();
    
    if (content.length > maxSize) {
      throw new Error(`File too large`);
    }
    
    return content;
  }
}

// Usage - TypeScript infers types
const service = new FileService(fileReader, environment);
```

## Practical Pattern for Real Use Cases

Based on our codebase, here's the practical pattern we use:

```typescript
/**
 * Use case with explicit port interface types
 * This is clearer and more maintainable than complex generics
 */
export class CopyFileReferenceUseCase {
  constructor(
    private readonly editorPort: IEditorPort,
    private readonly clipboardPort: IClipboardPort,
    private readonly terminalPort: ITerminalPort,
    private readonly processPort: IProcessPort,
    private readonly configPort: IConfigurationPort,
    private readonly notificationPort: INotificationPort,
    private readonly strategyResolver: TerminalStrategyResolver
  ) {}
  
  public async execute(formatOverride?: string): Promise<void> {
    // Implementation using all ports
  }
}
```

**Why this is better for our use case:**
1. ✅ Clear what dependencies are needed
2. ✅ No complex generic syntax
3. ✅ Easy to test with mocks
4. ✅ TypeScript auto-completion works perfectly
5. ✅ No type parameter ceremony

## When to Use Each Pattern

### Use Rust-Style Generics When:
- Building a **reusable library** with pluggable implementations
- Need to **avoid runtime overhead** of interface lookups (TypeScript compiles to JS, so no real benefit)
- Want **type parameter constraints** applied per-method
- Building **generic data structures** (List, Map, etc.)

### Use Explicit Port Interfaces When:
- Building **application-specific** services
- Dependencies are **known at design time**
- Want **maximum clarity** in constructor
- Need **good IDE support** and auto-completion
- Testing with **mocks** (easier without generics)

## Testing Comparison

### Generic Service Testing

```typescript
// Need to create mock that satisfies interface
class MockRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return null;
  }
  async save(user: User): Promise<void> {}
}

describe('UserService', () => {
  it('should create user', async () => {
    const mockRepo = new MockRepository();
    const service = new UserService(mockRepo);
    
    await service.createUser('test@example.com', 'Test');
    // Assertions
  });
});
```

### Explicit Interface Testing (Our Pattern)

```typescript
// Simple object literal mock
describe('CopyFileReferenceUseCase', () => {
  it('should copy file reference', async () => {
    const mockEditor: IEditorPort = {
      getActiveFile: () => '/path/to/file.ts',
      getSelection: () => ({ start: 1, end: 10 })
    };
    
    const mockClipboard: IClipboardPort = {
      write: vi.fn(),
      read: async () => ''
    };
    
    const useCase = new CopyFileReferenceUseCase(
      mockEditor,
      mockClipboard,
      // ... other mocks
    );
    
    await useCase.execute();
    expect(mockClipboard.write).toHaveBeenCalled();
  });
});
```

## Recommendation for This Project

**Use explicit port interface types** (current pattern) for these reasons:

1. **Clarity**: Constructor clearly shows all dependencies
2. **Simplicity**: No generic type parameter ceremony
3. **Testability**: Easy to create mock objects
4. **Maintainability**: Easy to understand 6 months later
5. **IDE Support**: Perfect auto-completion and type hints
6. **JavaScript Reality**: TypeScript compiles to JavaScript - no runtime benefit from generics

**Use generics** only for:
- Utility functions (map, filter, reduce)
- Generic data structures (if you create any)
- Reusable library code (not application code)

## Summary

| Pattern | Rust Equivalent | When to Use | Complexity |
|---------|----------------|-------------|------------|
| Generic with bounds | `impl<R: Trait>` | Reusable libraries | High |
| Explicit interfaces | Direct trait objects | Application code | Low |
| Separate type params | `impl<R, C, L>` | Multiple generics | Medium |

**For this project**: Continue using explicit port interfaces as we currently do. It's the pragmatic choice for application-level code.
