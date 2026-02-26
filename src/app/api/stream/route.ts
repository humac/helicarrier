import { NextRequest } from 'next/server';
import { openclaw } from '@/lib/openclaw';

/**
 * GET /api/stream
 * Server-Sent Events (SSE) endpoint for token streaming
 * Streams tokens from agent responses in real-time
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId');
  
  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'sessionId parameter is required' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Create a ReadableStream for SSE
  const encoder = new TextEncoder();
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;
      
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`));
      
      // TODO: Implement actual token streaming logic
      // This would typically involve:
      // 1. Subscribing to session events via websocket or polling
      // 2. Forwarding tokens as they arrive
      // 3. Handling session completion/errors
      
      // For now, send a heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (streamController) {
          streamController.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`));
        }
      }, 30000);

      // Cleanup on stream close
      return () => {
        clearInterval(heartbeatInterval);
        streamController = null;
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
