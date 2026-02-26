'use client';

import React from 'react';
import { CronJob } from '@/lib/types';
import { highlightMatch } from '../lib/searchUtils';

interface CronResultProps {
  job: CronJob;
  query: string;
}

export default function CronResult({ job, query }: CronResultProps) {
  const { id, name, schedule, enabled, lastRun, nextRun } = job;

  // Format timestamp
  const formatTime = (ts?: number) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Cron icon */}
        <div className="flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* Job name and status */}
          <div className="flex items-center gap-2 mb-2">
            <h3
              className="text-sm font-medium text-gray-200"
              dangerouslySetInnerHTML={{ __html: highlightMatch(name, query) }}
            />
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                enabled
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Schedule expression */}
          <div className="mb-2">
            <span className="text-xs text-gray-500">Schedule: </span>
            <code
              className="text-xs font-mono text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded"
              dangerouslySetInnerHTML={{ __html: highlightMatch(schedule.expr, query) }}
            />
            {schedule.tz && (
              <span className="text-xs text-gray-500 ml-2">({schedule.tz})</span>
            )}
          </div>

          {/* Job ID */}
          <div className="mb-2">
            <span className="text-xs text-gray-500">ID: </span>
            <code
              className="text-xs font-mono text-gray-400"
              dangerouslySetInnerHTML={{ __html: highlightMatch(id, query) }}
            />
          </div>

          {/* Last run and next run */}
          <div className="flex gap-4 text-xs text-gray-500">
            <span>
              <span className="text-gray-600">Last run:</span> {formatTime(lastRun)}
            </span>
            <span>
              <span className="text-gray-600">Next run:</span> {formatTime(nextRun)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
