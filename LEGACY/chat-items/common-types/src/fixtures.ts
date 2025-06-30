/**
 * Common fixture types shared across chat-item tool packages
 * @packageDocumentation
 * @module @dao/codex-chat-item-common-types/fixtures
 */

import type { BaseToolResultData, BaseToolUse, ToolStatus } from "./base";

/**
 * Base structure for tool call information in fixtures.
 * @typeParam TToolUse - The specific tool use type
 */
export interface BaseToolCall<TToolUse extends BaseToolUse<string, unknown>> {
	/** Unique identifier */
	uuid: string;
	/** Timestamp of the call */
	timestamp: string;
	/** Parent UUID reference */
	parentUuid: string;
	/** Session identifier */
	sessionId: string;
	/** Tool use details */
	tool: TToolUse;
}

/**
 * Base structure for tool result information in fixtures.
 * @typeParam TResult - The specific tool result type
 */
export interface BaseToolResult<TResult> {
	/** Unique identifier */
	uuid: string;
	/** Parent UUID reference */
	parentUuid: string;
	/** Timestamp of the result */
	timestamp: string;
	/** Raw result data */
	result: BaseToolResultData;
	/** Parsed tool use result */
	toolUseResult: TResult | string; // Can be string for error cases
}

/**
 * Base structure for expected component data.
 * @typeParam TProps - The specific component props type
 */
export interface BaseExpectedComponentData<TProps> {
	/** Component type identifier */
	type: string;
	/** Component props */
	props: TProps;
}

/**
 * Base fixture data structure from Claude conversation logs.
 * @typeParam TToolUse - The specific tool use type
 * @typeParam TResult - The specific tool result type
 * @typeParam TProps - The specific component props type
 */
export interface BaseFixtureData<TToolUse extends BaseToolUse<string, unknown>, TResult, TProps> {
	/** Tool call information */
	toolCall: BaseToolCall<TToolUse>;
	/** Tool result information */
	toolResult: BaseToolResult<TResult>;
	/** Expected component data */
	expectedComponentData: BaseExpectedComponentData<TProps>;
}

/**
 * Base structure for fixtures collection metadata.
 * @typeParam TFixture - The specific fixture data type
 */
export interface BaseFixturesMetadata<TFixture> {
	/** Tool name */
	toolName: string;
	/** Category classification */
	category: string;
	/** Priority level */
	priority: string;
	/** Total number of fixtures */
	fixtureCount: number;
	/** Array of fixture data */
	fixtures: TFixture[];
}

/**
 * Base structure for component props.
 * @typeParam TToolUse - The specific tool use type
 * @typeParam TResult - The specific tool result type
 */
export interface BaseToolProps<TToolUse extends BaseToolUse<string, unknown>, TResult> {
	/** Tool use information */
	toolUse: TToolUse;
	/** Execution status */
	status: ToolStatus;
	/** Timestamp of execution */
	timestamp: string;
	/** Tool execution result */
	toolResult: TResult;
}
