# @dao/codex-api-server

REST API and WebSocket server for Claude conversation logs.

## Overview

This package provides HTTP REST endpoints and real-time WebSocket streaming for Claude conversation data. It integrates with `@dao/codex-log-monitor` for file watching and `@dao/transformer` for data processing.

## Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Start production server  
bun run start
```

The server runs on `http://localhost:3001` by default.

## API Endpoints

### HTTP REST API
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/{id}` - Get session details
- `GET /api/sessions/{id}/history` - Get session conversation history
- `GET /api/projects` - List all projects
- `GET /api/projects/{path}/sessions` - Get sessions for project
- `GET /api/health` - Health check
- `GET /api/metrics` - System metrics

### WebSocket Streaming
- `WS /api/stream` - Real-time log updates

## Configuration

Set environment variables:

```bash
PORT=3001                    # Server port
HOST=localhost              # Server host
CORS_ORIGINS=*              # Allowed origins
CLAUDE_LOGS_PATH=~/.claude  # Claude logs directory
```

## Development

```bash
# Run tests
bun test

# Type checking
bun run typecheck

# Linting
bun run lint

# Format code
bun run format

# Full check
bun run check
```

## Architecture

The API server acts as a bridge between:
- File system monitoring (`@dao/codex-log-monitor`)
- Log processing (`@dao/transformer`) 
- Client applications (HTTP/WebSocket)

See `/docs/backend/` for detailed specifications.