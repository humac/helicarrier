'use client';

import React, { useEffect, useState } from 'react';
import { HistoryEntry } from '@/lib/types';
import { Clock, MessageSquare, Settings, FileText } from 'lucide-react';
import { clsx } from 'clsx';

interface HistoryTimelineProps {
  agentId: string;
}

export function HistoryTimeline({ agentId }: HistoryTimelineProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/sessions/${agentId}/history`);
        if (!res.ok) {
          throw new Error('Failed to fetch history');
        }
        
        const data: HistoryEntry[] = await res.json();
        setHistory(data.slice(0, 50)); // Limit to last 50 entries
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [agentId]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <MessageSquare size={16} className="text-blue-400" />;
      case 'assistant':
        return <FileText size={16} className="text-green-400" />;
      case 'system':
        return <Settings size={16} className="text-purple-400" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-blue-900/20 border-blue-800';
      case 'assistant':
        return 'bg-green-900/20 border-green-800';
      case 'system':
        return 'bg-purple-900/20 border-purple-800';
      default:
        return 'bg-gray-900 border-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.toUpperCase();
  };

  const renderContent = (content: HistoryEntry['content']) => {
    return content.map((part, idx) => {
      if (part.type === 'text') {
        return (
          <p key={idx} className="text-sm text-gray-300 whitespace-pre-wrap">
            {part.text}
          </p>
        );
      }
      if (part.type === 'toolCall') {
        return (
          <div key={idx} className="bg-gray-950 rounded p-2 mt-2 border border-gray-800">
            <p className="text-xs font-mono text-yellow-400">
              Tool: {part.name}
            </p>
            <pre className="text-xs text-gray-400 mt-1 overflow-x-auto">
              {part.arguments}
            </pre>
          </div>
        );
      }
      return null;
    });
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-4 h-4 bg-gray-800 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                <div className="h-3 bg-gray-800 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
        <p className="text-red-400 text-sm">Failed to load history: {error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        <Clock size={32} className="mx-auto text-gray-600 mb-2" />
        <p className="text-gray-500 text-sm">No history available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
        Session History ({history.length} entries)
      </h3>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {history.map((entry, index) => (
          <div 
            key={entry.id || index}
            className={clsx(
              "border rounded p-3",
              getRoleColor(entry.role)
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {getRoleIcon(entry.role)}
              <span className="text-xs font-bold text-gray-400 uppercase">
                {getRoleLabel(entry.role)}
              </span>
              <span className="text-xs text-gray-600 font-mono ml-auto">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
            
            <div className="space-y-1">
              {renderContent(entry.content)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
