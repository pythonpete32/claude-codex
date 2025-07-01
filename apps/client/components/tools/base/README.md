# Base Tool Component Architecture

This base component extracts all the common patterns found across our tool components, providing:

## Benefits

1. **Reduced Code Duplication**: ~70% less code in each tool component
2. **Consistent Status Handling**: All tools handle pending/running/failed states identically
3. **Shared Utilities**: Common helpers like `formatFileSize`, `getFileName` available to all
4. **Flexible Customization**: Tools can override any part or use `customRender` for unique UIs
5. **Type Safety**: Full TypeScript support with proper prop inheritance

## Usage Patterns

### Simple Tool (Using Functional Pattern)
```tsx
export const ReadTool = createToolComponent<ReadToolUIProps>((props) => ({
  renderCommand: () => `cat ${props.filePath}`,
  renderCommandName: () => "cat",
  renderOutput: () => <div>{props.content}</div>,
  renderFooter: () => <span>{props.filePath}</span>,
  shouldFold: () => props.totalLines > 50,
  maxHeight: "500px",
}))
```

### Using the Foldable Flag
```tsx
// Force foldable on
<ReadTool {...props} foldable={true} />

// Force foldable off  
<ReadTool {...props} foldable={false} />

// Use automatic logic (based on content size)
<ReadTool {...props} />

// Control default folded state
<ReadTool {...props} foldable={true} defaultFolded={true} />
```

### Complex Tool (Using Class Pattern)
```tsx
export class BashTool extends BaseTool<BashToolUIProps> {
  protected getRenderProps() {
    return {
      customRender: () => this.renderCustomUI(),
      // ... other props
    }
  }
  
  private renderCustomUI() {
    // Completely custom rendering
  }
}
```

## Common Patterns Extracted

1. **Status States**: Automatic handling of pending, running, failed, completed
2. **Terminal Window Integration**: Standard props passed to TerminalWindow
3. **Footer with Timestamps**: Consistent footer rendering with Clock icon
4. **Error Handling**: Centralized error message display
5. **Collapsible Logic**: Based on content size thresholds
6. **Copy Button**: Standard implementation across tools

## Migration Guide

To migrate an existing tool:

1. Extend props from base parser props + UI props
2. Use `createToolComponent` for functional approach
3. Return render props object with:
   - `renderCommand()` - The command to display
   - `renderCommandName()` - Short command name
   - `renderOutput()` - Main content
   - `renderFooter()` - Footer content
   - Optional: Override messages, folding logic, etc.

## Tool Categories

- **File Tools** (Read, Write, Edit): Use file path utilities
- **Search Tools** (Grep, Glob, LS): Handle results arrays
- **Command Tools** (Bash, MultiEdit): Show command execution
- **MCP Tools**: Can use customRender for unique UIs