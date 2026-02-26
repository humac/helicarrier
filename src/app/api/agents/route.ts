import { NextResponse } from 'next/server';
import { openclaw } from '@/lib/openclaw';
import { SubAgent } from '@/lib/types';

/**
 * GET /api/agents
 * List all active agents/subagents from OpenClaw gateway
 */
export async function GET() {
  try {
    // Use subagents_list tool to get all active subagents
    const agents = await openclaw.invoke('subagents_list', {
      action: 'list',
    }) as SubAgent[];

    return NextResponse.json(agents);
  } catch (error) {
    console.error('Failed to list agents:', error);
    return NextResponse.json(
      { error: 'Failed to list agents' },
      { status: 500 }
    );
  }
}
