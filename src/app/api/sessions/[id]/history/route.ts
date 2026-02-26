import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { HistoryEntry } from '@/lib/types';

/**
 * GET /api/sessions/[id]/history
 * Get session history for a specific agent/session
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Use sessions_history tool to get history
    const history = await openclaw.invoke('sessions_history', {
      sessionId: id,
    }) as HistoryEntry[];

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to get session history:', error);
    return NextResponse.json(
      { error: 'Failed to get session history' },
      { status: 500 }
    );
  }
}
