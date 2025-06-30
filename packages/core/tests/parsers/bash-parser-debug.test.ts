import { describe, expect, test } from 'vitest';
import { BashToolParser } from '../../src/parsers/bash-parser';
import { loadFixture } from '../utils';

describe('BashToolParser Debug', () => {
  test('inspect fixture structure', () => {
    const fixtureData = loadFixture('bash-tool-new.json');
    const fixture = fixtureData.fixtures[0];
    
    console.log('Tool Result Content:', JSON.stringify(fixture.toolResult.message.content, null, 2));
    
    // Check what the parser actually receives
    const parser = new BashToolParser();
    const toolCallEntry = {
      uuid: fixture.toolCall.uuid,
      timestamp: fixture.toolCall.timestamp,
      parentUuid: fixture.toolCall.parentUuid,
      type: fixture.toolCall.type as 'assistant',
      isSidechain: fixture.toolCall.isSidechain,
      content: fixture.toolCall.message.content,
    };
    
    const toolResultEntry = {
      uuid: fixture.toolResult.uuid,
      timestamp: fixture.toolResult.timestamp,
      parentUuid: fixture.toolResult.parentUuid,
      type: fixture.toolResult.type as 'user',
      isSidechain: fixture.toolResult.isSidechain,
      content: fixture.toolResult.message.content,
    };
    
    const result = parser.parse(toolCallEntry, toolResultEntry);
    console.log('Parser Result:', JSON.stringify(result, null, 2));
    
    expect(result).toBeDefined();
  });
});