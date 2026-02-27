'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGatewayHealth } from '../hooks/useOpenClaw';

export function Navigation() {
  const pathname = usePathname();
  const { health, loading, error } = useGatewayHealth(30000);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <span className="text-2xl font-bold text-white">🦀</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-100 tracking-tight">
                Helicarrier
              </h1>
              <p className="text-xs text-gray-500">Agent Swarm Dashboard</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/feed"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive('/feed')
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Feed
            </Link>
            <Link
              href="/calendar"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive('/calendar')
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Calendar
            </Link>
            <Link
              href="/search"
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                isActive('/search')
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Search
            </Link>
          </div>

          {/* Gateway Status Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-1.5 border border-gray-800">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  !loading && health?.healthy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 
                  loading ? 'bg-yellow-500 animate-pulse' : 
                  'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                }`}
              />
              <span className="text-xs font-mono text-gray-400">
                {loading
                  ? 'Checking...'
                  : health?.healthy
                    ? `Gateway (${health.sessions} sessions)`
                    : 'Gateway Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex gap-1 overflow-x-auto pb-2">
          <Link
            href="/feed"
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium text-center ${
              isActive('/feed')
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 bg-gray-900'
            }`}
          >
            Feed
          </Link>
          <Link
            href="/calendar"
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium text-center ${
              isActive('/calendar')
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 bg-gray-900'
            }`}
          >
            Calendar
          </Link>
          <Link
            href="/search"
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium text-center ${
              isActive('/search')
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 bg-gray-900'
            }`}
          >
            Search
          </Link>
        </div>
      </div>
    </nav>
  );
}
