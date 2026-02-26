'use client';

import React from 'react';
import { MemoryResult as MemoryResultType } from '@/lib/types';
import { highlightMatch, truncate } from '../lib/searchUtils';

interface MemoryResultProps {
  result: MemoryResultType;
  query: string;
}

export default function MemoryResult({ result, query }: MemoryResultProps) {
  const { content, score, metadata } = result;

  // Format score as percentage
  const scorePercent = Math.round(score * 100);

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Content with highlighting */}
          <div
            className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlightMatch(truncate(content, 500), query) }}
          />

          {/* Metadata */}
          {metadata && Object.keys(metadata).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(metadata).slice(0, 3).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-800 text-gray-400"
                >
                  <span className="font-medium">{key}:</span>
                  <span className="ml-1">{String(value)}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Score badge */}
        <div className="flex-shrink-0">
          <div
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
              score >= 0.7
                ? 'bg-green-900/50 text-green-400'
                : score >= 0.4
                ? 'bg-yellow-900/50 text-yellow-400'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {scorePercent}%
          </div>
        </div>
      </div>
    </div>
  );
}
