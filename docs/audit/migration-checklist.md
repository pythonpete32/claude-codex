# Migration Checklist: Parser-UI Harmonization

## Overview
This checklist provides a systematic approach to migrating UI components to align with parser outputs. Each item can be completed independently to minimize breaking changes.

## Phase 1: Foundation (No Breaking Changes)

### 1.1 Create Shared Type Definitions
- [ ] Create `/apps/client/types/tool-props.ts`
  - [ ] Import `NormalizedStatus` from `@claude-codex/types`
  - [ ] Define `BaseToolUIProps` interface
  - [ ] Define tool-specific prop interfaces extending base
  - [ ] Export all interfaces

### 1.2 Create Shared Utilities
- [ ] Create `/apps/client/lib/tool-utils.ts`
  - [ ] `getStatusColor(status: NormalizedStatus): string`
  - [ ] `getStatusIcon(status: NormalizedStatus): LucideIcon`
  - [ ] `getStatusBadgeStyles(status: NormalizedStatus): string`
  - [ ] `formatDuration(ms: number): string`
  - [ ] `formatFileSize(bytes: number): string`
  - [ ] `formatTimestamp(timestamp: string): string`

### 1.3 Create Status Mapping Utilities
- [ ] Create `/apps/client/lib/status-adapter.ts`
  - [ ] `mapParserStatusToUI(status: NormalizedStatus): UIStatus`
  - [ ] `isRunningStatus(status: NormalizedStatus): boolean`
  - [ ] `isErrorStatus(status: NormalizedStatus): boolean`
  - [ ] `isSuccessStatus(status: NormalizedStatus): boolean`

### 1.4 Extend TerminalWindow Component
- [ ] Add support for all normalized statuses
- [ ] Add optional `uuid` display in debug mode
- [ ] Add optional `duration` display in header
- [ ] Add optional `correlationId` tracking
- [ ] Ensure backwards compatibility with existing props

## Phase 2: Component Migration (One at a Time)

### 2.1 BashTool Migration
**Priority: HIGH** (Most different from others)

#### Step 1: Create New Props Interface
- [ ] Create `BashToolProps` extending `BaseToolUIProps`
- [ ] Add parser-specific fields:
  - [ ] `output: string`
  - [ ] `errorOutput?: string`
  - [ ] `exitCode?: number`
  - [ ] `workingDirectory?: string`
  - [ ] `interrupted?: boolean`

#### Step 2: Create Adapter Hook
- [ ] Create `useBashToolAdapter` hook
- [ ] Maps old props to new structure
- [ ] Provides backwards compatibility

#### Step 3: Refactor Component
- [ ] Extract terminal UI to use `TerminalWindow`
- [ ] Keep typing animation as feature flag
- [ ] Use shared status utilities
- [ ] Support new props while maintaining old ones

#### Step 4: Update Stories
- [ ] Update stories to use new props
- [ ] Keep legacy stories for reference
- [ ] Add stories for new states (interrupted, etc.)

### 2.2 EditTool Migration
**Priority: MEDIUM**

#### Step 1: Update Props Interface
- [ ] Extend from parser's `EditToolProps`
- [ ] Remove redundant diff calculation
- [ ] Add missing fields:
  - [ ] `fileType?: string`
  - [ ] `wordWrap?: boolean`
  - [ ] `diff: DiffLine[]`

#### Step 2: Component Updates
- [ ] Use parser-provided diff directly
- [ ] Add syntax highlighting based on fileType
- [ ] Implement wordWrap toggle
- [ ] Use shared utilities

#### Step 3: Update Stories
- [ ] Test with parser output fixtures
- [ ] Add examples with different file types

### 2.3 GlobTool Migration
**Priority: MEDIUM**

#### Step 1: Update Props Interface
- [ ] Change from flat to nested structure:
  - [ ] `pattern` → `input.pattern`
  - [ ] `matches` → `results` (string array)
- [ ] Add `ui` statistics object
- [ ] Add missing fields

#### Step 2: Create Adapter
- [ ] Transform `results` strings to `GlobMatch` objects
- [ ] Calculate `isDirectory` from path patterns

#### Step 3: Component Updates
- [ ] Display search statistics
- [ ] Show search time in header
- [ ] Handle empty results

### 2.4 GrepTool Migration
**Priority: HIGH** (Complex data structure)

#### Step 1: Update Props Interface
- [ ] Use nested `input` structure
- [ ] Align `SearchResult` types
- [ ] Add `ui` statistics
- [ ] Add `onRefineSearch` callback

#### Step 2: Component Updates
- [ ] Display match statistics in header
- [ ] Implement search refinement UI
- [ ] Use parser match highlighting

### 2.5 LsTool Migration
**Priority: MEDIUM**

#### Step 1: Update Props Interface
- [ ] Use nested `results.entries`
- [ ] Align `FileEntry` types
- [ ] Add entry counts
- [ ] Add `ui` statistics

#### Step 2: Component Updates
- [ ] Display file/directory counts
- [ ] Show total size in header
- [ ] Support all FileEntry fields

### 2.6 MultiEditTool Migration
**Priority: LOW** (Less commonly used)

#### Step 1: Update Props Interface
- [ ] Separate `input` and `results`
- [ ] Add detailed edit results
- [ ] Add success/failure tracking

#### Step 2: Component Updates
- [ ] Show per-edit status
- [ ] Display statistics
- [ ] Handle partial failures

### 2.7 ReadTool Migration
**Priority: MEDIUM**

#### Step 1: Update Props Interface
- [ ] Add missing fields:
  - [ ] `language?: string`
  - [ ] `truncated?: boolean`
  - [ ] `errorMessage?: string`
  - [ ] `maxHeight?: string`

#### Step 2: Component Updates
- [ ] Add syntax highlighting
- [ ] Show truncation indicator
- [ ] Implement maxHeight control

## Phase 3: Integration & Cleanup

### 3.1 Create Parser-to-UI Adapters
- [ ] Create `/apps/client/lib/parser-adapters/index.ts`
- [ ] One adapter function per tool type
- [ ] Direct mapping from parser output to UI props
- [ ] Type-safe transformations

### 3.2 Update Showcase Page
- [ ] Use parser fixtures for demo data
- [ ] Show all status states
- [ ] Demonstrate all features

### 3.3 Remove Duplication
- [ ] Extract common badge components
- [ ] Remove redundant status mappings
- [ ] Consolidate file type detection

### 3.4 Testing
- [ ] Unit tests for adapters
- [ ] Component tests with parser data
- [ ] Visual regression tests
- [ ] Integration tests with real fixtures

### 3.5 Documentation
- [ ] Update component documentation
- [ ] Create migration guide
- [ ] Document breaking changes
- [ ] Add examples of parser integration

## Migration Rules

1. **No Breaking Changes in Phase 1** - Only add new code
2. **One Component at a Time** - Complete each before moving on
3. **Backwards Compatibility** - Support old props during migration
4. **Test at Each Step** - Ensure nothing breaks
5. **Commit Frequently** - Small, focused commits

## Success Criteria

- [ ] All components accept parser output directly
- [ ] No runtime transformations needed
- [ ] All 6 status states supported
- [ ] Correlation IDs tracked
- [ ] Code duplication reduced by 50%+
- [ ] Type safety maintained throughout

## Order of Implementation

1. **Week 1**: Foundation (Phase 1)
2. **Week 2**: BashTool + GrepTool (highest priority)
3. **Week 3**: EditTool + ReadTool + GlobTool
4. **Week 4**: LsTool + MultiEditTool + Integration

## Notes

- Keep old props during migration for backwards compatibility
- Use feature flags if needed for gradual rollout
- Document all decisions and deviations
- Regular check-ins after each component