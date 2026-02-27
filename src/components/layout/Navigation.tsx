'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Calendar, Search, Settings } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Activity },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings, disabled: true },
];

export function Navigation() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav
        className={cn(
          'fixed left-0 top-0 h-full bg-bg-secondary border-r border-border-default transition-all duration-300 z-40',
          'hidden md:flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="p-4 border-b border-border-default">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-lg font-bold text-text-primary">Helicarrier</h1>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <div className="w-5 h-5 flex items-center justify-center text-text-secondary">
                {sidebarOpen ? '◀' : '▶'}
              </div>
            </button>
          </div>
        </div>

        {/* Nav Items */}
        <ul className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                    'hover:bg-bg-tertiary',
                    isActive && 'bg-accent-primary/20 text-accent-primary',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.disabled ? `${item.label} (coming soon)` : `View ${item.label.toLowerCase()}`}
                  tabIndex={item.disabled ? -1 : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {sidebarOpen && (
                    <span className="text-sm">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-border-default">
            <p className="text-xs text-text-muted">v3.0.0</p>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border-default md:hidden z-40"
        aria-label="Mobile navigation"
      >
        <ul className="flex justify-around">
          {navItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center py-3 px-4',
                    isActive && 'text-accent-primary'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-6 h-6" aria-hidden="true" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
