import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { Session } from '@/lib/types';

/**
 * GET /api/sessions
 * List all active sessions from OpenClaw gateway
 */
export async function GET() {
  try {
    const sessions = await openclaw.invoke('sessions_list', {}) as Session[];
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
