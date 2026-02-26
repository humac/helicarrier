'use client';

import React from 'react';
import { CronJob } from '@/lib/types';
import JobCard from './JobCard';

interface DayCellProps {
  date: Date;
  jobs: CronJob[];
  isSelected: boolean;
  onSelectJob: (job: CronJob) => void;
}

export default function DayCell({
  date,
  jobs,
  isSelected,
  onSelectJob,
}: DayCellProps) {
  const dayName = date.toLocaleString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();
  const isToday = checkIsToday(date);

  function checkIsToday(d: Date): boolean {
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  return (
    <div
      className={`flex flex-col h-full border rounded-lg transition-colors ${
        isToday
          ? 'border-blue-500/50 bg-blue-900/10'
          : 'border-gray-700/30 bg-gray-900/30'
      }`}
    >
      {/* Day header */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between ${
          isToday ? 'border-blue-500/30 bg-blue-900/5' : 'border-gray-700/20'
        }`}
      >
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-400 uppercase">
            {dayName}
          </span>
          <span
            className={`text-lg font-semibold ${
              isToday ? 'text-blue-400' : 'text-gray-300'
            }`}
          >
            {dayNumber}
          </span>
        </div>
        {jobs.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
            {jobs.length}
          </span>
        )}
      </div>

      {/* Job list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {jobs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-600 text-sm">
            No jobs
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onClick={() => onSelectJob(job)}
            />
          ))
        )}
      </div>
    </div>
  );
}
