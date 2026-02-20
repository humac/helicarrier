import { create } from 'zustand';
import { killAgent, steerAgent, killAllAgents } from '@/lib/api';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'terminated';

export interface Agent {
  id: string;
  name: string;
  parentId?: string; // null for main agent
  status: AgentStatus;
  model?: string;
  lastActive: number;
}

export interface LogEntry {
  id: string;
  agentId: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: unknown;
}

interface AgentState {
  agents: Record<string, Agent>;
  logs: LogEntry[];
  selectedAgentId: string | null;
  isConnected: boolean;
  isOperatorMode: boolean;
  
  // Actions
  upsertAgent: (agent: Agent) => void;
  addLog: (log: LogEntry) => void;
  selectAgent: (agentId: string | null) => void;
  setConnectionStatus: (status: boolean) => void;
  toggleOperatorMode: () => void;
  clearLogs: () => void;
  
  // Async Actions
  killAgentAction: (agentId: string) => Promise<boolean>;
  steerAgentAction: (agentId: string, message: string) => Promise<boolean>;
  killAllAgentsAction: () => Promise<boolean>;
}

export const useAgentStore = create<AgentState>((set) => ({
  agents: {},
  logs: [],
  selectedAgentId: null,
  isConnected: false,
  isOperatorMode: false,

  upsertAgent: (agent) => set((state) => ({
    agents: { ...state.agents, [agent.id]: agent }
  })),

  addLog: (log) => set((state) => {
    // Keep last 1000 logs to prevent memory explosion
    const newLogs = [...state.logs, log];
    if (newLogs.length > 1000) {
      newLogs.shift();
    }
    return { logs: newLogs };
  }),

  selectAgent: (agentId) => set({ selectedAgentId: agentId }),
  
  setConnectionStatus: (status) => set({ isConnected: status }),
  toggleOperatorMode: () => set((state) => ({ isOperatorMode: !state.isOperatorMode })),

  clearLogs: () => set({ logs: [] }),

  killAgentAction: async (agentId) => {
    try {
      // Optimistic update: mark as terminating? 
      // For now, let's just call API. The websocket will update the status.
      await killAgent(agentId);
      return true;
    } catch (error) {
      console.error(`Failed to kill agent ${agentId}:`, error);
      return false;
    }
  },

  steerAgentAction: async (agentId, message) => {
    try {
      await steerAgent(agentId, message);
      return true;
    } catch (error) {
      console.error(`Failed to steer agent ${agentId}:`, error);
      return false;
    }
  },

  killAllAgentsAction: async () => {
    try {
      await killAllAgents();
      return true;
    } catch (error) {
      console.error('Failed to kill all agents:', error);
      return false;
    }
  },
}));
