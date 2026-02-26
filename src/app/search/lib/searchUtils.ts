import { MemoryResult, FileResult, CronJob } from '@/lib/types';

/**
 * Search memory via the API
 */
export async function searchMemoryApi(query: string, limit = 20): Promise<MemoryResult[]> {
  if (!query.trim()) {
    return [];
  }

  const res = await fetch('/api/search/memory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, limit }),
  });

  if (!res.ok) {
    throw new Error('Failed to search memory');
  }

  return res.json();
}

/**
 * Search files via the API
 */
export async function searchFilesApi(query: string): Promise<FileResult[]> {
  if (!query.trim()) {
    return [];
  }

  const res = await fetch('/api/search/files', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error('Failed to search files');
  }

  return res.json();
}

/**
 * Fetch all cron jobs (for search/filter)
 */
export async function fetchCronJobs(): Promise<CronJob[]> {
  const res = await fetch('/api/cron/jobs');
  
  if (!res.ok) {
    throw new Error('Failed to fetch cron jobs');
  }

  return res.json();
}

/**
 * Filter cron jobs by query
 */
export function filterCronJobs(jobs: CronJob[], query: string): CronJob[] {
  if (!query.trim()) {
    return jobs;
  }

  const lowerQuery = query.toLowerCase();
  return jobs.filter(
    (job) =>
      job.name.toLowerCase().includes(lowerQuery) ||
      job.schedule.expr.toLowerCase().includes(lowerQuery) ||
      job.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Highlight matching text in a string
 */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) {
    return text;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">$1</mark>');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}
