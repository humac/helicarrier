// Gateway request/response types
export interface GatewayRequest {
  tool: string;
  action: string;
  params?: Record<string, unknown>;
}

export interface GatewayResponse<T> {
  ok: boolean;
  result?: {
    content: Array<{ type: string; text?: string; name?: string; arguments?: Record<string, unknown> }>;
    details?: Record<string, unknown>;
  };
  error?: {
    code: string;
    message: string;
  };
}

// API response envelope
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: number;
}

// Message types (content can be string OR array)
export interface Message {
  id: string;
  content: string | MessageContentPart[];
  timestamp: number;  // epoch milliseconds
  channel: string;
  author: string;
  tool?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface MessageContentPart {
  type: string;
  text?: string;
  name?: string;
  arguments?: Record<string, unknown>;
  [key: string]: unknown;
}

// Session types
export interface Session {
  id: string;
  requester: string;
  createdAt: number;  // epoch ms
  updatedAt: number;  // epoch ms
  model?: string;
  status?: string;
  messageCount?: number;
}

// Cron job types (schedule can be string OR object)
export interface CronJob {
  id: string;
  name: string;
  schedule: string | CronScheduleObject;
  command: string;
  enabled: boolean;
  lastRun?: number;  // epoch ms
  nextRun?: number;  // epoch ms
  history?: JobExecution[];
}

export interface CronScheduleObject {
  kind: string;
  expr: string;
  timezone?: string;
  enabled?: boolean;
}

export interface JobExecution {
  timestamp: number;  // epoch ms
  duration: number;   // milliseconds
  success: boolean;
  output?: string;
}

// Agent status
export interface AgentStatus {
  name: string;
  status: 'online' | 'busy' | 'offline';
  messagesSent24h: number;
  activeSubAgents: number;
  uptime: number;  // milliseconds
  capabilities: string[];
  lastSeen: number;  // epoch ms
}

// Sub-agent info
export interface SubAgent {
  id: string;
  label?: string;
  createdAt: number;
  status?: string;
}

// Search result
export interface SearchResult {
  id: string;
  content: string;
  timestamp: number;
  channel: string;
  author: string;
  relevance?: number;
}

// Gateway status
export interface GatewayStatus {
  healthy: boolean;
  version?: string;
  uptime?: number;
  activeSessions?: number;
}
