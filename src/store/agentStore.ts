import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AgentStatus, SubAgent } from '@/lib/types';

interface AgentState {
  status: AgentStatus | null;
  subAgents: SubAgent[];
  isLoading: boolean;
  error: Error | null;
  setStatus: (status: AgentStatus) => void;
  setSubAgents: (subAgents: SubAgent[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  refresh: () => Promise<void>;
}

export const useAgentStore = create<AgentState>()(
  devtools((set, get) => ({
    status: null,
    subAgents: [],
    isLoading: false,
    error: null,
    
    setStatus: (status) => set({ status, error: null }),
    setSubAgents: (subAgents) => set({ subAgents }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    
    refresh: async () => {
      set({ isLoading: true });
      try {
        // Fetch agent status
        const statusResponse = await fetch('/api/status');
        const statusData = await statusResponse.json();
        if (statusData.success) {
          // Create a pseudo agent status from gateway status
          set({ 
            status: {
              name: 'Jarvis',
              status: statusData.data.healthy ? 'online' : 'offline',
              messagesSent24h: 0,
              activeSubAgents: 0,
              uptime: statusData.data.uptime || 0,
              capabilities: ['message', 'subagents', 'healthcheck'],
              lastSeen: Date.now(),
            }
          });
        }
        
        // Fetch sub-agents
        const sessionsResponse = await fetch('/api/sessions');
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.success) {
          set({ subAgents: sessionsData.data || [] });
          // Update active sub-agents count
          const currentStatus = get().status;
          if (currentStatus) {
            set({
              status: {
                ...currentStatus,
                activeSubAgents: sessionsData.data?.length || 0,
              }
            });
          }
        }
      } catch (error) {
        set({ error: error as Error });
      } finally {
        set({ isLoading: false });
      }
    },
  }))
);
