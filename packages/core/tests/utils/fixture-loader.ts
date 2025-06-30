import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { LogEntry } from '@claude-codex/types';

/**
 * FixtureLoader - Centralized utility for loading and validating test fixtures
 *
 * Features:
 * - Type-safe fixture loading with generic typing
 * - Automatic file resolution from fixture names
 * - Comprehensive validation before returning data
 * - Performance-optimized caching strategy
 * - Detailed error messages for debugging
 */
export class FixtureLoader {
  private static cache = new Map<string, unknown>();
  private static readonly FIXTURES_DIR = join(__dirname, '../fixtures');

  /**
   * Load a fixture file with type safety and validation
   * @param fixtureName - Name of the fixture file (with or without .json)
   * @returns Parsed and validated fixture data
   */
  static load<T = LogEntry[]>(fixtureName: string): T {
    // Normalize fixture name
    const normalizedName = fixtureName.endsWith('.json')
      ? fixtureName
      : `${fixtureName}.json`;

    // Check cache first
    const cacheKey = normalizedName;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as T;
    }

    // Resolve file path
    const filePath = join(this.FIXTURES_DIR, normalizedName);

    // Validate file exists
    if (!existsSync(filePath)) {
      throw new Error(
        `Fixture file not found: ${normalizedName}\n` +
          `Expected location: ${filePath}\n` +
          `Available fixtures: ${this.getAvailableFixtures().join(', ')}`
      );
    }

    try {
      // Load and parse file
      const fileContent = readFileSync(filePath, 'utf-8');
      const parsedData = JSON.parse(fileContent) as T;

      // Basic validation
      this.validateFixtureData(parsedData, normalizedName);

      // Cache for performance
      this.cache.set(cacheKey, parsedData);

      return parsedData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Invalid JSON in fixture: ${normalizedName}\n` +
            `Parse error: ${error.message}`
        );
      }
      throw error;
    }
  }

  /**
   * Load multiple fixtures at once for batch testing
   * @param fixtureNames - Array of fixture names to load
   * @returns Map of fixture names to loaded data
   */
  static loadBatch<T = LogEntry[]>(fixtureNames: string[]): Map<string, T> {
    const results = new Map<string, T>();

    for (const name of fixtureNames) {
      try {
        results.set(name, this.load<T>(name));
      } catch (error) {
        throw new Error(
          `Failed to load fixture in batch: ${name}\n` +
            `Original error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return results;
  }

  /**
   * Get list of available fixture files for debugging
   * @returns Array of fixture file names
   */
  static getAvailableFixtures(): string[] {
    try {
      const fs = require('node:fs');
      return fs
        .readdirSync(this.FIXTURES_DIR)
        .filter((file: string) => file.endsWith('.json'))
        .sort();
    } catch {
      return [];
    }
  }

  /**
   * Clear the fixture cache (useful for testing)
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * Validate fixture data meets basic requirements
   */
  private static validateFixtureData(data: unknown, fixtureName: string): void {
    if (data === null || data === undefined) {
      throw new Error(`Fixture ${fixtureName} contains null or undefined data`);
    }

    // For array fixtures (most common case)
    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error(`Fixture ${fixtureName} contains empty array`);
      }

      // Validate each entry has required fields for LogEntry
      for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        if (!entry || typeof entry !== 'object') {
          throw new Error(
            `Fixture ${fixtureName} entry ${i} is not a valid object`
          );
        }

        // Check for required LogEntry fields
        const logEntry = entry as Record<string, unknown>;
        if (!logEntry.uuid || typeof logEntry.uuid !== 'string') {
          throw new Error(
            `Fixture ${fixtureName} entry ${i} missing required 'uuid' field`
          );
        }

        if (!logEntry.type || typeof logEntry.type !== 'string') {
          throw new Error(
            `Fixture ${fixtureName} entry ${i} missing required 'type' field`
          );
        }
      }
    }
  }

  /**
   * Helper to get fixture file path for external tools
   * @param fixtureName - Name of the fixture file
   * @returns Absolute path to fixture file
   */
  static getFixturePath(fixtureName: string): string {
    const normalizedName = fixtureName.endsWith('.json')
      ? fixtureName
      : `${fixtureName}.json`;
    return join(this.FIXTURES_DIR, normalizedName);
  }

  /**
   * Validate a fixture exists without loading it
   * @param fixtureName - Name of the fixture file
   * @returns True if fixture exists and is valid
   */
  static exists(fixtureName: string): boolean {
    try {
      const normalizedName = fixtureName.endsWith('.json')
        ? fixtureName
        : `${fixtureName}.json`;
      const filePath = join(this.FIXTURES_DIR, normalizedName);
      return existsSync(filePath);
    } catch {
      return false;
    }
  }
}
