import {
  displayAssistantMessage,
  displaySessionSummary,
  displayTodoTable,
  displayToolCallCard,
  displayToolResultSummary,
} from '../src/core/messaging/ui/index.js';
import { getAdaptiveWidth } from '../src/core/messaging/ui/layout/TerminalLayout.js';
import { colors } from '../src/core/messaging.js';

/**
 * Simple demo script to test component-based UI rendering
 *
 * Creates sample data to showcase all component types
 * and verify visual appearance across different terminal widths.
 */
export async function runComponentDemo(): Promise<void> {
  const width = getAdaptiveWidth();

  console.log(colors.cyan(colors.bold(`\n🎨 Component-Based Terminal UI Demo (${width} chars)\n`)));

  // Test Assistant Message
  console.log(colors.yellow('Testing: Assistant Message'));
  const assistantMsg = displayAssistantMessage(
    "I'll help you implement the todo list functionality. Let me start by reading the current project structure to understand the codebase better."
  );
  console.log(assistantMsg);
  console.log('');
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test Tool Call Card
  console.log(colors.yellow('Testing: Tool Call Card'));
  const toolCallMsg = displayToolCallCard({
    type: 'tool_use',
    id: 'toolu_ls1',
    name: 'LS',
    input: {
      path: '/very/long/path/to/some/directory/that/needs/truncation',
    },
  });
  console.log(toolCallMsg);
  console.log('');
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test Tool Result Summary
  console.log(colors.yellow('Testing: Tool Result Summary'));
  const toolResultMsg = displayToolResultSummary(
    {
      type: 'tool_result',
      tool_use_id: 'toolu_ls1',
      content:
        '- /app/src/\n  - components/\n    - TodoList.tsx\n    - TodoItem.tsx\n  - utils/\n    - helpers.ts\n  - App.tsx\n  - index.ts',
    },
    'LS'
  );
  console.log(toolResultMsg);
  console.log('');
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test Todo Table
  console.log(colors.yellow('Testing: Todo Table'));
  const todoTableMsg = displayTodoTable([
    {
      id: '1',
      content: 'Read existing TodoList component',
      status: 'completed',
      priority: 'high',
    },
    {
      id: '2',
      content: 'Implement new features',
      status: 'in_progress',
      priority: 'high',
    },
    {
      id: '3',
      content: 'Write comprehensive tests',
      status: 'pending',
      priority: 'medium',
    },
  ]);
  console.log(todoTableMsg);
  console.log('');
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test Session Summary
  console.log(colors.yellow('Testing: Session Summary'));
  const sessionMsg = displaySessionSummary({
    type: 'result',
    subtype: 'success',
    duration_ms: 4500,
    duration_api_ms: 3200,
    is_error: false,
    num_turns: 3,
    session_id: 'sess_12345',
    total_cost_usd: 0.012,
    result: 'Successfully analyzed project structure and created implementation plan',
  });
  console.log(sessionMsg);
  console.log('');

  console.log(
    colors.green(colors.bold('\n✅ Demo Complete - Component-based UI rendering successful\n'))
  );
}

/**
 * Quick test function for individual components
 */
export async function testComponentTypes(): Promise<void> {
  console.log(colors.magenta(colors.bold('🧪 Testing Individual Component Types...\n')));

  // Test different component types individually
  const testComponents = [
    {
      name: 'Assistant Message Component',
      test: () =>
        displayAssistantMessage(
          'This is a test message to verify the assistant message component works correctly with proper word wrapping and formatting.'
        ),
    },
    {
      name: 'Tool Call Card Component',
      test: () =>
        displayToolCallCard({
          type: 'tool_use',
          id: 'test_tool',
          name: 'Read',
          input: {
            file_path: '/very/long/path/to/some/file/that/needs/truncation.ts',
            limit: 100,
          },
        }),
    },
    {
      name: 'Todo Table Component',
      test: () =>
        displayTodoTable([
          { id: '1', content: 'Test todo item', status: 'pending', priority: 'high' },
          {
            id: '2',
            content: 'Another test item with longer content',
            status: 'completed',
            priority: 'medium',
          },
        ]),
    },
  ];

  for (const test of testComponents) {
    console.log(colors.yellow(`Testing: ${test.name}`));
    const result = test.test();
    if (result) {
      console.log(result);
    }
    console.log('');
  }
}

/**
 * Run demo if this file is executed directly
 */
if (import.meta.main) {
  console.log(colors.magenta(colors.bold('🎨 Starting Component-Based Terminal UI...\n')));

  await runComponentDemo();

  console.log(`\n${colors.yellow(colors.bold('='.repeat(60)))}\n`);

  await testComponentTypes();
}
