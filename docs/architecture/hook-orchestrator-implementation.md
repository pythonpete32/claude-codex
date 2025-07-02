# Hook Orchestrator Implementation Guide

## Overview

This document provides a detailed implementation guide for the central Hook Orchestrator that manages all Claude Code hook events.

## Core Orchestrator Implementation

### 1. Base Orchestrator Class

```python
#!/usr/bin/env python3
import json
import sys
import asyncio
import aioredis
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class HookEvent:
    event_type: str
    session_id: str
    transcript_path: str
    tool_name: Optional[str] = None
    tool_input: Optional[Dict[str, Any]] = None
    tool_response: Optional[Dict[str, Any]] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class HookOrchestrator:
    def __init__(self, config_path: str = "~/.claude/control-config.json"):
        self.config = self.load_config(config_path)
        self.redis_client = None
        self.websocket_server = None
        self.policies = PolicyEngine(self.config.get('policies', []))
        self.access_controller = DirectoryAccessController(
            self.config.get('access_control', {})
        )
        
    async def initialize(self):
        # Initialize Redis connection
        self.redis_client = await aioredis.create_redis_pool(
            'redis://localhost:6379'
        )
        
        # Start WebSocket server
        from .websocket_server import ControlWebSocketServer
        self.websocket_server = ControlWebSocketServer(self)
        await self.websocket_server.start()
    
    async def handle_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        # Parse event
        event = self.parse_event(event_data)
        
        # Log to session state
        await self.log_event(event)
        
        # Route to appropriate handler
        handler_map = {
            'pre-tool': self.handle_pre_tool,
            'post-tool': self.handle_post_tool,
            'stop': self.handle_stop,
            'notification': self.handle_notification
        }
        
        handler = handler_map.get(event.event_type)
        if handler:
            return await handler(event)
        
        return {"continue": True}
```

### 2. Pre-Tool Handler

```python
async def handle_pre_tool(self, event: HookEvent) -> Dict[str, Any]:
    # Check access control
    if access_result := self.access_controller.check_access(
        event.tool_name, event.tool_input
    ):
        if access_result.get('decision') == 'block':
            await self.notify_ui('tool_blocked', {
                'session_id': event.session_id,
                'tool_name': event.tool_name,
                'reason': access_result.get('reason')
            })
            return access_result
    
    # Apply policies
    policy_result = await self.policies.evaluate(event)
    if policy_result.get('decision') == 'block':
        return policy_result
    
    # Check for tool modifications
    if modification := await self.get_tool_modification(event):
        event.tool_input.update(modification['changes'])
        await self.notify_ui('tool_modified', {
            'session_id': event.session_id,
            'tool_name': event.tool_name,
            'changes': modification['changes']
        })
    
    # Check for approval requirements
    if self.requires_approval(event):
        approval = await self.request_approval(event)
        if not approval:
            return {
                "decision": "block",
                "reason": "User rejected tool execution"
            }
    
    # Log and continue
    await self.log_tool_execution(event)
    return {"decision": "approve"}
```

### 3. Stop Handler for Message Injection

```python
async def handle_stop(self, event: HookEvent) -> Dict[str, Any]:
    # Check if stop hook is already active to prevent loops
    if event_data.get('stop_hook_active'):
        return {"continue": True}
    
    # Check message queue
    message_key = f"messages:{event.session_id}"
    message = await self.redis_client.lpop(message_key)
    
    if message:
        # Inject message to continue session
        return {
            "decision": "block",
            "reason": message.decode('utf-8'),
            "suppressOutput": True
        }
    
    # Check for automatic context injection
    if context := await self.get_context_injection(event):
        return {
            "decision": "block",
            "reason": context,
            "suppressOutput": True
        }
    
    # Check if any policies require continuation
    if policy_continuation := await self.policies.check_continuation(event):
        return {
            "decision": "block",
            "reason": policy_continuation['reason']
        }
    
    # Normal stop
    await self.notify_ui('session_stopped', {
        'session_id': event.session_id,
        'timestamp': event.timestamp.isoformat()
    })
    
    return {"continue": True}
```

### 4. Session State Management

```python
class SessionStateManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.transcript_monitors = {}
    
    async def track_session(self, session_id: str, transcript_path: str):
        if session_id not in self.transcript_monitors:
            monitor = TranscriptMonitor(session_id, transcript_path)
            self.transcript_monitors[session_id] = monitor
            asyncio.create_task(monitor.start())
    
    async def get_session_state(self, session_id: str) -> Dict[str, Any]:
        state_key = f"session:{session_id}:state"
        state_data = await self.redis.get(state_key)
        
        if state_data:
            return json.loads(state_data)
        
        return {
            'session_id': session_id,
            'status': 'active',
            'files_modified': [],
            'commands_executed': [],
            'tool_calls': [],
            'messages': []
        }
    
    async def update_session_state(self, session_id: str, updates: Dict[str, Any]):
        state = await self.get_session_state(session_id)
        state.update(updates)
        state['last_updated'] = datetime.now().isoformat()
        
        state_key = f"session:{session_id}:state"
        await self.redis.set(state_key, json.dumps(state))
        
        # Notify UI of state change
        await self.notify_state_change(session_id, state)
```

### 5. Policy Engine

```python
class PolicyEngine:
    def __init__(self, policies: List[Dict[str, Any]]):
        self.policies = self.compile_policies(policies)
    
    def compile_policies(self, policies):
        compiled = []
        for policy in policies:
            compiled.append({
                'name': policy['name'],
                'matcher': self.compile_matcher(policy.get('match', {})),
                'conditions': self.compile_conditions(policy.get('conditions', [])),
                'action': policy['action'],
                'message': policy.get('message', 'Policy violation')
            })
        return compiled
    
    async def evaluate(self, event: HookEvent) -> Optional[Dict[str, Any]]:
        for policy in self.policies:
            if self.matches(policy['matcher'], event):
                if await self.check_conditions(policy['conditions'], event):
                    return self.apply_action(policy, event)
        return None
    
    def matches(self, matcher, event):
        if 'tools' in matcher:
            if event.tool_name not in matcher['tools']:
                return False
        
        if 'path_pattern' in matcher and event.tool_input:
            file_path = event.tool_input.get('file_path', '')
            import fnmatch
            if not fnmatch.fnmatch(file_path, matcher['path_pattern']):
                return False
        
        return True
    
    async def check_conditions(self, conditions, event):
        for condition in conditions:
            if 'max_calls_per_minute' in condition:
                count = await self.get_rate_limit_count(
                    event.session_id, 
                    event.tool_name
                )
                if count >= condition['max_calls_per_minute']:
                    return True
        return False
```

### 6. WebSocket Communication

```python
class ControlWebSocketServer:
    def __init__(self, orchestrator):
        self.orchestrator = orchestrator
        self.clients = {}
    
    async def start(self):
        import websockets
        await websockets.serve(
            self.handle_client, 
            "localhost", 
            8765
        )
    
    async def handle_client(self, websocket, path):
        client_id = str(uuid.uuid4())
        self.clients[client_id] = websocket
        
        try:
            async for message in websocket:
                await self.process_message(client_id, message)
        finally:
            del self.clients[client_id]
    
    async def process_message(self, client_id, message):
        data = json.loads(message)
        msg_type = data.get('type')
        
        handlers = {
            'inject_message': self.handle_inject_message,
            'modify_tool': self.handle_modify_tool,
            'get_state': self.handle_get_state,
            'create_policy': self.handle_create_policy,
            'subscribe': self.handle_subscribe
        }
        
        if handler := handlers.get(msg_type):
            response = await handler(data)
            await self.send_to_client(client_id, response)
    
    async def handle_inject_message(self, data):
        session_id = data['sessionId']
        message = data['message']
        
        # Add to Redis queue
        message_key = f"messages:{session_id}"
        await self.orchestrator.redis_client.rpush(
            message_key, 
            message
        )
        
        return {
            'type': 'message_queued',
            'sessionId': session_id,
            'status': 'success'
        }
```

### 7. Main Entry Point

```python
async def main():
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--event', required=True)
    args = parser.parse_args()
    
    # Read event data from stdin
    event_data = json.load(sys.stdin)
    event_data['event_type'] = args.event
    
    # Initialize orchestrator
    orchestrator = HookOrchestrator()
    await orchestrator.initialize()
    
    # Handle event
    result = await orchestrator.handle_event(event_data)
    
    # Output result
    print(json.dumps(result))
    
    # Cleanup
    await orchestrator.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
```

## Configuration Schema

```json
{
  "redis_url": "redis://localhost:6379",
  "websocket_port": 8765,
  "access_control": {
    "blocked_dirs": [
      "/etc",
      "/usr/bin",
      "~/.ssh",
      "~/.aws"
    ],
    "allowed_dirs": [
      "~/projects",
      "/tmp"
    ],
    "restrict_to_allowed": false
  },
  "policies": [
    {
      "name": "rate_limit_web",
      "match": {
        "tools": ["WebSearch", "WebFetch"]
      },
      "conditions": [
        {"max_calls_per_minute": 10}
      ],
      "action": "block",
      "message": "Rate limit exceeded"
    }
  ],
  "approval_required": {
    "tools": ["Bash"],
    "patterns": ["rm -rf", "sudo"]
  }
}
```

## Installation Script

```bash
#!/bin/bash
# install-claude-control.sh

# Create directory structure
mkdir -p ~/.claude/control
cd ~/.claude/control

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install aioredis websockets pyyaml

# Copy orchestrator files
cp /path/to/orchestrator.py .
cp /path/to/config.json ~/.claude/control-config.json

# Create systemd service (optional)
cat > ~/.config/systemd/user/claude-control.service << EOF
[Unit]
Description=Claude Control Orchestrator
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/$USER/.claude/control
ExecStart=/home/$USER/.claude/control/venv/bin/python orchestrator-server.py
Restart=always

[Install]
WantedBy=default.target
EOF

# Enable service
systemctl --user enable claude-control
systemctl --user start claude-control
```

## Testing the System

```python
# test_orchestrator.py
import pytest
import json
from unittest.mock import Mock, patch

@pytest.fixture
async def orchestrator():
    orch = HookOrchestrator(config_path='test-config.json')
    await orch.initialize()
    yield orch
    await orch.cleanup()

async def test_message_injection(orchestrator):
    # Queue a message
    await orchestrator.redis_client.rpush(
        "messages:test-session", 
        "Continue with the next task"
    )
    
    # Simulate stop event
    event_data = {
        "session_id": "test-session",
        "transcript_path": "/tmp/test.jsonl",
        "event_type": "stop"
    }
    
    result = await orchestrator.handle_event(event_data)
    
    assert result['decision'] == 'block'
    assert result['reason'] == "Continue with the next task"

async def test_access_control(orchestrator):
    event_data = {
        "session_id": "test-session",
        "tool_name": "Write",
        "tool_input": {
            "file_path": "/etc/passwd",
            "content": "malicious"
        },
        "event_type": "pre-tool"
    }
    
    result = await orchestrator.handle_event(event_data)
    
    assert result['decision'] == 'block'
    assert 'protected' in result['reason']
```

This implementation provides a robust foundation for controlling Claude Code sessions with real-time monitoring, message injection, and policy enforcement.