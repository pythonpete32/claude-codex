# UI Control Integration Architecture

## Overview

This document outlines how to integrate Claude Code control capabilities into the existing Claude Codex UI, creating a unified power user environment.

## UI Component Architecture

### 1. Control Dashboard Component

```typescript
// apps/web/src/components/control/ControlDashboard.tsx
import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SessionState, ControlAction } from '@claude-codex/types';

export function ControlDashboard({ sessionId }: { sessionId: string }) {
  const [sessionState, setSessionState] = useState<SessionState>();
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const ws = useWebSocket('ws://localhost:8765');

  useEffect(() => {
    // Subscribe to session updates
    ws.send({
      type: 'subscribe',
      sessionId,
      events: ['state_change', 'tool_call', 'message']
    });

    ws.on('session_state', setSessionState);
  }, [sessionId]);

  const injectMessage = (message: string) => {
    ws.send({
      type: 'inject_message',
      sessionId,
      message
    });
    setMessageQueue([...messageQueue, message]);
  };

  return (
    <div className="control-dashboard">
      <SessionStatus state={sessionState} />
      <MessageInjector onInject={injectMessage} queue={messageQueue} />
      <DirectoryControls sessionId={sessionId} />
      <PolicyManager sessionId={sessionId} />
      <ExecutionTimeline events={sessionState?.events} />
    </div>
  );
}
```

### 2. Real-time Tool Monitor

```typescript
// apps/web/src/components/control/ToolMonitor.tsx
interface ToolCall {
  id: string;
  tool: string;
  input: any;
  status: 'pending' | 'approved' | 'blocked' | 'completed';
  timestamp: string;
}

export function ToolMonitor({ sessionId }: { sessionId: string }) {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const ws = useWebSocket();

  useEffect(() => {
    ws.on('tool_call', (event) => {
      if (event.sessionId === sessionId) {
        setToolCalls(prev => [...prev, event.toolCall]);
      }
    });
  }, [sessionId]);

  const modifyToolCall = (id: string, changes: any) => {
    ws.send({
      type: 'modify_tool',
      sessionId,
      toolCallId: id,
      changes
    });
  };

  const blockToolCall = (id: string, reason: string) => {
    ws.send({
      type: 'block_tool',
      sessionId,
      toolCallId: id,
      reason
    });
  };

  return (
    <div className="tool-monitor">
      <ToolFilter value={filter} onChange={setFilter} />
      <div className="tool-list">
        {toolCalls
          .filter(tc => filter === 'all' || tc.tool === filter)
          .map(toolCall => (
            <ToolCallCard
              key={toolCall.id}
              toolCall={toolCall}
              onModify={modifyToolCall}
              onBlock={blockToolCall}
            />
          ))}
      </div>
    </div>
  );
}
```

### 3. Directory Access Control UI

```typescript
// apps/web/src/components/control/DirectoryControls.tsx
export function DirectoryControls({ sessionId }: { sessionId: string }) {
  const [config, setConfig] = useState({
    blockedDirs: [],
    allowedDirs: [],
    restrictToAllowed: false
  });

  const addBlockedDirectory = (dir: string) => {
    const newConfig = {
      ...config,
      blockedDirs: [...config.blockedDirs, dir]
    };
    setConfig(newConfig);
    updateServerConfig(newConfig);
  };

  const updateServerConfig = (newConfig: any) => {
    fetch('/api/control/access-config', {
      method: 'POST',
      body: JSON.stringify({ sessionId, config: newConfig })
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Directory Access Control</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DirectoryList
            title="Blocked Directories"
            directories={config.blockedDirs}
            onAdd={addBlockedDirectory}
            onRemove={(dir) => {
              setConfig({
                ...config,
                blockedDirs: config.blockedDirs.filter(d => d !== dir)
              });
            }}
          />
          
          <DirectoryList
            title="Allowed Directories"
            directories={config.allowedDirs}
            onAdd={(dir) => {
              setConfig({
                ...config,
                allowedDirs: [...config.allowedDirs, dir]
              });
            }}
          />
          
          <Switch
            checked={config.restrictToAllowed}
            onCheckedChange={(checked) => {
              setConfig({ ...config, restrictToAllowed: checked });
            }}
            label="Restrict to allowed directories only"
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Policy Builder UI

```typescript
// apps/web/src/components/control/PolicyBuilder.tsx
interface Policy {
  id: string;
  name: string;
  match: {
    tools?: string[];
    pathPattern?: string;
  };
  conditions: Array<{
    type: string;
    value: any;
  }>;
  action: 'block' | 'approve' | 'redirect';
  message?: string;
}

export function PolicyBuilder() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);

  return (
    <div className="policy-builder">
      <div className="policy-list">
        {policies.map(policy => (
          <PolicyCard
            key={policy.id}
            policy={policy}
            onEdit={() => setEditingPolicy(policy)}
            onDelete={() => deletePolicy(policy.id)}
          />
        ))}
      </div>
      
      {editingPolicy && (
        <PolicyEditor
          policy={editingPolicy}
          onSave={(updated) => {
            updatePolicy(updated);
            setEditingPolicy(null);
          }}
          onCancel={() => setEditingPolicy(null)}
        />
      )}
      
      <Button onClick={() => setEditingPolicy(createNewPolicy())}>
        Add Policy
      </Button>
    </div>
  );
}
```

### 5. Session Timeline Visualization

```typescript
// apps/web/src/components/control/ExecutionTimeline.tsx
export function ExecutionTimeline({ events }: { events: TimelineEvent[] }) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [timeRange, setTimeRange] = useState({ start: 0, end: 100 });

  return (
    <div className="execution-timeline">
      <TimelineControls
        onZoom={(delta) => adjustZoom(delta)}
        onPan={(delta) => adjustPan(delta)}
        onReset={() => setTimeRange({ start: 0, end: 100 })}
      />
      
      <div className="timeline-container">
        <svg width="100%" height="200">
          {events
            .filter(e => isInTimeRange(e, timeRange))
            .map((event, i) => (
              <TimelineItem
                key={event.id}
                event={event}
                y={getEventY(event.type)}
                x={getEventX(event.timestamp, timeRange)}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
        </svg>
      </div>
      
      {selectedEvent && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onReplay={() => replayFromEvent(selectedEvent)}
        />
      )}
    </div>
  );
}
```

## API Integration

### 1. Control API Endpoints

```typescript
// apps/api-server/src/routes/control.ts
import { Router } from 'express';
import { ControlService } from '../services/control-service';

const router = Router();
const controlService = new ControlService();

// Session control endpoints
router.post('/sessions/:sessionId/inject-message', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  
  const result = await controlService.injectMessage(sessionId, message);
  res.json(result);
});

router.post('/sessions/:sessionId/modify-tool', async (req, res) => {
  const { sessionId } = req.params;
  const { toolCallId, changes } = req.body;
  
  const result = await controlService.modifyToolCall(sessionId, toolCallId, changes);
  res.json(result);
});

// Access control endpoints
router.get('/sessions/:sessionId/access-config', async (req, res) => {
  const config = await controlService.getAccessConfig(req.params.sessionId);
  res.json(config);
});

router.put('/sessions/:sessionId/access-config', async (req, res) => {
  const result = await controlService.updateAccessConfig(
    req.params.sessionId,
    req.body
  );
  res.json(result);
});

// Policy management
router.get('/policies', async (req, res) => {
  const policies = await controlService.getPolicies();
  res.json(policies);
});

router.post('/policies', async (req, res) => {
  const policy = await controlService.createPolicy(req.body);
  res.json(policy);
});

export default router;
```

### 2. Control Service Implementation

```typescript
// apps/api-server/src/services/control-service.ts
import { Redis } from 'ioredis';
import { WebSocket } from 'ws';

export class ControlService {
  private redis: Redis;
  private ws: WebSocket;
  
  constructor() {
    this.redis = new Redis();
    this.ws = new WebSocket('ws://localhost:8765');
  }
  
  async injectMessage(sessionId: string, message: string) {
    // Add to Redis queue
    await this.redis.rpush(`messages:${sessionId}`, message);
    
    // Notify orchestrator
    this.ws.send(JSON.stringify({
      type: 'inject_message',
      sessionId,
      message
    }));
    
    return { status: 'queued', sessionId, message };
  }
  
  async modifyToolCall(sessionId: string, toolCallId: string, changes: any) {
    // Store modification request
    await this.redis.set(
      `tool-mod:${sessionId}:${toolCallId}`,
      JSON.stringify(changes),
      'EX',
      60 // Expire after 60 seconds
    );
    
    return { status: 'pending', toolCallId, changes };
  }
  
  async getSessionState(sessionId: string) {
    const state = await this.redis.get(`session:${sessionId}:state`);
    return state ? JSON.parse(state) : null;
  }
  
  async createPolicy(policy: any) {
    const id = generateId();
    const policyWithId = { ...policy, id };
    
    await this.redis.hset('policies', id, JSON.stringify(policyWithId));
    
    // Notify orchestrator to reload policies
    this.ws.send(JSON.stringify({
      type: 'reload_policies'
    }));
    
    return policyWithId;
  }
}
```

## Enhanced Log Processing

### 1. Control Event Parser

```typescript
// packages/core/src/parsers/control-event-parser.ts
export class ControlEventParser {
  parse(logEntry: LogEntry): ControlEvent | null {
    if (logEntry.type !== 'control_event') {
      return null;
    }
    
    return {
      id: logEntry.id,
      timestamp: logEntry.timestamp,
      eventType: logEntry.event_type,
      sessionId: logEntry.session_id,
      data: this.parseEventData(logEntry.data)
    };
  }
  
  private parseEventData(data: any): any {
    switch (data.type) {
      case 'message_injected':
        return {
          message: data.message,
          source: 'user_control'
        };
        
      case 'tool_modified':
        return {
          toolCallId: data.tool_call_id,
          originalInput: data.original,
          modifiedInput: data.modified
        };
        
      case 'policy_applied':
        return {
          policyName: data.policy_name,
          action: data.action,
          reason: data.reason
        };
        
      default:
        return data;
    }
  }
}
```

### 2. Enhanced Session Scanner

```typescript
// packages/log-processor/src/enhanced-session-scanner.ts
export class EnhancedSessionScanner extends SessionScanner {
  private controlEventParser = new ControlEventParser();
  
  protected async processLogEntry(entry: LogEntry) {
    // Process normal log entries
    await super.processLogEntry(entry);
    
    // Check for control events
    const controlEvent = this.controlEventParser.parse(entry);
    if (controlEvent) {
      await this.processControlEvent(controlEvent);
    }
  }
  
  private async processControlEvent(event: ControlEvent) {
    // Update session state with control information
    const session = await this.getSession(event.sessionId);
    
    session.controlEvents = session.controlEvents || [];
    session.controlEvents.push(event);
    
    // Emit for real-time updates
    this.emit('control-event', {
      sessionId: event.sessionId,
      event
    });
    
    await this.saveSession(session);
  }
}
```

## UI State Management

### 1. Control Store

```typescript
// apps/web/src/stores/control-store.ts
import { create } from 'zustand';
import { ControlState, ControlAction } from '@claude-codex/types';

interface ControlStore {
  sessions: Map<string, ControlState>;
  activeSessionId: string | null;
  
  // Actions
  setActiveSession: (sessionId: string) => void;
  updateSessionState: (sessionId: string, state: Partial<ControlState>) => void;
  injectMessage: (sessionId: string, message: string) => Promise<void>;
  modifyToolCall: (sessionId: string, toolId: string, changes: any) => Promise<void>;
  createPolicy: (policy: any) => Promise<void>;
}

export const useControlStore = create<ControlStore>((set, get) => ({
  sessions: new Map(),
  activeSessionId: null,
  
  setActiveSession: (sessionId) => {
    set({ activeSessionId: sessionId });
  },
  
  updateSessionState: (sessionId, state) => {
    set((prev) => {
      const sessions = new Map(prev.sessions);
      const current = sessions.get(sessionId) || {};
      sessions.set(sessionId, { ...current, ...state });
      return { sessions };
    });
  },
  
  injectMessage: async (sessionId, message) => {
    const response = await fetch(`/api/control/sessions/${sessionId}/inject-message`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    
    if (response.ok) {
      get().updateSessionState(sessionId, {
        messageQueue: [...(get().sessions.get(sessionId)?.messageQueue || []), message]
      });
    }
  },
  
  // ... other actions
}));
```

### 2. Real-time Sync Hook

```typescript
// apps/web/src/hooks/useControlSync.ts
export function useControlSync(sessionId: string) {
  const ws = useWebSocket();
  const updateState = useControlStore(s => s.updateSessionState);
  
  useEffect(() => {
    if (!sessionId || !ws.connected) return;
    
    // Subscribe to session events
    ws.send({
      type: 'subscribe',
      sessionId,
      events: ['state_change', 'tool_call', 'control_event']
    });
    
    // Handle incoming events
    const handlers = {
      state_change: (data: any) => {
        updateState(sessionId, data.state);
      },
      tool_call: (data: any) => {
        updateState(sessionId, {
          recentTools: [...(data.recentTools || []), data.toolCall]
        });
      },
      control_event: (data: any) => {
        updateState(sessionId, {
          controlEvents: [...(data.controlEvents || []), data.event]
        });
      }
    };
    
    Object.entries(handlers).forEach(([event, handler]) => {
      ws.on(event, handler);
    });
    
    return () => {
      Object.keys(handlers).forEach(event => ws.off(event));
    };
  }, [sessionId, ws.connected]);
}
```

## Integration Points

1. **Session List Enhancement**: Add control indicators to show which sessions have active control
2. **Tool View Enhancement**: Show real-time status and allow modification
3. **New Control Tab**: Dedicated tab for power user controls
4. **Settings Integration**: Add control configuration to settings
5. **Notification System**: Real-time alerts for blocked tools, policy violations

This architecture seamlessly integrates advanced control capabilities into the Claude Codex UI while maintaining the existing log viewing functionality.