# API Server Quick Test Reference

## 🚀 Quick Start

```bash
# Start the server
cd apps/api-server && bun run dev

# In another terminal, run tests
```

## 🧪 Essential Test Commands

### Basic Health Check
```bash
curl -s http://localhost:3456/health | jq '.'
```

### Get First Session with Parsed Props
```bash
# One-liner to get enhanced history for the first session
curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id' | xargs -I{} curl -s "http://localhost:3456/sessions/{}/enhanced-history?limit=5" | jq '.'
```

### Find All Tool Types in a Session
```bash
SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=100" | jq -r '.history[] | select(.parsedProps != null) | .parsedProps.toolType' | sort | uniq -c
```

### Check Parser Success Rate
```bash
SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=100" | jq '{
  total_tools: [.history[] | select(.type == "assistant" and .content[0].type == "tool_use")] | length,
  parsed_tools: [.history[] | select(.parsedProps != null)] | length
}'
```

### View Specific Tool Type Examples
```bash
# View all Bash commands and their outputs
SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=100" | jq '.history[] | select(.parsedProps.toolType == "Bash") | {
  command: .parsedProps.props.command,
  exitCode: .parsedProps.props.exitCode,
  duration: .parsedProps.props.duration
}'
```

### Test Error Handling
```bash
# Invalid UUID
curl -s http://localhost:3456/sessions/not-a-uuid | jq '.'

# Non-existent session  
curl -s http://localhost:3456/sessions/00000000-0000-0000-0000-000000000000 | jq '.'

# Invalid query params
curl -s "http://localhost:3456/sessions/$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')/history?type=invalid" | jq '.'
```

## 📊 Validation Metrics

### Count Tool Usage by Type
```bash
SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
echo "=== Tool Usage Stats ==="
curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=500" | jq -r '
  .history[] | 
  select(.parsedProps != null) | 
  .parsedProps.toolType
' | sort | uniq -c | sort -nr
```

### Check Parsing Coverage
```bash
SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=500" | jq '
{
  messages: .history | length,
  tool_calls: [.history[] | select(.type == "assistant" and (.content | type == "array") and .content[0].type == "tool_use")] | length,
  parsed: [.history[] | select(.parsedProps != null)] | length,
  parse_rate: (([.history[] | select(.parsedProps != null)] | length) / ([.history[] | select(.type == "assistant" and (.content | type == "array") and .content[0].type == "tool_use")] | length) * 100 | tostring + "%")
}'
```

### Performance Check
```bash
SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
echo "Timing enhanced history endpoint..."
time curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=100" > /dev/null
```

## 🔍 Debug Commands

### View Raw vs Parsed for Specific Entry
```bash
SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
UUID="3ce3aa9a-01a5-4632-9a3b-f28a99d0d32b"  # Replace with actual UUID

# Raw entry
curl -s "http://localhost:3456/sessions/$SESSION_ID/history?limit=1000" | jq ".history[] | select(.uuid == \"$UUID\")"

# Parsed entry
curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=1000" | jq ".history[] | select(.uuid == \"$UUID\") | .parsedProps"
```

### Find Unparsed Tool Entries
```bash
SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=500" | jq '.history[] | 
  select(
    .type == "assistant" and 
    (.content | type == "array") and 
    .content[0].type == "tool_use" and 
    .parsedProps == null
  ) | {uuid, tool: .content[0].name}'
```

## 💡 Pro Tips

1. **Save session ID for repeated use:**
   ```bash
   export SESSION_ID=$(curl -s http://localhost:3456/sessions | jq -r '.sessions[0].id')
   ```

2. **Pretty print specific fields:**
   ```bash
   curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=5" | jq '.history[] | select(.parsedProps) | {
     tool: .parsedProps.toolType,
     status: .parsedProps.props.status.normalized,
     duration: .parsedProps.props.duration
   }'
   ```

3. **Monitor real-time parsing:**
   ```bash
   watch -n 2 'curl -s "http://localhost:3456/sessions/$SESSION_ID/enhanced-history?limit=10" | jq "[.history[] | select(.parsedProps)] | length"'
   ```