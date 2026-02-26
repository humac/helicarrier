import { NextRequest, NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { MemoryResult } from '@/lib/types';

/**
 * POST /api/search/memory
 * Search memory with a query
 * Body: { query: string, limit?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 }
      );
    }

    const results = await openclaw.invoke('memory_search', { query, limit }) as MemoryResult[];
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search memory:', error);
    return NextResponse.json(
      { error: 'Failed to search memory' },
      { status: 500 }
    );
  }
}
