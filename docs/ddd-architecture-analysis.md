# DDD Architecture Analysis - Claude Codex

## Executive Summary

This analysis examines the Claude Codex codebase from a Domain-Driven Design (DDD) perspective. The project demonstrates a **hybrid DDD approach** that prioritizes pragmatic UI-first design while maintaining clear domain boundaries and separation of concerns.

## Architecture Overview

### Domain Boundaries

The codebase is organized into distinct layers following DDD principles:

```
claude-codex/
├── packages/                     # Domain & Supporting Layers
│   ├── core/                    # Core Domain - Business Logic
│   ├── types/                   # Domain Model - Shared Types
│   ├── log-processor/           # Infrastructure - Log Processing
│   └── utils/                   # Supporting - Cross-cutting Concerns
├── apps/                        # Application & Presentation Layers
│   ├── api-server/              # Application Layer - REST API
│   └── client/                  # Presentation Layer - Next.js UI
└── docs/                        # Architecture Documentation
```

## DDD Layer Analysis

### 1. Domain Layer (`packages/core`)

**Purpose**: Contains the core business logic for parsing Claude Code tool logs.

**Key Components**:
- **Parsers**: Domain services that transform raw log data into UI-ready props
- **Registry**: Domain service for parser registration and lookup
- **Project Domain**: `ProjectPathResolver` for handling Claude's encoded paths

**DDD Assessment**:
- ✅ **Pure domain logic** - No infrastructure dependencies
- ✅ **Rich domain services** - Parsers encapsulate complex transformation logic
- ✅ **Clear bounded context** - Focused solely on log parsing
- ⚠️ **Anemic domain model** - Most entities are data structures without behavior

### 2. Domain Model (`packages/types`)

**Purpose**: Defines all domain entities, value objects, and interfaces.

**Key Components**:
- **Entities**: `LogEntry`, `Session`, `Project`, `ChatItem`
- **Value Objects**: `ToolStatus`, `ToolMetadata`, `SearchResult`
- **UI Props**: Domain-specific data structures for UI consumption
- **Interfaces**: Parser contracts and type guards

**DDD Assessment**:
- ✅ **Centralized domain model** - Single source of truth for types
- ✅ **Clear value objects** - Immutable data structures
- ✅ **Domain-specific language** - Types reflect business concepts
- ⚠️ **Mixed concerns** - UI props blur domain/presentation boundary

### 3. Infrastructure Layer (`packages/log-processor`)

**Purpose**: Handles external concerns like file monitoring and log correlation.

**Key Components**:
- **FileMonitor**: Watches JSONL files for changes
- **CorrelationEngine**: Links tool calls with results
- **ProjectResolver**: Maps encoded paths to projects

**DDD Assessment**:
- ✅ **Clear infrastructure boundary** - Isolated from domain logic
- ✅ **Dependency inversion** - Uses domain types, not vice versa
- ✅ **Event-driven design** - Publishes domain events
- ✅ **Proper abstraction** - Domain doesn't know about file systems

### 4. Application Layer (`apps/api-server`)

**Purpose**: Orchestrates domain services and exposes REST API.

**Key Components**:
- **Routes**: HTTP endpoints for projects and sessions
- **Services**: `HistoryReader`, `SessionScanner`, `HealthMetrics`
- **API Types**: DTOs for client communication

**DDD Assessment**:
- ✅ **Thin application layer** - Delegates to domain services
- ✅ **Clear DTOs** - Separate API models from domain
- ✅ **Use case orchestration** - Coordinates multiple services
- ⚠️ **Some domain logic leak** - File scanning could be in infrastructure

### 5. Presentation Layer (`apps/client`)

**Purpose**: Next.js UI for displaying parsed logs.

**Key Components**:
- **Components**: Tool-specific UI components
- **Hooks**: React hooks for API interaction
- **Services**: API client for backend communication

**DDD Assessment**:
- ✅ **Clear presentation boundary** - No domain logic in UI
- ✅ **Component-based architecture** - Modular UI structure
- ✅ **Proper data flow** - Consumes DTOs from API
- ⚠️ **Direct domain type usage** - Imports from `@claude-codex/types`

## Architectural Patterns & Decisions

### 1. Hybrid Schema Architecture

The project implements a unique **hybrid approach** that deviates from traditional DDD:

- **Simple tools**: Use flat props for immediate UI consumption
- **Complex tools**: Use structured props for relational data
- **Parser-centric design**: Domain services output UI-ready data

**Rationale**: Eliminates runtime transformation, improving performance and developer experience.

### 2. UI-First Domain Modeling

Unlike traditional DDD where domain models are UI-agnostic, Claude Codex:

- **Domain outputs UI props directly** - Parsers know about UI needs
- **No intermediate transformation** - Components consume parser output
- **Type system enforces consistency** - SOT document governs all types

**Trade-offs**:
- ✅ **Performance** - No runtime data mapping
- ✅ **Type safety** - End-to-end type checking
- ❌ **Domain purity** - Domain knows about presentation
- ❌ **Flexibility** - Harder to support multiple UIs

### 3. Source of Truth (SOT) Document

The project uses a **design-by-contract** approach with `/docs/SOT/0_1_type-system-design-authority.md`:

- **Authoritative type definitions** - All types must conform
- **Inheritance rules** - Clear type hierarchies
- **Naming conventions** - Consistent field names
- **No exceptions** - Deviations require approval

**DDD Perspective**: This enforces a **ubiquitous language** across all layers.

### 4. Event Sourcing Light

The log-processor implements a lightweight event sourcing pattern:

- **Immutable log entries** - Never modified after creation
- **Event correlation** - Links related events
- **Temporal ordering** - Maintains event sequence

### 5. Dependency Injection for Cross-Cutting Concerns

The utils package provides logging via dependency injection:

```typescript
// Types package stays pure
StatusMapper.setLogger(loggerFn);

// Utils provides implementation
initializeLogging();
```

**DDD Assessment**: Maintains domain purity while enabling infrastructure services.

## Deviations from Classical DDD

### 1. Anemic Domain Model

- **Entities are mostly data structures** - Limited behavior
- **Logic in domain services** - Parsers contain business rules
- **Functional approach** - Stateless transformations

**Justification**: Log parsing is inherently functional - transform input to output.

### 2. UI-Aware Domain

- **Domain knows about UI needs** - Props designed for components
- **No application DTOs** - Direct domain-to-UI mapping
- **Presentation concepts in domain** - `showLineNumbers`, `wordWrap`

**Trade-off**: Sacrifices domain purity for pragmatic performance.

### 3. Missing Domain Events

- **No explicit domain events** - Only infrastructure events
- **No event bus** - Direct method calls
- **No saga/process managers** - Simple request-response

**Opportunity**: Could add domain events for better decoupling.

## Strengths

1. **Clear Bounded Contexts** - Each package has a focused responsibility
2. **Dependency Direction** - Infrastructure depends on domain, not vice versa
3. **Type Safety** - Comprehensive TypeScript usage with strict rules
4. **Performance Focus** - Eliminates unnecessary transformations
5. **Pragmatic Design** - Balances DDD principles with real-world needs

## Areas for Improvement

1. **Rich Domain Model** - Add behavior to entities where appropriate
2. **Domain Events** - Implement proper event-driven architecture
3. **Aggregate Roots** - Define clear aggregate boundaries
4. **Repository Pattern** - Abstract data access behind repositories
5. **Domain/UI Separation** - Consider intermediate DTOs for flexibility

## Recommendations

### Short Term
1. **Extract UI concerns from domain types** - Move UI helpers to presentation layer
2. **Add domain events** - For parser completion, errors, etc.
3. **Implement repositories** - Abstract file system access

### Long Term
1. **Rich domain entities** - Move parser logic into domain objects
2. **CQRS pattern** - Separate read models from write models
3. **Multiple UI support** - Decouple domain from specific UI needs
4. **Plugin architecture** - Allow external parser additions

## Conclusion

Claude Codex demonstrates a **pragmatic approach to DDD** that prioritizes:
- **Developer experience** through type safety
- **Performance** through direct data flow
- **Maintainability** through clear boundaries

While it deviates from classical DDD in some areas (UI-aware domain, anemic model), these are **conscious trade-offs** that align with the project's goals. The architecture successfully separates concerns while maintaining a cohesive, type-safe system.

The hybrid schema architecture is particularly innovative, showing how DDD principles can be adapted for modern frontend-heavy applications without sacrificing the benefits of domain-driven design.