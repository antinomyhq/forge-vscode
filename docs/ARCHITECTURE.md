# Forge VS Code Extension - Architecture

## Overview

This VS Code extension follows the **Onion Architecture** (also known as Clean Architecture or Hexagonal Architecture), which organizes code into concentric layers with dependencies flowing inward toward the domain core.

The architecture prioritizes:
- **Testability**: Core business logic can be tested without VS Code
- **Maintainability**: Clear separation of concerns
- **Flexibility**: Easy to swap implementations
- **Independence**: Domain logic is independent of external frameworks

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                          │
│              (VS Code API, Node.js, File System)            │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌───────────────────────────┼───────────────────────────────────┐
│  INFRASTRUCTURE LAYER     │                                   │
│  ┌────────────────────────┴────────────────────────┐         │
│  │  Adapters (Implement Port Interfaces)           │         │
│  │  - VSCodeConfigAdapter                           │         │
│  │  - VSCodeTerminalAdapter                         │         │
│  │  - VSCodeEditorAdapter                           │         │
│  │  - VSCodeClipboardAdapter                        │         │
│  │  - VSCodeNotificationAdapter                     │         │
│  │  - NodeProcessAdapter                            │         │
│  └──────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────┘
                            ▲
                            │ implements
┌───────────────────────────┼───────────────────────────────────┐
│  PRESENTATION LAYER       │                                   │
│  ┌────────────────────────┴────────────────────────┐         │
│  │  extension.ts (Composition Root)                 │         │
│  │  - Wires all dependencies together               │         │
│  │  - Registers VS Code commands                    │         │
│  └──────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────┘
                            ▲
                            │ uses
┌───────────────────────────┼───────────────────────────────────┐
│  SERVICE LAYER            │                                   │
│  ┌────────────────────────┴────────────────────────┐         │
│  │  ForgeService (Coordinator)                      │         │
│  │  - Provides clean API for presentation layer     │         │
│  │  - Coordinates use cases                         │         │
│  │  - Error handling and logging                    │         │
│  └──────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────┘
                            ▲
                            │ uses
┌───────────────────────────┼───────────────────────────────────┐
│  API LAYER (Ports)        │                                   │
│  ┌────────────────────────┴────────────────────────┐         │
│  │  Port Interfaces (Abstractions)                  │         │
│  │  - IConfigurationPort                            │         │
│  │  - ITerminalPort                                 │         │
│  │  - IEditorPort                                   │         │
│  │  - IClipboardPort                                │         │
│  │  - IProcessPort                                  │         │
│  │  - INotificationPort                             │         │
│  └──────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────┘
                            ▲
                            │ depends on
┌───────────────────────────┼───────────────────────────────────┐
│  APPLICATION LAYER        │                                   │
│  ┌────────────────────────┴────────────────────────┐         │
│  │  Use Cases (Orchestration)                       │         │
│  │  - CopyFileReferenceUseCase                      │         │
│  │  - StartForgeSessionUseCase                      │         │
│  │                                                   │         │
│  │  Domain Services (Pure Business Logic)           │         │
│  │  - TerminalStrategyResolver                      │         │
│  └──────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────┘
                            ▲
                            │ uses
┌───────────────────────────┼───────────────────────────────────┐
│  DOMAIN LAYER (Core)      │                                   │
│  ┌────────────────────────┴────────────────────────┐         │
│  │  Domain Models (Pure Business Objects)           │         │
│  │                                                   │         │
│  │  Entities:                                        │         │
│  │  - FileReference                                  │         │
│  │                                                   │         │
│  │  Value Objects:                                   │         │
│  │  - FilePath                                       │         │
│  │  - LineRange                                      │         │
│  │  - PathFormat (enum)                              │         │
│  │                                                   │         │
│  │  ✓ NO external dependencies                      │         │
│  │  ✓ NO imports from vscode, node, or other layers │         │
│  │  ✓ Pure TypeScript/JavaScript                    │         │
│  └──────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────┘
```

## Dependency Flow

Dependencies ALWAYS flow **inward** toward the domain:

```
External Systems
    ↓
Infrastructure (Adapters)
    ↓ implements
Presentation (Composition Root)
    ↓ uses
Service Layer (Coordinator)
    ↓ uses
API Layer (Port Interfaces)
    ↓ defines contracts for
Application Layer (Use Cases + Domain Services)
    ↓ uses
Domain Layer (Entities + Value Objects)
```

**Key Rule**: Inner layers NEVER depend on outer layers. The domain knows nothing about VS Code, the file system, or how it's being used.

## Layer Responsibilities

### 1. Domain Layer (`src/domain/`)

**Purpose**: Contains pure business models with intrinsic business logic.

**Core Constraints**:
- ✅ Contains ONLY models (entities, value objects, enums)
- ✅ NO services or interfaces
- ✅ NO external dependencies (no `vscode`, no Node.js APIs)
- ✅ NO imports from other layers
- ✅ Pure TypeScript/JavaScript only
- ✅ Can be tested without ANY external framework

**Components**:
- **Entities**: Objects with identity (FileReference)
- **Value Objects**: Immutable objects defined by values (FilePath, LineRange)
- **Enums**: Domain-specific enumerations (PathFormat)

**Why No Services?**:
Domain services contain business logic but may need external dependencies (ports). Therefore, they live in the Application Layer to keep domain 100% pure.

### 2. Application Layer (`src/app/`)

**Purpose**: Contains business logic and orchestration.

**Core Constraints**:
- ✅ Domain services depend ONLY on primitives and domain models
- ✅ Use cases depend ONLY on port interfaces (not concrete implementations)
- ✅ NO imports of `vscode` or infrastructure code
- ✅ Can be tested with mock ports (no VS Code required)

**Components**:
- **Domain Services** (`src/app/services/`): Pure business logic with no external dependencies
- **Use Cases** (`src/app/useCases/`): Orchestration logic that coordinates domain models, services, and ports

### 3. API Layer - Ports (`src/api/ports/`)

**Purpose**: Defines interfaces (contracts) for external dependencies.

**Core Constraints**:
- ✅ Contains ONLY interfaces
- ✅ NO concrete implementations
- ✅ NO business logic
- ✅ NO imports from `vscode` or external libraries
- ✅ Comprehensive JSDoc documentation

**Port Interfaces**:

| Port Interface | Purpose |
|----------------|---------|
| `IConfigurationPort` | Access user configuration |
| `ITerminalPort` | Manage VS Code terminals |
| `IEditorPort` | Access active editor state |
| `IClipboardPort` | Read/write clipboard |
| `IProcessPort` | Inspect running processes |
| `INotificationPort` | Show user notifications |

### 4. Service Layer (`src/service/`)

**Purpose**: Coordinates use cases and provides a clean API for the presentation layer.

**Core Constraints**:
- ✅ Coordinates use cases
- ✅ Provides simple public API methods
- ✅ Error handling and logging
- ✅ NO business logic (only coordination)
- ✅ Can be instantiated with any port implementations

**Components**:
- `ForgeService`: Main service that wires everything together

### 5. Infrastructure Layer (`src/infra/`)

**Purpose**: Concrete implementations of port interfaces using external APIs.

**Core Constraints**:
- ✅ Each adapter implements ONE port interface
- ✅ Contains ALL interactions with VS Code API
- ✅ NO business logic (only translation/adaptation)
- ✅ Proper resource cleanup (dispose methods)

**Adapter Implementations**:

| Adapter | Implements | External System |
|---------|------------|-----------------|
| `VSCodeConfigAdapter` | `IConfigurationPort` | VS Code Configuration API |
| `VSCodeTerminalAdapter` | `ITerminalPort` | VS Code Terminal API |
| `VSCodeEditorAdapter` | `IEditorPort` | VS Code Editor API |
| `VSCodeClipboardAdapter` | `IClipboardPort` | VS Code Clipboard API |
| `VSCodeNotificationAdapter` | `INotificationPort` | VS Code Notification API |
| `NodeProcessAdapter` | `IProcessPort` | Node.js `child_process` |

### 6. Presentation Layer (`src/presentation/`)

**Purpose**: Entry point that wires everything together (Composition Root).

**Core Constraints**:
- ✅ Instantiates all adapters
- ✅ Instantiates ForgeService with adapters
- ✅ Registers VS Code commands
- ✅ NO business logic
- ✅ Proper resource management (disposables)

**Components**:
- `extension.ts`: VS Code extension entry point

## Port/Adapter Pattern

The architecture uses the **Port/Adapter Pattern** (Hexagonal Architecture):

- **Ports** (`src/api/ports/`): Interfaces that define what the application needs
- **Adapters** (`src/infra/adapters/`): Concrete implementations that provide what the application needs

**Benefits**:
1. **Testability**: Can mock ports for testing
2. **Flexibility**: Easy to swap implementations
3. **Independence**: Core logic doesn't know about VS Code
4. **Maintainability**: Changes to external systems only affect adapters

## Complete Data Flow

When a user executes the "Copy File Reference" command:

```
User Action
   ↓
Presentation Layer → registers command, calls service
   ↓
Service Layer → delegates to use case, handles errors
   ↓
Application Layer → orchestrates workflow
   ├─ Gets editor state via editorPort
   ├─ Creates domain models (FileReference, FilePath, LineRange)
   ├─ Converts to Forge format (domain logic)
   ├─ Writes to clipboard via clipboardPort
   ├─ Resolves terminal strategy (domain service)
   └─ Executes appropriate strategy via terminalPort
   ↓
API Layer → defines contracts
   ↓
Infrastructure Layer → implements using VS Code API
   ↓
External Systems → VS Code executes operations
```

## Architecture Decisions

### ADR-001: Domain Layer Contains Only Models

**Decision**: Domain layer contains ONLY models (entities, value objects, enums). NO services, NO interfaces.

**Rationale**: 
- Matches clean architecture principles
- Keeps domain extremely pure and simple
- Forces business logic into application layer where it's easier to test
- Clear boundary: domain = data structures, app = business logic

### ADR-002: Domain Services in Application Layer

**Decision**: Pure business logic services (like TerminalStrategyResolver) belong in `src/app/services/`, not domain.

**Rationale**:
- Business logic that doesn't fit in entities goes to application layer
- Domain layer is models-only for maximum simplicity
- Application layer is where business workflows live

### ADR-003: Use Cases Inject Ports

**Decision**: Use cases depend on port interfaces, not concrete adapters.

**Rationale**:
- **Dependency Inversion Principle**: Depend on abstractions, not concretions
- **Testability**: Can easily mock ports for testing
- **Flexibility**: Can swap adapter implementations without changing use cases

### ADR-004: Composition Root in Extension.ts

**Decision**: All dependency wiring happens in one place (extension.ts).

**Rationale**:
- **Single Responsibility**: One place to manage all dependencies
- **Clarity**: Easy to see how everything is wired together
- **Maintainability**: Changes to dependencies are localized

## Architecture Benefits

### Achieved Goals

✅ **Testability**
- 115 tests total
- 89% of tests run WITHOUT VS Code
- Domain and application layers fully testable
- Mock infrastructure for unit testing

✅ **Maintainability**
- Clear separation of concerns
- Each layer has a single responsibility
- Easy to locate and modify code

✅ **Flexibility**
- Easy to swap implementations
- Can replace VS Code with different UI
- Can replace Node.js with browser APIs

✅ **Independence**
- Domain knows nothing about VS Code
- Business logic isolated from framework
- Can reuse domain in different contexts

✅ **Type Safety**
- Full TypeScript coverage
- Explicit interfaces for all contracts
- Compile-time verification

## Testing Strategy

See [TESTING.md](./TESTING.md) for detailed testing guidelines.

**Test Pyramid**:
```
           /\
          /E2\       Integration Tests (13 tests)
         /────\      
        /      \     
       /────────\
      /   Unit   \   Unit Tests (102 tests)
     /    Tests   \  - Domain: 43 tests
    /              \ - Application: 45 tests
   /────────────────\- Service: 14 tests
  /                  \
────────────────────────
```

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) by Robert C. Martin
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/) by Alistair Cockburn
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/) by Eric Evans
- [Onion Architecture](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/) by Jeffrey Palermo
