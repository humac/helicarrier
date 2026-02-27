import { NextRequest, NextResponse } from 'next/server';
import { invokeGatewayWithRetry } from '@/lib/openclaw';
import { Message } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const channel = searchParams.get('channel');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    if (!query) {
      return NextResponse.json({
        success: true,
        data: [],
        timestamp: Date.now(),
      });
    }
    
    const params: Record<string, unknown> = { query, limit };
    if (channel) params.channel = channel;
    
    // Invoke Gateway to search messages
    const results = await invokeGatewayWithRetry<Message[]>(
      'message',
      'search',
      params
    );
    
    return NextResponse.json({
      success: true,
      data: results,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to search',
        },
      },
      { status: 500 }
    );
  }
}
