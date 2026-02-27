// Mock environment variables before importing
process.env.GATEWAY_URL = 'http://localhost:8080';
process.env.GATEWAY_TOKEN = 'test-token';

import { formatRelativeTime } from './utils';
import { isTimestampMs, getMessageContent } from './openclaw';

describe('utils', () => {
  describe('formatRelativeTime', () => {
    it('should format a timestamp from the past', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000;
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toContain('5 minutes');
      expect(result).toContain('ago');
    });

    it('should format a timestamp from the future', () => {
      const now = Date.now();
      const fiveMinutesLater = now + 5 * 60 * 1000;
      const result = formatRelativeTime(fiveMinutesLater);
      expect(result).toContain('in 5 minutes');
    });

    it('should handle epoch seconds (older timestamps)', () => {
      // 2024-01-01 00:00:00 UTC in seconds
      const epochSeconds = 1704067200;
      const result = formatRelativeTime(epochSeconds);
      expect(result).toContain('ago');
    });
  });

  describe('isTimestampMs', () => {
    it('should return true for millisecond timestamps (> year 2001)', () => {
      // January 1, 2020 in milliseconds (well above 1e12 threshold)
      const year2020Ms = 1577836800000;
      expect(isTimestampMs(year2020Ms)).toBe(true);
      
      // Current timestamp
      expect(isTimestampMs(Date.now())).toBe(true);
    });

    it('should return false for second timestamps', () => {
      // January 1, 2001 in seconds
      const year2001Seconds = 978307200;
      expect(isTimestampMs(year2001Seconds)).toBe(false);
      
      // Current timestamp in seconds
      expect(isTimestampMs(Math.floor(Date.now() / 1000))).toBe(false);
    });
  });

  describe('getMessageContent', () => {
    it('should return string content as-is', () => {
      const content = 'Hello, world!';
      expect(getMessageContent(content)).toBe('Hello, world!');
    });

    it('should extract text from array of content parts', () => {
      const content = [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: ' ' },
        { type: 'text', text: 'world!' },
      ];
      expect(getMessageContent(content)).toBe('Hello world!');
    });

    it('should handle empty array', () => {
      const content: any[] = [];
      expect(getMessageContent(content)).toBe('');
    });

    it('should handle content parts with missing text', () => {
      const content = [
        { type: 'text', text: 'Hello' },
        { type: 'image', text: '' },
        { type: 'text' },
      ];
      expect(getMessageContent(content)).toBe('Hello');
    });
  });
});
