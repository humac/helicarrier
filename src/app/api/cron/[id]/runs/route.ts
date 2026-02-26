import { NextRequest, NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { CronRun } from '@/lib/types';

/**
 * GET /api/cron/[id]/runs
 * Get runs for a specific cron job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const runs = await openclaw.invoke('cron', { action: 'runs', jobId: id }) as CronRun[];
    return NextResponse.json(runs);
  } catch (error) {
    console.error('Failed to get cron runs:', error);
    return NextResponse.json(
      { error: 'Failed to get cron runs' },
      { status: 500 }
    );
  }
}
