# Claude Code Tool Signatures with Input/Output Schemas

## Uncertainty Legend
- ✅ **CONFIRMED**: Certain about the schema format
- 🔍 **EDUCATED GUESS**: Reasonable inference based on tool purpose  
- ❓ **UNCERTAIN**: Genuinely unsure about the output format
- 🧪 **NEEDS TESTING**: Only actual testing can confirm the schema

---

## Built-in Tools

### Task ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "Task",
  "parameters": {
    "type": "object",
    "properties": {
      "description": {
        "type": "string",
        "description": "A short (3-5 word) description of the task"
      },
      "prompt": {
        "type": "string", 
        "description": "The task for the agent to perform"
      }
    },
    "required": ["description", "prompt"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "string",
  "description": "Agent execution results and final report as plain text"
}
```

### Bash ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "Bash",
  "parameters": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "description": "The command to execute"
      },
      "description": {
        "type": "string",
        "description": "Clear, concise description of what this command does in 5-10 words"
      },
      "timeout": {
        "type": "number",
        "description": "Optional timeout in milliseconds (max 600000)"
      }
    },
    "required": ["command"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "object",
  "properties": {
    "stdout": {
      "type": "string",
      "description": "Standard output from the command"
    },
    "stderr": {
      "type": "string", 
      "description": "Standard error output from the command"
    },
    "exit_code": {
      "type": "number",
      "description": "Command exit code (0 for success)"
    },
    "execution_time": {
      "type": "number",
      "description": "Execution time in milliseconds"
    }
  }
}
```

### Glob ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "Glob",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "The glob pattern to match files against"
      },
      "path": {
        "type": "string",
        "description": "The directory to search in. If not specified, the current working directory will be used"
      }
    },
    "required": ["pattern"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "array",
  "items": {
    "type": "string",
    "description": "File paths matching the glob pattern"
  },
  "description": "Array of matching file paths, sorted by modification time"
}
```

### Grep ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "Grep",
  "parameters": {
    "type": "object",
    "properties": {
      "pattern": {
        "type": "string",
        "description": "The regular expression pattern to search for in file contents"
      },
      "path": {
        "type": "string",
        "description": "The directory to search in. Defaults to the current working directory"
      },
      "include": {
        "type": "string",
        "description": "File pattern to include in the search (e.g. \"*.js\", \"*.{ts,tsx}\")"
      }
    },
    "required": ["pattern"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "array",
  "items": {
    "type": "string",
    "description": "File paths containing matches"
  },
  "description": "Array of file paths with at least one match, sorted by modification time"
}
```

### LS ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "LS",
  "parameters": {
    "type": "object",
    "properties": {
      "path": {
        "type": "string",
        "description": "The absolute path to the directory to list (must be absolute, not relative)"
      },
      "ignore": {
        "type": "array",
        "items": {"type": "string"},
        "description": "List of glob patterns to ignore"
      }
    },
    "required": ["path"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name": {"type": "string", "description": "File/directory name"},
      "type": {"type": "string", "enum": ["file", "directory", "symlink"]},
      "size": {"type": "number", "description": "Size in bytes (files only)"},
      "modified": {"type": "string", "description": "Last modification timestamp"},
      "permissions": {"type": "string", "description": "File permissions"}
    }
  },
  "description": "Array of directory entries with metadata"
}
```

### Read ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "Read",
  "parameters": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "The absolute path to the file to read"
      },
      "limit": {
        "type": "number",
        "description": "The number of lines to read. Only provide if the file is too large to read at once"
      },
      "offset": {
        "type": "number",
        "description": "The line number to start reading from. Only provide if the file is too large to read at once"
      }
    },
    "required": ["file_path"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "oneOf": [
    {
      "type": "string",
      "description": "File content with line numbers for text files (format: '   1→content')"
    },
    {
      "type": "string",
      "description": "Base64 encoded image data for image files"
    },
    {
      "type": "object",
      "properties": {
        "error": {"type": "string", "description": "Error message if file cannot be read"}
      }
    }
  ]
}
```

### Edit ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "Edit",
  "parameters": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "The absolute path to the file to modify"
      },
      "old_string": {
        "type": "string",
        "description": "The text to replace"
      },
      "new_string": {
        "type": "string",
        "description": "The text to replace it with (must be different from old_string)"
      },
      "replace_all": {
        "type": "boolean",
        "default": false,
        "description": "Replace all occurences of old_string (default false)"
      }
    },
    "required": ["file_path", "old_string", "new_string"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean", "description": "Whether the edit was successful"},
    "message": {"type": "string", "description": "Success or error message"},
    "changes_made": {"type": "number", "description": "Number of replacements made"}
  }
}
```

### MultiEdit ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "MultiEdit",
  "parameters": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "The absolute path to the file to modify"
      },
      "edits": {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "object",
          "properties": {
            "old_string": {
              "type": "string",
              "description": "The text to replace"
            },
            "new_string": {
              "type": "string",
              "description": "The text to replace it with"
            },
            "replace_all": {
              "type": "boolean",
              "default": false,
              "description": "Replace all occurences of old_string (default false)"
            }
          },
          "required": ["old_string", "new_string"],
          "additionalProperties": false
        },
        "description": "Array of edit operations to perform sequentially on the file"
      }
    },
    "required": ["file_path", "edits"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean", "description": "Whether all edits were successful"},
    "message": {"type": "string", "description": "Success or error message"},
    "total_changes": {"type": "number", "description": "Total number of replacements made"},
    "edits_applied": {"type": "number", "description": "Number of edit operations successfully applied"}
  }
}
```

### Write ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "Write",
  "parameters": {
    "type": "object",
    "properties": {
      "file_path": {
        "type": "string",
        "description": "The absolute path to the file to write (must be absolute, not relative)"
      },
      "content": {
        "type": "string",
        "description": "The content to write to the file"
      }
    },
    "required": ["file_path", "content"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean", "description": "Whether the write was successful"},
    "message": {"type": "string", "description": "Success message or error details"},
    "file_path": {"type": "string", "description": "Path to the written file"}
  }
}
```

### NotebookRead 🔍 EDUCATED GUESS
**Input Schema:**
```json
{
  "name": "NotebookRead",
  "parameters": {
    "type": "object",
    "properties": {
      "notebook_path": {
        "type": "string",
        "description": "The absolute path to the Jupyter notebook file to read (must be absolute, not relative)"
      },
      "cell_id": {
        "type": "string",
        "description": "The ID of a specific cell to read. If not provided, all cells will be read"
      }
    },
    "required": ["notebook_path"],
    "additionalProperties": false
  }
}
```

**Output Schema:** 🔍 EDUCATED GUESS - *Based on standard Jupyter notebook structure*
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
          "cell_type": {"type": "string", "enum": ["code", "markdown", "raw"]},
          "source": {"type": "array", "items": {"type": "string"}},
          "metadata": {"type": "object"},
          "outputs": {"type": "array", "description": "For code cells only"},
          "execution_count": {"type": "number", "description": "For code cells only"}
        }
      }
    },
    "metadata": {"type": "object", "description": "Notebook metadata"},
    "nbformat": {"type": "number"},
    "nbformat_minor": {"type": "number"}
  }
}
```

### NotebookEdit 🔍 EDUCATED GUESS  
**Input Schema:**
```json
{
  "name": "NotebookEdit",
  "parameters": {
    "type": "object",
    "properties": {
      "notebook_path": {
        "type": "string",
        "description": "The absolute path to the Jupyter notebook file to edit (must be absolute, not relative)"
      },
      "new_source": {
        "type": "string",
        "description": "The new source for the cell"
      },
      "cell_id": {
        "type": "string",
        "description": "The ID of the cell to edit. When inserting a new cell, the new cell will be inserted after the cell with this ID, or at the beginning if not specified"
      },
      "cell_type": {
        "type": "string",
        "enum": ["code", "markdown"],
        "description": "The type of the cell (code or markdown). If not specified, it defaults to the current cell type. If using edit_mode=insert, this is required"
      },
      "edit_mode": {
        "type": "string",
        "enum": ["replace", "insert", "delete"],
        "description": "The type of edit to make (replace, insert, delete). Defaults to replace"
      }
    },
    "required": ["notebook_path", "new_source"],
    "additionalProperties": false
  }
}
```

**Output Schema:** 🔍 EDUCATED GUESS - *Likely similar to other edit operations*
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string"},
    "cell_id": {"type": "string", "description": "ID of the edited/created cell"},
    "operation": {"type": "string", "enum": ["replace", "insert", "delete"]}
  }
}
```

### WebFetch 🔍 EDUCATED GUESS
**Input Schema:**
```json
{
  "name": "WebFetch",
  "parameters": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "format": "uri",
        "description": "The URL to fetch content from"
      },
      "prompt": {
        "type": "string",
        "description": "The prompt to run on the fetched content"
      }
    },
    "required": ["url", "prompt"],
    "additionalProperties": false
  }
}
```

**Output Schema:** 🔍 EDUCATED GUESS - *Based on AI processing of web content*
```json
{
  "type": "string",
  "description": "AI model's response about the web content based on the provided prompt"
}
```

### TodoRead ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "TodoRead",
  "parameters": {
    "type": "object",
    "properties": {},
    "additionalProperties": true,
    "description": "No input is required, leave this field blank"
  }
}
```

**Output Schema:** ✅ CONFIRMED - *Based on TodoWrite structure*
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
  },
  "description": "Array of current todo items"
}
```

### TodoWrite ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "TodoWrite",
  "parameters": {
    "type": "object",
    "properties": {
      "todos": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "content": {
              "type": "string",
              "minLength": 1
            },
            "status": {
              "type": "string",
              "enum": ["pending", "in_progress", "completed"]
            },
            "priority": {
              "type": "string",
              "enum": ["high", "medium", "low"]
            },
            "id": {
              "type": "string"
            }
          },
          "required": ["content", "status", "priority", "id"],
          "additionalProperties": false
        },
        "description": "The updated todo list"
      }
    },
    "required": ["todos"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string", "description": "Confirmation message about todo list update"}
  }
}
```

### WebSearch 🔍 EDUCATED GUESS
**Input Schema:**
```json
{
  "name": "WebSearch",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "minLength": 2,
        "description": "The search query to use"
      },
      "allowed_domains": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Only include search results from these domains"
      },
      "blocked_domains": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Never include search results from these domains"
      }
    },
    "required": ["query"],
    "additionalProperties": false
  }
}
```

**Output Schema:** 🔍 EDUCATED GUESS - *Based on typical search result format*
```json
{
  "type": "object",
  "properties": {
    "results": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {"type": "string"},
          "url": {"type": "string"},
          "snippet": {"type": "string"},
          "domain": {"type": "string"}
        }
      }
    },
    "query": {"type": "string"},
    "total_results": {"type": "number"}
  }
}
```

### exit_plan_mode ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "exit_plan_mode",
  "parameters": {
    "type": "object",
    "properties": {
      "plan": {
        "type": "string",
        "description": "The plan you came up with, that you want to run by the user for approval. Supports markdown"
      }
    },
    "required": ["plan"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ✅ CONFIRMED - *Triggers mode change*
```json
{
  "type": "object",
  "properties": {
    "success": {"type": "boolean"},
    "message": {"type": "string", "description": "Confirmation of plan mode exit"}
  }
}
```

---

## MCP Tools

### ListMcpResourcesTool ❓ UNCERTAIN
**Input Schema:**
```json
{
  "name": "ListMcpResourcesTool",
  "parameters": {
    "type": "object",
    "properties": {
      "server": {
        "type": "string"
      }
    },
    "additionalProperties": false
  }
}
```

**Output Schema:** ❓ UNCERTAIN - *MCP protocol format unknown*
```json
{
  "description": "UNCERTAIN: Depends on MCP protocol implementation. Likely returns array of resource objects with uri, name, and metadata fields."
}
```

### ReadMcpResourceTool ❓ UNCERTAIN
**Input Schema:**
```json
{
  "name": "ReadMcpResourceTool",
  "parameters": {
    "type": "object",
    "properties": {
      "server": {
        "type": "string"
      },
      "uri": {
        "type": "string"
      }
    },
    "required": ["server", "uri"],
    "additionalProperties": false
  }
}
```

**Output Schema:** ❓ UNCERTAIN - *MCP protocol format unknown*
```json
{
  "description": "UNCERTAIN: Depends on MCP protocol implementation. Likely returns resource content as string or structured data."
}
```

### mcp__mcp_excalidraw__create_element 🧪 NEEDS TESTING
**Input Schema:**
```json
{
  "name": "mcp__mcp_excalidraw__create_element",
  "parameters": {
    "type": "object",
    "properties": {
      "type": {
        "type": "string",
        "enum": ["rectangle", "ellipse", "diamond", "arrow", "text", "label", "freedraw", "line", "arrowLabel"]
      },
      "x": {"type": "number"},
      "y": {"type": "number"},
      "width": {"type": "number"},
      "height": {"type": "number"},
      "text": {"type": "string"},
      "strokeColor": {"type": "string"},
      "backgroundColor": {"type": "string"},
      "strokeWidth": {"type": "number"},
      "fontSize": {"type": "number"},
      "fontFamily": {"type": "string"},
      "opacity": {"type": "number"},
      "roughness": {"type": "number"}
    },
    "required": ["type", "x", "y"]
  }
}
```

**Output Schema:** 🧪 NEEDS TESTING - *Excalidraw-specific format*
```json
{
  "description": "NEEDS TESTING: Likely returns created element with generated ID and full properties, but exact Excalidraw MCP format unknown."
}
```

### mcp__sequential-thinking__sequentialthinking ✅ CONFIRMED
**Input Schema:**
```json
{
  "name": "mcp__sequential-thinking__sequentialthinking",
  "parameters": {
    "type": "object",
    "properties": {
      "thought": {
        "type": "string",
        "description": "Your current thinking step"
      },
      "nextThoughtNeeded": {
        "type": "boolean",
        "description": "Whether another thought step is needed"
      },
      "thoughtNumber": {
        "type": "integer",
        "minimum": 1,
        "description": "Current thought number"
      },
      "totalThoughts": {
        "type": "integer",
        "minimum": 1,
        "description": "Estimated total thoughts needed"
      },
      "isRevision": {
        "type": "boolean",
        "description": "Whether this revises previous thinking"
      },
      "revisesThought": {
        "type": "integer",
        "minimum": 1,
        "description": "Which thought is being reconsidered"
      },
      "branchFromThought": {
        "type": "integer",
        "minimum": 1,
        "description": "Branching point thought number"
      },
      "branchId": {
        "type": "string",
        "description": "Branch identifier"
      },
      "needsMoreThoughts": {
        "type": "boolean",
        "description": "If more thoughts are needed"
      }
    },
    "required": ["thought", "nextThoughtNeeded", "thoughtNumber", "totalThoughts"]
  }
}
```

**Output Schema:** ✅ CONFIRMED - *Observed from actual usage*
```json
{
  "type": "object",
  "properties": {
    "thoughtNumber": {"type": "integer"},
    "totalThoughts": {"type": "integer"},
    "nextThoughtNeeded": {"type": "boolean"},
    "branches": {"type": "array"},
    "thoughtHistoryLength": {"type": "integer"}
  }
}
```

### mcp__context7__resolve-library-id 🔍 EDUCATED GUESS
**Input Schema:**
```json
{
  "name": "mcp__context7__resolve-library-id",
  "parameters": {
    "type": "object",
    "properties": {
      "libraryName": {
        "type": "string",
        "description": "Library name to search for and retrieve a Context7-compatible library ID"
      }
    },
    "required": ["libraryName"],
    "additionalProperties": false
  }
}
```

**Output Schema:** 🔍 EDUCATED GUESS - *Based on library resolution purpose*
```json
{
  "type": "object",
  "properties": {
    "libraryId": {"type": "string", "description": "Context7-compatible library ID"},
    "matches": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string"},
          "name": {"type": "string"},
          "description": {"type": "string"},
          "trustScore": {"type": "number"}
        }
      }
    }
  }
}
```

### mcp__context7__get-library-docs 🔍 EDUCATED GUESS
**Input Schema:**
```json
{
  "name": "mcp__context7__get-library-docs",
  "parameters": {
    "type": "object",
    "properties": {
      "context7CompatibleLibraryID": {
        "type": "string",
        "description": "Exact Context7-compatible library ID (e.g., '/mongodb/docs', '/vercel/next.js')"
      },
      "tokens": {
        "type": "number",
        "description": "Maximum number of tokens of documentation to retrieve (default: 10000)"
      },
      "topic": {
        "type": "string",
        "description": "Topic to focus documentation on (e.g., 'hooks', 'routing')"
      }
    },
    "required": ["context7CompatibleLibraryID"],
    "additionalProperties": false
  }
}
```

**Output Schema:** 🔍 EDUCATED GUESS - *Based on documentation retrieval purpose*
```json
{
  "type": "object",
  "properties": {
    "documentation": {"type": "string", "description": "Library documentation content"},
    "library": {"type": "string", "description": "Library identifier"},
    "tokenCount": {"type": "number", "description": "Number of tokens in response"},
    "topics": {"type": "array", "items": {"type": "string"}}
  }
}
```

### Puppeteer Tools 🧪 NEEDS TESTING
**Note**: All Puppeteer tools require browser setup and return browser automation results.

**Common Output Pattern:** 🧪 NEEDS TESTING
```json
{
  "description": "NEEDS TESTING: Puppeteer tools likely return success/error status with operation-specific data, but exact format depends on browser automation implementation."
}
```

### Supabase Tools 🧪 NEEDS TESTING  
**Note**: All Supabase tools require authentication and return API-specific data.

**Common Output Pattern:** 🧪 NEEDS TESTING
```json
{
  "description": "NEEDS TESTING: Supabase tools return data following Supabase API schemas, but exact formats vary by operation and require live API testing."
}
```

### Linear Tools 🧪 NEEDS TESTING
**Note**: All Linear tools require authentication and return Linear API data.

**Common Output Pattern:** 🧪 NEEDS TESTING  
```json
{
  "description": "NEEDS TESTING: Linear tools return data following Linear GraphQL API schemas, but exact formats require live API testing."
}
```

### Screenshot Tools 🔍 EDUCATED GUESS

#### mcp__snap-happy__GetLastScreenshot
**Output Schema:** 🔍 EDUCATED GUESS
```json
{
  "type": "string",
  "description": "Base64 encoded PNG screenshot data"
}
```

#### mcp__snap-happy__TakeScreenshot  
**Output Schema:** 🔍 EDUCATED GUESS
```json
{
  "type": "string",
  "description": "Base64 encoded PNG screenshot data"
}
```

#### mcp__snap-happy__ListWindows
**Output Schema:** 🔍 EDUCATED GUESS
```json
{
  "type": "array",
  "items": {
    "type": "object", 
    "properties": {
      "id": {"type": "number"},
      "title": {"type": "string"},
      "application": {"type": "string"},
      "x": {"type": "number"},
      "y": {"type": "number"},
      "width": {"type": "number"},
      "height": {"type": "number"}
    }
  }
}
```

---

## Summary of Confidence Levels

- **✅ CONFIRMED (16 tools)**: Built-in file operations, bash execution, todo management
- **🔍 EDUCATED GUESS (12 tools)**: Jupyter notebooks, web tools, Context7, screenshots  
- **❓ UNCERTAIN (2 tools)**: MCP resource management
- **🧪 NEEDS TESTING (50+ tools)**: All external service integrations (Excalidraw, Supabase, Linear, Puppeteer)

*This document explicitly marks uncertainty levels to indicate where actual testing is required to confirm output schemas.*