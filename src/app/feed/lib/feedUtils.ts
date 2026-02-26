import { Session, HistoryEntry, FeedItem, FilterType } from '@/lib/types';

/**
 * Converts HistoryEntry role to FilterType for feed display
 */
function roleToFilterType(role: 'user' | 'assistant' | 'system'): FilterType {
  switch (role) {
    case 'user':
      return 'user';
    case 'assistant':
    case 'system':
      return 'assistant';
    default:
      return 'assistant';
  }
}

/**
 * Flattens sessions and histories into a single feed item array
 */
export function flattenHistory(sessions: Session[], histories: Record<string, HistoryEntry[]>): FeedItem[] {
  const feedItems: FeedItem[] = [];

  for (const session of sessions) {
    const history = histories[session.id] || [];
    
    for (const entry of history) {
      const feedItem: FeedItem = {
        id: entry.id,
        sessionId: session.id,
        sessionLabel: session.label,
        timestamp: entry.timestamp,
        type: roleToFilterType(entry.role),
        content: '',
        toolName: undefined,
      };

      // Parse content parts to extract the main content
      const { text, toolName } = parseContentParts(entry.content);
      feedItem.content = text;
      feedItem.toolName = toolName;

      // Adjust type based on content for feed filtering
      // toolCall content becomes 'tool' type, but role determines base type
      if (feedItem.type === 'assistant' && toolName) {
        feedItem.type = 'tool';
      }

      feedItems.push(feedItem);
    }
  }

  // Sort by timestamp (newest first)
  feedItems.sort((a, b) => b.timestamp - a.timestamp);

  return feedItems;
}

/**
 * Parses content parts to extract text and tool information
 */
export function parseContentParts(parts: HistoryEntry['content']): { text: string; toolName?: string } {
  let text = '';
  let toolName: string | undefined;

  for (const part of parts) {
    if (part.type === 'text') {
      text += part.text;
    } else if (part.type === 'toolCall') {
      toolName = part.name;
      // Include tool call info in the text for display
      if (!text) {
        text = `Tool: ${part.name}`;
      }
    }
  }

  return { text, toolName };
}

/**
 * Formats a timestamp into a human-readable relative time string
 */
export function formatTimestamp(epochMs: number): string {
  const now = Date.now();
  const diff = now - epochMs;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return years === 1 ? '1y ago' : `${years}y ago`;
  }
  if (months > 0) {
    return months === 1 ? '1mo ago' : `${months}mo ago`;
  }
  if (days > 0) {
    return days === 1 ? '1d ago' : `${days}d ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1h ago' : `${hours}h ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1m ago' : `${minutes}m ago`;
  }
  return 'just now';
}
