'use client';

import React, { useState, useCallback } from 'react';
import { SearchBar, ResultList, MemoryResult, FileResult, CronResult } from '.';
import { searchMemoryApi, searchFilesApi, fetchCronJobs, filterCronJobs } from '../lib/searchUtils';
import { MemoryResult as MemoryResultType, FileResult as FileResultType, CronJob } from '@/lib/types';

type SearchTab = 'memory' | 'files' | 'crons';

interface TabConfig {
  id: SearchTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabConfig[] = [
  {
    id: 'memory',
    label: 'Memory',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
        />
      </svg>
    ),
  },
  {
    id: 'files',
    label: 'Files',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: 'crons',
    label: 'Crons',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function SearchContainer() {
  const [activeTab, setActiveTab] = useState<SearchTab>('memory');
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryResults, setMemoryResults] = useState<MemoryResultType[]>([]);
  const [fileResults, setFileResults] = useState<FileResultType[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cron jobs on mount
  React.useEffect(() => {
    const loadCronJobs = async () => {
      try {
        const jobs = await fetchCronJobs();
        setCronJobs(jobs);
      } catch (err) {
        console.error('Failed to load cron jobs:', err);
      }
    };
    loadCronJobs();
  }, []);

  // Perform search
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setSearchQuery(searchQuery);

      if (!searchQuery.trim()) {
        setMemoryResults([]);
        setFileResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (activeTab === 'memory') {
          const results = await searchMemoryApi(searchQuery);
          setMemoryResults(results);
        } else if (activeTab === 'files') {
          const results = await searchFilesApi(searchQuery);
          setFileResults(results);
        }
      } catch (err) {
        console.error('Search failed:', err);
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  // Handle tab change
  const handleTabChange = useCallback((tab: SearchTab) => {
    setActiveTab(tab);
    // Re-run search when switching tabs if there's a query
    if (searchQuery.trim()) {
      // Trigger search for the new tab
      setTimeout(() => {
        if (tab === 'memory') {
          searchMemoryApi(searchQuery).then(setMemoryResults).catch(console.error);
        } else if (tab === 'files') {
          searchFilesApi(searchQuery).then(setFileResults).catch(console.error);
        }
      }, 0);
    }
  }, [searchQuery]);

  // Filter cron jobs based on query
  const filteredCronJobs = filterCronJobs(cronJobs, searchQuery);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-200">Search</h2>
        </div>

        {/* Search Bar */}
        <SearchBar
          onSearch={handleSearch}
          placeholder={`Search ${activeTab}...`}
          defaultValue={query}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900/50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400 bg-blue-900/10'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            {tab.icon}
            {tab.label}
            {/* Result count badges */}
            {searchQuery && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">
                {tab.id === 'memory' && memoryResults.length}
                {tab.id === 'files' && fileResults.length}
                {tab.id === 'crons' && filteredCronJobs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-950/30 border-b border-red-900/50 text-red-400 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'memory' && (
          <ResultList<MemoryResultType>
            items={memoryResults}
            renderItem={(result) => <MemoryResult result={result} query={searchQuery} />}
            emptyMessage={searchQuery ? 'No memory results found' : 'Enter a search query to search memory'}
            loading={loading}
          />
        )}

        {activeTab === 'files' && (
          <ResultList<FileResultType>
            items={fileResults}
            renderItem={(result) => <FileResult result={result} query={searchQuery} />}
            emptyMessage={searchQuery ? 'No file results found' : 'Enter a search query to search files'}
            loading={loading}
          />
        )}

        {activeTab === 'crons' && (
          <ResultList<CronJob>
            items={filteredCronJobs}
            renderItem={(job) => <CronResult job={job} query={searchQuery} />}
            emptyMessage={searchQuery ? 'No cron jobs match your search' : 'Enter a search query to filter cron jobs'}
            loading={loading}
          />
        )}
      </div>

      {/* Footer info */}
      <div className="px-4 py-2 text-xs text-gray-600 border-t border-gray-800 bg-gray-950">
        {searchQuery && (
          <span>
            {activeTab === 'memory' && `${memoryResults.length} result${memoryResults.length !== 1 ? 's' : ''} found`}
            {activeTab === 'files' && `${fileResults.length} result${fileResults.length !== 1 ? 's' : ''} found`}
            {activeTab === 'crons' && `${filteredCronJobs.length} job${filteredCronJobs.length !== 1 ? 's' : ''} found`}
          </span>
        )}
      </div>
    </div>
  );
}
