'use client';

import React, { useEffect, useState } from 'react';
import { Session } from '@/lib/types';
import { Cpu, Hash, Clock, Database } from 'lucide-react';
import { clsx } from 'clsx';

interface AgentStatsProps {
  agentId: string;
}

interface AgentStatsData {
  model: string;
  tokenCount: number;
  sessionCount: number;
  contextUsage?: { current: number; max: number };
}

export function AgentStats({ agentId }: AgentStatsProps) {
  const [stats, setStats] = useState<AgentStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch session details
        const res = await fetch(`/api/sessions/${agentId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch session details');
        }
        
        const session: Session = await res.json();
        
        // Fetch system status for context info
        const statusRes = await fetch('/api/status');
        let contextUsage = undefined;
        if (statusRes.ok) {
          const status = await statusRes.json();
          contextUsage = status.contextUsage;
        }
        
        setStats({
          model: session.model,
          tokenCount: session.tokenCount || 0,
          sessionCount: 1, // This is a single session detail view
          contextUsage,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [agentId]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-800 rounded w-1/3"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
        <p className="text-red-400 text-sm">Failed to load stats: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
        Agent Statistics
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-950 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <Cpu size={16} className="text-blue-400" />
            <span className="text-xs text-gray-500 uppercase font-bold">Model</span>
          </div>
          <p className="text-sm text-gray-200 font-mono truncate" title={stats.model}>
            {stats.model}
          </p>
        </div>
        
        <div className="bg-gray-950 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <Database size={16} className="text-purple-400" />
            <span className="text-xs text-gray-500 uppercase font-bold">Tokens</span>
          </div>
          <p className="text-lg font-mono font-bold text-gray-200">
            {stats.tokenCount.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-gray-950 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={16} className="text-green-400" />
            <span className="text-xs text-gray-500 uppercase font-bold">Sessions</span>
          </div>
          <p className="text-lg font-mono font-bold text-gray-200">
            {stats.sessionCount}
          </p>
        </div>
        
        <div className="bg-gray-950 rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-xs text-gray-500 uppercase font-bold">Context</span>
          </div>
          {stats.contextUsage ? (
            <div>
              <p className="text-lg font-mono font-bold text-gray-200">
                {stats.contextUsage.current.toLocaleString()}
                <span className="text-sm text-gray-500"> / {stats.contextUsage.max.toLocaleString()}</span>
              </p>
              <div className="mt-1 bg-gray-800 rounded-full h-1.5">
                <div 
                  className={clsx(
                    "h-1.5 rounded-full",
                    (stats.contextUsage.current / stats.contextUsage.max) > 0.8 
                      ? 'bg-red-500' 
                      : 'bg-blue-500'
                  )}
                  style={{ width: `${(stats.contextUsage.current / stats.contextUsage.max) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">N/A</p>
          )}
        </div>
      </div>
    </div>
  );
}
