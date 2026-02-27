import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { Session } from '@/lib/types';

/**
 * GET /api/sessions
 * List all active sessions from OpenClaw gateway
 * Handles both direct array response and gateway envelope format {count, sessions: [...]}
 */
export async function GET() {
  try {
    const result = await openclaw.invoke('sessions_list', {});
    
    // Handle different response formats:
    // 1. Direct array: [Session, Session, ...]
    // 2. Gateway envelope: {count: number, sessions: [Session, ...]}
    const sessionsArray = Array.isArray(result) 
      ? result 
      : (result as any)?.sessions;
    
    const sessions = Array.isArray(sessionsArray) ? sessionsArray : [];
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
