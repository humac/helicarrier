import { GatewayRequest, GatewayResponse, MessageContentPart, CronScheduleObject } from './types';

const GATEWAY_URL = process.env.GATEWAY_URL;
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN;

if (!GATEWAY_URL || !GATEWAY_TOKEN) {
  throw new Error('Missing GATEWAY_URL or GATEWAY_TOKEN environment variables');
}

/**
 * Server-side Gateway client
 * NEVER import this file in client components
 */

/**
 * Invoke a Gateway tool action
 * @param tool - Tool name (e.g., 'message', 'healthcheck')
 * @param action - Action name (e.g., 'list', 'send')
 * @param params - Optional parameters
 * @returns Unwrapped response data
 */
export async function invokeGateway<T>(
  tool: string,
  action: string,
  params?: Record<string, unknown>
): Promise<T> {
  const url = `${GATEWAY_URL}/tools/invoke`;
  
  const request: GatewayRequest = {
    tool,
    action,
    params: params || {},
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Gateway request failed: ${response.status} ${response.statusText}`);
  }

  const envelope: GatewayResponse<T> = await response.json();

  if (!envelope.ok) {
    throw new Error(envelope.error?.message || 'Gateway request failed');
  }

  // Extract content from the result envelope
  // Gateway response: { ok, result: { content: [{ type: "text", text: "<JSON>" }], details } }
  if (envelope.result && envelope.result.content && envelope.result.content.length > 0) {
    const firstPart = envelope.result.content[0];
    if (firstPart.text) {
      try {
        // Try to parse as JSON first
        return JSON.parse(firstPart.text);
      } catch {
        // If not JSON, return as string wrapped in the expected type
        return firstPart.text as unknown as T;
      }
    }
  }

  throw new Error('Gateway returned no data');
}

/**
 * Retry wrapper with exponential backoff
 */
export async function invokeGatewayWithRetry<T>(
  tool: string,
  action: string,
  params?: Record<string, unknown>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await invokeGateway<T>(tool, action, params);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (lastError.message.includes('400') || lastError.message.includes('401')) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Gateway request failed after retries');
}

/**
 * Extract message content from string or array format
 */
export function getMessageContent(content: string | MessageContentPart[]): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map(part => part.text || '').join('');
  }
  return '';
}

/**
 * Normalize cron schedule (string or object)
 */
export function normalizeCronSchedule(schedule: string | CronScheduleObject): string {
  if (typeof schedule === 'string') {
    return schedule;
  }
  return (schedule as CronScheduleObject).expr || '';
}

/**
 * Check if timestamp is in milliseconds (> year 2001 in epoch ms)
 */
export function isTimestampMs(timestamp: number): boolean {
  return timestamp > 1e12;
}
