import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAgentStore, Agent, LogEntry } from '@/store/agentStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';

export function useAgentSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { upsertAgent, addLog, setConnectionStatus } = useAgentStore();

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to OpenClaw Gateway');
      setConnectionStatus(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Gateway');
      setConnectionStatus(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnectionStatus(false);
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
  }, [upsertAgent, addLog, setConnectionStatus]);
}
