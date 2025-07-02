/**
 * Type guards for safely accessing unknown data from external sources.
 * These guards ensure SOT compliance by validating unknown types before use.
 */

/**
 * Check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if a value is an object (not null, not array)
 */
export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a record (object with string keys)
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value);
}

/**
 * Check if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Safely get a string property from an unknown object
 */
export function getStringProperty(obj: unknown, key: string): string | undefined {
  if (!isRecord(obj)) return undefined;
  const value = obj[key];
  return isString(value) ? value : undefined;
}

/**
 * Safely get a number property from an unknown object
 */
export function getNumberProperty(obj: unknown, key: string): number | undefined {
  if (!isRecord(obj)) return undefined;
  const value = obj[key];
  return isNumber(value) ? value : undefined;
}

/**
 * Safely get a boolean property from an unknown object
 */
export function getBooleanProperty(obj: unknown, key: string): boolean | undefined {
  if (!isRecord(obj)) return undefined;
  const value = obj[key];
  return isBoolean(value) ? value : undefined;
}

/**
 * Safely get an object property from an unknown object
 */
export function getObjectProperty(obj: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(obj)) return undefined;
  const value = obj[key];
  return isRecord(value) ? value : undefined;
}

/**
 * Generic helper to validate and extract tool input with a type guard
 */
export function getToolInput<T extends Record<string, unknown>>(
  input: unknown,
  validator: (input: unknown) => input is T
): T | undefined {
  if (validator(input)) {
    return input;
  }
  return undefined;
}

/**
 * Type guard for MessageContent output field
 * Since output can be various types, we provide specific guards
 */
export function isToolResultOutput(output: unknown): output is string | Record<string, unknown> {
  return isString(output) || isRecord(output);
}

/**
 * Extract tool result output safely
 */
export function getToolResultOutput(output: unknown): { type: 'string' | 'object' | 'unknown'; value: unknown } {
  if (isString(output)) {
    return { type: 'string', value: output };
  }
  if (isRecord(output)) {
    return { type: 'object', value: output };
  }
  return { type: 'unknown', value: output };
}