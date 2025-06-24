import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractAgentResults,
  formatExecutionSummary,
  logFinalResponse,
} from '../../../src/messaging/result-extractor.js';
import type { AgentResult } from '../../../src/messaging/sdk-wrapper.js';
import { SAMPLE_DEBUG_MESSAGES } from '../../helpers/mock-sdk.js';

// Mock console.log to capture output
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('Result Extractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractAgentResults', () => {
    it('should extract all results from AgentResult', () => {
      const agentResult: AgentResult = {
        messages: SAMPLE_DEBUG_MESSAGES,
        finalResponse: 'Feature implemented successfully',
        success: true,
        cost: 0.0025,
        duration: 5000,
        messageCount: 5,
      };

      const results = extractAgentResults(agentResult);

      expect(results).toEqual({
        finalResponse: 'Feature implemented successfully',
        success: true,
        cost: 0.0025,
        duration: 5000,
        messageCount: 5,
      });
    });

    it('should handle empty finalResponse', () => {
      const agentResult: AgentResult = {
        messages: SAMPLE_DEBUG_MESSAGES,
        finalResponse: '',
        success: false,
        cost: 0,
        duration: 1000,
        messageCount: 3,
      };

      const results = extractAgentResults(agentResult);

      expect(results.finalResponse).toBe('');
      expect(results.success).toBe(false);
    });
  });

  describe('logFinalResponse', () => {
    it('should log and return non-empty final response', () => {
      const finalResponse = 'Implementation completed successfully!';

      const result = logFinalResponse(finalResponse);

      expect(result).toBe(finalResponse);
      expect(mockConsoleLog).toHaveBeenCalledWith('\n📋 Final Response:');
      expect(mockConsoleLog).toHaveBeenCalledWith('─'.repeat(50));
      expect(mockConsoleLog).toHaveBeenCalledWith(finalResponse);
    });

    it('should log fallback message for empty response', () => {
      const result = logFinalResponse('');

      expect(result).toBe('Task was interrupted - no final response available');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n⚠️  Final Response:');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        'Task was interrupted - no final response available'
      );
    });

    it('should use custom fallback message', () => {
      const customFallback = 'Custom interruption message';

      const result = logFinalResponse('', customFallback);

      expect(result).toBe(customFallback);
      expect(mockConsoleLog).toHaveBeenCalledWith(customFallback);
    });

    it('should handle whitespace-only responses as empty', () => {
      const result = logFinalResponse('   \n  \t  ');

      expect(result).toBe('Task was interrupted - no final response available');
      expect(mockConsoleLog).toHaveBeenCalledWith('\n⚠️  Final Response:');
    });
  });

  describe('formatExecutionSummary', () => {
    it('should format successful execution summary', () => {
      const results = {
        finalResponse: 'Implementation completed',
        success: true,
        cost: 0.0025,
        duration: 5000,
        messageCount: 10,
      };

      const summary = formatExecutionSummary(results);

      expect(summary).toContain('📊 Execution Summary:');
      expect(summary).toContain('Status: ✅ Success');
      expect(summary).toContain('Duration: 5000ms');
      expect(summary).toContain('Cost: $0.0025');
      expect(summary).toContain('Messages: 10 messages');
      expect(summary).toContain('Has Final Response: Yes');

      expect(mockConsoleLog).toHaveBeenCalledWith(summary);
    });

    it('should format failed execution summary', () => {
      const results = {
        finalResponse: '',
        success: false,
        cost: 0.001,
        duration: 2000,
        messageCount: 5,
      };

      const summary = formatExecutionSummary(results);

      expect(summary).toContain('Status: ❌ Failed');
      expect(summary).toContain('Duration: 2000ms');
      expect(summary).toContain('Cost: $0.0010');
      expect(summary).toContain('Messages: 5 messages');
      expect(summary).toContain('Has Final Response: No');
    });

    it('should handle zero cost correctly', () => {
      const results = {
        finalResponse: 'Test response',
        success: true,
        cost: 0,
        duration: 1000,
        messageCount: 3,
      };

      const summary = formatExecutionSummary(results);

      expect(summary).toContain('Cost: $0.0000');
    });

    it('should handle high precision costs', () => {
      const results = {
        finalResponse: 'Test response',
        success: true,
        cost: 0.123456789,
        duration: 1000,
        messageCount: 3,
      };

      const summary = formatExecutionSummary(results);

      expect(summary).toContain('Cost: $0.1235'); // Should round to 4 decimal places
    });
  });
});
