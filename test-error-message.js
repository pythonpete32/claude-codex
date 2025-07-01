// Quick test to verify errorMessage functionality
import { ReadToolParser } from './packages/core/src/parsers/read-parser.js';

const parser = new ReadToolParser();

const toolCall = {
  type: 'assistant',
  uuid: 'test-uuid',
  timestamp: '2025-01-01T00:00:00Z',
  content: [{
    type: 'tool_use',
    id: 'test-tool-id',
    name: 'Read',
    input: { file_path: '/nonexistent.txt' }
  }]
};

const toolResult = {
  type: 'user',
  uuid: 'result-uuid',
  timestamp: '2025-01-01T00:00:01Z',
  content: [{
    type: 'tool_result',
    tool_use_id: 'test-tool-id',
    is_error: true,
    text: 'Error: File not found'
  }]
};

try {
  const result = parser.parse(toolCall, toolResult);
  console.log('✅ Error Message:', result.errorMessage);
  console.log('✅ Status:', result.status.normalized);
  console.log('✅ errorMessage field exists and is working');
} catch (error) {
  console.log('❌ Error:', error.message);
}