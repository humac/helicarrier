// === Gateway Responses ===

export interface Session {
  id: string;
  label: string;
  model: string;
  tokenCount: number;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  status: "active" | "idle" | "completed";
}

export interface HistoryEntry {
  id: string;
  role: "user" | "assistant" | "system";
  timestamp: number; // epoch ms
  content: ContentPart[];
}

export type ContentPart = 
  | { type: "text"; text: string }
  | { type: "toolCall"; name: string; arguments: string };

export interface CronJob {
  id: string;
  name: string;
  schedule: {
    kind: "cron";
    expr: string; // "0 5 * * *"
    tz?: string;
  };
  enabled: boolean;
  lastRun?: number; // epoch ms
  nextRun?: number; // epoch ms
}

export interface CronRun {
  id: string;
  jobId: string;
  status: "success" | "failure" | "running";
  startedAt: number; // epoch ms
  completedAt?: number; // epoch ms
  output?: string;
}

export interface MemoryResult {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface FileResult {
  path: string;
  line: number;
  content: string;
}

export interface SystemStatus {
  agentName: string;
  version: string;
  model: string;
  contextUsage: { current: number; max: number };
  activeSessions: number;
  runtimeMode: string;
  capabilities: string[];
  resources: string[];
}

// === UI Types ===

export type FilterType = "all" | "user" | "assistant" | "tool";

export interface FeedItem {
  id: string;
  sessionId: string;
  sessionLabel: string;
  timestamp: number;
  type: FilterType;
  content: string;
  toolName?: string;
}

export interface SearchResults {
  memories: MemoryResult[];
  files: FileResult[];
  sessions: Session[];
  cronJobs: CronJob[];
}

// === Agent Management Types ===

export interface SubAgent {
  id: string;
  label: string;
  model: string;
  status: "active" | "idle" | "completed" | "failed";
  createdAt: number; // epoch ms
  updatedAt?: number; // epoch ms
  tokenCount?: number;
  task?: string;
}

export interface SessionCreateRequest {
  label?: string;
  model?: string;
  instruction?: string;
}

export interface SessionCreateResponse {
  id: string;
  label: string;
  model: string;
  status: "active";
  createdAt: number;
}
