'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Bot,
  Trophy,
  PenLine,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';

const sidebarLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/problems', label: 'All Posts', icon: Zap },
  { href: '/bots', label: 'Bots', icon: Bot },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/submit', label: 'Ask a Question', icon: PenLine },
];

const adminLinks = [
  { href: '/admin', label: 'Admin Panel', icon: Shield },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-surface-border bg-navy-950/60 h-full">
      <nav className="p-4 space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'text-accent bg-accent/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-800'
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-surface-border" />
            {adminLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'text-accent bg-accent/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-navy-800'
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}
