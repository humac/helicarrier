import React from 'react';
import { formatTimestamp } from '@/app/feed/lib/feedUtils';
import { FilterType } from '@/lib/types';

interface TimelineItemProps {
  item: {
    id: string;
    sessionId: string;
    sessionLabel: string;
    timestamp: number;
    type: FilterType;
    content: string;
    toolName?: string;
  };
}

export default function TimelineItem({ item }: TimelineItemProps) {
  // Determine color based on type
  const getColor = () => {
    switch (item.type) {
      case 'tool':
        return 'bg-blue-500';
      case 'user':
        return 'bg-green-500';
      case 'assistant':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const colorClass = getColor();

  return (
    <div className="flex gap-4 p-4 hover:bg-gray-900/50 transition-colors duration-200 border-b border-gray-800 last:border-0">
      {/* Colored dot for role indicator */}
      <div className="flex flex-col items-center pt-1">
        <div className={`w-3 h-3 rounded-full ${colorClass} ring-4 ring-gray-950`} />
        <div className="w-px h-full bg-gray-800 mt-1 last:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header with session, role, and timestamp */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="font-medium text-gray-300">{item.sessionLabel}</span>
          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 uppercase tracking-wider">
            {item.type}
          </span>
          <span className="text-gray-600">{formatTimestamp(item.timestamp)}</span>
        </div>

        {/* Main content */}
        <div className="text-gray-200 text-sm leading-relaxed break-words">
          {item.type === 'tool' && item.toolName && (
            <div className="mb-2">
              <span className="text-blue-400 font-mono text-xs bg-blue-900/20 px-2 py-1 rounded">
                {item.toolName}
              </span>
            </div>
          )}
          <p className="whitespace-pre-wrap">{item.content}</p>
        </div>
      </div>
    </div>
  );
}
