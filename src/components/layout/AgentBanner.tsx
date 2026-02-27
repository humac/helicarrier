'use client';

import { ChevronDown, ChevronUp, RefreshCw, Bot, Zap, Users, Clock } from 'lucide-react';
import { useAgentStore } from '@/store/agentStore';
import { useUIStore } from '@/store/uiStore';
import { useEffect } from 'react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function AgentBanner() {
  const { status, subAgents, isLoading, refresh } = useAgentStore();
  const { bannerCollapsed, toggleBanner } = useUIStore();

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [refresh]);

  if (!status) {
    return (
      <div className="bg-bg-secondary border-b border-border-default p-4">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-10 h-10 bg-bg-tertiary rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-bg-tertiary rounded w-1/4" />
            <div className="h-3 bg-bg-tertiary rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    online: 'bg-status-online',
    busy: 'bg-status-busy',
    offline: 'bg-status-offline',
  };

  return (
    <div className="bg-bg-secondary border-b border-border-default">
      {/* Main Banner */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-10 h-10 bg-accent-primary/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-accent-primary" aria-hidden="true" />
              </div>
              <div
                className={cn(
                  'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-bg-secondary',
                  statusColors[status.status]
                )}
                aria-label={`Status: ${status.status}`}
              />
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-text-primary">{status.name}</h2>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  status.status === 'online' && 'bg-status-online/20 text-status-online',
                  status.status === 'busy' && 'bg-status-busy/20 text-status-busy',
                  status.status === 'offline' && 'bg-status-offline/20 text-status-offline',
                )}>
                  {status.status}
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Last seen {formatRelativeTime(status.lastSeen)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Zap className="w-4 h-4" aria-hidden="true" />
                <span>{status.messagesSent24h} msgs</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>{status.activeSubAgents} agents</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Clock className="w-4 h-4" aria-hidden="true" />
                <span>{Math.floor(status.uptime / 3600000)}h uptime</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
                aria-label="Refresh status"
              >
                <RefreshCw className={cn('w-4 h-4 text-text-secondary', isLoading && 'animate-spin')} />
              </button>
              <button
                onClick={toggleBanner}
                className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                aria-label={bannerCollapsed ? 'Expand banner' : 'Collapse banner'}
              >
                {bannerCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-text-secondary" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {!bannerCollapsed && (
        <div className="px-4 pb-4 border-t border-border-subtle pt-3">
          {/* Capabilities */}
          <div className="mb-3">
            <h3 className="text-xs font-medium text-text-muted mb-2">CAPABILITIES</h3>
            <div className="flex flex-wrap gap-2">
              {status.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="text-xs px-2 py-1 bg-bg-tertiary text-text-secondary rounded-md border border-border-subtle"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          {/* Sub-agents */}
          {subAgents.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-muted mb-2">ACTIVE SUB-AGENTS</h3>
              <div className="flex flex-wrap gap-2">
                {subAgents.map((agent) => (
                  <span
                    key={agent.id}
                    className="text-xs px-2 py-1 bg-accent-primary/10 text-accent-primary rounded-md border border-accent-primary/20"
                  >
                    {agent.label || agent.id.slice(0, 8)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
