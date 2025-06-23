import { colors } from '../../../messaging.js';
import { getAdaptiveWidth } from '../layout/TerminalLayout.js';
import { smartTruncate } from './BoxComponent.js';

/**
 * Remove ANSI color codes from string for accurate length calculation
 */
function stripAnsiCodes(text: string): string {
  // Use String.fromCharCode to avoid control character warning
  const esc = String.fromCharCode(27); // ESC character
  const ansiRegex = new RegExp(`${esc}\\[[0-9;]*m`, 'g');
  return text.replace(ansiRegex, '');
}

/**
 * Todo item interface for table display
 */
interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

/**
 * Get colored status icon for display
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
      return colors.green('✅');
    case 'in_progress':
      return colors.yellow('🔄');
    case 'pending':
      return colors.gray('⏳');
    default:
      return '❓';
  }
}

/**
 * Get colored priority icon for display
 */
function getPriorityIcon(priority: string): string {
  switch (priority) {
    case 'high':
      return colors.red('🔴');
    case 'medium':
      return colors.yellow('🟡');
    case 'low':
      return colors.green('🟢');
    default:
      return '⚪';
  }
}

/**
 * TodoTable Component - Display todos in a properly formatted table
 *
 * Creates a professional table layout for todo items with proper
 * column alignment and colored status indicators. Never truncated
 * to ensure all todo information is visible.
 */
export function displayTodoTable(todos: TodoItem[]): string {
  const width = getAdaptiveWidth();

  if (!todos || todos.length === 0) {
    const title = '📋 Todo List';
    const content = 'No todos found';
    const contentWidth = width - 4; // Account for borders and padding

    const topBorder = `┌${'─'.repeat(width - 2)}┐`;
    const titleLine = `│ ${title.padEnd(contentWidth)} │`;
    const separator = `├${'─'.repeat(width - 2)}┤`;
    const contentLine = `│ ${content.padEnd(contentWidth)} │`;
    const bottomBorder = `└${'─'.repeat(width - 2)}┘`;

    const box = [topBorder, titleLine, separator, contentLine, bottomBorder].join('\n');
    return colors.yellow(colors.bold(box));
  }

  // Use fixed column widths that fit within the dynamic width constraint
  // Calculate based on content and available space
  const idWidth = 3; // ID column: 3 chars
  const statusWidth = 14; // Status column: 14 chars (icon + text)
  const priorityWidth = 10; // Priority column: 10 chars (icon + text)
  const taskWidth = width - 4 - (idWidth + 2) - (statusWidth + 2) - (priorityWidth + 2) - 3; // Remaining space for task

  // Helper function to create perfectly aligned borders
  const makeBorder = (left: string, cross: string, right: string, line: string) => {
    const idPart = line.repeat(idWidth + 2);
    const taskPart = line.repeat(taskWidth + 2);
    const statusPart = line.repeat(statusWidth + 2);
    const priorityPart = line.repeat(priorityWidth + 2);

    return `${left}${idPart}${cross}${taskPart}${cross}${statusPart}${cross}${priorityPart}${right}`;
  };

  // Helper function to create perfectly aligned content rows
  const makeRow = (id: string, task: string, status: string, priority: string) => {
    const truncatedTask = smartTruncate(task, taskWidth);
    const idCell = ` ${id.padEnd(idWidth)} `;
    const taskCell = ` ${truncatedTask.padEnd(taskWidth)} `;

    // For status and priority, calculate visual length (emojis count as 1 char visually)
    // Remove ANSI color codes for length calculation
    const statusPlain = stripAnsiCodes(status);
    const priorityPlain = stripAnsiCodes(priority);

    // Calculate how many spaces we need to pad to the full column width
    const statusVisualLength = statusPlain.length;
    const priorityVisualLength = priorityPlain.length;

    const statusPadding = Math.max(0, statusWidth - statusVisualLength);
    const priorityPadding = Math.max(0, priorityWidth - priorityVisualLength);

    // Build cells with content + padding spaces
    // Add one extra space to account for cell padding
    const statusCell = ` ${status}${' '.repeat(statusPadding)} `;
    // For priority, right-align the content within the column
    const priorityCell = ` ${' '.repeat(priorityPadding)}${priority} `;

    return `│${idCell}│${taskCell}│${statusCell}│${priorityCell}│`;
  };

  // Create table components
  const topBorder = makeBorder('┌', '┬', '┐', '─');
  const middleBorder = makeBorder('├', '┼', '┤', '─');
  const bottomBorder = makeBorder('└', '┴', '┘', '─');

  // Create header row
  const headerRow = makeRow('ID', 'Task', 'Status', 'Priority');

  // Create data rows
  const dataRows = todos.map((todo) => {
    // Get colored icons for display
    const statusIcon = getStatusIcon(todo.status);
    const priorityIcon = getPriorityIcon(todo.priority);

    // Create display strings (with colors)
    const statusDisplay = `${statusIcon} ${todo.status}`;
    const priorityDisplay = `${priorityIcon} ${todo.priority}`;

    return makeRow(todo.id.toString(), todo.content, statusDisplay, priorityDisplay);
  });

  // Assemble complete table
  const table = [topBorder, headerRow, middleBorder, ...dataRows, bottomBorder].join('\n');

  // Output with cyan color
  return colors.cyan(colors.bold(table));
}

/**
 * Console output version of todo table
 */
export function logTodoTable(todos: TodoItem[]): void {
  console.log(displayTodoTable(todos));
}
