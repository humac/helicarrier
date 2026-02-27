import { NextRequest, NextResponse } from 'next/server';
import { invokeGatewayWithRetry } from '@/lib/openclaw';
import { Session } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Invoke Gateway to fetch sessions
    const sessions = await invokeGatewayWithRetry<Session[]>(
      'subagents',
      'list',
      { limit }
    );
    
    return NextResponse.json({
      success: true,
      data: sessions,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Sessions API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SESSIONS_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch sessions',
        },
      },
      { status: 500 }
    );
  }
}
