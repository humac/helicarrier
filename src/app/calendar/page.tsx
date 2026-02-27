'use client';

import useSWR from 'swr';
import { Navigation } from '@/components/layout/Navigation';
import { AgentBanner } from '@/components/layout/AgentBanner';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CronJob } from '@/lib/types';
import { Calendar as CalendarIcon, Clock, Play, Pause, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { parseCronExpression, cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CalendarPage() {
  const { data: jobsData, isLoading, mutate } = useSWR<{ data: CronJob[] }>('/api/cron', fetcher);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    setActionInProgress(id);
    try {
      await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'toggle' }),
      });
      await mutate();
    } catch (error) {
      console.error('Failed to toggle job:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleTrigger = async (id: string) => {
    setActionInProgress(id);
    try {
      await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'trigger' }),
      });
      await mutate();
    } catch (error) {
      console.error('Failed to trigger job:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  // Helper to extract cron expression
  const getCronExpr = (job: CronJob): string => {
    if (typeof job.schedule === 'string') return job.schedule;
    return (job.schedule as any).expr || (job.schedule as any).expression || '';
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <div className="md:ml-64">
        <AgentBanner />
        
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-text-primary">Cron Jobs</h1>
              <p className="text-text-secondary text-sm mt-1">
                Manage scheduled tasks and view execution history
              </p>
            </header>

            {isLoading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            )}

            {!isLoading && (!jobsData?.data || jobsData.data.length === 0) && (
              <div className="text-center py-12">
                <CalendarIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-medium text-text-primary">No scheduled jobs</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Cron jobs will appear here when configured
                </p>
              </div>
            )}

            {!isLoading && jobsData?.data && jobsData.data.length > 0 && (
              <div className="space-y-3">
                {jobsData.data.map((job) => {
                  const expr = getCronExpr(job);
                  const isDisabled = actionInProgress === job.id;

                  return (
                    <div
                      key={job.id}
                      className="p-4 bg-bg-secondary rounded-lg border border-border-default"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-text-primary">{job.name}</h3>
                            <Badge variant={job.enabled ? 'success' : 'default'}>
                              {job.enabled ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="mt-2">
                            <code className="text-xs px-2 py-1 bg-bg-tertiary text-accent-info rounded">
                              {expr}
                            </code>
                            <p className="text-xs text-text-muted mt-1">
                              {parseCronExpression(expr)}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
                            {job.lastRun && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Last: {new Date(job.lastRun).toLocaleString()}
                              </span>
                            )}
                            {job.nextRun && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Next: {new Date(job.nextRun).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggle(job.id, job.enabled)}
                            disabled={isDisabled}
                            aria-label={job.enabled ? 'Disable job' : 'Enable job'}
                          >
                            {job.enabled ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleTrigger(job.id)}
                            disabled={isDisabled}
                            aria-label="Trigger job now"
                          >
                            <RefreshCw className={cn('w-4 h-4', isDisabled && 'animate-spin')} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
