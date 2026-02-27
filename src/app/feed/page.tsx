'use client';

import useSWR from 'swr';
import { Navigation } from '@/components/layout/Navigation';
import { AgentBanner } from '@/components/layout/AgentBanner';
import { FeedSkeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/lib/utils';
import { Message } from '@/lib/types';
import { Bot, Calendar, Hash } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FeedPage() {
  const { data: messages, isLoading, error } = useSWR<{ data: Message[] }>('/api/history', fetcher);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navigation />
      <div className="md:ml-64">
        <AgentBanner />
        
        <main className="p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-text-primary">Activity Feed</h1>
              <p className="text-text-secondary text-sm mt-1">
                Real-time timeline of agent activities and interactions
              </p>
            </header>

            {isLoading && <FeedSkeleton />}
            
            {error && (
              <div className="p-4 bg-accent-error/20 border border-accent-error rounded-lg">
                <p className="text-accent-error">Failed to load feed</p>
                <p className="text-text-secondary text-sm mt-1">{error.message}</p>
              </div>
            )}

            {!isLoading && !error && (!messages?.data || messages.data.length === 0) && (
              <div className="text-center py-12">
                <Bot className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h2 className="text-lg font-medium text-text-primary">No activity yet</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Agent activities will appear here in real-time
                </p>
              </div>
            )}

            {!isLoading && messages?.data && messages.data.length > 0 && (
              <div className="space-y-3">
                {messages.data.map((message) => (
                  <article
                    key={message.id}
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
                            <span className="text-xs px-2 py-0.5 bg-bg-tertiary text-text-secondary rounded">
                              {message.tool}.{message.action}
                            </span>
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
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
