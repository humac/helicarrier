import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';

/**
 * GET /api/health
 * Check gateway health endpoint
 */
export async function GET() {
  try {
    const gatewayUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789';
    
    const res = await fetch(`${gatewayUrl}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Gateway health check failed: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to check gateway health:', error);
    return NextResponse.json(
      { error: 'Failed to check gateway health' },
      { status: 500 }
    );
  }
}
