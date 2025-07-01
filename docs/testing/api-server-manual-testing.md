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

## Test Cases

### 1. Health Check

**Test the server is running and healthy:**

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

**Failure Case:**
- Connection refused if server not running
- Status other than "healthy" indicates issues

### 2. List All Sessions

**Get all available sessions:**

```bash
curl -s http://localhost:3001/api/sessions | jq '.'
```

**Expected Response:**
```json
{
  "sessions": [
    {
      "id": "5ba59030-0d21-4229-a5e1-5e9160dfe7e6",
      "projectPath": "/Users/username/projects/my-project",
      "lastActivity": "2025-01-01T12:00:00.000Z",
      "messageCount": 150,
      "hasToolUsage": true,
      "isActive": false,
      "createdAt": "2025-01-01T10:00:00.000Z",
      "fileSize": 524288
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

**Failure Case:**
- Empty sessions array if no Claude logs exist
- 500 error if logs directory is inaccessible

### 3. Get Specific Session

**Get details for a specific session (replace UUID with actual session ID):**

```bash
# First, get a session ID from the list
SESSION_ID=$(curl -s http://localhost:3001/api/sessions | jq -r '.sessions[0].id')

# Then fetch its details
curl -s http://localhost:3001/api/sessions/$SESSION_ID | jq '.'
```

**Expected Response:**
```json
{
  "id": "5ba59030-0d21-4229-a5e1-5e9160dfe7e6",
  "projectPath": "/Users/username/projects/my-project",
  "lastActivity": "2025-01-01T12:00:00.000Z",
  "messageCount": 150,
  "hasToolUsage": true,
  "isActive": false,
  "createdAt": "2025-01-01T10:00:00.000Z",
  "fileSize": 524288
}
```

**Failure Cases:**
```bash
# Invalid UUID format
curl -s http://localhost:3001/api/sessions/invalid-uuid | jq '.'
# Expected: {"error": "INVALID_SESSION_ID", "message": "Session ID must be a valid UUID"}

# Non-existent session
curl -s http://localhost:3001/api/sessions/00000000-0000-0000-0000-000000000000 | jq '.'
# Expected: {"error": "SESSION_NOT_FOUND", "message": "Session 00000000-0000-0000-0000-000000000000 not found"}
```

### 4. Get Session History (Raw)

**Get conversation history without parsing:**

```bash
# Get first 10 entries
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?limit=10" | jq '.'
```

**Expected Response:**
```json
{
  "history": [
    {
      "uuid": "43b9d9bf-955c-4425-bdf9-0f6558aa5cb2",
      "parentUuid": null,
      "sessionId": "5ba59030-0d21-4229-a5e1-5e9160dfe7e6",
      "timestamp": "2025-01-01T12:00:00.000Z",
      "type": "user",
      "content": "Write a hello world file",
      "isSidechain": false
    },
    {
      "uuid": "3ce3aa9a-01a5-4632-9a3b-f28a99d0d32b",
      "parentUuid": "43b9d9bf-955c-4425-bdf9-0f6558aa5cb2",
      "sessionId": "5ba59030-0d21-4229-a5e1-5e9160dfe7e6",
      "timestamp": "2025-01-01T12:00:01.000Z",
      "type": "assistant",
      "content": [
        {
          "type": "tool_use",
          "id": "toolu_01ABC123",
          "name": "Write",
          "input": {
            "file_path": "/tmp/hello.txt",
            "content": "Hello, World!"
          }
        }
      ],
      "toolUse": {
        "id": "toolu_01ABC123",
        "name": "Write",
        "input": {
          "file_path": "/tmp/hello.txt",
          "content": "Hello, World!"
        },
        "status": "pending"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "session": {
    "id": "5ba59030-0d21-4229-a5e1-5e9160dfe7e6",
    "projectPath": "/Users/username/projects/my-project"
  }
}
```

### 5. Get Enhanced Session History (With Parsed Props) 🔥

**This is the main integration test - get history with parsed tool props:**

```bash
# Get enhanced history with parsed UI props
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=10" | jq '.'
```

**Note:** Tool results come in separate user messages, not in the assistant messages. The correlation engine matches tool calls with their results based on the tool ID.

**Expected Response (Success Case):**
```json
{
  "history": [
    {
      "uuid": "3ce3aa9a-01a5-4632-9a3b-f28a99d0d32b",
      "parentUuid": "43b9d9bf-955c-4425-bdf9-0f6558aa5cb2",
      "type": "assistant",
      "timestamp": "2025-01-01T12:00:01.000Z",
      "content": [{"type": "tool_use", "id": "toolu_01ABC123", "name": "Write"}],
      "parsedProps": {
        "toolType": "Write",
        "props": {
          "id": "toolu_01ABC123",
          "uuid": "3ce3aa9a-01a5-4632-9a3b-f28a99d0d32b",
          "timestamp": "2025-01-01T12:00:01.000Z",
          "duration": 150,
          "status": {
            "normalized": "completed",
            "original": "success"
          },
          "filePath": "/tmp/hello.txt",
          "content": "Hello, World!",
          "fileType": "plaintext",
          "created": true,
          "overwritten": false,
          "showLineNumbers": true,
          "wordWrap": false
        },
        "correlationId": "toolu_01ABC123"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Failure Cases:**
```bash
# Session without tool usage
curl -s "http://localhost:3001/api/sessions/$NO_TOOLS_SESSION/enhanced-history" | jq '.history[0].parsedProps'
# Expected: null (no parsedProps field for non-tool messages)

# Unsupported tool type
# If entry contains unknown tool, parsedProps will be null but no error thrown
```

### 6. Test Different Tool Types

**Test that various tools are parsed correctly:**

```bash
# Find entries with specific tools
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=100" | \
  jq '.history[] | select(.parsedProps.toolType == "Bash") | .parsedProps'
```

**Expected Tool Types and Their Props:**

#### Bash Tool
```json
{
  "toolType": "Bash",
  "props": {
    "command": "ls -la",
    "output": "total 16\ndrwxr-xr-x  4 user  staff  128 Jan  1 12:00 .",
    "exitCode": 0,
    "duration": 250
  }
}
```

#### Edit Tool
```json
{
  "toolType": "Edit",
  "props": {
    "filePath": "/path/to/file.js",
    "oldString": "const foo = 'bar'",
    "newString": "const foo = 'baz'",
    "success": true,
    "editType": "str_replace"
  }
}
```

#### Read Tool
```json
{
  "toolType": "Read",
  "props": {
    "filePath": "/path/to/file.js",
    "content": "file contents here...",
    "lineCount": 42,
    "fileType": "javascript"
  }
}
```

### 7. Test Pagination

**Test pagination parameters:**

```bash
# Get second page of results
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=20&offset=20" | \
  jq '{total: .pagination.total, returned: .history | length, offset: .pagination.offset}'
```

**Expected:**
```json
{
  "total": 150,
  "returned": 20,
  "offset": 20
}
```

### 8. Test Filtering

**Filter by message type:**

```bash
# Get only assistant messages
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?type=assistant" | \
  jq '.history[] | {type, hasTools: (.toolUse != null)}'

# Get only user messages  
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?type=user" | \
  jq '.history[].type' | sort | uniq -c
```

**Filter by time:**

```bash
# Get messages from last hour
SINCE=$(date -u -v-1H +"%Y-%m-%dT%H:%M:%SZ")
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/history?since=$SINCE" | \
  jq '.history | length'
```

### 9. Test Active Sessions

**Get only active sessions:**

```bash
curl -s "http://localhost:3001/api/sessions?active=true" | jq '.sessions | length'
```

**Expected:**
- Returns sessions modified within the last 60 seconds
- Empty array if no active sessions

### 10. Performance Test

**Test with large result set:**

```bash
# Time the request
time curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=1000" > /dev/null

# Check response size
curl -s "http://localhost:3001/api/sessions/$SESSION_ID/enhanced-history?limit=100" | wc -c
```

**Expected:**
- Response time < 2 seconds for 1000 entries
- Properly formatted JSON even with large datasets

## WebSocket Testing (Optional)

**Connect to WebSocket for real-time updates:**

```bash
# Using websocat (install with: brew install websocat)
websocat ws://localhost:3001/api/stream

# After connection, send:
{"type":"subscribe","target":"session","sessionId":"$SESSION_ID"}

# Expected stream of messages:
{"type":"connected","clientId":"..."}
{"type":"log_entry","sessionId":"...","data":{...}}
```

## Validation Checklist

- [ ] Server starts without errors
- [ ] Health endpoint returns healthy status
- [ ] Sessions list returns valid data
- [ ] Individual session details are retrievable
- [ ] Raw history endpoint returns log entries
- [ ] Enhanced history includes parsedProps for tool entries
- [ ] Different tool types are parsed correctly
- [ ] Pagination works as expected
- [ ] Filtering by type and time works
- [ ] Invalid requests return appropriate error messages
- [ ] Performance is acceptable for large datasets

## Common Issues and Troubleshooting

### No Sessions Found
```bash
# Check if Claude logs exist
ls -la ~/.claude/projects/
```

### Parser Errors
```bash
# Check API server logs for parser errors
# Look for "Failed to parse entry" warnings
```

### Type Checking Errors
```bash
# Run type check in API server
cd apps/api-server
bun run typecheck
```

### Missing Parsed Props
- Ensure the tool type is supported (check ParserRegistry)
- Verify the log entry has proper tool_use/tool_result structure
- Check for correlation between tool call and result

## Example Test Script

Save this as `test-api.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3001/api"

echo "1. Testing health endpoint..."
curl -s $API_URL/health | jq '.status' | grep -q "healthy" && echo "✅ Health check passed" || echo "❌ Health check failed"

echo -e "\n2. Getting sessions..."
SESSIONS=$(curl -s $API_URL/sessions)
SESSION_COUNT=$(echo $SESSIONS | jq '.sessions | length')
echo "Found $SESSION_COUNT sessions"

if [ $SESSION_COUNT -gt 0 ]; then
  SESSION_ID=$(echo $SESSIONS | jq -r '.sessions[0].id')
  echo "Using session: $SESSION_ID"
  
  echo -e "\n3. Testing enhanced history..."
  ENHANCED=$(curl -s "$API_URL/sessions/$SESSION_ID/enhanced-history?limit=5")
  PARSED_COUNT=$(echo $ENHANCED | jq '[.history[] | select(.parsedProps != null)] | length')
  echo "Found $PARSED_COUNT entries with parsed props"
  
  echo -e "\n4. Checking tool types..."
  echo $ENHANCED | jq -r '.history[] | select(.parsedProps != null) | .parsedProps.toolType' | sort | uniq
else
  echo "❌ No sessions found - create some Claude Code logs first"
fi
```

Run with: `bash test-api.sh`