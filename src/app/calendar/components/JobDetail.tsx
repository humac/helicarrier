'use client';

import React, { useState, useEffect } from 'react';
import { CronJob, CronRun } from '@/lib/types';
import { formatTime } from '../lib/cronUtils';

interface JobDetailProps {
  job: CronJob | null;
  onClose: () => void;
}

export default function JobDetail({ job, onClose }: JobDetailProps) {
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      fetchRuns(job.id);
    }
  }, [job]);

  async function fetchRuns(jobId: string) {
    if (!jobId) return;

    setLoadingRuns(true);
    setError(null);

    try {
      const response = await fetch(`/api/cron/${jobId}/runs`);
      if (response.ok) {
        const data = await response.json();
        setRuns(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load run history');
        setRuns([]);
      }
    } catch (err) {
      setError('Failed to load run history');
      setRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm">Select a job to view details</p>
      </div>
    );
  }

  const getStatusColor = (status: CronRun['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failure':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'running':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-700/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-100 truncate">
              {job.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                job.enabled
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {job.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="text-sm text-gray-400 font-mono break-all">
            Schedule: {job.schedule.expr}
            {job.schedule.tz && ` (${job.schedule.tz})`}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Job Info */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-900/30">
        <div className="p-3 rounded-lg border border-gray-700/30">
          <div className="text-xs text-gray-500 uppercase mb-1">Next Run</div>
          <div className="text-sm font-medium text-gray-300">
            {job.nextRun
              ? formatTime(job.nextRun)
              : <span className="text-gray-500">Unknown</span>}
          </div>
        </div>
        <div className="p-3 rounded-lg border border-gray-700/30">
          <div className="text-xs text-gray-500 uppercase mb-1">Last Run</div>
          <div className="text-sm font-medium text-gray-300">
            {job.lastRun
              ? formatTime(job.lastRun)
              : <span className="text-gray-500">Never</span>}
          </div>
        </div>
      </div>

      {/* Run History */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h4 className="text-sm font-medium text-gray-300">Run History</h4>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {loadingRuns ? (
            <div className="flex items-center justify-center h-full py-8">
              <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Loading history...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="text-gray-600 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No run history yet</p>
              <p className="text-xs text-gray-600 mt-1">Jobs will appear here after running</p>
            </div>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className={`p-3 rounded-lg border ${getStatusColor(run.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-semibold tracking-wider">
                      {run.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(run.startedAt)}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-gray-400">
                    ID: {run.id.slice(0, 8)}
                  </span>
                </div>
                {run.completedAt && (
                  <div className="text-xs text-gray-400 mb-2">
                    Duration: {Math.round((run.completedAt - run.startedAt) / 1000)}s
                  </div>
                )}
                {run.output && (
                  <div className="mt-2 p-2 bg-gray-950/30 rounded border border-gray-700/30">
                    <pre className="text-xs font-mono text-gray-300 overflow-x-auto">
                      {run.output}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
