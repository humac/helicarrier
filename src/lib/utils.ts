import { format, formatDistanceToNow } from 'date-fns';
import { isTimestampMs } from './openclaw';

/**
 * Format timestamp to readable string
 * Handles both epoch ms and epoch s
 */
export function formatTimestamp(timestamp: number): string {
  // Ensure timestamp is in milliseconds
  const ms = isTimestampMs(timestamp) ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  return format(date, 'MMM d, yyyy HH:mm:ss z');
}

/**
 * Format timestamp to relative time (e.g., "5 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const ms = isTimestampMs(timestamp) ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format timestamp for display (shorter format)
 */
export function formatTimestampShort(timestamp: number): string {
  const ms = isTimestampMs(timestamp) ? timestamp : timestamp * 1000;
  const date = new Date(ms);
  return format(date, 'MMM d, HH:mm');
}

/**
 * Parse cron expression to human-readable format
 */
export function parseCronExpression(expr: string): string {
  // Simple parser for common cron patterns
  const parts = expr.split(' ');
  if (parts.length < 5) return expr;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  const descriptions: string[] = [];

  if (minute === '0' && hour === '*') {
    descriptions.push('Every hour');
  } else if (minute === '0' && hour === '0') {
    descriptions.push('Daily at midnight');
  } else if (minute !== '*' && hour !== '*') {
    descriptions.push(`At ${hour}:${minute.padStart(2, '0')}`);
  }

  if (dayOfMonth !== '*') {
    descriptions.push(`on day ${dayOfMonth}`);
  }

  if (month !== '*') {
    descriptions.push(`in month ${month}`);
  }

  if (dayOfWeek !== '*') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    descriptions.push(`on ${days[parseInt(dayOfWeek)]}`);
  }

  return descriptions.join(' ') || expr;
}

/**
 * Class names utility
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
