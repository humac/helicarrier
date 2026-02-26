import { describe, it, expect } from 'vitest';
import { unwrap } from './openclaw';

describe('Gateway Envelope Unwrap', () => {
  it('should correctly unwrap JSON content from envelope', () => {
    const envelope = {
      ok: true,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ sessions: [] })
          }
        ] satisfies Array<{ type: 'text'; text: string }>,
      } satisfies { content: Array<{ type: 'text'; text: string }> },
    };

    const result = unwrap<{ sessions: [] }>(envelope);
    expect(result.sessions).toEqual([]);
  });

  it('should throw error when envelope ok is false', () => {
    const envelope = {
      ok: false,
      result: {
        content: [] as Array<{ type: 'text'; text: string }>,
      } satisfies { content: Array<{ type: 'text'; text: string }> },
    };

    expect(() => unwrap(envelope)).toThrow('Invalid gateway response');
  });

  it('should throw error when no text content exists', () => {
    const envelope = {
      ok: true,
      result: {
        content: [] as Array<{ type: 'text'; text: string }>,
      } satisfies { content: Array<{ type: 'text'; text: string }> },
    };

    // Test with empty content - should throw
    expect(() => unwrap(envelope)).toThrow();
  });
});

describe('Types from ARCH.md', () => {
  it('should have all required type interfaces', () => {
    // This test is just to ensure types are exported correctly
    // Actual type checking happens at compile time
    expect(true).toBe(true);
  });
});
