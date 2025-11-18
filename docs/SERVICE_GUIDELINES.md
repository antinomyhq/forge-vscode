# Service Implementation Guidelines

This document defines the architectural principles for implementing services in this TypeScript/VS Code extension project, ensuring clean architecture and maintainability.

## Core Principles

### 1. No Service-to-Service Dependencies
**Services should NEVER depend on other services directly**

- ❌ Services depending on other services creates tight coupling
- ✅ Services should only depend on:
  - Domain models (entities, value objects)
  - Port interfaces (abstractions for infrastructure)
  - Other services in the same layer (domain services)

### 2. Infrastructure Dependency Through Ports
**Services depend only on port interfaces (abstractions), never concrete implementations**

- ❌ Don't import concrete adapters in services
- ✅ Import and depend on port interfaces from `src/api/ports/`
- ✅ Implementations are injected via constructor (Dependency Injection)

### 3. Type Parameters and Generics
**TypeScript supports Rust-style generic patterns with type bounds**

For most application code, use **explicit port interfaces** (simpler and clearer):
```typescript
export class MyUseCase {
  constructor(
    private readonly port: IPort  // Explicit interface type
  ) {}
}
```

For **reusable library code**, you can use **generic type parameters** (like Rust):
```typescript
export class GenericService<R> {
  constructor(private readonly repository: R) {}
  
  // Method with type bound (like Rust impl<R: Repository>)
  public async save(
    this: GenericService<R & IRepository>,
    data: Data
  ): Promise<void> {
    await this.repository.save(data);
  }
}
```

**See**: 
- `docs/GENERIC_PATTERN.md` - Complete guide to generic patterns
- `src/examples/GenericServicePattern.ts` - Working examples

**Recommendation**: Use explicit interfaces for application code, generics only for libraries.

### 4. No `any` Types
**Avoid `any` - use concrete types or proper generics**

- ❌ `any` defeats TypeScript's type safety
- ✅ Use proper interfaces and types
- ✅ Use `unknown` if type is truly unknown, then narrow it

### 5. Constructor Dependency Injection Pattern
**Use constructor-based dependency injection**

- ✅ All dependencies declared as constructor parameters
- ✅ Store as `private readonly` fields
- ✅ Constructor should only assign dependencies, no logic
- ✅ Make dependencies explicit in the constructor signature

### 6. Single Responsibility
**Each service should have a single, well-defined responsibility**

- ✅ Use Cases: One business workflow per use case
- ✅ Domain Services: One domain concept per service
- ✅ Coordinators: Orchestration only, no business logic

### 7. Immutable Dependencies
**Dependencies should be immutable after construction**

- ✅ Use `private readonly` for all injected dependencies
- ❌ Don't mutate or reassign dependencies after construction

## Layer-Specific Guidelines

### Domain Services (src/app/services/)

Domain services contain **pure business logic** that doesn't fit in a single entity.

**Pattern:**
```typescript
/**
 * Domain service for [business concept]
 * Pure business logic, NO external dependencies
 */
export class DomainService {
  /**
   * Constructor - no dependencies for pure domain services
   */
  constructor() {}

  /**
   * Business logic method
   * @param input - Domain model or primitive
   * @returns Domain model or primitive
   */
  public calculateSomething(input: DomainModel): Result {
    // Pure business logic here
    return result;
  }
}
```

**Example from codebase:**
```typescript
// src/app/services/TerminalStrategyResolver.ts
export class TerminalStrategyResolver {
  constructor() {} // No dependencies - pure logic

  public resolve(terminalCount: number, processCount: number): TerminalStrategy {
    // Pure business logic to determine strategy
    if (terminalCount > 1) return TerminalStrategy.COPY_ONLY_MULTIPLE_TERMINALS;
    // ... more logic
  }
}
```

### Use Cases (src/app/useCases/)

Use cases orchestrate business workflows using domain models and port interfaces.

**Pattern:**
```typescript
/**
 * Use case for [specific business workflow]
 * Orchestrates domain models and infrastructure through ports
 */
export class SomeUseCase {
  /**
   * Constructor with dependency injection
   * @param portA - Infrastructure port for [capability]
   * @param portB - Infrastructure port for [capability]
   * @param domainService - Domain service for [business logic]
   */
  constructor(
    private readonly portA: IPortA,
    private readonly portB: IPortB,
    private readonly domainService: DomainService
  ) {}

  /**
   * Execute the use case
   * @param input - Input parameters (primitives or domain models)
   */
  public async execute(input?: string): Promise<void> {
    // 1. Get data through ports
    const data = await this.portA.getData();
    
    // 2. Create domain models
    const model = DomainModel.create(data);
    
    // 3. Apply business logic through domain service
    const result = this.domainService.process(model);
    
    // 4. Persist through ports
    await this.portB.save(result);
  }
}
```

**Example from codebase:**
```typescript
// src/app/useCases/CopyFileReferenceUseCase.ts
export class CopyFileReferenceUseCase {
  constructor(
    private readonly editorPort: IEditorPort,
    private readonly clipboardPort: IClipboardPort,
    private readonly terminalPort: ITerminalPort,
    private readonly processPort: IProcessPort,
    private readonly configPort: IConfigurationPort,
    private readonly notificationPort: INotificationPort,
    private readonly strategyResolver: TerminalStrategyResolver // Domain service
  ) {}

  public async execute(formatOverride?: string): Promise<void> {
    // Orchestrate the workflow using ports and domain service
  }
}
```

### Service Coordinators (src/service/)

Coordinators provide a clean API by composing use cases.

**Pattern:**
```typescript
/**
 * Service coordinator for [feature area]
 * Composes use cases and provides clean public API
 */
export class FeatureService {
  private readonly useCaseA: UseCaseA;
  private readonly useCaseB: UseCaseB;

  /**
   * Constructor - receives ports, instantiates use cases
   */
  constructor(
    private readonly portA: IPortA,
    private readonly portB: IPortB
  ) {
    // Instantiate domain services
    const domainService = new DomainService();
    
    // Instantiate use cases with dependencies
    this.useCaseA = new UseCaseA(portA, domainService);
    this.useCaseB = new UseCaseB(portB, domainService);
  }

  /**
   * Public API method
   */
  public async doSomething(): Promise<void> {
    try {
      await this.useCaseA.execute();
    } catch (error) {
      // Error handling and logging
      console.error('Error:', error);
      throw error;
    }
  }
}
```

**Example from codebase:**
```typescript
// src/service/ForgeService.ts
export class ForgeService {
  private readonly copyFileRefUseCase: CopyFileReferenceUseCase;
  private readonly startSessionUseCase: StartForgeSessionUseCase;

  constructor(
    private readonly editorPort: IEditorPort,
    private readonly clipboardPort: IClipboardPort,
    // ... other ports
  ) {
    // Composition root - wire up dependencies
    const strategyResolver = new TerminalStrategyResolver();
    this.copyFileRefUseCase = new CopyFileReferenceUseCase(
      editorPort, clipboardPort, /* ... */, strategyResolver
    );
  }

  public async copyFileReference(): Promise<void> {
    try {
      await this.copyFileRefUseCase.execute();
    } catch (error) {
      console.error('Error copying file reference:', error);
    }
  }
}
```

## Anti-Patterns to Avoid

### ❌ Service-to-Service Dependencies

```typescript
// BAD: Use case depending on another use case
export class BadUseCase {
  constructor(
    private readonly port: IPort,
    private readonly otherUseCase: OtherUseCase // DON'T DO THIS!
  ) {}
}

// GOOD: Extract shared logic to domain service
export class GoodUseCase {
  constructor(
    private readonly port: IPort,
    private readonly domainService: SharedLogicService // Domain service is OK
  ) {}
}
```

### ❌ Concrete Implementation Dependencies

```typescript
// BAD: Depending on concrete adapter
import { VSCodeEditorAdapter } from '../infra/adapters/VSCodeEditorAdapter';

export class BadUseCase {
  constructor(
    private readonly editor: VSCodeEditorAdapter // Concrete class!
  ) {}
}

// GOOD: Depend on port interface
import { IEditorPort } from '../api/ports/IEditorPort';

export class GoodUseCase {
  constructor(
    private readonly editor: IEditorPort // Abstract interface
  ) {}
}
```

### ❌ Using `any` Types

```typescript
// BAD: Using any defeats type safety
export class BadService {
  constructor(private readonly dependency: any) {} // Don't use any!
  
  public process(data: any): any { // Type safety lost
    return data.something; // No compile-time checking
  }
}

// GOOD: Use proper types
export class GoodService {
  constructor(private readonly dependency: IPort) {}
  
  public process(data: InputModel): OutputModel {
    return OutputModel.from(data); // Type-safe
  }
}
```

### ❌ Business Logic in Adapters

```typescript
// BAD: Business logic in adapter
export class BadAdapter implements IPort {
  public async getData(): Promise<Data> {
    const raw = await vscode.getData();
    
    // Business logic doesn't belong here!
    if (raw.value > 100) {
      return transformComplexWay(raw);
    }
    
    return raw;
  }
}

// GOOD: Adapter only translates, no business logic
export class GoodAdapter implements IPort {
  public async getData(): Promise<Data> {
    const raw = await vscode.getData();
    // Only translate from VS Code format to domain format
    return {
      value: raw.value,
      name: raw.name
    };
  }
}
```

### ❌ Mutable Dependencies

```typescript
// BAD: Mutable dependency
export class BadService {
  private dependency: IPort; // Not readonly!

  constructor(dependency: IPort) {
    this.dependency = dependency;
  }

  public changeDependency(newDep: IPort) {
    this.dependency = newDep; // Mutation after construction!
  }
}

// GOOD: Immutable dependency
export class GoodService {
  constructor(private readonly dependency: IPort) {} // readonly!
  
  // No methods to change dependencies
}
```

### ❌ Logic in Constructor

```typescript
// BAD: Business logic in constructor
export class BadService {
  constructor(private readonly port: IPort) {
    // Don't do work in constructor!
    const data = this.port.getData(); // Async call in constructor!
    this.initialize(data); // Business logic in constructor!
  }
}

// GOOD: Constructor only assigns dependencies
export class GoodService {
  constructor(private readonly port: IPort) {
    // Only assignment, no logic
  }

  public async initialize(): Promise<void> {
    // Initialization logic in separate method
    const data = await this.port.getData();
    // ... process data
  }
}
```

## Enforcement Through Tooling

### TypeScript Compiler Options

Ensure strict type checking in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Rules

Add rules to enforce architecture principles:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Prevent imports from wrong layers
    'no-restricted-imports': ['error', {
      'patterns': [
        {
          'group': ['**/infra/**'],
          'message': 'Application layer should not import from infrastructure layer. Use port interfaces instead.'
        }
      ]
    }],
    
    // Prevent any types
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Enforce readonly for class properties
    '@typescript-eslint/prefer-readonly': 'error',
  }
};
```

### Import Linting (Path-Based)

Create custom ESLint rules or use `eslint-plugin-import` to enforce:

- **Domain layer** (`src/domain/`) can import: NOTHING external
- **Application layer** (`src/app/`) can import: domain, api/ports
- **API layer** (`src/api/`) can import: domain only
- **Infrastructure layer** (`src/infra/`) can import: api/ports, domain
- **Service layer** (`src/service/`) can import: app, api/ports, domain
- **Presentation layer** (`src/presentation/`) can import: everything

## Code Review Checklist

When reviewing service implementations, check:

- [ ] **No service-to-service dependencies** - Services don't depend on other services
- [ ] **Port interfaces only** - No concrete adapter imports in app layer
- [ ] **Constructor DI** - All dependencies via constructor
- [ ] **Immutable dependencies** - All dependencies are `private readonly`
- [ ] **No business logic in adapters** - Adapters only translate
- [ ] **Single responsibility** - Each service has one clear purpose
- [ ] **No `any` types** - Proper types throughout
- [ ] **No logic in constructors** - Only assignment
- [ ] **Proper error handling** - Errors propagated correctly
- [ ] **Tests exist** - Unit tests with mocked dependencies

## Testing Guidelines

### Domain Services

Test without any mocks - pure functions:

```typescript
describe('DomainService', () => {
  let service: DomainService;

  beforeEach(() => {
    service = new DomainService(); // No dependencies to mock
  });

  it('should calculate correctly', () => {
    const result = service.calculate(input);
    expect(result).toEqual(expectedOutput);
  });
});
```

### Use Cases

Test with mocked port interfaces:

```typescript
describe('SomeUseCase', () => {
  let useCase: SomeUseCase;
  let mockPortA: MockPortA;
  let mockPortB: MockPortB;

  beforeEach(() => {
    mockPortA = new MockPortA();
    mockPortB = new MockPortB();
    useCase = new SomeUseCase(mockPortA, mockPortB);
  });

  it('should orchestrate correctly', async () => {
    mockPortA.setData(testData);
    await useCase.execute();
    expect(mockPortB.savedData).toEqual(expectedResult);
  });
});
```

## Summary

Following these guidelines ensures:

- ✅ **Testability** - Easy to test with mocked dependencies
- ✅ **Maintainability** - Clear separation of concerns
- ✅ **Flexibility** - Easy to swap implementations
- ✅ **Type Safety** - Full TypeScript benefits
- ✅ **Independence** - Layers don't depend on implementation details

**Key Principle**: Dependencies flow inward toward the domain, never outward. Business logic is isolated from infrastructure concerns through port interfaces.
