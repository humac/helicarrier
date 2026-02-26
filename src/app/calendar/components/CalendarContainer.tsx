'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CronJob } from '@/lib/types';
import { getWeekStart, getWeekEnd, getWeekDays, formatDayDate, isToday } from '../lib/cronUtils';
import WeekGrid from './WeekGrid';
import JobDetail from './JobDetail';

export default function CalendarContainer() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cron jobs
  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      const response = await fetch('/api/cron/jobs');
      if (response.ok) {
        const data = await response.json();
        setJobs(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load cron jobs');
      }
    } catch (err) {
      setError('Failed to load cron jobs');
    } finally {
      setLoading(false);
    }
  }

  // Week navigation
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const result = new Date(prev);
      result.setDate(result.getDate() - 7);
      return result;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const result = new Date(prev);
      result.setDate(result.getDate() + 7);
      return result;
    });
  };

  const handleToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // Get jobs for the current week
  const jobsForWeek = useMemo(() => {
    const weekEnd = getWeekEnd(currentWeekStart);
    
    return jobs.filter((job) => {
      // If nextRun is available, check if it's in the current week
      if (job.nextRun) {
        return job.nextRun >= currentWeekStart.getTime() && job.nextRun <= weekEnd.getTime();
      }
      
      // If no nextRun, show all jobs (they might run in this week)
      return true;
    });
  }, [jobs, currentWeekStart]);

  // Generate week days
  const weekDays = useMemo(() => {
    return getWeekDays(currentWeekStart);
  }, [currentWeekStart]);

  // Format date range for header
  const dateRangeText = useMemo(() => {
    const startMonth = currentWeekStart.toLocaleString('en-US', { month: 'short' });
    const end = new Date(currentWeekStart);
    end.setDate(currentWeekStart.getDate() + 6);
    const endMonth = end.toLocaleString('en-US', { month: 'short' });
    const startDay = currentWeekStart.getDate();
    const endDay = end.getDate();
    const year = currentWeekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }, [currentWeekStart]);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-800 bg-gray-900">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-gray-200">Calendar</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
              {jobs.length} jobs
            </span>
          </div>
          <p className="text-sm text-gray-500">{dateRangeText}</p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={handlePrevWeek}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Previous week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Next week"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="px-4 py-3 bg-red-950/30 border-b border-red-900/50 text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Calendar */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 flex flex-col min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm text-gray-500">Loading calendar...</span>
              </div>
            </div>
          ) : (
            <WeekGrid
              weekStart={currentWeekStart}
              jobs={jobsForWeek}
              selectedJob={selectedJob}
              onSelectJob={setSelectedJob}
            />
          )}
        </div>

        {/* Job Detail Panel */}
        {selectedJob && (
          <div className="w-80 border-l border-gray-800 bg-gray-900 hidden md:flex flex-col">
            <JobDetail job={selectedJob} onClose={() => setSelectedJob(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
