import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAgentStore, Agent, LogEntry } from '@/store/agentStore';
import { useGatewayStore } from '@/store/gatewayStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:18789';

export function useAgentSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { upsertAgent, addLog } = useAgentStore();
  const { setIsConnected, setConnectionStatus, incrementRetryCount, resetRetryCount } = useGatewayStore();

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) return;

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity, // Keep trying indefinitely
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to OpenClaw Gateway');
      setIsConnected(true);
      setConnectionStatus('connected');
      resetRetryCount();
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Gateway:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
      setConnectionStatus('offline');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
      setConnectionStatus('recovering');
      incrementRetryCount();
    });
    
    socket.on('reconnect_attempt', () => {
      setConnectionStatus('recovering');
      incrementRetryCount();
    });

    // Handle agent updates
    socket.on('agent:update', (data: Agent) => {
      upsertAgent(data);
    });

    // Handle log events
    socket.on('agent:log', (data: LogEntry) => {
      addLog(data);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [upsertAgent, addLog, setIsConnected, setConnectionStatus, incrementRetryCount, resetRetryCount]);
}
