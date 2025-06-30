# Fixture-First Testing Architecture: Detailed Design Document

**STATUS**: Architectural Design  
**VERSION**: 1.0  
**CREATED**: 2025-06-30  
**PURPOSE**: Comprehensive technical specification for fixture-based parser testing infrastructure

## Overview

This document defines the complete architectural design for transitioning from hardcoded mock data to real fixture-based testing. The architecture centers on two core systems: **FixtureLoader** for systematic fixture management and **ParserTestHarness** for standardized parser validation.

## Problem Statement

### Current Testing Architecture Issues
1. **Data Disconnect**: Parser tests use hardcoded mock data that doesn't reflect real Claude Code tool outputs
2. **Maintenance Burden**: Mock data scattered across multiple test files requires manual synchronization
3. **Validation Gap**: No systematic validation that parsers produce UI props matching TypeScript interfaces
4. **Real Data Blindness**: Tests may pass with simplified mocks but fail with complex real data structures

### Business Impact
- **Risk of Production Failures**: Parsers untested against real data complexity
- **Development Inefficiency**: Duplicate effort maintaining mocks and fixtures separately
- **Type Safety Gaps**: No guarantee parser outputs match UI component expectations

## Architectural Solution

### Core Philosophy
**Fixtures as Single Source of Truth**: All parser testing validation flows from our comprehensive, real-data fixture files that are already validated against TypeScript interfaces.

### Key Benefits
1. **Real Data Confidence**: Tests use actual Claude Code log structures
2. **Type Safety Assurance**: Fixtures pre-validated against UI prop interfaces
3. **Systematic Consistency**: Uniform testing approach across all 16 built-in tools
4. **Maintenance Efficiency**: Update fixture once, all tests benefit
5. **Production Reliability**: Real data ensures parser robustness

## Core Component 1: FixtureLoader

### Purpose and Responsibilities
The FixtureLoader serves as the foundational data access layer for the fixture-first testing architecture. It provides type-safe, validated access to our comprehensive fixture files while abstracting the complexities of file loading, parsing, and validation.

### Why We Need FixtureLoader
1. **Centralized Fixture Access**: Single point of control for all fixture loading operations
2. **Type Safety**: Ensures loaded fixtures conform to expected TypeScript interfaces
3. **Validation Layer**: Guarantees fixture integrity before use in tests
4. **Performance Optimization**: Caching and efficient loading strategies
5. **Error Handling**: Graceful handling of malformed or missing fixtures
6. **Abstraction**: Hides file system complexity from test code

### FixtureLoader Interface Design

```typescript
interface FixtureData<TProps> {
  toolName: string;
  category: 'core' | 'mcp';
  priority: 'critical' | 'high' | 'medium' | 'low';
  fixtureCount: number;
  fixtures: Array<{
    toolCall: LogEntry;
    toolResult: LogEntry;
    expectedComponentData: TProps;
  }>;
}

interface FixtureValidationResult {
  isValid: boolean;
  errors: FixtureValidationError[];
  warnings: FixtureValidationWarning[];
}

interface FixtureValidationError {
  field: string;
  expected: string;
  actual: string;
  severity: 'critical' | 'error' | 'warning';
  message: string;
}

interface FixtureManifest {
  fixtures: Array<{
    name: string;
    path: string;
    toolType: string;
    status: 'valid' | 'invalid' | 'missing';
  }>;
  totalCount: number;
  validCount: number;
  invalidCount: number;
}

class FixtureLoader {
  /**
   * Loads and validates a fixture file for a specific tool and UI props type
   * @param fixtureName - Name of fixture file (e.g., 'bash-tool-new')
   * @returns Promise resolving to validated fixture data
   * @throws FixtureLoadError if file missing or invalid
   */
  static async loadFixture<TProps>(fixtureName: string): Promise<FixtureData<TProps>>;

  /**
   * Loads fixture by tool name with automatic file resolution
   * @param toolName - Tool name (e.g., 'Bash', 'NotebookRead')
   * @returns Promise resolving to validated fixture data
   */
  static async loadFixtureByTool<TProps>(toolName: string): Promise<FixtureData<TProps>>;

  /**
   * Validates fixture structure against schema requirements
   * @param fixture - Raw fixture data to validate
   * @returns Validation result with errors and warnings
   */
  static validateFixture<TProps>(fixture: unknown): FixtureValidationResult;

  /**
   * Loads and returns manifest of all available fixtures
   * @returns Promise resolving to complete fixture manifest
   */
  static async getFixtureManifest(): Promise<FixtureManifest>;

  /**
   * Preloads and caches commonly used fixtures for performance
   * @param fixtureNames - Array of fixture names to preload
   */
  static async preloadFixtures(fixtureNames: string[]): Promise<void>;

  /**
   * Clears fixture cache (useful for testing cache behavior)
   */
  static clearCache(): void;

  /**
   * Validates that fixture's expectedComponentData matches TypeScript interface
   * @param expectedData - The expectedComponentData from fixture
   * @param interfaceSchema - TypeScript interface schema for validation
   */
  static validateExpectedDataStructure<TProps>(
    expectedData: TProps, 
    interfaceSchema: TypeSchema
  ): FixtureValidationResult;
}
```

### FixtureLoader Internal Architecture

#### Fixture File Resolution Strategy
```typescript
interface FixturePathResolver {
  /**
   * Resolves fixture file path from tool name
   * Priority: exact-match > partial-match > default
   */
  resolveFixturePath(toolName: string): string;
  
  /**
   * Returns all possible fixture paths for a tool
   */
  getAllPossiblePaths(toolName: string): string[];
}
```

#### Validation Engine
```typescript
interface FixtureValidator {
  /**
   * Validates complete fixture structure
   */
  validateStructure(fixture: unknown): FixtureValidationResult;
  
  /**
   * Validates LogEntry format for toolCall/toolResult
   */
  validateLogEntry(entry: unknown): FixtureValidationResult;
  
  /**
   * Validates expectedComponentData against UI props interface
   */
  validateExpectedData<TProps>(data: unknown): FixtureValidationResult;
}
```

#### Caching Strategy
```typescript
interface FixtureCache {
  /**
   * Gets cached fixture data
   */
  get<TProps>(key: string): FixtureData<TProps> | null;
  
  /**
   * Stores fixture data in cache
   */
  set<TProps>(key: string, data: FixtureData<TProps>): void;
  
  /**
   * Cache invalidation and management
   */
  invalidate(key: string): void;
  clear(): void;
}
```

## Core Component 2: ParserTestHarness

### Purpose and Responsibilities
The ParserTestHarness provides a systematic, standardized framework for validating that parsers correctly transform raw log data (from fixtures) into expected UI component props. It serves as the testing engine that ensures parser reliability and correctness.

### Why We Need ParserTestHarness
1. **Systematic Validation**: Consistent testing approach across all parser types
2. **Automated Comparison**: Programmatic validation of parser output vs expected results
3. **Comprehensive Coverage**: Tests all aspects of parser behavior systematically
4. **Error Reporting**: Detailed feedback on parser failures and discrepancies
5. **Test Generation**: Automatically creates comprehensive test suites from fixtures
6. **Edge Case Handling**: Systematic testing of error conditions and edge cases

### ParserTestHarness Interface Design

```typescript
interface ParserTestResult {
  passed: boolean;
  errors: ParserTestError[];
  warnings: ParserTestWarning[];
  metrics: TestMetrics;
  comparisonReport: ComparisonReport;
}

interface ParserTestError {
  field: string;
  expected: unknown;
  actual: unknown;
  difference: FieldDifference;
  severity: 'critical' | 'major' | 'minor';
  message: string;
}

interface ComparisonReport {
  fieldsCompared: number;
  fieldsMatched: number;
  fieldsMismatched: number;
  fieldsAdditional: string[]; // Fields in actual but not expected
  fieldsMissing: string[];    // Fields in expected but not actual
  detailedDifferences: FieldDifference[];
}

interface FieldDifference {
  path: string;
  expectedType: string;
  actualType: string;
  expectedValue: unknown;
  actualValue: unknown;
  diffType: 'missing' | 'additional' | 'type_mismatch' | 'value_mismatch';
}

interface TestMetrics {
  executionTimeMs: number;
  memoryUsageMB: number;
  fixtureLoadTimeMs: number;
  parseTimeMs: number;
  comparisonTimeMs: number;
}

interface TestSuiteConfiguration {
  includeEdgeCases: boolean;
  validateAllFields: boolean;
  strictTypeChecking: boolean;
  performanceThresholds: {
    maxExecutionTimeMs: number;
    maxMemoryUsageMB: number;
  };
}

class ParserTestHarness<TParser, TProps> {
  private parser: TParser;
  private fixture: FixtureData<TProps>;
  private config: TestSuiteConfiguration;

  /**
   * Creates new test harness for specific parser and fixture combination
   * @param parser - Parser instance to test
   * @param fixture - Fixture data containing test scenarios
   * @param config - Test configuration options
   */
  constructor(
    parser: TParser, 
    fixture: FixtureData<TProps>, 
    config?: Partial<TestSuiteConfiguration>
  );

  /**
   * Executes parser with fixture data and validates output
   * @returns Comprehensive test result with detailed comparison
   */
  async validateParserOutput(): Promise<ParserTestResult>;

  /**
   * Runs complete test suite including edge cases and error scenarios
   * @returns Array of test results for all scenarios
   */
  async runComprehensiveTests(): Promise<ParserTestResult[]>;

  /**
   * Tests parser behavior with invalid/malformed input data
   * @returns Test results for error handling scenarios
   */
  async testErrorHandling(): Promise<ParserTestResult[]>;

  /**
   * Tests parser performance characteristics
   * @returns Performance metrics and validation results
   */
  async testPerformance(): Promise<TestMetrics>;

  /**
   * Generates detailed comparison report between parser output and expected data
   * @param parserOutput - Actual output from parser
   * @param expectedData - Expected output from fixture
   * @returns Detailed field-by-field comparison
   */
  generateComparisonReport(parserOutput: TProps, expectedData: TProps): ComparisonReport;

  /**
   * Validates that parser implements required interface methods
   * @returns Validation result for interface compliance
   */
  validateParserInterface(): FixtureValidationResult;
}
```

### ParserTestHarness Internal Architecture

#### Deep Comparison Engine
```typescript
interface ComparisonEngine {
  /**
   * Performs deep object comparison with detailed difference tracking
   */
  deepCompare<T>(expected: T, actual: T): ComparisonReport;
  
  /**
   * Compares specific field types with custom validation rules
   */
  compareField(fieldPath: string, expected: unknown, actual: unknown): FieldDifference | null;
  
  /**
   * Validates type compatibility between expected and actual values
   */
  validateTypeCompatibility(expected: unknown, actual: unknown): boolean;
}
```

#### Test Scenario Generator
```typescript
interface TestScenarioGenerator {
  /**
   * Generates standard test scenarios from fixture data
   */
  generateStandardScenarios<TProps>(fixture: FixtureData<TProps>): TestScenario[];
  
  /**
   * Generates edge case scenarios (missing data, invalid data, etc.)
   */
  generateEdgeCaseScenarios<TProps>(fixture: FixtureData<TProps>): TestScenario[];
  
  /**
   * Generates error condition scenarios
   */
  generateErrorScenarios<TProps>(fixture: FixtureData<TProps>): TestScenario[];
}

interface TestScenario {
  name: string;
  description: string;
  toolCall: LogEntry;
  toolResult?: LogEntry;
  expectedOutcome: 'success' | 'error' | 'warning';
  expectedProps?: unknown;
}
```

#### Performance Monitor
```typescript
interface PerformanceMonitor {
  /**
   * Measures parser execution performance
   */
  measureExecution<T>(operation: () => T): { result: T; metrics: TestMetrics };
  
  /**
   * Validates performance against thresholds
   */
  validatePerformance(metrics: TestMetrics, thresholds: TestSuiteConfiguration['performanceThresholds']): boolean;
}
```

## Supporting Type System

### Base Testing Types
```typescript
interface TestFrameworkTypes {
  // Core testing result types
  TestResult: ParserTestResult;
  TestError: ParserTestError;
  TestWarning: ParserTestWarning;
  
  // Comparison and validation types
  ComparisonReport: ComparisonReport;
  FieldDifference: FieldDifference;
  ValidationResult: FixtureValidationResult;
  
  // Configuration types
  TestConfig: TestSuiteConfiguration;
  FixtureConfig: FixtureLoaderConfiguration;
}
```

### Parser Integration Types
```typescript
interface ParserIntegrationTypes {
  /**
   * Base interface that all parsers must implement for testing compatibility
   */
  TestableParser<TInput, TOutput> {
    parse(toolCall: LogEntry, toolResult?: LogEntry): TOutput;
    canParse(entry: LogEntry): boolean;
  }
  
  /**
   * Extended interface for parsers that support configuration
   */
  ConfigurableParser<TInput, TOutput, TConfig> extends TestableParser<TInput, TOutput> {
    configure(config: TConfig): void;
    getConfiguration(): TConfig;
  }
}
```

## Integration Architecture

### Integration with Existing Test Framework
```typescript
interface VitestIntegration {
  /**
   * Creates vitest test suite from fixture and harness
   */
  createTestSuite<TParser, TProps>(
    parserClass: new () => TParser,
    fixtureName: string
  ): void;
  
  /**
   * Generates individual test cases for vitest
   */
  generateTestCases<TParser, TProps>(
    harness: ParserTestHarness<TParser, TProps>
  ): Array<{ name: string; testFn: () => Promise<void> }>;
}
```

### Integration with Parser Registry
```typescript
interface RegistryIntegration {
  /**
   * Validates all registered parsers against their fixtures
   */
  validateAllRegisteredParsers(): Promise<ValidationSummary>;
  
  /**
   * Runs comprehensive test suite for entire parser registry
   */
  testParserRegistry(): Promise<RegistryTestResult>;
}

interface ValidationSummary {
  totalParsers: number;
  validatedParsers: number;
  failedParsers: string[];
  warnings: string[];
  overallStatus: 'pass' | 'fail' | 'partial';
}
```

## Testing Patterns and Usage

### Standard Testing Pattern
```typescript
// How tests will be structured using this architecture
describe('ParserName with Fixture-First Testing', () => {
  let harness: ParserTestHarness<ParserClass, ParserProps>;
  
  beforeAll(async () => {
    const fixture = await FixtureLoader.loadFixture<ParserProps>('parser-fixture-name');
    harness = new ParserTestHarness(new ParserClass(), fixture);
  });
  
  test('should parse fixture data correctly', async () => {
    const result = await harness.validateParserOutput();
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should handle all fixture scenarios', async () => {
    const results = await harness.runComprehensiveTests();
    results.forEach(result => {
      expect(result.passed).toBe(true);
    });
  });
  
  test('should handle error cases gracefully', async () => {
    const results = await harness.testErrorHandling();
    // Validate error handling behavior
  });
});
```

### Advanced Testing Pattern
```typescript
// How complex testing scenarios will work
describe('Advanced Parser Validation', () => {
  test('should validate all built-in parsers', async () => {
    const manifest = await FixtureLoader.getFixtureManifest();
    
    for (const fixtureInfo of manifest.fixtures) {
      const fixture = await FixtureLoader.loadFixture(fixtureInfo.name);
      const parser = ParserRegistry.getParser(fixtureInfo.toolType);
      const harness = new ParserTestHarness(parser, fixture);
      
      const result = await harness.validateParserOutput();
      expect(result.passed).toBe(true);
    }
  });
});
```

## Error Handling Strategy

### FixtureLoader Error Handling
```typescript
interface FixtureLoaderErrors {
  FixtureNotFoundError: { fixtureName: string; searchPaths: string[] };
  FixtureValidationError: { validationErrors: FixtureValidationError[] };
  FixtureParseError: { parseError: string; originalError: Error };
  FixtureTypeError: { expectedType: string; actualType: string };
}
```

### ParserTestHarness Error Handling
```typescript
interface TestHarnessErrors {
  ParserExecutionError: { parser: string; inputData: LogEntry; error: Error };
  ComparisonError: { field: string; comparisonType: string; error: Error };
  PerformanceThresholdError: { metric: string; expected: number; actual: number };
  InterfaceValidationError: { missingMethods: string[]; invalidMethods: string[] };
}
```

## Performance Considerations

### FixtureLoader Performance
- **Caching Strategy**: Intelligent caching of frequently used fixtures
- **Lazy Loading**: Load fixtures only when needed
- **Batch Loading**: Efficient loading of multiple fixtures
- **Memory Management**: Automatic cleanup of unused fixture data

### ParserTestHarness Performance
- **Parallel Execution**: Run multiple test scenarios concurrently where possible
- **Performance Monitoring**: Track and report execution metrics
- **Memory Efficiency**: Efficient object comparison algorithms
- **Timeout Management**: Prevent hanging tests with reasonable timeouts

## Migration Strategy

### Phase 1: Infrastructure Implementation
1. Implement FixtureLoader with full interface
2. Implement ParserTestHarness with comprehensive testing
3. Create supporting utilities and types
4. Validate with one existing parser

### Phase 2: Existing Parser Migration
1. Convert each existing parser test individually
2. Maintain parallel old/new tests during transition
3. Validate complete feature parity
4. Remove old hardcoded mock tests

### Phase 3: New Parser Implementation
1. Implement missing parsers using fixture-first approach
2. Use established patterns from Phase 2
3. Achieve 100% built-in tool coverage

### Phase 4: System Integration
1. Complete parser registry integration
2. End-to-end validation
3. Performance optimization
4. Documentation and guidelines

## Success Criteria

### Technical Success Criteria
1. **100% Fixture Coverage**: All existing fixtures load and validate successfully
2. **Parser Compatibility**: All existing parsers work with new testing architecture
3. **Type Safety**: No TypeScript errors, full type validation
4. **Performance**: Test execution time within acceptable thresholds
5. **Error Handling**: Graceful handling of all error conditions

### Business Success Criteria
1. **Development Efficiency**: Faster parser development and testing
2. **Reliability**: Increased confidence in parser behavior with real data
3. **Maintainability**: Single source of truth for test data
4. **Scalability**: Easy addition of new parsers and fixtures

This architectural design provides the complete foundation for implementing fixture-first testing with systematic validation, comprehensive error handling, and scalable patterns for parser development.