'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Timeline from './Timeline';
import FilterBar from './FilterBar';
import { flattenHistory, formatTimestamp } from '@/app/feed/lib/feedUtils';
import { FeedItem, FilterType } from '@/lib/types';

interface FeedSession {
  id: string;
  label: string;
}

interface FeedHistory {
  [sessionId: string]: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: number;
    content: Array<{ type: 'text'; text: string } | { type: 'toolCall'; name: string; arguments: string }>;
  }[];
}

// Polling hook for automatic refresh
function usePolling(callback: () => void, interval: number, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const id = setInterval(callback, interval);
    return () => clearInterval(id);
  }, [callback, interval, enabled]);
}

export default function FeedContainer() {
  const [sessions, setSessions] = useState<FeedSession[]>([]);
  const [histories, setHistories] = useState<FeedHistory>({});
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch feed data
  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sessions
      const sessionsRes = await fetch('/api/sessions');
      if (!sessionsRes.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const response = await sessionsRes.json();
      const sessionsData = response.sessions || response;

      // Fetch histories for all sessions
      const historyPromises = sessionsData.map(async (session: FeedSession) => {
        try {
          const historyRes = await fetch(`/api/sessions/${session.id}/history`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            return { sessionId: session.id, history: historyData };
          }
          return { sessionId: session.id, history: [] };
        } catch {
          return { sessionId: session.id, history: [] };
        }
      });

      const historiesData = await Promise.all(historyPromises);
      const historiesMap: FeedHistory = {};
      historiesData.forEach(({ sessionId, history }) => {
        historiesMap[sessionId] = history;
      });

      // Flatten and set feed items
      const flattened = flattenHistory(sessionsData, historiesMap);
      setSessions(sessionsData);
      setHistories(historiesMap);
      setFeedItems(flattened);
      setLastUpdate(new Date());

    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh every 30 seconds
  usePolling(fetchFeed, 30000, true);

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    if (selectedFilter === 'all') {
      return feedItems;
    }
    return feedItems.filter((item) => item.type === selectedFilter);
  }, [feedItems, selectedFilter]);

  // Calculate item counts for filter buttons
  const itemCounts = useMemo(() => {
    return {
      all: feedItems.length,
      user: feedItems.filter((item) => item.type === 'user').length,
      assistant: feedItems.filter((item) => item.type === 'assistant').length,
      tool: feedItems.filter((item) => item.type === 'tool').length,
    };
  }, [feedItems]);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header with last update time */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-200">Feed</h2>
          {loading && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <span>Updated: {lastUpdate ? formatTimestamp(lastUpdate.getTime()) : 'Never'}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        itemCounts={itemCounts}
      />

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-950/30 border-b border-red-900/50 text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Timeline */}
      <Timeline items={filteredItems} loading={loading} />

      {/* Auto-refresh indicator */}
      {!error && !loading && feedItems.length > 0 && (
        <div className="p-2 text-center text-xs text-gray-600 border-t border-gray-800 bg-gray-950">
          Auto-refresh enabled (30s)
        </div>
      )}
    </div>
  );
}
