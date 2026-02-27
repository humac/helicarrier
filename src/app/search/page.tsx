'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { Navigation } from '@/components/layout/Navigation';
import { AgentBanner } from '@/components/layout/AgentBanner';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Message } from '@/lib/types';
import { Search as SearchIcon, Hash, Bot, Calendar, Download } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [channel, setChannel] = useState('');

  // Debounce search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const searchUrl = debouncedQuery 
    ? `/api/search?q=${encodeURIComponent(debouncedQuery)}${channel ? `&channel=${channel}` : ''}`
    : null;

  const { data: results, isLoading } = useSWR<{ data: Message[] }>(
    searchUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleExport = () => {
    if (!results?.data) return;
    
    const blob = new Blob([JSON.stringify(results.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasSearched = debouncedQuery.length > 0;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <div className="md:ml-64">
        <AgentBanner />
        
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-text-primary">Search</h1>
              <p className="text-text-secondary text-sm mt-1">
                Global search across all agent activities and messages
              </p>
            </header>

            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={handleSearchChange}
                  placeholder="Search messages, commands, and activities..."
                  className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                  aria-label="Search query"
                />
              </div>

              {/* Filters */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="Filter by channel (optional)"
                  className="flex-1 px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent-primary transition-colors"
                  aria-label="Filter by channel"
                />
                {results?.data && results.data.length > 0 && (
                  <Button variant="secondary" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </div>

            {/* Results */}
            {isLoading && <FeedSkeleton />}

            {!isLoading && hasSearched && (!results?.data || results.data.length === 0) && (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-medium text-text-primary">No results found</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}

            {!hasSearched && (
              <div className="text-center py-12">
                <SearchIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-medium text-text-primary">Search messages</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Enter a query to search across all agent activities
                </p>
                <div className="mt-6 text-left max-w-md mx-auto">
                  <h3 className="text-sm font-medium text-text-primary mb-2">Search tips:</h3>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li>• Search is case-insensitive</li>
                    <li>• Filter by channel name</li>
                    <li>• Results are sorted by relevance</li>
                  </ul>
                </div>
              </div>
            )}

            {!isLoading && results?.data && results.data.length > 0 && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-text-secondary">
                    Found {results.data.length} result{results.data.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-3">
                  {results.data.map((message, index) => (
                    <article
                      key={message.id || index}
                      className="p-4 bg-bg-secondary rounded-lg border border-border-default hover:border-border-subtle transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-accent-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-accent-primary" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-text-primary">{message.author}</span>
                            {message.tool && (
                              <Badge variant="info">
                                {message.tool}.{message.action}
                              </Badge>
                            )}
                            <span className="text-xs text-text-muted">
                              {formatRelativeTime(message.timestamp)}
                            </span>
                          </div>
                          
                          <div className="mt-2 text-text-secondary text-sm break-words">
                            {typeof message.content === 'string' 
                              ? message.content 
                              : message.content.map((part) => part.text).join('')}
                          </div>
                          
                          <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              {message.channel}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
