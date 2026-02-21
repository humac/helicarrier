import { create } from 'zustand';

interface GatewayState {
  isConnected: boolean;
  connectionStatus: 'connected' | 'degraded' | 'offline' | 'recovering';
  retryCount: number;
  lastHeartbeat: number | null;
  
  setIsConnected: (status: boolean) => void;
  setConnectionStatus: (status: 'connected' | 'degraded' | 'offline' | 'recovering') => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  updateHeartbeat: () => void;
}

export const useGatewayStore = create<GatewayState>((set) => ({
  isConnected: false,
  connectionStatus: 'offline',
  retryCount: 0,
  lastHeartbeat: null,

  setIsConnected: (isConnected) => set({ 
    isConnected,
    connectionStatus: isConnected ? 'connected' : 'offline'
  }),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  incrementRetryCount: () => set((state) => ({ retryCount: state.retryCount + 1 })),
  
  resetRetryCount: () => set({ retryCount: 0 }),
  
  updateHeartbeat: () => set({ lastHeartbeat: Date.now() })
}));
