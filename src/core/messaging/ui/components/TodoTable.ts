import { colors } from '../../../messaging.js';

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
 * Get clean status icon without colors for width calculation
 */
function getStatusIconClean(status: string): string {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in_progress':
      return '🔄';
    case 'pending':
      return '⏳';
    default:
      return '❓';
  }
}

/**
 * Get clean priority icon without colors for width calculation
 */
function getPriorityIconClean(priority: string): string {
  switch (priority) {
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🟢';
    default:
      return '⚪';
  }
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
  if (!todos || todos.length === 0) {
    const boxContent = [
      '┌─ 📋 Todo List ─────────────────────────────────────────┐',
      '│ No todos found                                         │',
      '└───────────────────────────────────────────────────────┘',
    ].join('\n');
    return colors.yellow(colors.bold(boxContent));
  }

  // Calculate exact visual widths (emojis count as 1 char visually)
  const idWidth = Math.max(2, ...todos.map((t) => t.id.toString().length));
  const taskWidth = Math.max(4, ...todos.map((t) => t.content.length));

  // For status and priority, calculate based on actual display text without color codes
  const statusTexts = todos.map((t) => `${getStatusIconClean(t.status)} ${t.status}`);
  const priorityTexts = todos.map((t) => `${getPriorityIconClean(t.priority)} ${t.priority}`);
  const statusWidth = Math.max(6, ...statusTexts.map((s) => s.length));
  const priorityWidth = Math.max(8, ...priorityTexts.map((p) => p.length));

  // Helper function to create perfectly aligned borders
  const makeBorder = (left: string, cross: string, right: string, line: string) => {
    const idPart = line.repeat(idWidth + 2); // +2 for spaces around content
    const taskPart = line.repeat(taskWidth + 2);
    const statusPart = line.repeat(statusWidth + 2);
    const priorityPart = line.repeat(priorityWidth + 2);

    return `${left}${idPart}${cross}${taskPart}${cross}${statusPart}${cross}${priorityPart}${right}`;
  };

  // Helper function to create perfectly aligned content rows
  const makeRow = (id: string, task: string, status: string, priority: string) => {
    const idCell = ` ${id.padEnd(idWidth)} `;
    const taskCell = ` ${task.padEnd(taskWidth)} `;
    const statusCell = ` ${status.padEnd(statusWidth)} `;
    const priorityCell = ` ${priority.padEnd(priorityWidth)} `;

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
