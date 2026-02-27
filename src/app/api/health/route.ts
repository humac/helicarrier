import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';

/**
 * GET /api/health
 * Check gateway health by invoking sessions_list tool
 */
export async function GET() {
  try {
    // Use OpenClaw client to invoke a lightweight tool call
    // This verifies gateway connectivity and auth
    const result = await openclaw.invoke('sessions_list', {});

    // If we get here, gateway is working (result has sessions array)
    const sessions = Array.isArray(result) ? result : (result as any)?.sessions;
    if (!sessions) {
      throw new Error('Unexpected response format');
    }

    return NextResponse.json({
      healthy: true,
      gateway: 'connected',
      sessions: sessions.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Gateway health check failed:', error);
    return NextResponse.json(
      { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
