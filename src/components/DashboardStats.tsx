import React, { useMemo } from 'react';
import { useAgentStore } from '@/store/agentStore';
import { Brain, Wifi, ShieldCheck, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export default function DashboardStats() {
  const { agents, isConnected } = useAgentStore();

  const stats = useMemo(() => {
    const totalAgents = Object.keys(agents).length;
    const runningAgents = Object.values(agents).filter(a => a.status === 'running').length;
    const errorAgents = Object.values(agents).filter(a => a.status === 'error').length;
    
    // Mock token usage until Gateway provides it
    const totalTokens = 0; // TODO: Implement real metrics
    
    return {
      totalAgents,
      runningAgents,
      errorAgents,
      totalTokens,
    };
  }, [agents]);

  return (
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-900 border-b border-gray-800 shrink-0">
      <div className="bg-gray-800 p-3 rounded flex items-center gap-3">
        <div className={clsx("p-2 rounded bg-gray-900", isConnected ? "text-green-500" : "text-red-500")}>
          <Wifi size={20} />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-bold">Gateway</div>
          <div className={clsx("text-lg font-mono font-bold leading-none", isConnected ? "text-green-400" : "text-red-400")}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-3 rounded flex items-center gap-3">
        <div className="p-2 rounded bg-gray-900 text-blue-500">
          <Activity size={20} />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-bold">Active Agents</div>
          <div className="text-lg font-mono font-bold leading-none text-gray-200">
            {stats.runningAgents} <span className="text-xs text-gray-600">/ {stats.totalAgents}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-3 rounded flex items-center gap-3">
        <div className="p-2 rounded bg-gray-900 text-purple-500">
          <Brain size={20} />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-bold">Token Usage</div>
          <div className="text-lg font-mono font-bold leading-none text-gray-200">
            {stats.totalTokens.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-3 rounded flex items-center gap-3">
        <div className={clsx("p-2 rounded bg-gray-900", stats.errorAgents > 0 ? "text-red-500" : "text-gray-500")}>
          <ShieldCheck size={20} />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase font-bold">System Health</div>
          <div className={clsx("text-lg font-mono font-bold leading-none", stats.errorAgents > 0 ? "text-red-400" : "text-green-400")}>
            {stats.errorAgents > 0 ? `${stats.errorAgents} ERRORS` : 'STABLE'}
          </div>
        </div>
      </div>
    </div>
  );
}
