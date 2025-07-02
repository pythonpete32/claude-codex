# API Server Manual Testing Guide

This document provides step-by-step instructions for manually testing the Claude Codex API server integration with the parser system.

## Prerequisites

- Ensure you have `curl` and `jq` installed
- The API server should be running on port 3001
- You need Claude Code log files in `~/.claude/projects/`

## Starting the API Server

```bash
# From the repository root
bun dev

# Expected output:
# 🚀 Claude Conversation Log API server running at http://localhost:3001
# 📚 API documentation available at http://localhost:3001/api/swagger
# 💡 Health check: http://localhost:3001/api/health
```

## Quick Start Commands

```bash
# 1. Check server health
curl -s http://localhost:3001/api/health | jq -r '.status'
# Expected: "healthy"

# 2. Get first session ID
SESSION_ID=$(curl -s http://localhost:3001/api/sessions | jq -r '.sessions[0].id')
echo "Session ID: $SESSION_ID"
# Expected: A UUID like "20304939-a518-4a36-af19-71055997e2ef" or "null"

# 3. If session exists, check parsed props
if [ "$SESSION_ID" != "null" ]; then
  curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=20" | \
    jq -r '.history[] | select(.parsedProps) | "\(.parsedProps.toolType) - \(.parsedProps.props.status.normalized)"' | \
    head -5
fi
# Expected output like:
# Bash - completed
# Write - completed
# Read - completed
# mcp__sequential-thinking__sequentialthinking - completed
```

## Test Cases

### 1. Health Check

**Command:**
```bash
curl -s http://localhost:3001/api/health | jq '.'
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00.000Z",
  "version": "0.1.0",
  "uptime": 123.456
}
```

**Quick Test:**
```bash
curl -s http://localhost:3001/api/health | jq -r '.status'
# Expected output: healthy
```

### 2. List All Sessions

**Command:**
```bash
curl -s http://localhost:3001/api/sessions | jq '.'
```

**Expected Response:**
```json
{
  "sessions": [
    {
      "id": "20304939-a518-4a36-af19-71055997e2ef",
      "projectPath": "/Users/abuusama/Desktop/temp/test-data",
      "lastActivity": "2025-06-30T12:41:34.966Z",
      "messageCount": 207,
      "hasToolUsage": true,
      "isActive": false,
      "createdAt": "2025-06-30T08:16:49.027Z",
      "fileSize": 1048576
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**Quick Tests:**
```bash
# Count sessions
curl -s http://localhost:3001/api/sessions | jq '.sessions | length'
# Expected: A number >= 0

# Get first session ID if any exist
curl -s http://localhost:3001/api/sessions | jq -r '.sessions[0].id // "No sessions found"'
# Expected: UUID like "20304939-a518-4a36-af19-71055997e2ef" or "No sessions found"

# Check sessions with tool usage
curl -s http://localhost:3001/api/sessions | jq '.sessions[] | select(.hasToolUsage) | .id'
# Expected: List of session IDs that contain tool usage
```

### 3. Get Specific Session

**Commands:**
```bash
# First, get a session ID from the list
SESSION_ID=$(curl -s http://localhost:3001/api/sessions | jq -r '.sessions[0].id')

# Then fetch its details
curl -s http://localhost:3001/api/sessions/$SESSION_ID | jq '.'
```

**Expected Response:**
```json
{
  "id": "20304939-a518-4a36-af19-71055997e2ef",
  "projectPath": "/Users/abuusama/Desktop/temp/test-data",
  "lastActivity": "2025-06-30T12:41:34.966Z",
  "messageCount": 207,
  "hasToolUsage": true,
  "isActive": false,
  "createdAt": "2025-06-30T08:16:49.027Z",
  "fileSize": 1048576
}
```

**Error Cases:**
```bash
# Invalid UUID format
curl -s http://localhost:3001/api/sessions/invalid-uuid | jq '.'
# Expected: {"error": "INVALID_SESSION_ID", "message": "Session ID must be a valid UUID"}

# Non-existent session
curl -s http://localhost:3001/api/sessions/00000000-0000-0000-0000-000000000000 | jq '.'
# Expected: {"error": "SESSION_NOT_FOUND", "message": "Session 00000000-0000-0000-0000-000000000000 not found"}
```

### 4. Get Session History (Raw)

**Command:**
```bash
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?limit=5" | jq '.'
```

**Expected Response Structure:**
```json
{
  "history": [
    {
      "uuid": "43b9d9bf-955c-4425-bdf9-0f6558aa5cb2",
      "parentUuid": null,
      "sessionId": "20304939-a518-4a36-af19-71055997e2ef",
      "timestamp": "2025-06-30T08:18:27.722Z",
      "type": "user",
      "content": "Write a hello world file",
      "isSidechain": false
    },
    {
      "uuid": "3ce3aa9a-01a5-4632-9a3b-f28a99d0d32b",
      "parentUuid": "43b9d9bf-955c-4425-bdf9-0f6558aa5cb2",
      "sessionId": "20304939-a518-4a36-af19-71055997e2ef",
      "timestamp": "2025-06-30T12:38:46.653Z",
      "type": "assistant",
      "content": {
        "type": "tool_use",
        "id": "toolu_01N7WzjTsz1YoYCdPqfBAmgR",
        "name": "mcp__sequential-thinking__sequentialthinking",
        "input": {
          "thought": "Starting to think...",
          "nextThoughtNeeded": true,
          "thoughtNumber": 1,
          "totalThoughts": 3
        }
      },
      "isSidechain": false
    }
  ],
  "pagination": {
    "total": 207,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  },
  "session": {
    "id": "20304939-a518-4a36-af19-71055997e2ef",
    "projectPath": "/Users/abuusama/Desktop/temp/test-data"
  }
}
```

### 5. Get Enhanced Session History (With Parsed Props) 🔥

**This is the main integration test - get history with parsed tool props:**

**Command:**
```bash
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=10" | jq '.'
```

**Note:** Tool results come in separate user messages, not in the assistant messages. The correlation engine matches tool calls with their results based on the tool ID.

**Exact Test Commands:**
```bash
# Find tool calls with parsed props
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=50" | \
  jq '.history[] | select(.parsedProps) | {uuid, type, toolType: .parsedProps.toolType}'
# Expected output like:
# {
#   "uuid": "3ce3aa9a-01a5-4632-9a3b-f28a99d0d32b",
#   "type": "assistant",
#   "toolType": "mcp__sequential-thinking__sequentialthinking"
# }

# Count entries with parsed props
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=50" | \
  jq '[.history[] | select(.parsedProps)] | length'
# Expected: Number > 0 if session has tool usage

# Get first parsed tool details
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=50" | \
  jq '.history[] | select(.parsedProps) | .parsedProps' | head -50
# Expected: Full parsedProps object with toolType, props, and correlationId
```

**Expected Response (Tool Call with Parsed Props):**
```json
{
  "uuid": "3ce3aa9a-01a5-4632-9a3b-f28a99d0d32b",
  "parentUuid": "6afa9ff3-656e-49cc-b2e7-a839854bff52",
  "timestamp": "2025-06-30T12:38:46.653Z",
  "type": "assistant",
  "content": {
    "type": "tool_use",
    "id": "toolu_01N7WzjTsz1YoYCdPqfBAmgR",
    "name": "mcp__sequential-thinking__sequentialthinking",
    "input": {
      "thought": "Starting to think about JSON-L...",
      "nextThoughtNeeded": true,
      "thoughtNumber": 1,
      "totalThoughts": 3
    }
  },
  "isSidechain": false,
  "parsedProps": {
    "toolType": "mcp__sequential-thinking__sequentialthinking",
    "props": {
      "id": "toolu_01N7WzjTsz1YoYCdPqfBAmgR",
      "uuid": "3ce3aa9a-01a5-4632-9a3b-f28a99d0d32b",
      "parentUuid": "6afa9ff3-656e-49cc-b2e7-a839854bff52",
      "timestamp": "2025-06-30T12:38:46.653Z",
      "duration": 0,
      "status": {
        "normalized": "completed",
        "original": "success"
      },
      "input": {
        "parameters": {
          "thought": "Starting to think about JSON-L...",
          "nextThoughtNeeded": true,
          "thoughtNumber": 1,
          "totalThoughts": 3
        }
      },
      "results": {},
      "ui": {
        "toolName": "mcp__sequential-thinking__sequentialthinking",
        "serverName": "sequential-thinking",
        "methodName": "sequentialthinking",
        "displayMode": "empty",
        "isStructured": false,
        "hasNestedData": false,
        "keyCount": 0,
        "showRawJson": false,
        "collapsible": false,
        "isComplex": false,
        "isLarge": false
      }
    },
    "correlationId": "toolu_01N7WzjTsz1YoYCdPqfBAmgR"
  }
}
```

### 6. Test Different Tool Types

**Commands to test various tool types:**

```bash
# List all unique tool types in the session
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=200" | \
  jq -r '.history[] | select(.parsedProps) | .parsedProps.toolType' | sort | uniq
# Expected output:
# Bash
# Edit
# Glob
# Grep
# LS
# MultiEdit
# Read
# Task
# Write
# mcp__sequential-thinking__sequentialthinking
# mcp__time__get_current_time

# Get specific tool example - Bash
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=100" | \
  jq '.history[] | select(.parsedProps.toolType == "Bash") | .parsedProps.props | {command, exitCode, duration}' | head -10
# Expected: {"command": "ls -la", "exitCode": 0, "duration": 250}

# Get specific tool example - Write
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=100" | \
  jq '.history[] | select(.parsedProps.toolType == "Write") | .parsedProps.props | {filePath, created, fileType}' | head -10
# Expected: {"filePath": "/path/to/file.txt", "created": true, "fileType": "plaintext"}

# Get MCP tool example
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=100" | \
  jq '.history[] | select(.parsedProps.toolType | startswith("mcp__")) | {tool: .parsedProps.toolType, ui: .parsedProps.props.ui}' | head -10
# Expected: MCP tool with detailed UI metadata
```

**Example Tool Props:**

#### Bash Tool
```json
{
  "toolType": "Bash",
  "props": {
    "id": "toolu_01ABC123",
    "uuid": "bash-uuid",
    "timestamp": "2025-01-01T12:00:00.000Z",
    "duration": 150,
    "status": {
      "normalized": "completed",
      "original": "success"
    },
    "command": "ls -la",
    "description": "List files in current directory",
    "output": "total 16\ndrwxr-xr-x  4 user  staff  128...",
    "exitCode": 0,
    "executionTime": 150
  }
}
```

#### Write Tool
```json
{
  "toolType": "Write",
  "props": {
    "id": "toolu_01DEF456",
    "uuid": "write-uuid",
    "timestamp": "2025-01-01T12:00:00.000Z",
    "duration": 50,
    "status": {
      "normalized": "completed",
      "original": "File created successfully"
    },
    "filePath": "/tmp/hello.txt",
    "content": "Hello, World!",
    "fileType": "plaintext",
    "created": true,
    "overwritten": false,
    "showLineNumbers": true,
    "wordWrap": false
  }
}
```

#### MCP Tool
```json
{
  "toolType": "mcp__time__get_current_time",
  "props": {
    "id": "toolu_01GHI789",
    "uuid": "mcp-uuid",
    "timestamp": "2025-01-01T12:00:00.000Z",
    "duration": 10,
    "status": {
      "normalized": "completed",
      "original": "success"
    },
    "input": {
      "parameters": {
        "timezone": "America/New_York"
      }
    },
    "results": {
      "output": {
        "time": "2025-01-01T07:00:00-05:00",
        "timezone": "America/New_York"
      }
    },
    "ui": {
      "toolName": "mcp__time__get_current_time",
      "serverName": "time",
      "methodName": "get_current_time",
      "displayMode": "json",
      "isStructured": true,
      "hasNestedData": false,
      "keyCount": 2
    }
  }
}
```

### 7. Test Pagination

**Commands:**
```bash
# Get second page of results
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=20&offset=20" | \
  jq '{total: .pagination.total, returned: .history | length, offset: .pagination.offset}'
```

**Expected:**
```json
{
  "total": 207,
  "returned": 20,
  "offset": 20
}
```

**Additional Tests:**
```bash
# Get last page
TOTAL=$(curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=1" | jq '.pagination.total')
LAST_OFFSET=$((TOTAL - 10))
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=10&offset=$LAST_OFFSET" | \
  jq '{total: .pagination.total, returned: .history | length, hasMore: .pagination.hasMore}'
# Expected: {"total": 207, "returned": 10, "hasMore": false}
```

### 8. Test Filtering

**Filter by message type:**
```bash
# Get only assistant messages with tools
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?type=assistant&limit=10" | \
  jq '.history[] | select(.content.type == "tool_use") | {uuid, tool: .content.name}'

# Count message types
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?limit=100" | \
  jq '.history | group_by(.type) | map({type: .[0].type, count: length})'
# Expected: [{"type": "assistant", "count": 45}, {"type": "user", "count": 55}]
```

**Filter by time (macOS):**
```bash
# Get messages from last hour
SINCE=$(date -u -v-1H +"%Y-%m-%dT%H:%M:%SZ")
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?since=$SINCE" | \
  jq '.history | length'
```

**Filter by time (Linux):**
```bash
# Get messages from last hour
SINCE=$(date -u -d '1 hour ago' +"%Y-%m-%dT%H:%M:%SZ")
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?since=$SINCE" | \
  jq '.history | length'
```

### 9. Test Active Sessions

**Command:**
```bash
curl -s "http://localhost:3001/api/sessions?active=true" | jq '.sessions | length'
```

**Expected:**
- Returns sessions modified within the last 60 seconds
- Usually returns 0 unless actively using Claude Code

**Test with custom time window:**
```bash
# Get sessions active in last 24 hours
curl -s "http://localhost:3001/api/sessions?active=true&window=86400" | \
  jq '.sessions | map({id, lastActivity, isActive})'
```

### 10. Performance Test

**Commands:**
```bash
# Time the request for 1000 entries
time curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=1000" > /dev/null
# Expected: real time < 2.0s

# Check response size
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=100" | wc -c
# Expected: Size in bytes (typically 50KB-200KB for 100 entries)

# Memory efficient streaming test
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=1000" | \
  jq -c '.history[] | select(.parsedProps) | {id: .uuid, tool: .parsedProps.toolType}' | wc -l
# Expected: Count of parsed tool entries
```

## Complete Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3001/api"

echo "=== Claude Codex API Server Test ==="
echo

# 1. Health Check
echo "1. Testing health endpoint..."
HEALTH=$(curl -s $API_URL/health)
if echo $HEALTH | jq -e '.status == "healthy"' > /dev/null; then
    echo "✅ Health check passed"
    echo "   Version: $(echo $HEALTH | jq -r '.version')"
    echo "   Uptime: $(echo $HEALTH | jq -r '.uptime')s"
else
    echo "❌ Health check failed"
    exit 1
fi

# 2. Get Sessions
echo -e "\n2. Getting sessions..."
SESSIONS=$(curl -s $API_URL/sessions)
SESSION_COUNT=$(echo $SESSIONS | jq '.sessions | length')
echo "Found $SESSION_COUNT sessions"

if [ $SESSION_COUNT -eq 0 ]; then
    echo "❌ No sessions found - create some Claude Code logs first"
    echo "   Expected location: ~/.claude/projects/"
    exit 1
fi

# 3. Use first session
SESSION_ID=$(echo $SESSIONS | jq -r '.sessions[0].id')
PROJECT_PATH=$(echo $SESSIONS | jq -r '.sessions[0].projectPath')
MSG_COUNT=$(echo $SESSIONS | jq -r '.sessions[0].messageCount')
HAS_TOOLS=$(echo $SESSIONS | jq -r '.sessions[0].hasToolUsage')
echo "Using session: $SESSION_ID"
echo "   Project: $PROJECT_PATH"
echo "   Messages: $MSG_COUNT"
echo "   Has tools: $HAS_TOOLS"

# 4. Test raw history
echo -e "\n3. Testing raw history endpoint..."
RAW_HISTORY=$(curl -s "$API_URL/sessions/$SESSION_ID/history?limit=5")
RAW_COUNT=$(echo $RAW_HISTORY | jq '.history | length')
echo "✅ Retrieved $RAW_COUNT raw entries"

# 5. Test enhanced history
echo -e "\n4. Testing enhanced history (with parsed props)..."
ENHANCED=$(curl -s "$API_URL/sessions/$SESSION_ID/enhanced-history?limit=50")
TOTAL_ENTRIES=$(echo $ENHANCED | jq '.history | length')
PARSED_COUNT=$(echo $ENHANCED | jq '[.history[] | select(.parsedProps)] | length')
echo "✅ Retrieved $TOTAL_ENTRIES entries, $PARSED_COUNT with parsed props"

# 6. Show tool types
if [ $PARSED_COUNT -gt 0 ]; then
    echo -e "\n5. Tool types found:"
    echo $ENHANCED | jq -r '.history[] | select(.parsedProps) | .parsedProps.toolType' | sort | uniq -c | sort -nr
    
    echo -e "\n6. Sample parsed props:"
    echo $ENHANCED | jq '.history[] | select(.parsedProps) | .parsedProps | {toolType, status: .props.status.normalized, correlationId}' | head -30
    
    echo -e "\n7. Tool success rate:"
    COMPLETED=$(echo $ENHANCED | jq '[.history[] | select(.parsedProps.props.status.normalized == "completed")] | length')
    FAILED=$(echo $ENHANCED | jq '[.history[] | select(.parsedProps.props.status.normalized == "failed")] | length')
    echo "   Completed: $COMPLETED"
    echo "   Failed: $FAILED"
    if [ $PARSED_COUNT -gt 0 ]; then
        SUCCESS_RATE=$(echo "scale=2; $COMPLETED * 100 / $PARSED_COUNT" | bc)
        echo "   Success rate: ${SUCCESS_RATE}%"
    fi
else
    echo "⚠️  No parsed props found - session may not contain tool usage"
fi

# 8. Performance check
echo -e "\n8. Performance test (1000 entries)..."
START_TIME=$(date +%s.%N)
curl -s "$API_URL/sessions/$SESSION_ID/enhanced-history?limit=1000" > /dev/null
END_TIME=$(date +%s.%N)
DURATION=$(echo "$END_TIME - $START_TIME" | bc)
echo "✅ Retrieved 1000 entries in ${DURATION}s"

# 9. Test pagination
echo -e "\n9. Testing pagination..."
PAGE_TEST=$(curl -s "$API_URL/sessions/$SESSION_ID/enhanced-history?limit=10&offset=10")
PAGE_TOTAL=$(echo $PAGE_TEST | jq '.pagination.total')
PAGE_OFFSET=$(echo $PAGE_TEST | jq '.pagination.offset')
PAGE_HAS_MORE=$(echo $PAGE_TEST | jq '.pagination.hasMore')
echo "✅ Pagination working (total: $PAGE_TOTAL, offset: $PAGE_OFFSET, hasMore: $PAGE_HAS_MORE)"

echo -e "\n=== All tests completed successfully! ==="
```

**Make executable and run:**
```bash
chmod +x test-api.sh
./test-api.sh
```

**Expected output:**
```
=== Claude Codex API Server Test ===

1. Testing health endpoint...
✅ Health check passed
   Version: 0.1.0
   Uptime: 123.456s

2. Getting sessions...
Found 1 sessions
Using session: 20304939-a518-4a36-af19-71055997e2ef
   Project: /Users/abuusama/Desktop/temp/test-data
   Messages: 207
   Has tools: true

3. Testing raw history endpoint...
✅ Retrieved 5 raw entries

4. Testing enhanced history (with parsed props)...
✅ Retrieved 50 entries, 23 with parsed props

5. Tool types found:
      9 mcp__sequential-thinking__sequentialthinking
      5 Bash
      4 Write
      3 Read
      2 Edit

6. Sample parsed props:
{
  "toolType": "mcp__sequential-thinking__sequentialthinking",
  "status": "completed",
  "correlationId": "toolu_01N7WzjTsz1YoYCdPqfBAmgR"
}
...

7. Tool success rate:
   Completed: 22
   Failed: 1
   Success rate: 95.65%

8. Performance test (1000 entries)...
✅ Retrieved 1000 entries in 1.234s

9. Testing pagination...
✅ Pagination working (total: 207, offset: 10, hasMore: true)

=== All tests completed successfully! ===
```

## Troubleshooting

### No Sessions Found
```bash
# Check if Claude logs exist
ls -la ~/.claude/projects/
# If empty, use Claude Code to generate some logs
```

### Parser Errors
```bash
# Check API server logs
# Look for warnings like "Failed to parse tool" or "No correlation ID found"
```

### Missing Parsed Props
1. Ensure the tool type is supported (check ParserRegistry)
2. Verify the log entry has proper tool_use structure
3. Check that tool results are being correlated properly
4. Look for correlation warnings in server logs

### Type Checking
```bash
cd apps/api-server
bun tsc --noEmit
```

### Performance Issues
- For large sessions (>10,000 entries), use pagination
- Consider implementing caching for frequently accessed sessions
- Monitor memory usage with large result sets