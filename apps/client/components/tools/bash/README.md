# BashTool Component

This component displays bash command execution results using the parser-generated props from `@claude-codex/types`.

## Props

The component accepts `BashToolProps` from the parser, which extends `CommandToolProps` and includes:

### From BaseToolProps
- `id`: Tool use ID for API correlation
- `uuid`: Internal correlation ID
- `parentUuid`: Links to parent call for nested operations
- `timestamp`: ISO timestamp
- `duration`: Execution time in milliseconds
- `status`: Harmonized status object with `normalized` and `original` values
- `className`: Optional CSS classes
- `metadata`: Optional metadata object

### From CommandToolProps
- `command`: The command executed
- `output`: Combined stdout/stderr
- `errorOutput`: Separate error output if needed
- `exitCode`: Command exit code
- `workingDirectory`: Execution context
- `environment`: Environment variables
- `interrupted`: Whether execution was interrupted
- `showCopyButton`: Show copy button (default: true)
- `onCopy`: Copy callback
- `onRerun`: Rerun callback

### From BashToolProps
- `elevated`: Whether sudo was used
- `showPrompt`: Show prompt (default: true)
- `promptText`: Custom prompt text

### UI-specific
- `animated`: Enable animations (default: true)
- `description`: Optional description text

## Key Changes from Original

1. **Status Handling**: Now uses the harmonized `ToolStatus` object with `normalized` and `original` values
2. **Error Display**: Properly handles `errorOutput` and `exitCode` for better error visualization
3. **Metadata Support**: Displays execution ID and other metadata when available
4. **Working Directory**: Shows working directory when different from default
5. **Exit Code Badge**: Shows exit code when non-zero
6. **Timestamp Formatting**: Properly formats ISO timestamps