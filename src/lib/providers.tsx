'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || 'Request failed');
  }
  const data = await response.json();
  return data.data;
};

const swrConfig = {
  fetcher,
  refreshInterval: 5000,
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  onErrorRetry: (error: Error, key: string, config: any, revalidate: any, { retryCount }: { retryCount: number }) => {
    if (retryCount >= 3) return false;
    if (error.message.includes('40')) return false;
    setTimeout(() => revalidate({ retryCount }), Math.pow(2, retryCount) * 1000);
  },
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrConfig as any}>
      {children}
    </SWRConfig>
  );
}
