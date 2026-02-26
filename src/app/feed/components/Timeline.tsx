import React from 'react';
import TimelineItem from './TimelineItem';
import { FeedItem } from '@/lib/types';

interface TimelineProps {
  items: FeedItem[];
  loading?: boolean;
}

export default function Timeline({ items, loading }: TimelineProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 animate-pulse">Loading feed...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="text-gray-600 mb-2">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500">No feed items yet</p>
        <p className="text-xs text-gray-600 mt-1">Start a session to see activity</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
      <div className="max-w-3xl mx-auto">
        {items.map((item) => (
          <TimelineItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
