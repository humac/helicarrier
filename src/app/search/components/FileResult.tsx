'use client';

import React from 'react';
import { FileResult as FileResultType } from '@/lib/types';
import { highlightMatch } from '../lib/searchUtils';

interface FileResultProps {
  result: FileResultType;
  query: string;
}

export default function FileResult({ result, query }: FileResultProps) {
  const { path, line, content } = result;

  // Get file name from path
  const fileName = path.split('/').pop() || path;

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div className="flex-shrink-0 mt-1">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          {/* File path and line */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
              {path}
            </span>
            <span className="text-xs text-gray-500">
              Line {line}
            </span>
          </div>

          {/* Content with highlighting */}
          <div
            className="text-sm text-gray-300 font-mono whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: highlightMatch(content, query) }}
          />
        </div>
      </div>
    </div>
  );
}
