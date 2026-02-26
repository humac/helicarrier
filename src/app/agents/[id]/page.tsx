'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Agent } from '@/store/agentStore';
import { useAgentSocket } from '@/hooks/useAgentSocket';
import { useGatewayStore } from '@/store/gatewayStore';
import { useAgentStore } from '@/store/agentStore';
import { AgentBanner, AgentStats, ActionPanel, HistoryTimeline } from '@/components/agent-detail';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ArrowLeft, Hexagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clsx } from 'clsx';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  
  // Initialize WebSocket connection
  useAgentSocket();
  const { isConnected } = useGatewayStore();
  const { agents } = useAgentStore();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find agent from store
    const foundAgent = agents[agentId];
    if (foundAgent) {
      setAgent(foundAgent);
      setLoading(false);
    }
  }, [agentId, agents]);

  const isTerminated = agent?.status === 'terminated';

  return (
    <div className="flex flex-col h-full bg-black text-gray-200 overflow-hidden">
      <OfflineBanner key={String(isConnected)} />

      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-gray-950 border-b border-gray-800 shrink-0 h-16">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-gray-200 hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="text-blue-500">
            <Hexagon size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-100 leading-none">
              AGENT DETAIL
            </h1>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              {agentId}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-32 bg-gray-900 rounded-lg"></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="h-48 bg-gray-900 rounded-lg"></div>
              <div className="h-48 bg-gray-900 rounded-lg"></div>
            </div>
            <div className="h-96 bg-gray-900 rounded-lg"></div>
          </div>
        ) : !agent ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-gray-600 mb-4">
              <Hexagon size={64} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-gray-400 mb-2">Agent Not Found</h2>
            <p className="text-gray-600 text-sm mb-4">
              The agent &quot;{agentId}&quot; does not exist or has been removed.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="bg-gray-800 border-gray-700 hover:bg-gray-700"
            >
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Task 4.1: Detail Layout with Agent Banner */}
            <AgentBanner agent={agent} />

            {/* Task 4.2 & 4.3: Stats and Action Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AgentStats agentId={agentId} />
              <ActionPanel agentId={agentId} isTerminated={isTerminated} />
            </div>

            {/* Task 4.4: History Timeline */}
            <HistoryTimeline agentId={agentId} />
          </div>
        )}
      </main>
    </div>
  );
}
