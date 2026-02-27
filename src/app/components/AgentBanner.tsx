'use client';

import React, { useState, useEffect } from 'react';
import { useAgentBannerData } from '../hooks/useOpenClaw';

export function AgentBanner() {
  const [expanded, setExpanded] = useState(false);
  const { status, versionInfo, sessions, loading } = useAgentBannerData();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute for "updated recently" calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const isSessionUpdatedRecently = (updatedAt: number) => {
    const twoMinutesAgo = currentTime - 2 * 60 * 1000;
    return updatedAt > twoMinutesAgo;
  };

  const getActiveSessionsCount = () => {
    // Defensive check: ensure sessions is an array before filtering
    if (!Array.isArray(sessions)) return 0;
    return sessions.filter((s) => s && s.status === 'active').length;
  };

  const getAgentName = () => {
    if (loading) return 'Loading...';
    if (status?.agentName) return status.agentName;
    return 'Helicarrier Agent';
  };

  const getVersion = () => {
    if (loading) return '...';
    if (versionInfo?.current) return versionInfo.current;
    if (status?.version) return status.version;
    return '0.0.0';
  };

  const getUpToDateStatus = () => {
    if (loading) return null;
    if (!versionInfo) return null;
    return versionInfo.upToDate;
  };

  return (
    <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      {/* Collapsible Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 text-left hover:bg-gray-800/50 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-indigo-600">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">
                {getAgentName()}
              </span>
              {getUpToDateStatus() !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    getUpToDateStatus()
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {getUpToDateStatus() ? 'up-to-date' : 'update available'}
                </span>
              )}
              <span className="text-xs text-gray-500 font-mono">
                v{getVersion()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">
                {status?.model || 'unknown model'}
              </span>
              <span className="text-xs text-gray-600">|</span>
              <span className="text-xs text-gray-400">
                {status?.contextUsage ? 
                  `${Math.round((status.contextUsage.current / status.contextUsage.max) * 100)}% ctx` : 
                  '0% ctx'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{getActiveSessionsCount()} active</span>
            <span className="text-gray-600">|</span>
            <span>{status?.runtimeMode || 'unknown'}</span>
          </div>
          <span className={`text-lg transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Connected Resources Row */}
          {status?.resources && status.resources.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {status.resources.map((resource, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                >
                  📡 {resource}
                </span>
              ))}
            </div>
          )}

          {/* Capabilities Row */}
          {status?.capabilities && status.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {status.capabilities.map((capability, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                >
                  ⚡ {capability}
                </span>
              ))}
            </div>
          )}

          {/* Sub-Agents Section */}
          {sessions && Array.isArray(sessions) && sessions.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Sub-Agents ({sessions.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {sessions && sessions.map((session) => session && (
                  <div
                    key={session?.id}
                    className="flex items-center justify-between p-2 rounded-md bg-gray-800/50 border border-gray-700/50"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          session.status === 'active'
                            ? 'bg-green-500'
                            : session.status === 'idle'
                              ? 'bg-yellow-500'
                              : session.status === 'completed'
                                ? 'bg-gray-500'
                                : 'bg-red-500'
                        } ${
                          isSessionUpdatedRecently(session.updatedAt) && 
                          (session.status === 'active' || session.status === 'idle')
                            ? 'animate-pulse'
                            : ''
                        }`}
                      />
                      <span className="text-xs text-gray-300 truncate">
                        {session.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Info Row */}
          <div className="mt-3 pt-3 border-t border-gray-800">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <div>
                <span className="text-gray-600">Workspace:</span>{' '}
                <span className="font-mono text-gray-400 truncate max-w-xs inline-block">
                  {process.env.NEXT_PUBLIC_WORKSPACE_PATH || '~/.openclaw/workspace'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">GitHub:</span>{' '}
                <span className="font-mono text-gray-400">
                  {process.env.NEXT_PUBLIC_GITHUB_USERNAME || 'unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
