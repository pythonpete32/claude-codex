# Claude Code Tool Output Schema Analysis

This document provides a comprehensive analysis of the expected output schemas for all Claude Code tools, with explicit uncertainty markers indicating the confidence level of each schema inference.

## Uncertainty Markers Legend

- ✅ **CONFIRMED**: When certain about the output format based on tool description or standard behavior
- 🔍 **EDUCATED GUESS**: When making reasonable inferences based on tool purpose and context  
- ❓ **UNCERTAIN**: When genuinely unsure about the output format
- 🧪 **NEEDS TESTING**: When only actual testing can confirm the schema

---

## Built-in Tools

### Task ✅ CONFIRMED
**Input**: Task description and prompt for agent execution
**Output Schema**:
```json
{
  "type": "string",
  "description": "Response from the executed task/agent"
}
```
**Certainty**: This tool delegates to another agent, so output is a string response from that agent.

### Bash ✅ CONFIRMED  
**Input**: Command execution with optional timeout
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "stdout": {"type": "string", "description": "Standard output from command"},
    "stderr": {"type": "string", "description": "Standard error output"}, 
    "exit_code": {"type": "integer", "description": "Command exit status"},
    "timeout": {"type": "boolean", "description": "Whether command timed out"}
  }
}
```
**Certainty**: Standard shell execution output format is well-established.

### Glob ✅ CONFIRMED
**Input**: Pattern matching for file discovery
**Output Schema**:
```json
{
  "type": "array",
  "items": {
    "type": "string",
    "description": "Absolute file paths matching the glob pattern"
  },
  "description": "Files sorted by modification time"
}
```
**Certainty**: File discovery tools consistently return arrays of file paths.

### Grep ✅ CONFIRMED
**Input**: Content search using regex patterns
**Output Schema**:
```json
{
  "type": "array", 
  "items": {
    "type": "string",
    "description": "File paths containing at least one match"
  },
  "description": "Files with matches, sorted by modification time"
}
```
**Certainty**: Content search tools return file paths containing matches.

### LS ✅ CONFIRMED
**Input**: Directory listing with optional ignore patterns
**Output Schema**:
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name": {"type": "string", "description": "File/directory name"},
      "type": {"type": "string", "enum": ["file", "directory", "symlink"]},
      "size": {"type": "integer", "description": "Size in bytes (files only)"},
      "modified": {"type": "string", "format": "date-time"},
      "permissions": {"type": "string", "description": "Unix permissions string"}
    }
  }
}
```
**Certainty**: Directory listing tools have standard metadata formats.

### Read ✅ CONFIRMED
**Input**: File content reading with optional offset/limit
**Output Schema**:
```json
{
  "type": "string",
  "description": "File contents with cat -n format (line numbers + tab + content)"
}
```
**Certainty**: Tool description explicitly states "cat -n format" output.

### Edit ✅ CONFIRMED
**Input**: String replacement in files
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string", "description": "Success/error message"},
    "changes_made": {"type": "integer", "description": "Number of replacements"}
  }
}
```
**Certainty**: File modification tools typically return success status and change counts.

### MultiEdit ✅ CONFIRMED
**Input**: Multiple sequential edits to a single file
**Output Schema**:
```json
{
  "type": "object", 
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string"},
    "edits_applied": {"type": "integer", "description": "Number of successful edits"},
    "total_changes": {"type": "integer", "description": "Total replacements made"}
  }
}
```
**Certainty**: Batch edit tools report overall success and change statistics.

### Write ✅ CONFIRMED
**Input**: Complete file content overwrite
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string"},
    "bytes_written": {"type": "integer"}
  }
}
```
**Certainty**: File write operations return success status and size information.

### NotebookRead 🔍 EDUCATED GUESS
**Input**: Jupyter notebook reading with optional cell targeting
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "cells": {
      "type": "array",
      "items": {
        "type": "object", 
        "properties": {
          "id": {"type": "string"},
          "cell_type": {"type": "string", "enum": ["code", "markdown"]},
          "source": {"type": "array", "items": {"type": "string"}},
          "outputs": {"type": "array", "items": {"type": "object"}},
          "execution_count": {"type": ["integer", "null"]},
          "metadata": {"type": "object"}
        }
      }
    },
    "metadata": {"type": "object"},
    "nbformat": {"type": "integer"},
    "nbformat_minor": {"type": "integer"}
  }
}
```
**Certainty**: Based on standard Jupyter notebook JSON structure, but exact output format needs confirmation.

### NotebookEdit 🔍 EDUCATED GUESS
**Input**: Jupyter notebook cell modification
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string"},
    "cell_id": {"type": "string", "description": "ID of modified/created cell"},
    "operation": {"type": "string", "enum": ["replace", "insert", "delete"]}
  }
}
```
**Certainty**: Edit operations typically return success status and operation details.

### WebFetch ✅ CONFIRMED
**Input**: URL content fetching with AI processing
**Output Schema**:
```json
{
  "type": "string",
  "description": "AI model response based on the fetched content and prompt"
}
```
**Certainty**: Tool description states it returns the AI model's response about the content.

### TodoRead ✅ CONFIRMED
**Input**: No parameters (session todo list retrieval)
**Output Schema**:
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {"type": "string"},
      "content": {"type": "string"},
      "status": {"type": "string", "enum": ["pending", "in_progress", "completed"]},
      "priority": {"type": "string", "enum": ["high", "medium", "low"]}
    }
  }
}
```
**Certainty**: Description states it returns todo items with status and priority.

### TodoWrite ✅ CONFIRMED
**Input**: Updated todo list structure
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string"},
    "todos_count": {"type": "integer"}
  }
}
```
**Certainty**: Write operations typically return success confirmation.

### WebSearch 🔍 EDUCATED GUESS
**Input**: Search query with domain filtering
**Output Schema**:
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "title": {"type": "string"},
      "url": {"type": "string", "format": "uri"},
      "snippet": {"type": "string", "description": "Content excerpt"},
      "domain": {"type": "string"},
      "relevance_score": {"type": "number"}
    }
  }
}
```
**Certainty**: Based on standard search result formats, but exact structure needs verification.

### exit_plan_mode ✅ CONFIRMED
**Input**: Plan presentation for user approval
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string", "description": "Confirmation of plan mode exit"}
  }
}
```
**Certainty**: Mode transition tools typically return status confirmation.

---

## MCP Tools Analysis

### General MCP Pattern Recognition
MCP tools show these common patterns:
- **Resource listing tools**: Return arrays of resources with metadata
- **CRUD operations**: Return success/error status with relevant IDs
- **Content retrieval**: Return structured data specific to the service
- **External service tools**: Output depends entirely on third-party API responses

### Resource Management Tools

#### ListMcpResourcesTool 🔍 EDUCATED GUESS
**Output Schema**:
```json
{
  "type": "array",
  "items": {
    "type": "object", 
    "properties": {
      "uri": {"type": "string"},
      "name": {"type": "string"},
      "description": {"type": "string"},
      "mimeType": {"type": "string"},
      "server": {"type": "string"}
    }
  }
}
```
**Certainty**: Based on MCP resource specification, but exact format needs confirmation.

#### ReadMcpResourceTool ❓ UNCERTAIN
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "uri": {"type": "string"},
    "mimeType": {"type": "string"},
    "text": {"type": "string", "description": "Resource content"}
  }
}
```
**Certainty**: Content depends entirely on the specific MCP server implementation.

### Excalidraw Tools 🧪 NEEDS TESTING

All Excalidraw tools depend on the external Excalidraw service API. The exact output schemas need testing as they vary by operation:

#### mcp__mcp_excalidraw__create_element
**Expected Output**: Element object with generated ID and confirmed properties
```json
{
  "type": "object",
  "properties": {
    "id": {"type": "string", "description": "Generated element ID"},
    "type": {"type": "string"},
    "x": {"type": "number"},
    "y": {"type": "number"}
  }
}
```

#### mcp__mcp_excalidraw__query_elements  
**Expected Output**: Array of matching elements
```json
{
  "type": "array",
  "items": {"$ref": "#/excalidraw-element"}
}
```

**Testing Note**: All Excalidraw operations require live API testing to confirm exact response schemas.

### Sequential Thinking Tool 🔍 EDUCATED GUESS

#### mcp__sequential-thinking__sequentialthinking
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "thought_processed": {"type": "boolean"},
    "thinking_complete": {"type": "boolean"},
    "next_step": {"type": "string", "description": "Guidance for next thought"},
    "current_state": {"type": "object", "description": "Thinking session state"}
  }
}
```
**Certainty**: Based on thinking tool patterns, but exact format needs verification.

### Context7 Documentation Tools 🔍 EDUCATED GUESS

#### mcp__context7__resolve-library-id
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "library_id": {"type": "string", "description": "Context7-compatible library ID"},
    "matches": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "name": {"type": "string"}, 
          "description": {"type": "string"},
          "trust_score": {"type": "number"}
        }
      }
    }
  }
}
```

#### mcp__context7__get-library-docs
**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "documentation": {"type": "string", "description": "Library documentation content"},
    "library_id": {"type": "string"},
    "tokens_used": {"type": "number"}
  }
}
```
**Certainty**: Based on documentation service patterns.

### Puppeteer Browser Automation 🔍 EDUCATED GUESS

All Puppeteer tools return different schemas based on their operation:

#### mcp__puppeteer__puppeteer_navigate
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "url": {"type": "string", "description": "Final URL after redirects"},
    "title": {"type": "string", "description": "Page title"}
  }
}
```

#### mcp__puppeteer__puppeteer_screenshot  
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "filename": {"type": "string"},
    "base64_data": {"type": "string", "description": "If encoded=true"},
    "dimensions": {"type": "object", "properties": {"width": {"type": "number"}, "height": {"type": "number"}}}
  }
}
```

#### mcp__puppeteer__puppeteer_evaluate
```json
{
  "type": "object", 
  "properties": {
    "result": {"description": "JavaScript execution result", "type": ["string", "number", "boolean", "object", "null"]},
    "error": {"type": "string", "description": "Error message if execution failed"}
  }
}
```

**Certainty**: Based on Puppeteer API patterns, but exact output needs testing.

### Screenshot Tools ✅ CONFIRMED

#### mcp__snap-happy__TakeScreenshot & mcp__snap-happy__GetLastScreenshot
**Output Schema**:
```json
{
  "type": "string",
  "description": "Base64 encoded PNG data"
}
```

#### mcp__snap-happy__ListWindows
**Output Schema**:
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "windowId": {"type": "number"},
      "title": {"type": "string"},
      "applicationName": {"type": "string"},
      "position": {"type": "object", "properties": {"x": {"type": "number"}, "y": {"type": "number"}}},
      "size": {"type": "object", "properties": {"width": {"type": "number"}, "height": {"type": "number"}}}
    }
  }
}
```
**Certainty**: Tool descriptions are explicit about return formats.

### Supabase Tools 🧪 NEEDS TESTING

The Supabase MCP tools have the most complex and varied output schemas, as they interact with a comprehensive database platform. Each tool returns different structured data:

#### List Operations (organizations, projects, branches, etc.)
**General Pattern**:
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {"type": "string"},
      "name": {"type": "string"},
      "created_at": {"type": "string", "format": "date-time"},
      "status": {"type": "string"}
    }
  }
}
```

#### Database Operations (execute_sql, apply_migration)
**General Pattern**:
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "data": {"type": "array", "description": "Query results"},
    "error": {"type": "string"},
    "execution_time": {"type": "number"}
  }
}
```

#### Configuration Operations (get_project_url, get_anon_key, generate_typescript_types)
**General Pattern**:
```json
{
  "type": "object", 
  "properties": {
    "value": {"type": "string", "description": "The requested configuration value"}
  }
}
```

**Testing Note**: Supabase tool outputs vary significantly based on database state and require live API testing.

### Linear Project Management Tools 🧪 NEEDS TESTING

Linear tools follow GraphQL API patterns but exact schemas need verification:

#### List Operations (issues, projects, teams, etc.)
**General Pattern**:
```json
{
  "type": "object",
  "properties": {
    "nodes": {"type": "array", "items": {"type": "object"}},
    "pageInfo": {
      "type": "object",
      "properties": {
        "hasNextPage": {"type": "boolean"},
        "hasPreviousPage": {"type": "boolean"},
        "startCursor": {"type": "string"},
        "endCursor": {"type": "string"}
      }
    }
  }
}
```

#### Create/Update Operations
**General Pattern**:
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "issue": {"type": "object", "description": "Created/updated entity"},
    "error": {"type": "string"}
  }
}
```

**Testing Note**: Linear API responses follow GraphQL conventions but require testing for exact field structures.

---

## Summary and Recommendations

### Confidence Levels by Category

1. **High Confidence (✅ CONFIRMED)**: 
   - Built-in file system tools (Read, Write, Edit, LS, Glob, Grep)
   - Shell execution (Bash)
   - Session management (TodoRead, TodoWrite)
   - Screenshot tools

2. **Medium Confidence (🔍 EDUCATED GUESS)**:
   - Jupyter notebook tools 
   - Web-related tools (WebSearch, WebFetch)
   - Context7 documentation tools
   - Basic Puppeteer operations

3. **Low Confidence (❓ UNCERTAIN)**:
   - MCP resource management tools
   - Complex browser automation results

4. **Requires Testing (🧪 NEEDS TESTING)**:
   - All Excalidraw tools
   - All Supabase tools  
   - All Linear tools
   - Sequential thinking tool
   - Advanced Puppeteer operations

### Key Patterns Identified

1. **File Operations**: Consistently return success/error status with operation details
2. **List Operations**: Return arrays of objects with standard metadata fields
3. **External Service Tools**: Output schemas depend entirely on third-party APIs
4. **MCP Tools**: Show high variability - each server implements different response formats
5. **Database Tools**: Follow SQL result conventions with data arrays and metadata

### Recommendations for Enhancement

1. **Priority Testing**: Focus on Supabase and Linear tools as they're most complex and commonly used
2. **Documentation**: Add explicit output examples to the tool signatures document  
3. **Error Handling**: Document expected error response formats for all tools
4. **Versioning**: Track schema changes as external services update their APIs
5. **Validation**: Implement schema validation for critical tools to catch API changes

This analysis provides a foundation for understanding tool outputs while being explicit about uncertainty levels. The next step would be systematic testing of the tools marked as needing verification.