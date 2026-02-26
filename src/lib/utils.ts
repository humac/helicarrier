import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a timestamp to a relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format a timestamp to a full date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get color for agent status
 */
export function getStatusColor(status: 'active' | 'idle' | 'completed'): string {
  switch (status) {
    case 'active':
      return 'text-green-400';
    case 'idle':
      return 'text-yellow-400';
    case 'completed':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get color for filter type
 */
export function getFilterColor(type: 'all' | 'user' | 'assistant' | 'tool'): string {
  switch (type) {
    case 'user':
      return 'text-green-400';
    case 'assistant':
      return 'text-blue-400';
    case 'tool':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Parse content parts to extract text
 */
export function parseContentParts(parts: { type: string; text?: string; name?: string; arguments?: string }[]): string {
  return parts
    .map((part) => {
      if (part.type === 'text') return part.text || '';
      if (part.type === 'toolCall') return `[Tool: ${part.name || 'unknown'}]`;
      return '';
    })
    .join(' ');
}
