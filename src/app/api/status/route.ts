import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { SystemStatus } from '@/lib/types';

/**
 * GET /api/status
 * Get session status from OpenClaw gateway
 */
export async function GET() {
  try {
    const status = await openclaw.invoke('session_status', {}) as SystemStatus;
    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to get session status:', error);
    return NextResponse.json(
      { error: 'Failed to get session status' },
      { status: 500 }
    );
  }
}
