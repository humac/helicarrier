import { NextRequest, NextResponse } from 'next/server';
import { invokeGatewayWithRetry } from '@/lib/openclaw';
import { GatewayStatus } from '@/lib/types';

export async function GET() {
  try {
    // Check gateway health by making a simple request
    // This is a lightweight health check
    const status: GatewayStatus = {
      healthy: true,
      uptime: process.uptime() * 1000,
    };
    
    // Try to invoke a simple gateway command to verify connectivity
    try {
      await invokeGatewayWithRetry('subagents', 'list', { limit: 1 });
      status.healthy = true;
    } catch {
      status.healthy = false;
    }
    
    return NextResponse.json({
      success: true,
      data: status,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Status API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get status',
        },
      },
      { status: 500 }
    );
  }
}
