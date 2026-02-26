import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { Session } from '@/lib/types';

/**
 * GET /api/sessions/[id]
 * Get details for a specific session/agent
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get all sessions and find the matching one
    const sessions = await openclaw.invoke('sessions_list', {}) as Session[];
    const session = sessions.find(s => s.id === id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to get session details:', error);
    return NextResponse.json(
      { error: 'Failed to get session details' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions/[id]/kill
 * Kill a specific session
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    
    if (body.action === 'kill') {
      await openclaw.invoke('sessions_kill', { sessionId: id });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to kill session:', error);
    return NextResponse.json(
      { error: 'Failed to kill session' },
      { status: 500 }
    );
  }
}
