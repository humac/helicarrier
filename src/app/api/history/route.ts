import { NextRequest, NextResponse } from 'next/server';
import { invokeGatewayWithRetry } from '@/lib/openclaw';
import { Message } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const cursor = searchParams.get('cursor');
    const channel = searchParams.get('channel');
    
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    if (channel) params.channel = channel;
    
    // Invoke Gateway to fetch message history
    const messages = await invokeGatewayWithRetry<Message[]>(
      'message',
      'read',
      params
    );
    
    return NextResponse.json({
      success: true,
      data: messages,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('History API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HISTORY_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch history',
        },
      },
      { status: 500 }
    );
  }
}
