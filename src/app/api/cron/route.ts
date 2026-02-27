import { NextRequest, NextResponse } from 'next/server';
import { invokeGatewayWithRetry } from '@/lib/openclaw';
import { CronJob } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Invoke Gateway healthcheck to get cron jobs status
    // This may need adjustment based on actual Gateway cron tool
    const jobs = await invokeGatewayWithRetry<CronJob[]>(
      'healthcheck',
      'status',
      {}
    );
    
    return NextResponse.json({
      success: true,
      data: jobs,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Cron API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRON_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch cron jobs',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;
    
    if (!id || !action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing id or action',
          },
        },
        { status: 400 }
      );
    }
    
    let result;
    
    if (action === 'toggle') {
      result = await invokeGatewayWithRetry(
        'healthcheck',
        'toggle',
        { id }
      );
    } else if (action === 'trigger') {
      result = await invokeGatewayWithRetry(
        'healthcheck',
        'trigger',
        { id }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: `Unknown action: ${action}`,
          },
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Cron action API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CRON_ACTION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to execute cron action',
        },
      },
      { status: 500 }
    );
  }
}
