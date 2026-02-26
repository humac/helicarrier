'use client';

import React from 'react';
import { CronJob } from '@/lib/types';

interface JobCardProps {
  job: CronJob;
  onClick: () => void;
}

export default function JobCard({ job, onClick }: JobCardProps) {
  const isRunning = job.lastRun ? isRecent(job.lastRun) : false;

  function isRecent(timestamp: number): boolean {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours < 24;
  }

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer p-2 rounded-lg border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all duration-200"
    >
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
          job.enabled ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-200 truncate">
            {job.name}
          </div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            {job.schedule.expr}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            {job.nextRun && (
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Next: {formatTime(job.nextRun)}
              </span>
            )}
            {job.lastRun && (
              <span className={`flex items-center gap-1 ${isRunning ? 'text-blue-400' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-blue-500 animate-pulse' : 'bg-gray-500'}`} />
                Last: {formatTime(job.lastRun)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Formats a timestamp into a time string
 */
function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
