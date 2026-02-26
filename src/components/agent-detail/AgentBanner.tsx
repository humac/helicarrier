'use client';

import React from 'react';
import { Agent } from '@/store/agentStore';
import { Hexagon, Cpu, Clock, Activity } from 'lucide-react';
import { clsx } from 'clsx';

interface AgentBannerProps {
  agent: Agent;
}

export function AgentBanner({ agent }: AgentBannerProps) {
  const statusColors = {
    idle: 'text-gray-400 bg-gray-800',
    running: 'text-green-400 bg-green-900/20',
    paused: 'text-yellow-400 bg-yellow-900/20',
    error: 'text-red-400 bg-red-900/20',
    terminated: 'text-gray-500 bg-gray-900',
  };

  const statusLabels = {
    idle: 'IDLE',
    running: 'RUNNING',
    paused: 'PAUSED',
    error: 'ERROR',
    terminated: 'TERMINATED',
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-950 border-b border-gray-800 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={clsx(
            "p-3 rounded-lg",
            agent.status === 'running' ? 'bg-blue-900/30 text-blue-400' :
            agent.status === 'error' ? 'bg-red-900/30 text-red-400' :
            'bg-gray-800 text-gray-400'
          )}>
            <Hexagon size={32} strokeWidth={2} />
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
                {agent.name}
              </h1>
              <span className={clsx(
                "px-2 py-0.5 text-xs font-mono font-bold rounded uppercase tracking-wider",
                statusColors[agent.status]
              )}>
                {statusLabels[agent.status]}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1.5">
                <Cpu size={14} />
                <span className="font-mono">{agent.id}</span>
              </div>
              
              {agent.model && (
                <div className="flex items-center gap-1.5">
                  <Activity size={14} />
                  <span>{agent.model}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>Last active: {formatTimestamp(agent.lastActive)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
