'use client';

import React from 'react';
import { useAgentSocket } from '@/hooks/useAgentSocket';
import AgentTree from '@/components/AgentTree';
import LogViewer from '@/components/LogViewer';
import DashboardStats from '@/components/DashboardStats';
import GlobalControls from '@/components/GlobalControls';
import { Hexagon } from 'lucide-react';

export default function Home() {
  // Initialize WebSocket connection
  useAgentSocket();

  return (
    <div className="flex flex-col h-full bg-black text-gray-200 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-gray-950 border-b border-gray-800 shrink-0 h-16">
        <div className="flex items-center gap-3">
          <div className="text-blue-500">
            <Hexagon size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-100 leading-none">
              HELICARRIER
            </h1>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              Hologram v0.1.0
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <GlobalControls />
          <div className="text-xs text-gray-600 font-mono border-l border-gray-800 pl-4 ml-2">
            CONNECTED: LOCALHOST:8080
          </div>
        </div>
      </header>
      
      {/* Metrics Banner */}
      <DashboardStats />
      
      {/* Main Content Split */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar: Agent Tree */}
        <aside className="w-80 min-w-[250px] max-w-[400px] border-r border-gray-800 flex flex-col bg-gray-950">
          <AgentTree />
        </aside>
        
        {/* Main Area: Logs */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-950 relative">
          <LogViewer />
        </main>
      </div>
    </div>
  );
}
