/**
 * Generate emoji-based metrics for tool results
 *
 * Provides visual summaries for different tool types to help users
 * quickly understand the outcome of tool operations.
 */
export function generateResultMetrics(content: string, toolName?: string): string | null {
  // Generate metrics based on tool type and content
  const metrics: string[] = [];

  if (toolName === 'LS') {
    const lines = content.split('\n').filter((line) => line.trim());
    const files = lines.filter((line) => !line.includes('/')).length;
    const dirs = lines.filter((line) => line.includes('/')).length;
    metrics.push(`📁 ${dirs} dirs`, `📄 ${files} files`);
  } else if (toolName === 'Read') {
    const lines = content.split('\n').length;
    const chars = content.length;
    metrics.push(`📏 ${lines} lines`, `🔤 ${chars} chars`);
  } else if (toolName?.includes('Edit')) {
    metrics.push('✅ File modified');
  } else if (toolName === 'Bash') {
    const lines = content.split('\n').length;
    metrics.push(`📤 ${lines} output lines`);
  } else if (toolName?.includes('Todo')) {
    // Try to parse todo count from content
    const todoMatch = content.match(/(\d+)\s+(?:todo|task|item)/i);
    if (todoMatch) {
      metrics.push(`📋 ${todoMatch[1]} items`);
    }
  }

  return metrics.length > 0 ? metrics.join(' • ') : null;
}

/**
 * Get emoji icon for tool types
 */
export function getToolIcon(toolName: string): string {
  const icons: Record<string, string> = {
    TodoWrite: '📋',
    TodoRead: '📋',
    Read: '📖',
    Write: '✍️',
    Edit: '✏️',
    MultiEdit: '✏️',
    LS: '📁',
    Glob: '🔍',
    Grep: '🔍',
    Bash: '💻',
    Task: '⚙️',
    WebFetch: '🌐',
    WebSearch: '🔍',
    NotebookRead: '📓',
    NotebookEdit: '📓',
  };
  return icons[toolName] || '🔧';
}
