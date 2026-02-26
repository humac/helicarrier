import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { CronJob } from '@/lib/types';

/**
 * GET /api/cron/jobs
 * List all cron jobs from OpenClaw gateway
 */
export async function GET() {
  try {
    const jobs = await openclaw.invoke('cron', { action: 'list' }) as CronJob[];
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Failed to list cron jobs:', error);
    return NextResponse.json(
      { error: 'Failed to list cron jobs' },
      { status: 500 }
    );
  }
}
