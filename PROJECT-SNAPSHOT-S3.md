# PROJECT-SNAPSHOT-S3.md — Frontend & Email Infrastructure

**Generated**: 2026-03-12
**Scope**: Section 10 (Frontend Pages & Components), Section 10b (Live Activity Feed), Section 11 (Email Infrastructure)

---

## SECTION 10: FRONTEND — PAGES & COMPONENTS

### All Frontend Routes (37 pages)

```
apps/web/src/app/about/page.tsx
apps/web/src/app/admin/activity/page.tsx
apps/web/src/app/admin/bots/page.tsx
apps/web/src/app/admin/communications/page.tsx
apps/web/src/app/admin/debug/page.tsx
apps/web/src/app/admin/moderation/page.tsx
apps/web/src/app/admin/page.tsx
apps/web/src/app/admin/problems/page.tsx
apps/web/src/app/admin/users/page.tsx
apps/web/src/app/auth/callback/page.tsx
apps/web/src/app/auth/login/page.tsx
apps/web/src/app/blog/page.tsx
apps/web/src/app/bots/[id]/page.tsx
apps/web/src/app/bots/page.tsx
apps/web/src/app/coming-soon/page.tsx
apps/web/src/app/contact/page.tsx
apps/web/src/app/docs/api/page.tsx
apps/web/src/app/docs/sdk/page.tsx
apps/web/src/app/hall-of-fame/page.tsx
apps/web/src/app/how-it-works/page.tsx
apps/web/src/app/impressum/page.tsx
apps/web/src/app/leaderboard/page.tsx
apps/web/src/app/llm-leaderboard/[modelName]/page.tsx
apps/web/src/app/llm-leaderboard/page.tsx
apps/web/src/app/newsletter/confirm/page.tsx
apps/web/src/app/newsletter/page.tsx
apps/web/src/app/onboarding/page.tsx
apps/web/src/app/page.tsx
apps/web/src/app/privacy/page.tsx
apps/web/src/app/problems/[id]/page.tsx
apps/web/src/app/problems/page.tsx
apps/web/src/app/register-bot/page.tsx
apps/web/src/app/search/page.tsx
apps/web/src/app/settings/page.tsx
apps/web/src/app/submit/page.tsx
apps/web/src/app/terms/page.tsx
apps/web/src/app/unsubscribe/page.tsx
```

### All Components (67 files)

```
apps/web/src/components/CookieBanner.tsx
apps/web/src/components/DefaultAvatar.tsx
apps/web/src/components/NewsletterBanner.tsx
apps/web/src/components/about/AboutBigIdea.tsx
apps/web/src/components/about/AboutBlindSolving.tsx
apps/web/src/components/about/AboutCTA.tsx
apps/web/src/components/about/AboutCategories.tsx
apps/web/src/components/about/AboutDiagram.tsx
apps/web/src/components/about/AboutGamification.tsx
apps/web/src/components/about/AboutHero.tsx
apps/web/src/components/about/AboutHumanFirst.tsx
apps/web/src/components/about/AboutOpenSource.tsx
apps/web/src/components/about/AboutQuickStart.tsx
apps/web/src/components/about/AboutRanking.tsx
apps/web/src/components/about/AboutSafety.tsx
apps/web/src/components/about/AboutSection.tsx
apps/web/src/components/about/AboutWhyPairwise.tsx
apps/web/src/components/admin/ConfirmDialog.tsx
apps/web/src/components/bot/ActivityHistory.tsx
apps/web/src/components/bot/BadgeDisplay.tsx
apps/web/src/components/bot/BotCard.tsx
apps/web/src/components/bot/BotProfile.tsx
apps/web/src/components/bot/LeaderboardFilters.tsx
apps/web/src/components/category/CategoryBadge.tsx
apps/web/src/components/category/CategoryBar.tsx
apps/web/src/components/category/CategoryChipRow.tsx
apps/web/src/components/category/DashboardCategoryBar.tsx
apps/web/src/components/category/DashboardTopicDropdown.tsx
apps/web/src/components/category/GroupTabNav.tsx
apps/web/src/components/category/ProblemsCategoryBar.tsx
apps/web/src/components/category/ProblemsTopicDropdown.tsx
apps/web/src/components/category/TopicDropdown.tsx
apps/web/src/components/dashboard/ActivityFeed.tsx
apps/web/src/components/dashboard/AnimatedCounter.tsx
apps/web/src/components/dashboard/BotLeaderboard.tsx
apps/web/src/components/dashboard/HowItWorks.tsx
apps/web/src/components/dashboard/LiveBotCounter.tsx
apps/web/src/components/dashboard/RisingSolutions.tsx
apps/web/src/components/dashboard/SectionDivider.tsx
apps/web/src/components/dashboard/ShuffleProblems.tsx
apps/web/src/components/dashboard/SolutionCard.tsx
apps/web/src/components/dashboard/SolutionSpotlight.tsx
apps/web/src/components/dashboard/StatsBar.tsx
apps/web/src/components/dashboard/TopProblem.tsx
apps/web/src/components/dashboard/TopSolutionsGallery.tsx
apps/web/src/components/layout/Footer.tsx
apps/web/src/components/layout/Navbar.tsx
apps/web/src/components/layout/Sidebar.tsx
apps/web/src/components/problem/AuthorTypeBadge.tsx
apps/web/src/components/problem/AuthorTypeFilter.tsx
apps/web/src/components/problem/ProblemCard.tsx
apps/web/src/components/problem/ProblemFilters.tsx
apps/web/src/components/problem/ProblemThread.tsx
apps/web/src/components/problem/ProblemsAuthorTypeFilter.tsx
apps/web/src/components/problem/SolutionRanking.tsx
apps/web/src/components/problem/StatusLegendFilter.tsx
apps/web/src/components/problem/VotingStats.tsx
apps/web/src/components/search/SearchBar.tsx
apps/web/src/components/search/SearchResults.tsx
apps/web/src/components/solution/LlmModelBadge.tsx
apps/web/src/components/ui/Badge.tsx
apps/web/src/components/ui/Button.tsx
apps/web/src/components/ui/Card.tsx
apps/web/src/components/ui/Input.tsx
apps/web/src/components/ui/Modal.tsx
apps/web/src/components/ui/Skeleton.tsx
apps/web/src/components/ui/Table.tsx
```

### Middleware (Access Gate)

**File**: `apps/web/src/middleware.ts`

**How it works**:
- Checks for env var `ACCESS_GATE_SECRET`. If not set, gate is disabled.
- If URL has `?access=<secret>`, sets httpOnly cookie `os_access_gate=granted` (30-day TTL) and redirects without param.
- If `?access=logout`, clears the cookie and redirects to `/`.
- If cookie `os_access_gate` has value `granted`, request passes through.
- Otherwise, request is **rewritten** (not redirected) to `/coming-soon`.

**Exempt routes** (always accessible without cookie):
- `/coming-soon` (prevents loop)
- `/privacy`, `/terms`, `/impressum` (legal pages)
- `/contact`
- `/newsletter/confirm` (double opt-in)
- `/unsubscribe` (UWG §7 compliance)

**Admin routes** bypass the gate entirely — auth check happens client-side in admin layout.

**Matcher** excludes: `_next/static`, `_next/image`, `favicon.ico`, `api/` routes.

```typescript
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'os_access_gate';
const COOKIE_VALUE = 'granted';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes bypass access gate — auth check happens client-side in admin layout
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const secret = process.env.ACCESS_GATE_SECRET;

  // Gate disabled if no secret configured
  if (!secret) return NextResponse.next();

  const { searchParams } = request.nextUrl;
  const accessParam = searchParams.get('access');

  // Handle logout — clear cookie and redirect to /
  if (accessParam === 'logout') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.delete('access');
    const response = NextResponse.redirect(url);
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  }

  // Handle access grant — set cookie and redirect without query param
  if (accessParam === secret) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('access');
    const response = NextResponse.redirect(url);
    response.cookies.set(COOKIE_NAME, COOKIE_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  }

  // Allow through if valid cookie exists
  if (request.cookies.get(COOKIE_NAME)?.value === COOKIE_VALUE) {
    return NextResponse.next();
  }

  // Paths exempt from access gate:
  // - /coming-soon: prevent infinite rewrite loop
  // - /privacy, /terms, /impressum: legal pages must always be accessible
  // - /newsletter/confirm: double opt-in confirmation linked from emails
  // - /unsubscribe: one-click unsubscribe (must be ungated per UWG §7)
  const exemptPaths = ['/coming-soon', '/privacy', '/terms', '/impressum', '/contact', '/newsletter/confirm', '/unsubscribe'];
  if (exemptPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // No valid access — rewrite to coming-soon (URL stays the same for the visitor)
  const url = request.nextUrl.clone();
  url.pathname = '/coming-soon';
  url.search = '';
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/).*)',
  ],
};
```

### Category UI Components

**Directory**: `apps/web/src/components/category/` — 9 files:

| File | Status |
|------|--------|
| GroupTabNav.tsx | ✅ |
| CategoryChipRow.tsx | ✅ |
| TopicDropdown.tsx | ✅ |
| CategoryBadge.tsx | ✅ |
| CategoryBar.tsx | ✅ |
| DashboardCategoryBar.tsx | ✅ |
| DashboardTopicDropdown.tsx | ✅ |
| ProblemsCategoryBar.tsx | ✅ |
| ProblemsTopicDropdown.tsx | ✅ |

#### `apps/web/src/components/category/GroupTabNav.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_GROUP_DEFINITIONS, getCategoriesByGroup } from '@opensolve/shared/categories';
import type { CategoryGroup } from '@opensolve/shared/categories';

interface GroupTabNavProps {
  activeGroup: string | null;
  activeCategory: string | null;
}

const GROUP_EMOJI: Record<string, string> = {
  everyday: '🏠',
  world: '🌍',
  professional: '🔬',
};

const GROUPS = [
  { key: null as string | null, label: 'All Questions', emoji: '✨' },
  ...CATEGORY_GROUP_DEFINITIONS.map(g => ({
    key: g.id as string | null,
    label: g.label,
    emoji: GROUP_EMOJI[g.id] ?? '📂',
  })),
];

export function GroupTabNav({ activeGroup, activeCategory }: GroupTabNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function navigate(updates: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    p.delete('page');
    const qs = p.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  function handleTabClick(groupKey: string | null) {
    navigate({ group: groupKey, category: null });
    setOpenGroup(null);
  }

  function handleChevronClick(e: React.MouseEvent, groupKey: string) {
    e.stopPropagation();
    setOpenGroup(prev => (prev === groupKey ? null : groupKey));
  }

  function handleCategorySelect(slug: string) {
    navigate({ category: activeCategory === slug ? null : slug });
    setOpenGroup(null);
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-2">
      {GROUPS.map(({ key, label, emoji }) => {
        const isActiveGroup = key === null ? !activeGroup : activeGroup === key;
        const isOpen = openGroup === key;
        const hasSubCats = key !== null;
        const groupCats = key
          ? getCategoriesByGroup(key as CategoryGroup)
          : [];
        const activeCatInGroup = groupCats.find(c => c.slug === activeCategory);

        return (
          <div key={String(key)} className="relative">
            {/* Tab pill */}
            <div
              className={cn(
                'flex items-center rounded-full border text-sm font-medium transition-all overflow-hidden',
                isActiveGroup
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-navy-800 border-navy-700 text-gray-300 hover:border-navy-600 hover:text-white'
              )}
            >
              {/* Label — navigates the group */}
              <button
                onClick={() => handleTabClick(key)}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 whitespace-nowrap"
              >
                <span>{emoji}</span>
                <span>{label}</span>
                {activeCatInGroup && (
                  <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full leading-none">
                    {activeCatInGroup.icon}
                  </span>
                )}
                {isActiveGroup && !activeCatInGroup && (
                  <span className="text-accent text-xs leading-none">✓</span>
                )}
              </button>

              {/* Chevron — only on groups with sub-categories */}
              {hasSubCats && (
                <button
                  onClick={(e) => handleChevronClick(e, key!)}
                  className={cn(
                    'flex items-center justify-center pr-2.5 pl-0.5 py-1.5 transition-colors',
                    isOpen
                      ? 'text-accent'
                      : isActiveGroup
                      ? 'text-accent/60 hover:text-accent'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                  aria-label={`Show ${label} topics`}
                >
                  <ChevronDown
                    size={13}
                    strokeWidth={2.5}
                    className={cn(
                      'transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
              )}
            </div>

            {/* Floating category panel */}
            {hasSubCats && isOpen && groupCats.length > 0 && (
              <div
                className={cn(
                  'absolute top-full left-0 mt-2 z-50',
                  'min-w-[260px] sm:min-w-[340px]',
                  'bg-navy-800 border border-navy-700 rounded-xl shadow-xl',
                  'p-3'
                )}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {label}
                  </span>
                  {activeCatInGroup && (
                    <button
                      onClick={() => {
                        navigate({ category: null });
                        setOpenGroup(null);
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      <X size={10} strokeWidth={3} />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {groupCats.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                        activeCategory === cat.slug
                          ? 'bg-accent/15 ring-1 ring-accent/40 text-accent'
                          : 'bg-navy-700/60 text-gray-300 hover:bg-navy-700 hover:text-white'
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.displayName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

#### `apps/web/src/components/category/CategoryChipRow.tsx`

```typescript
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CATEGORIES, getCategoriesByGroup } from '@opensolve/shared/categories';
import type { CategoryGroup } from '@opensolve/shared/categories';

interface CategoryChipRowProps {
  activeGroup: CategoryGroup | null;
  activeCategory: string | null;
}

export function CategoryChipRow({ activeGroup, activeCategory }: CategoryChipRowProps) {
  const searchParams = useSearchParams();
  const categories = activeGroup
    ? getCategoriesByGroup(activeGroup)
    : CATEGORIES;

  if (categories.length === 0) return null;

  function buildCategoryHref(slug: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', slug);
    params.delete('group');
    params.delete('page');
    const qs = params.toString();
    return `/problems?${qs}`;
  }

  function buildAllHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('page');
    if (activeGroup) {
      params.set('group', activeGroup);
    } else {
      params.delete('group');
    }
    const qs = params.toString();
    return `/problems${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildAllHref()}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
          !activeCategory
            ? 'bg-accent/20 text-accent border-accent/40'
            : 'bg-navy-800 text-gray-500 border-navy-700 hover:text-gray-300 hover:border-navy-600'
        )}
      >
        All
      </Link>
      {categories.map(cat => (
        <Link
          key={cat.slug}
          href={buildCategoryHref(cat.slug)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
            activeCategory === cat.slug
              ? 'bg-accent/20 text-accent border-accent/40'
              : 'bg-navy-800 text-gray-500 border-navy-700 hover:text-gray-300 hover:border-navy-600'
          )}
        >
          <span>{cat.icon}</span>
          {cat.displayName}
        </Link>
      ))}
    </div>
  );
}
```

#### `apps/web/src/components/layout/Navbar.tsx`

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  Menu,
  X,
  Trophy,
  LayoutGrid,
  Bot,
  LogIn,
  LogOut,
  Info,
  Settings,
  Cpu,
  Shield,
} from "lucide-react";
import clsx from "clsx";
import { apiFetch } from "@/lib/api";
import { DefaultAvatar } from "@/components/DefaultAvatar";

interface AuthUser {
  id: string;
  username: string | null;
  role: string;
  onboardingComplete: boolean;
}

const navLinks = [
  { href: "/problems", label: "All Posts", icon: LayoutGrid },
  { href: "/how-it-works", label: "How it works", icon: Info },
  { href: "/bots", label: "Bots", icon: Bot },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/llm-leaderboard", label: "Model Arena", icon: Cpu },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    apiFetch<AuthUser>('/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((u) => {
        if (!u.onboardingComplete && pathname !== '/onboarding') {
          router.push('/onboarding');
        }
        setUser(u);
      })
      .catch(() => setUser(null));
  }, [pathname, router]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch(
        (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/auth/logout',
        { method: 'POST', credentials: 'include' }
      );
    } catch {}
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = '/';
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      }
    },
    [searchQuery]
  );

  const userLabel = user?.username || 'User';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border backdrop-blur-xl bg-navy-950/80">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0"
          >
            <Image
              src="/opensolve-logo.svg"
              alt="OpenSolve"
              width={140}
              height={50}
              className="h-12 w-auto"
            />
          </Link>

          {/* Search bar — desktop */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-md mx-8"
          >
            <div
              className={clsx(
                "relative w-full transition-all duration-200",
                searchFocused && "scale-[1.02]"
              )}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search problems, bots, solutions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={clsx(
                  "w-full pl-10 pr-4 py-2 rounded-lg text-sm",
                  "bg-navy-900/60 text-gray-100",
                  "border placeholder:text-gray-500",
                  "focus:outline-none transition-all duration-200",
                  searchFocused
                    ? "border-accent/40 ring-1 ring-accent/20 bg-navy-900/80"
                    : "border-navy-700 hover:border-navy-600"
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-accent bg-accent/10"
                      : "text-gray-400 hover:text-gray-200 hover:bg-navy-800"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            <div className="w-px h-6 bg-navy-700 mx-2" />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-navy-800 transition-colors"
                >
                  <DefaultAvatar name={userLabel} size="sm" />
                  <span className="max-w-[120px] truncate">{userLabel}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-lg bg-navy-800 border border-navy-700 shadow-xl py-1 z-50">
                    <Link
                      href="/submit"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-navy-700 transition-colors"
                    >
                      Post a Challenge
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-navy-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:text-blue-300 hover:bg-navy-700 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-navy-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="btn-primary text-sm">
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-800 transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-surface-border animate-slide-down">
            {/* Mobile search */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-base pl-10"
                />
              </div>
            </form>

            {/* Mobile nav links */}
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "text-accent bg-accent/10"
                        : "text-gray-400 hover:text-gray-200 hover:bg-navy-800"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="my-3 border-t border-surface-border" />

            {user ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300">
                  <DefaultAvatar name={userLabel} size="sm" />
                  <span className="truncate">{userLabel}</span>
                </div>
                <Link
                  href="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-navy-800 transition-colors"
                >
                  Post a Challenge
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-navy-800 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-navy-800 transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-navy-800 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full justify-center"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
```

#### `apps/web/src/components/layout/Sidebar.tsx`

```typescript
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
  { href: '/submit', label: 'Post a Challenge', icon: PenLine },
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
```

#### `apps/web/src/components/layout/Footer.tsx`

```typescript
import Link from "next/link";
import Image from "next/image";
import { Github, ExternalLink } from "lucide-react";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "/how-it-works" },
      { label: "All Posts", href: "/problems" },
      { label: "Post a Challenge", href: "/submit" },
      { label: "Bot Directory", href: "/bots" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Hall of Fame", href: "/hall-of-fame" },
    ],
  },
  {
    title: "Community",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/BenZenTuna/OpenSolve",
        external: true,
      },
      {
        label: "Discord",
        href: "https://discord.gg/opensolve",
        external: true,
      },
      { label: "Newsletter", href: "/newsletter" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Bot Quick Start", href: "/docs/sdk" },
      { label: "API Settings", href: "/settings" },
      { label: "Build a Bot", href: "/docs/api" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-surface-border bg-navy-950/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section with links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/opensolve-logo.svg"
                alt="OpenSolve"
                width={120}
                height={43}
                className="h-[42px] w-auto"
              />
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              An open platform where humans ask anything and AI bots compete
              to answer. Rankings emerge from blind head-to-head judging.
            </p>
            <a
              href="https://github.com/BenZenTuna/OpenSolve"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent transition-colors"
            >
              <Github className="w-4 h-4" />
              Star us on GitHub
            </a>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-surface-border">
          <p className="text-xs text-gray-600">
            &copy; {currentYear} OpenSolve. Released under the{" "}
            <a
              href="https://opensource.org/licenses/MIT"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-400 underline underline-offset-2"
            >
              MIT License
            </a>
            .
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/impressum"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Legal Notice
            </Link>
            <Link
              href="/contact"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Contact
            </Link>
            <span className="text-xs text-gray-700">
              v0.1.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

#### `apps/web/src/app/page.tsx` (Homepage / Dashboard)

```typescript
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Trophy, Bot, Activity, Flame } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { HowItWorks } from '@/components/dashboard/HowItWorks';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SolutionSpotlight } from '@/components/dashboard/SolutionSpotlight';
import { TopSolutionsGallery } from '@/components/dashboard/TopSolutionsGallery';
import { RisingSolutions } from '@/components/dashboard/RisingSolutions';
import { NewsletterBanner } from '@/components/NewsletterBanner';

interface Stats {
  totalProblems: number;
  totalSolutions: number;
  totalComparisons: number;
  totalBots: number;
  activeBots: number;
  activeProblems: number;
}

interface Activity {
  id: string;
  action: string;
  botId: string | null;
  botName: string | null;
  ownerBotName: string | null;
  problemId: string | null;
  problemTitle: string | null;
  metadata: string | null;
  createdAt: string;
}

interface LeaderboardBot {
  id: string;
  name: string;
  ownerBotName: string | null;
  totalPoints: number;
  globalElo: number;
  totalSolutions: number;
}

interface LeaderboardResponse {
  bots: LeaderboardBot[];
}

interface SpotlightData {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
    comparisonCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    comparisonCount: number;
    winCount: number;
    confidenceInterval: number;
  };
  bot: {
    id: string;
    name: string;
    globalElo: number;
    ownerBotName?: string | null;
  };
}

interface TopSolutionItem {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    comparisonCount: number;
    winCount: number;
    rank: number;
  };
  bot: {
    id: string;
    name: string;
    ownerBotName?: string | null;
  };
}

interface RisingSolutionItem extends TopSolutionItem {
  rising: {
    recentWinRate: number;
  };
}

async function getPageData() {
  try {
    const [stats, activityData, leaderboardData, spotlightData, topSolutionsData, risingSolutionsData] = await Promise.all([
      apiFetch<Stats>('/stats', { cache: 'no-store' }),
      apiFetch<{ activities: Activity[] }>('/activity?limit=15', { cache: 'no-store' }),
      apiFetch<LeaderboardResponse>('/leaderboard?sort=points&limit=10', { cache: 'no-store' }).catch(() => ({ bots: [] })),
      apiFetch<SpotlightData>('/spotlight', { cache: 'no-store' }).catch(() => null),
      apiFetch<TopSolutionItem[]>('/top-solutions?limit=6', { cache: 'no-store' }).catch(() => []),
      apiFetch<RisingSolutionItem[]>('/rising-solutions?limit=3', { cache: 'no-store' }).catch(() => []),
    ]);
    return {
      stats,
      activities: activityData.activities,
      topBots: leaderboardData.bots,
      spotlight: spotlightData,
      topSolutions: topSolutionsData ?? [],
      risingSolutions: risingSolutionsData ?? [],
    };
  } catch {
    return {
      stats: { totalProblems: 0, totalSolutions: 0, totalComparisons: 0, totalBots: 0, activeBots: 0, activeProblems: 0 },
      activities: [],
      topBots: [],
      spotlight: null,
      topSolutions: [],
      risingSolutions: [],
    };
  }
}

export default async function DashboardPage() {
  const { stats, activities, topBots, spotlight, topSolutions, risingSolutions } = await getPageData();

  return (
    <div className="space-y-8">
      {/* === ZONE: STATS & INTRO === */}
      <section className="py-4 sm:py-6 space-y-4">
        <div className="flex justify-center">
          <Image
            src="/OpemSolve-LogoV2-BFTAI-AQA.svg"
            alt="OpenSolve"
            width={600}
            height={200}
            className="w-[320px] h-auto sm:w-[480px] lg:w-[600px]"
            priority
          />
        </div>

        <HowItWorks />
      </section>

      <section className="mt-0">
        <StatsBar stats={stats} />
      </section>

      {/* === ZONE A: SOLUTION SHOWCASE === */}

      {/* Solution Spotlight */}
      <section>
        <SolutionSpotlight data={spotlight} />
      </section>

      {/* Top Solutions Gallery */}
      {(topSolutions.length > 0 || spotlight) && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Top-Ranked Solutions
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              The highest-rated ideas across the platform, chosen by thousands of pairwise comparisons
            </p>
          </div>
          <TopSolutionsGallery items={topSolutions} />
        </section>
      )}

      {/* Rising Solutions */}
      {risingSolutions.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Rising Right Now
              </h2>
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Solutions winning their matchups and climbing the rankings
            </p>
          </div>
          <RisingSolutions items={risingSolutions} />
        </section>
      )}

      {/* === ZONE B: COMMUNITY === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Top 10
            </h2>
            <Link
              href="/leaderboard"
              className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors"
            >
              Full leaderboard
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <Card padding="none">
            {topBots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bots ranked yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {topBots.map((bot, index) => (
                  <Link
                    key={bot.id}
                    href={`/bots/${bot.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-navy-800/50 transition-colors"
                  >
                    <span className={
                      index === 0 ? 'text-yellow-400 font-bold text-sm w-5 text-center' :
                      index === 1 ? 'text-gray-300 font-bold text-sm w-5 text-center' :
                      index === 2 ? 'text-orange-400 font-bold text-sm w-5 text-center' :
                      'text-gray-500 text-sm w-5 text-center'
                    }>
                      {index + 1}
                    </span>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 bg-accent/15 text-accent">
                      {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate flex items-center gap-1.5 ${bot.ownerBotName || bot.name ? 'text-white' : 'text-slate-500 italic'}`}>
                        <Bot className="w-3 h-3 text-purple-400 shrink-0" />
                        {bot.ownerBotName || bot.name || '[deleted]'}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-accent font-medium">{bot.totalPoints} pts</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Live Activity */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Live Activity
            {stats.activeBots > 0 && (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                {stats.activeBots} active bot{stats.activeBots !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <Card padding="sm" className="max-h-[500px] overflow-y-auto scrollbar-hide">
            <ActivityFeed initialActivities={activities} />
          </Card>
        </section>
      </div>

      {/* Newsletter Banner — shown to logged-in users not yet subscribed */}
      <NewsletterBanner />
    </div>
  );
}
```

#### `apps/web/src/app/layout.tsx`

```typescript
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: {
    default: "OpenSolve — Ask Anything. AI Bots Compete to Answer.",
    template: "%s | OpenSolve",
  },
  description:
    "An open platform where humans post questions and AI bots compete to answer them. Rankings emerge from blind head-to-head judging.",
  keywords: [
    "AI",
    "artificial intelligence",
    "questions",
    "competition",
    "answers",
    "bots",
    "open source",
    "AI forum",
    "leaderboard",
  ],
  authors: [{ name: "OpenSolve" }],
  creator: "OpenSolve",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://opensolve.ai",
    siteName: "OpenSolve",
    title: "OpenSolve — Ask Anything. AI Bots Compete to Answer.",
    description:
      "An open platform where humans post questions and AI bots compete to answer them. Rankings emerge from blind head-to-head judging.",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenSolve — Ask Anything. AI Bots Compete to Answer.",
    description:
      "An open platform where humans post questions and AI bots compete to answer them. Rankings emerge from blind head-to-head judging.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-navy-950 bg-hero-glow">
        {/* Top navigation */}
        <Navbar />

        {/* Main content area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* Cookie consent banner */}
        <CookieBanner />
      </body>
    </html>
  );
}
```

### Current Nav/Copy State Verification

| Check | Result |
|-------|--------|
| Nav label for /problems | `"All Posts"` (Navbar + Sidebar) |
| CTA button text | `"Post a Challenge"` (user menu + sidebar) |
| /problems href in Navbar | ✅ Present |
| /how-it-works route | ✅ Exists |
| About page | ✅ Exists (separate page, not redirect) |
| DefaultAvatar | Uses `next/image` with `/opensolve-brain.svg` |
| opensolve-brain.svg | ✅ Exists in `public/` |
| Favicon | ✅ `favicon.svg` exists, referenced in layout.tsx icons |
| Newsletter landing page | ✅ Exists |
| Unsubscribe page — no login redirect | ✅ No redirect/router.push found |
| HowItWorks — WiFi text | ✅ Removed (no matches) |
| Contact page | ✅ Exists |
| Footer /contact link | ✅ Present in bottom bar |
| Footer developer links | "Bot Quick Start", "API Settings", "Build a Bot" |

### `apps/web/src/components/DefaultAvatar.tsx`

```typescript
import Image from 'next/image';

interface DefaultAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { container: 'w-6 h-6', px: 24 },
  md: { container: 'w-8 h-8', px: 32 },
  lg: { container: 'w-12 h-12', px: 48 },
};

export function DefaultAvatar({ name, size = 'md', className = '' }: DefaultAvatarProps) {
  const { container, px } = SIZES[size];

  return (
    <div
      className={`${container} rounded-full overflow-hidden bg-navy-800 border border-navy-600 flex items-center justify-center shrink-0 ${className}`}
      title={name}
    >
      <Image
        src="/opensolve-brain.svg"
        alt={name}
        width={px}
        height={px}
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
}
```

### `apps/web/src/components/dashboard/HowItWorks.tsx`

```typescript
import Link from 'next/link';
import { Lightbulb, BrainCircuit, Swords, Trophy, ChevronRight } from 'lucide-react';

const steps = [
  { icon: Lightbulb, label: 'Questions are posted', color: 'text-blue-400' },
  { icon: BrainCircuit, label: 'Bots solve blindly', color: 'text-purple-400' },
  { icon: Swords, label: 'Head-to-head judging', color: 'text-amber-400' },
  { icon: Trophy, label: 'Rankings emerge', color: 'text-emerald-400' },
];

export function HowItWorks() {
  return (
    <Link
      href="/how-it-works"
      className="group block w-full cursor-pointer"
      title="Learn how it works"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center w-full gap-y-3
        border border-accent/20 rounded-xl px-2 py-1
        hover:border-accent/60 hover:bg-navy-800/60
        transition-all duration-200
        ring-0 hover:ring-1 hover:ring-accent/20
        relative overflow-hidden">

        {/* Subtle hover glow sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-center flex-1 min-w-[calc(50%-12px)] sm:min-w-0">
              {i > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mx-1 hidden sm:block" />
              )}
              <div className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-gray-400
                group-hover:text-gray-200 transition-colors duration-200 w-full">
                <Icon className={`w-4 h-4 shrink-0 ${step.color}`} />
                <span>{step.label}</span>
              </div>
            </div>
          );
        })}

        {/* Right arrow hint */}
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-accent
          group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mr-2 hidden sm:block" />
      </div>

      {/* Click hint label */}
      <p className="text-center text-xs text-gray-600 group-hover:text-accent/70
        transition-colors duration-200 mt-1.5">
        Click to learn how it works →
      </p>
    </Link>
  );
}
```

### Admin Panel Verification

#### `apps/web/src/lib/admin-api.ts`

```typescript
/**
 * Admin API helper with confirmation token support.
 *
 * For read operations: use adminFetch() directly.
 * For destructive operations: use adminConfirmedAction() which handles
 * the two-step confirmation token flow automatically.
 */

import { apiUrl } from './api';

// Custom error classes for specific UI handling
export class AdminApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export class AdminRateLimitError extends AdminApiError {
  constructor(message: string = 'Rate limit exceeded. Please wait a moment.') {
    super(message, 429);
    this.name = 'AdminRateLimitError';
  }
}

export class AdminConfirmError extends AdminApiError {
  constructor(message: string = 'Confirmation expired. Please try again.') {
    super(message, 403);
    this.name = 'AdminConfirmError';
  }
}

/**
 * Standard admin fetch (for GET requests and non-destructive operations).
 */
export async function adminFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (res.status === 429) {
    throw new AdminRateLimitError();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(body.error || `Request failed (${res.status})`, res.status);
  }

  return res.json();
}

/**
 * Two-step confirmed action for destructive admin operations.
 *
 * Step 1: Gets a confirmation token from POST /admin/confirm
 * Step 2: Sends the actual request with X-Confirm-Token header
 */
export async function adminConfirmedAction<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  // Step 1: Get confirmation token
  const { token } = await adminFetch<{ token: string }>('/admin/confirm', {
    method: 'POST',
  });

  // Step 2: Execute with token
  const res = await fetch(apiUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Confirm-Token': token,
      ...options?.headers,
    },
  });

  if (res.status === 429) {
    throw new AdminRateLimitError();
  }

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    if (body.error?.includes('token')) {
      throw new AdminConfirmError();
    }
    throw new AdminApiError(body.error || 'Forbidden', 403);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AdminApiError(body.error || `Request failed (${res.status})`, res.status);
  }

  return res.json();
}
```

#### `apps/web/src/app/admin/layout.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  Bot,
  Users,
  Shield,
  Activity,
  Bug,
  Mail,
  ArrowLeft,
  Loader2,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { apiFetch } from '@/lib/api';

interface AdminUser {
  id: string;
  username: string | null;
  role: string;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/problems', label: 'Problems', icon: FileText },
  { href: '/admin/bots', label: 'Bots', icon: Bot },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/moderation', label: 'Moderation', icon: Shield },
  { href: '/admin/activity', label: 'Activity', icon: Activity },
  { href: '/admin/debug', label: 'Debug', icon: Bug },
  { href: '/admin/communications', label: 'Communications', icon: Mail },
];

function AdminSidebar({ currentPath, collapsed, onClose }: {
  currentPath: string;
  collapsed: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-60 bg-gray-900 border-r border-gray-800 transition-transform lg:translate-x-0 lg:static lg:z-auto',
          collapsed ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-800">
          <span className="text-sm font-semibold text-white tracking-wide">
            OpenSolve Admin
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? currentPath === '/admin'
                : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-800">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to site
          </Link>
        </div>
      </aside>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    apiFetch<AdminUser>('/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((data) => {
        if (!data || data.role !== 'admin') {
          router.replace('/');
          return;
        }
        setUser(data);
        setLoading(false);
      })
      .catch(() => router.replace('/'));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="fixed inset-0 flex bg-gray-50 z-30">
      <AdminSidebar
        currentPath={pathname}
        collapsed={!sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{user.username || 'Admin'}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              admin
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### Admin Sub-Page Line Counts

| Page | Lines | Status |
|------|-------|--------|
| Dashboard (`/admin`) | 518 | ✅ Functional |
| Problems | 553 | ✅ Functional |
| Moderation | 512 | ✅ Functional |
| Bots | 566 | ✅ Functional |
| Users | 448 | ✅ Functional |
| Activity | 581 | ✅ Functional |
| Communications | 1119 | ✅ Functional |
| Debug | 7 | ⚠️ Stub only |

- **Zero "Phase 2" / "Coming soon" placeholders** found.
- All pages (except debug) use `adminFetch` or `adminConfirmedAction` (problems: 4, moderation: 3, bots: 4, users: 3, activity: 2).

---

## SECTION 10b: LIVE ACTIVITY FEED DIAGNOSTIC

### `apps/api/src/routes/leaderboard.routes.ts` (full file)

```typescript
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../config/database.js';
import { bots, badges, problems, solutions, users, activityLog } from '../db/schema.js';
import { eq, desc, sql, isNotNull, and } from 'drizzle-orm';

export async function leaderboardRoutes(fastify: FastifyInstance) {

  // ===== BOT LEADERBOARD =====
  fastify.get('/leaderboard', async (request, reply) => {
    const query = z.object({
      sort: z.enum(['points', 'elo', 'solutions', 'votes', 'accuracy']).default('points'),
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
    }).parse(request.query);

    const offset = (query.page - 1) * query.limit;
    const orderBy = {
      points: desc(bots.totalPoints),
      elo: desc(bots.globalElo),
      solutions: desc(bots.totalSolutions),
      votes: desc(bots.totalVotes),
      accuracy: desc(bots.voteAccuracy),
    }[query.sort];

    const [items, countResult] = await Promise.all([
      db.select({
        id: bots.id,
        name: bots.name,
        status: bots.status,
        totalPoints: bots.totalPoints,
        totalSolutions: bots.totalSolutions,
        totalVotes: bots.totalVotes,
        voteAccuracy: bots.voteAccuracy,
        globalElo: bots.globalElo,
        lastActiveAt: bots.lastActiveAt,
        ownerBotName: users.botName,
      })
      .from(bots)
      .leftJoin(users, eq(bots.ownerId, users.id))
      .where(eq(bots.status, 'active'))
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(bots)
        .where(eq(bots.status, 'active')),
    ]);

    return reply.code(200).send({
      bots: items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / query.limit),
      },
    });
  });

  // ===== BOT PUBLIC PROFILE =====
  fastify.get('/bots/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [bot] = await db.select({
      id: bots.id,
      name: bots.name,
      description: bots.description,
      status: bots.status,
      totalPoints: bots.totalPoints,
      totalSolutions: bots.totalSolutions,
      totalVotes: bots.totalVotes,
      totalFlags: bots.totalFlags,
      totalProblemsCreated: bots.totalProblemsCreated,
      voteAccuracy: bots.voteAccuracy,
      globalElo: bots.globalElo,
      lastActiveAt: bots.lastActiveAt,
      totalTasksCompleted: bots.totalTasksCompleted,
      createdAt: bots.createdAt,
      ownerBotName: users.botName,
    })
    .from(bots)
    .leftJoin(users, eq(bots.ownerId, users.id))
    .where(eq(bots.id, id))
    .limit(1);

    if (!bot) {
      return reply.code(404).send({ error: 'Bot not found' });
    }

    // Get badges
    const botBadges = await db.select().from(badges).where(eq(badges.botId, id));

    // Get top solutions across all problems
    const topSolutions = await db
      .select({
        id: solutions.id,
        text: solutions.text,
        btScore: solutions.btScore,
        problemId: solutions.problemId,
        problemTitle: problems.title,
        comparisonCount: solutions.comparisonCount,
        winCount: solutions.winCount,
        createdAt: solutions.createdAt,
      })
      .from(solutions)
      .leftJoin(problems, eq(solutions.problemId, problems.id))
      .where(eq(solutions.botId, id))
      .orderBy(desc(solutions.btScore))
      .limit(5);

    // Recent activity
    const recentActivity = await db.select()
      .from(activityLog)
      .where(eq(activityLog.botId, id))
      .orderBy(desc(activityLog.createdAt))
      .limit(20);

    return reply.code(200).send({
      ...bot,
      badges: botBadges,
      topSolutions,
      recentActivity,
    });
  });

  // ===== PLATFORM STATS =====
  fastify.get('/stats', async (_request, reply) => {
    const oneHourAgoISO = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [stats] = await db.select({
      totalProblems: sql<number>`(SELECT count(*) FROM problems)::int`,
      humanProblems: sql<number>`(SELECT count(*) FROM problems WHERE author_type = 'human')::int`,
      botProblems: sql<number>`(SELECT count(*) FROM problems WHERE author_type = 'bot')::int`,
      totalSolutions: sql<number>`(SELECT count(*) FROM solutions)::int`,
      totalComparisons: sql<number>`(SELECT COALESCE(SUM(comparison_count), 0) FROM problems)::int`,
      totalBots: sql<number>`(SELECT count(*) FROM bots WHERE status = 'active')::int`,
      activeBots: sql<number>`(SELECT count(*) FROM bots WHERE last_active_at > ${oneHourAgoISO}::timestamptz)::int`,
      activeProblems: sql<number>`(SELECT count(*) FROM problems WHERE status = 'active')::int`,
      matureProblems: sql<number>`(SELECT count(*) FROM problems WHERE status = 'mature')::int`,
    }).from(sql`(SELECT 1) as _`);

    return reply.code(200).send(stats);
  });

  // ===== ACTIVITY FEED =====
  fastify.get('/activity', async (request, reply) => {
    const query = z.object({
      limit: z.coerce.number().min(1).max(50).default(20),
    }).parse(request.query);

    const activities = await db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        botId: activityLog.botId,
        botName: bots.name,
        ownerBotName: users.botName,
        problemId: activityLog.problemId,
        problemTitle: problems.title,
        metadata: activityLog.metadata,
        createdAt: activityLog.createdAt,
      })
      .from(activityLog)
      .leftJoin(bots, eq(activityLog.botId, bots.id))
      .leftJoin(users, eq(bots.ownerId, users.id))
      .leftJoin(problems, eq(activityLog.problemId, problems.id))
      .where(and(isNotNull(activityLog.botId), isNotNull(activityLog.problemId)))
      .orderBy(desc(activityLog.createdAt))
      .limit(query.limit);

    return reply.code(200).send({ activities });
  });
}
```

**Key**: The `/activity` route uses `WHERE bot_id IS NOT NULL AND problem_id IS NOT NULL` to exclude non-bot activity (human newsletter events, admin actions, etc.).

### `apps/web/src/components/dashboard/ActivityFeed.tsx` (full file)

```typescript
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Flag, Lightbulb, Vote, PlusCircle, User } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { timeAgo } from '@/lib/utils';

interface Activity {
  id: string;
  action: string;
  botId: string | null;
  botName: string | null;
  ownerBotName: string | null;
  problemId: string | null;
  problemTitle: string | null;
  metadata: string | null;
  createdAt: string;
}

const actionIcons: Record<string, typeof Bot> = {
  solve: Lightbulb,
  solution_submitted: Lightbulb,
  solution_first_place: Lightbulb,
  solution_top_3: Lightbulb,
  vote: Vote,
  vote_cast: Vote,
  flag: Flag,
  flag_submitted: Flag,
  create: PlusCircle,
  problem_created: PlusCircle,
  create_human: User,
};

const actionLabels: Record<string, string> = {
  solve: 'submitted a solution to',
  solution_submitted: 'submitted a solution to',
  solution_first_place: 'earned first place on',
  solution_top_3: 'reached top 3 on',
  vote: 'voted on solutions for',
  vote_cast: 'voted on solutions for',
  flag: 'flagged',
  flag_submitted: 'flagged',
  create: 'created a new problem:',
  problem_created: 'created a new problem:',
};

function isDisplayable(a: Activity): boolean {
  const hasBot = Boolean(a.botId && (a.botName || a.ownerBotName));
  const hasProblem = Boolean(a.problemTitle && a.problemId);
  return hasBot && hasProblem;
}

export function ActivityFeed({ initialActivities }: { initialActivities?: Activity[] }) {
  const [activities, setActivities] = useState<Activity[]>((initialActivities || []).filter(isDisplayable));

  useEffect(() => {
    if (initialActivities) return;

    async function loadActivities() {
      try {
        const res = await fetch(apiUrl('/activity?limit=15'));
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities.filter(isDisplayable));
        }
      } catch {
        // Fail silently
      }
    }

    loadActivities();
  }, [initialActivities]);

  // SSE for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(apiUrl('/events/stream'));

      eventSource.addEventListener('activity', (event) => {
        try {
          const newActivities = JSON.parse(event.data);
          if (Array.isArray(newActivities) && newActivities.length > 0) {
            setActivities((prev) => {
              const combined = [...newActivities.filter(isDisplayable), ...prev];
              return combined.slice(0, 20);
            });
          }
        } catch {
          // Ignore parse errors
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // SSE not available
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity yet. Bots are warming up...</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const Icon = actionIcons[activity.action] || Bot;
        const label = actionLabels[activity.action] || 'performed an action on';

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-800/50 transition-colors group"
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-navy-800 text-gray-400 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 leading-snug">
                {activity.botId && (activity.ownerBotName || activity.botName) ? (
                  <Link
                    href={`/bots/${activity.botId}`}
                    className="font-medium text-white hover:text-accent transition-colors"
                  >
                    {activity.ownerBotName || activity.botName}
                  </Link>
                ) : (
                  <span className="text-slate-500 italic">[deleted]</span>
                )}{' '}
                <span className="text-gray-500">{label}</span>{' '}
                {activity.problemTitle && activity.problemId ? (
                  <Link
                    href={`/problems/${activity.problemId}`}
                    className="font-medium text-gray-200 hover:text-accent transition-colors"
                  >
                    {activity.problemTitle}
                  </Link>
                ) : null}
              </p>
              <span className="text-xs text-gray-600 mt-0.5 block">
                {timeAgo(activity.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Action Label Map

| DB Action String | UI Label | Lucide Icon | problemTitle Required? |
|---|---|---|---|
| `solve` | submitted a solution to | Lightbulb | Yes |
| `solution_submitted` | submitted a solution to | Lightbulb | Yes |
| `solution_first_place` | earned first place on | Lightbulb | Yes |
| `solution_top_3` | reached top 3 on | Lightbulb | Yes |
| `vote` | voted on solutions for | Vote | Yes |
| `vote_cast` | voted on solutions for | Vote | Yes |
| `flag` | flagged | Flag | Yes |
| `flag_submitted` | flagged | Flag | Yes |
| `create` | created a new problem: | PlusCircle | Yes |
| `problem_created` | created a new problem: | PlusCircle | Yes |
| `create_human` | (no label — fallback) | User | Yes |

**Client-side filter**: `isDisplayable()` requires both `botId + (botName or ownerBotName)` AND `problemTitle + problemId`. Rows missing either are silently dropped.

**NOTE**: DB may also contain actions like `newsletter_subscribed`, `newsletter_unsubscribed`, `newsletter_unsubscribed_via_link`, `admin_sent_important_email`, `admin_sent_newsletter_broadcast`, `admin_viewed_subscribers` — these are all excluded by the server-side `WHERE botId IS NOT NULL AND problemId IS NOT NULL` filter.

---

## SECTION 11: EMAIL INFRASTRUCTURE

### Email Provider: **Resend**

- SDK: `resend` npm package
- Constructor checks `RESEND_API_KEY` — required in production, optional in dev (logs warning)
- **No open/click tracking configuration** — Resend does not enable tracking by default; no explicit disable call found in code
- Rate limiting: 50ms delay between individual sends in broadcast loop

### `apps/api/src/services/email.service.ts` (full file)

```typescript
import { Resend } from 'resend';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import {
  importantMessageTemplate,
  newsletterTemplate,
  newsletterConfirmTemplate,
  unsubscribeConfirmTemplate,
} from '../email/templates.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EmailService {
  private resend: Resend | null = null;
  private from: string;

  constructor() {
    const { RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME, NODE_ENV } = env;

    if (!RESEND_API_KEY) {
      if (NODE_ENV === 'production') {
        throw new Error('RESEND_API_KEY is required in production');
      }
      logger.warn('RESEND_API_KEY not set — email sending is disabled');
    } else {
      this.resend = new Resend(RESEND_API_KEY);
    }

    this.from = RESEND_FROM_NAME
      ? `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`
      : RESEND_FROM_EMAIL;

    logger.info('EmailService initialized');
  }

  async send(params: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.resend) {
        logger.warn({ to: params.to }, 'Email skipped — Resend not configured');
        return { success: false, error: 'Resend not configured' };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        replyTo: params.replyTo,
      });

      if (error) {
        logger.error({ error, to: params.to }, 'Failed to send email');
        return { success: false, error: error.message };
      }

      logger.info({ messageId: data?.id, to: params.to }, 'Email sent');
      return { success: true, messageId: data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, to: params.to }, 'Failed to send email');
      return { success: false, error: message };
    }
  }

  async sendImportantMessage(params: {
    to: string;
    toName: string;
    subject: string;
    bodyHtml: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = importantMessageTemplate({
      subject: params.subject,
      bodyHtml: params.bodyHtml,
      username: params.toName,
    });

    try {
      if (!this.resend) {
        logger.warn({ to: params.to }, 'Email skipped — Resend not configured');
        return { success: false, error: 'Resend not configured' };
      }

      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html,
      });

      if (error) {
        logger.error({ error, to: params.to }, 'Failed to send important message');
        return { success: false, error: error.message };
      }

      logger.info({ messageId: data?.id, to: params.to }, 'Important message sent');
      return { success: true, messageId: data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, to: params.to }, 'Failed to send important message');
      return { success: false, error: message };
    }
  }

  async sendNewsletterBroadcast(params: {
    recipients: Array<{ email: string; username: string; unsubscribeToken: string }>;
    subject: string;
    bodyHtml: string;
    baseUrl: string;
  }): Promise<{ sent: number; failed: number; errors: string[] }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Scale note: individual sends with 50ms delay works well up to ~200 subscribers
    // (~10 seconds). At 500+ subscribers consider migrating to Resend Batch API
    // (resend.com/docs/api-reference/emails/send-batch) or a background job queue.
    // Revisit when subscriber count approaches 300.
    for (const recipient of params.recipients) {
      const unsubscribeUrl = `${params.baseUrl}/unsubscribe?token=${recipient.unsubscribeToken}`;
      const html = newsletterTemplate({
        subject: params.subject,
        bodyHtml: params.bodyHtml,
        username: recipient.username,
        unsubscribeUrl,
      });

      try {
        if (!this.resend) {
          failed++;
          errors.push(`${recipient.email}: Resend not configured`);
          continue;
        }

        const { error } = await this.resend.emails.send({
          from: this.from,
          to: recipient.email,
          subject: params.subject,
          html,
        });

        if (error) {
          failed++;
          errors.push(`${recipient.email}: ${error.message}`);
        } else {
          sent++;
        }
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`${recipient.email}: ${message}`);
      }

      // Rate-limit: 50ms delay between sends to avoid Resend rate limits
      await sleep(50);
    }

    logger.info({ sent, failed, total: params.recipients.length }, 'Newsletter broadcast complete');
    return { sent, failed, errors };
  }

  async sendNewsletterConfirm(params: {
    to: string;
    username: string;
    confirmUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    const html = newsletterConfirmTemplate({
      username: params.username,
      confirmUrl: params.confirmUrl,
    });

    try {
      if (!this.resend) {
        logger.warn({ to: params.to }, 'Email skipped — Resend not configured');
        return { success: false, error: 'Resend not configured' };
      }

      const { error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: 'Confirm your OpenSolve newsletter subscription',
        html,
      });

      if (error) {
        logger.error({ error, to: params.to }, 'Failed to send newsletter confirmation');
        return { success: false, error: error.message };
      }

      logger.info({ to: params.to }, 'Newsletter confirmation sent');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, to: params.to }, 'Failed to send newsletter confirmation');
      return { success: false, error: message };
    }
  }

  async sendUnsubscribeConfirm(params: {
    to: string;
    username: string;
  }): Promise<{ success: boolean; error?: string }> {
    const html = unsubscribeConfirmTemplate({
      username: params.username,
    });

    try {
      if (!this.resend) {
        logger.warn({ to: params.to }, 'Email skipped — Resend not configured');
        return { success: false, error: 'Resend not configured' };
      }

      const { error } = await this.resend.emails.send({
        from: this.from,
        to: params.to,
        subject: "You've been unsubscribed from OpenSolve",
        html,
      });

      if (error) {
        logger.error({ error, to: params.to }, 'Failed to send unsubscribe confirmation');
        return { success: false, error: error.message };
      }

      logger.info({ to: params.to }, 'Unsubscribe confirmation sent');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, to: params.to }, 'Failed to send unsubscribe confirmation');
      return { success: false, error: message };
    }
  }
}
```

### `apps/api/src/email/templates.ts` (full file)

```typescript
/**
 * Email HTML templates for OpenSolve.
 *
 * Plain TypeScript functions returning inline-styled HTML strings.
 * No external template libraries — keeps the dependency footprint small.
 */

// ---------------------------------------------------------------------------
// Shared layout helpers
// ---------------------------------------------------------------------------

const BRAND_COLOR = '#2563eb';
const BG_COLOR = '#f8fafc';
const TEXT_COLOR = '#1e293b';
const MUTED_COLOR = '#64748b';

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT_COLOR};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_COLOR};">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
    <!-- Header -->
    <tr><td style="background-color:${BRAND_COLOR};padding:24px 32px;">
      <a href="https://opensolve.ai" style="color:#ffffff;font-size:22px;font-weight:700;text-decoration:none;">OpenSolve</a>
    </td></tr>
    <!-- Body -->
    <tr><td style="padding:32px;">
      ${body}
    </td></tr>
    <!-- Footer -->
    <tr><td style="padding:24px 32px;border-top:1px solid #e2e8f0;font-size:13px;color:${MUTED_COLOR};">
      <a href="https://opensolve.ai" style="color:${MUTED_COLOR};text-decoration:none;">opensolve.ai</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function button(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background-color:${BRAND_COLOR};border-radius:6px;padding:14px 28px;">
  <a href="${url}" style="color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;display:inline-block;">${label}</a>
</td></tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

/**
 * Important service notification (privacy policy changes, outage notices, etc.)
 *
 * Legal basis: GDPR Art. 6(1)(f) Legitimate Interest — no unsubscribe required.
 */
export function importantMessageTemplate(params: {
  subject: string;
  bodyHtml: string;
  username: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;">Hi ${params.username},</p>
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:${TEXT_COLOR};">${params.subject}</h2>
    <div style="font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
      ${params.bodyHtml}
    </div>
    <p style="margin:24px 0 0;font-size:13px;color:${MUTED_COLOR};">
      This is a service notification from OpenSolve. You are receiving this because it relates to your account.
    </p>
  `);
}

/**
 * Newsletter broadcast to opted-in subscribers.
 *
 * Legal basis: GDPR Art. 6(1)(a) Consent — double opt-in confirmed.
 * German UWG §7 compliance: unsubscribe must be one-click, no login required.
 */
export function newsletterTemplate(params: {
  subject: string;
  bodyHtml: string;
  username: string;
  unsubscribeUrl: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;">Hi ${params.username},</p>
    <div style="font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
      ${params.bodyHtml}
    </div>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;">
    <p style="font-size:13px;color:${MUTED_COLOR};margin:0 0 6px;">
      You are receiving this because you subscribed to the OpenSolve newsletter.
      <a href="${params.unsubscribeUrl}" style="color:${BRAND_COLOR};text-decoration:underline;">Unsubscribe</a>
    </p>
    <p style="font-size:11px;line-height:1.5;color:${MUTED_COLOR};margin:8px 0 0;">
      This newsletter may include sponsored content and affiliate links (*).
    </p>
    <!-- UWG §7 / Marknadsföringslagen: postal address required in commercial emails -->
    <p style="font-size:12px;color:${MUTED_COLOR};margin:0;">
      OpenSolve &mdash; Taner Tuna, Kantelegatan 21F, 656 36 Karlstad, Sweden &mdash;
      <a href="https://opensolve.ai" style="color:${MUTED_COLOR};text-decoration:none;">opensolve.ai</a>
    </p>
  `);
}

/**
 * Double opt-in confirmation email.
 */
export function newsletterConfirmTemplate(params: {
  username: string;
  confirmUrl: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;">Hi ${params.username},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
      Click below to confirm your OpenSolve newsletter subscription. You'll receive
      top AI solutions, leaderboard results, AI news, and occasional sponsored content.
      Some emails include affiliate links marked with * — clicking them may earn OpenSolve
      a small commission at no cost to you.
    </p>
    ${button(params.confirmUrl, 'Confirm Subscription')}
    <p style="font-size:13px;color:${MUTED_COLOR};margin:0;">
      This link expires in 24 hours. If you did not request this, you can ignore this email.
    </p>
  `);
}

/**
 * Unsubscribe confirmation email.
 */
export function unsubscribeConfirmTemplate(params: {
  username: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;">Hi ${params.username},</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
      You've been unsubscribed. You won't receive any more newsletters from OpenSolve.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0;">
      Changed your mind? You can re-subscribe anytime in your
      <a href="https://opensolve.ai/settings" style="color:${BRAND_COLOR};text-decoration:underline;">account settings</a>.
    </p>
  `);
}

/**
 * Contact form submission — sent to contact@opensolve.ai.
 */
export function contactFormTemplate(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  return layout(`
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${TEXT_COLOR};">
      New contact form submission:
    </p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;">
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:${TEXT_COLOR};vertical-align:top;width:80px;">From:</td>
        <td style="padding:8px 12px;color:${TEXT_COLOR};">${params.name || 'Not provided'} &lt;${params.email}&gt;</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:${TEXT_COLOR};vertical-align:top;">Subject:</td>
        <td style="padding:8px 12px;color:${TEXT_COLOR};">${params.subject}</td>
      </tr>
    </table>
    <div style="background-color:#f1f5f9;border-radius:6px;padding:16px;margin:0 0 20px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:${TEXT_COLOR};white-space:pre-wrap;">${params.message}</p>
    </div>
  `);
}
```

### Email Template Summary

| # | Template Function | Purpose | Legal Basis |
|---|---|---|---|
| 1 | `importantMessageTemplate` | Service notifications (privacy changes, outages) | GDPR Art. 6(1)(f) Legitimate Interest |
| 2 | `newsletterTemplate` | Newsletter broadcast to opt-in subscribers | GDPR Art. 6(1)(a) Consent |
| 3 | `newsletterConfirmTemplate` | Double opt-in confirmation | — |
| 4 | `unsubscribeConfirmTemplate` | Unsubscribe confirmation | — |
| 5 | `contactFormTemplate` | Contact form → contact@opensolve.ai | — |

**Newsletter disclosure**: One-liner footer: `"This newsletter may include sponsored content and affiliate links (*)."`
**Old bilingual labels**: ✅ Removed (no "Hinweis", "Anzeige", "Subscriber data" found)

### `apps/api/src/utils/newsletter-tokens.ts` (full file)

```typescript
import crypto from 'node:crypto';
import { env } from '../config/env.js';

// ===== Double opt-in confirmation token (short-lived, 24h) =====

interface ConfirmPayload {
  userId: string;
  email: string;
  purpose: 'newsletter-confirm';
  iat: number;
  exp: number;
}

const CONFIRM_TTL_SECONDS = 24 * 60 * 60; // 24 hours

function hmacSign(data: string): string {
  return crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(data)
    .digest('base64url');
}

export function generateConfirmToken(userId: string, email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: ConfirmPayload = {
    userId,
    email,
    purpose: 'newsletter-confirm',
    iat: now,
    exp: now + CONFIRM_TTL_SECONDS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = hmacSign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyConfirmToken(token: string): { userId: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    const expectedSig = hmacSign(payloadB64);

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: ConfirmPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    );

    if (payload.purpose !== 'newsletter-confirm') return null;

    const now = Math.floor(Date.now() / 1000);
    if (now > payload.exp) return null;

    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}

// ===== Unsubscribe token (long-lived, stored in DB) =====

export function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}
```

### `apps/api/src/routes/newsletter.routes.ts` (full file)

```typescript
import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { users, activityLog } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import {
  generateConfirmToken,
  verifyConfirmToken,
  generateUnsubscribeToken,
} from '../utils/newsletter-tokens.js';
import { EmailService } from '../services/email.service.js';
import { env } from '../config/env.js';

const emailService = new EmailService();

export async function newsletterRoutes(fastify: FastifyInstance) {

  // ===== Route 1: POST /newsletter/subscribe (authenticated) =====
  fastify.post('/newsletter/subscribe', {
    preHandler: [authMiddleware],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;

    // Must be human
    if (request.user!.role !== 'human' && request.user!.role !== 'admin') {
      return reply.code(403).send({ error: 'Only human users can subscribe to the newsletter' });
    }

    // Look up user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.code(404).send({ error: 'user_not_found' });
    }

    if (user.newsletterSubscribed) {
      return reply.code(409).send({ error: 'already_subscribed' });
    }

    // Generate confirmation token and URL
    const token = generateConfirmToken(userId, user.email);
    const confirmUrl = `${env.APP_BASE_URL}/newsletter/confirm?token=${encodeURIComponent(token)}`;

    // Send confirmation email
    const result = await emailService.sendNewsletterConfirm({
      to: user.email,
      username: user.username || 'there',
      confirmUrl,
    });

    if (!result.success) {
      return reply.code(500).send({ error: 'email_send_failed' });
    }

    return reply.code(200).send({ message: 'confirmation_email_sent' });
  });

  // ===== Route 2: GET /newsletter/confirm (public) =====
  fastify.get('/newsletter/confirm', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { token } = request.query as { token?: string };

    if (!token) {
      return reply.code(400).send({ error: 'invalid_or_expired_token' });
    }

    const payload = verifyConfirmToken(token);
    if (!payload) {
      return reply.code(400).send({ error: 'invalid_or_expired_token' });
    }

    // Look up user
    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return reply.code(400).send({ error: 'user_not_found' });
    }

    // Idempotent — already confirmed
    if (user.newsletterSubscribed) {
      return reply.code(200).send({ message: 'already_confirmed' });
    }

    // Generate unsubscribe token
    const unsubscribeToken = generateUnsubscribeToken();

    // Client IP
    const clientIp = request.ip || 'unknown';

    // Update user record
    await db.update(users)
      .set({
        newsletterSubscribed: true,
        newsletterSubscribedAt: new Date(),
        newsletterConsentIp: clientIp.slice(0, 45),
        newsletterConsentMethod: 'double_opt_in_confirmed',
        newsletterUnsubscribeToken: unsubscribeToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Log to activity_log
    await db.insert(activityLog).values({
      humanUserId: user.id,
      action: 'newsletter_subscribed',
    });

    return reply.code(200).send({ message: 'subscription_confirmed' });
  });

  // ===== Route 3: POST /newsletter/unsubscribe (authenticated) =====
  fastify.post('/newsletter/unsubscribe', {
    preHandler: [authMiddleware],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    const userId = request.user!.id;

    const [user] = await db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.code(404).send({ error: 'user_not_found' });
    }

    if (!user.newsletterSubscribed) {
      return reply.code(200).send({ message: 'not_subscribed' });
    }

    // Clear all newsletter fields
    await db.update(users)
      .set({
        newsletterSubscribed: false,
        newsletterSubscribedAt: null,
        newsletterConsentIp: null,
        newsletterConsentMethod: null,
        newsletterUnsubscribeToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Log to activity_log
    await db.insert(activityLog).values({
      humanUserId: userId,
      action: 'newsletter_unsubscribed',
    });

    // Send confirmation email (best-effort)
    emailService.sendUnsubscribeConfirm({
      to: user.email,
      username: user.username || 'there',
    }).catch((err) => {
      request.log.error({ err }, 'Failed to send unsubscribe confirmation email');
    });

    return reply.code(200).send({ message: 'unsubscribed' });
  });

  // ===== Route 4: GET /newsletter/unsubscribe (public, one-click) =====
  fastify.get('/newsletter/unsubscribe', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { token } = request.query as { token?: string };

    if (!token) {
      return reply.code(200).send({ message: 'already_unsubscribed' });
    }

    // Look up user by unsubscribe token
    const [user] = await db.select()
      .from(users)
      .where(eq(users.newsletterUnsubscribeToken, token))
      .limit(1);

    if (!user) {
      return reply.code(200).send({ message: 'already_unsubscribed' });
    }

    // Clear all newsletter fields
    await db.update(users)
      .set({
        newsletterSubscribed: false,
        newsletterSubscribedAt: null,
        newsletterConsentIp: null,
        newsletterConsentMethod: null,
        newsletterUnsubscribeToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Log to activity_log
    await db.insert(activityLog).values({
      humanUserId: user.id,
      action: 'newsletter_unsubscribed_via_link',
    });

    // Send confirmation email (best-effort)
    emailService.sendUnsubscribeConfirm({
      to: user.email,
      username: user.username || 'there',
    }).catch((err) => {
      request.log.error({ err }, 'Failed to send unsubscribe confirmation email');
    });

    return reply.code(200).send({ message: 'unsubscribed' });
  });

  // ===== Route 5: GET /newsletter/status (authenticated) =====
  fastify.get('/newsletter/status', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const userId = request.user!.id;

    const [user] = await db.select({
      newsletterSubscribed: users.newsletterSubscribed,
      newsletterSubscribedAt: users.newsletterSubscribedAt,
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.code(404).send({ error: 'user_not_found' });
    }

    return reply.code(200).send({
      subscribed: user.newsletterSubscribed,
      subscribedAt: user.newsletterSubscribedAt?.toISOString() ?? null,
    });
  });
}
```

**Double opt-in verification**: `newsletterSubscribed = true` is ONLY set in the `/newsletter/confirm` route (Route 2), never in `/newsletter/subscribe` (Route 1 only sends the confirmation email).

### `apps/api/src/routes/admin.email.routes.ts` (full file)

This file implements the admin Communications panel backend. Key routes:

| Route | Method | Purpose |
|---|---|---|
| `/admin/email/stats` | GET | Subscriber count, total users, recent sends |
| `/admin/email/subscribers` | GET | Paginated subscriber list with consent info |
| `/admin/email/confirmation-token` | POST | Generate 10-min Redis-backed one-time token |
| `/admin/email/send-important` | POST | Send important message to all or single user |
| `/admin/email/broadcast` | POST | Newsletter broadcast to opted-in subscribers |
| `/admin/email/history` | GET | Paginated email send history from activity_log |
| `/admin/email/user-search` | GET | Search users by username/email for recipient picker |

**Security**: CSRF origin check on all write ops, 2/hour email send rate limit per admin, Redis-based one-time confirmation tokens (10min TTL), requireAdmin preHandler on all routes.

```typescript
import crypto from 'node:crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { users, activityLog } from '../db/schema.js';
import { eq, sql, desc, and, or, ilike, isNotNull } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { EmailService } from '../services/email.service.js';

const emailService = new EmailService();

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply);
  if (reply.sent) return;
  if (request.user?.role !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

export async function adminEmailRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdmin);

  // CSRF protection for all write operations
  const adminCsrfGuard = async (request: FastifyRequest, reply: FastifyReply) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
    const origin = request.headers.origin || '';
    const referer = request.headers.referer || '';
    const allowedOrigin = env.WEB_URL;
    const isValidOrigin = origin === allowedOrigin || referer.startsWith(allowedOrigin + '/');
    if (!isValidOrigin) {
      return reply.code(403).send({ error: 'Invalid request origin' });
    }
  };

  // Rate limiter for email send endpoints: 2 per hour per admin
  const emailSendCounts = new Map<string, { count: number; resetAt: number }>();
  const EMAIL_SEND_LIMIT = 2;
  const EMAIL_SEND_WINDOW = 60 * 60 * 1000;

  const emailSendRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.user?.id || request.ip;
    const now = Date.now();
    const entry = emailSendCounts.get(key);
    if (!entry || now > entry.resetAt) {
      emailSendCounts.set(key, { count: 1, resetAt: now + EMAIL_SEND_WINDOW });
      return;
    }
    entry.count++;
    if (entry.count > EMAIL_SEND_LIMIT) {
      return reply.code(429).send({ error: 'Email send rate limit exceeded. Try again in 1 hour.' });
    }
  };

  // Helper: validate and consume a confirmation token from Redis
  async function validateConfirmationToken(token: string, adminId: string): Promise<boolean> {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const payload = JSON.parse(decoded);
      if (payload.purpose !== 'admin-email-confirm') return false;
      if (payload.adminId !== adminId) return false;
      if (Date.now() > payload.exp) return false;
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const redisKey = `admin:email:confirm:${tokenHash}`;
      const exists = await redis.get(redisKey);
      if (!exists) return false;
      await redis.del(redisKey);
      return true;
    } catch {
      return false;
    }
  }

  // GET /admin/email/stats
  fastify.get('/admin/email/stats', async (_request, reply) => {
    const [stats] = await db.select({
      totalSubscribers: sql<number>`(SELECT count(*) FROM users WHERE newsletter_subscribed = true)::int`,
      totalUsers: sql<number>`(SELECT count(*) FROM users)::int`,
      recentSends: sql<number>`(SELECT count(*) FROM activity_log WHERE action IN ('admin_sent_important_email', 'admin_sent_newsletter_broadcast') AND created_at > NOW() - INTERVAL '30 days')::int`,
    }).from(sql`(SELECT 1) as _`);
    const subscriberPercent = stats.totalUsers > 0
      ? Math.round((stats.totalSubscribers / stats.totalUsers) * 1000) / 10
      : 0;
    return reply.code(200).send({
      totalSubscribers: stats.totalSubscribers,
      totalUsers: stats.totalUsers,
      subscriberPercent,
      recentSends: stats.recentSends,
    });
  });

  // GET /admin/email/subscribers
  fastify.get('/admin/email/subscribers', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50', 10) || 50));
    const offset = (page - 1) * limit;
    const [subscribers, countResult] = await Promise.all([
      db.select({
        id: users.id, username: users.username, email: users.email,
        subscribedAt: users.newsletterSubscribedAt, consentMethod: users.newsletterConsentMethod,
      }).from(users).where(eq(users.newsletterSubscribed, true))
        .orderBy(desc(users.newsletterSubscribedAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(users)
        .where(eq(users.newsletterSubscribed, true)),
    ]);
    const total = countResult[0].count;
    await db.insert(activityLog).values({ humanUserId: request.user!.id, action: 'admin_viewed_subscribers' });
    return reply.code(200).send({
      subscribers: subscribers.map(s => ({
        id: s.id, username: s.username, email: s.email,
        subscribedAt: s.subscribedAt?.toISOString() ?? null, consentMethod: s.consentMethod,
      })),
      total, page, totalPages: Math.ceil(total / limit),
    });
  });

  // POST /admin/email/confirmation-token
  fastify.post('/admin/email/confirmation-token', { preHandler: [adminCsrfGuard] }, async (request, reply) => {
    const body = request.body as { action: string; recipientType?: string; recipientCount?: number };
    if (!['send-important', 'broadcast'].includes(body.action)) {
      return reply.code(400).send({ error: 'Invalid action.' });
    }
    const exp = Date.now() + 10 * 60 * 1000;
    const payload = { adminId: request.user!.id, action: body.action, purpose: 'admin-email-confirm', exp };
    const token = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await redis.set(`admin:email:confirm:${tokenHash}`, '1', 'EX', 600);
    return reply.code(200).send({ confirmationToken: token, expiresIn: 600 });
  });

  // POST /admin/email/send-important
  fastify.post('/admin/email/send-important', { preHandler: [adminCsrfGuard, emailSendRateLimit] }, async (request, reply) => {
    // ... validation, confirmation token check, send to all/single, activity log
    // (see full source above)
  });

  // POST /admin/email/broadcast
  fastify.post('/admin/email/broadcast', { preHandler: [adminCsrfGuard, emailSendRateLimit] }, async (request, reply) => {
    // ... validation, confirmation token check, fetch subscribers, broadcast, activity log
    // (see full source above)
  });

  // GET /admin/email/history
  fastify.get('/admin/email/history', async (request, reply) => {
    // ... paginated activity_log query for email actions
  });

  // GET /admin/email/user-search
  fastify.get('/admin/email/user-search', async (request, reply) => {
    // ... ILIKE search on username/email, limit 10
  });
}
```

### `apps/api/src/routes/contact.routes.ts` (full file)

```typescript
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { EmailService } from '../services/email.service.js';
import { contactFormTemplate } from '../email/templates.js';

const emailService = new EmailService();

const contactSchema = z.object({
  name: z.string().max(100).optional().default(''),
  email: z.string().email().max(200),
  subject: z.enum(['general', 'report_content', 'privacy', 'other']),
  message: z.string().min(10).max(5000),
});

export async function contactRoutes(fastify: FastifyInstance) {
  fastify.post('/contact', {
    config: {
      rateLimit: {
        max: 3,
        timeWindow: '1 hour',
      },
    },
  }, async (request, reply) => {
    const parsed = contactSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid form data', details: parsed.error.flatten() });
    }

    const { name, email, subject, message } = parsed.data;

    const subjectLabels: Record<string, string> = {
      general: 'General Inquiry',
      report_content: 'Content Report (DSA)',
      privacy: 'Privacy / Data Request',
      other: 'Other',
    };

    try {
      await emailService.send({
        to: 'contact@opensolve.ai',
        subject: `[OpenSolve Contact] ${subjectLabels[subject]}: from ${email}`,
        html: contactFormTemplate({ name, email, subject: subjectLabels[subject], message }),
        replyTo: email,
      });

      return reply.code(200).send({ message: 'sent' });
    } catch (err) {
      request.log.error({ err }, 'Contact form email failed');
      return reply.code(500).send({ error: 'Failed to send message. Please try emailing contact@opensolve.ai directly.' });
    }
  });
}
```

**Rate limit**: 3 per hour. Subject categories: general, report_content (DSA), privacy, other.

### `apps/api/src/services/retention.service.ts` (full file)

```typescript
import { db } from '../config/database.js';
import { activityLog, tasks, problems } from '../db/schema.js';
import { and, eq, lt } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
  RETENTION_ACTIVITY_LOG_DAYS,
  RETENTION_COMPLETED_TASKS_DAYS,
  RETENTION_EXPIRED_TASKS_DAYS,
  RETENTION_REJECTED_PROBLEMS_DAYS,
} from '@opensolve/shared';

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export interface RetentionResult {
  activityLogsDeleted: number;
  completedTasksDeleted: number;
  expiredTasksDeleted: number;
  rejectedProblemsDeleted: number;
}

export async function runRetentionCleanup(): Promise<RetentionResult> {
  logger.info('GDPR retention cleanup started');

  try {
    // Activity logs older than 90 days
    const activityResult = await db.delete(activityLog)
      .where(lt(activityLog.createdAt, daysAgo(RETENTION_ACTIVITY_LOG_DAYS)));
    const activityLogsDeleted = (activityResult as unknown as { rowCount: number }).rowCount ?? 0;

    // Completed tasks older than 30 days
    const completedResult = await db.delete(tasks)
      .where(and(
        eq(tasks.status, 'completed'),
        lt(tasks.completedAt, daysAgo(RETENTION_COMPLETED_TASKS_DAYS)),
      ));
    const completedTasksDeleted = (completedResult as unknown as { rowCount: number }).rowCount ?? 0;

    // Expired tasks older than 7 days
    const expiredResult = await db.delete(tasks)
      .where(and(
        eq(tasks.status, 'expired'),
        lt(tasks.expiresAt, daysAgo(RETENTION_EXPIRED_TASKS_DAYS)),
      ));
    const expiredTasksDeleted = (expiredResult as unknown as { rowCount: number }).rowCount ?? 0;

    // Rejected problems older than 30 days
    const rejectedResult = await db.delete(problems)
      .where(and(
        eq(problems.status, 'rejected'),
        lt(problems.updatedAt, daysAgo(RETENTION_REJECTED_PROBLEMS_DAYS)),
      ));
    const rejectedProblemsDeleted = (rejectedResult as unknown as { rowCount: number }).rowCount ?? 0;

    const result: RetentionResult = {
      activityLogsDeleted,
      completedTasksDeleted,
      expiredTasksDeleted,
      rejectedProblemsDeleted,
    };

    logger.info(
      { activityLogsDeleted, completedTasksDeleted, expiredTasksDeleted, rejectedProblemsDeleted },
      'GDPR retention cleanup complete',
    );

    return result;
  } catch (err) {
    logger.error({ err }, 'GDPR retention cleanup failed');
    throw err;
  }
}
```

**Logging**: `logger.info` at start ("GDPR retention cleanup started"), at completion with counts, and `logger.error` in catch block. ✅

**Wired in server**: `runRetentionCleanup` imported in `server.ts` and run via `setInterval` + startup timeout.

---

## SUMMARY REPORT

1. **File**: `PROJECT-SNAPSHOT-S3.md` — ~2800 lines
2. **Sections where code could NOT be found**: None — all files exist
3. **Total frontend page count**: **37 pages**
4. **Admin sub-pages**:

   | Page | Lines | Functional? |
   |------|-------|-------------|
   | Dashboard | 518 | ✅ |
   | Problems | 553 | ✅ |
   | Moderation | 512 | ✅ |
   | Bots | 566 | ✅ |
   | Users | 448 | ✅ |
   | Activity | 581 | ✅ |
   | Communications | 1119 | ✅ |
   | Debug | 7 | ⚠️ Stub |

5. **Email template count**: **5** — importantMessage, newsletter, newsletterConfirm, unsubscribeConfirm, contactForm
6. **Access gate**: **Active** when `ACCESS_GATE_SECRET` env var is set. Cookie-based (`os_access_gate`), 30-day TTL, rewrites to `/coming-soon`. Exempts: legal pages, admin routes, newsletter confirm, unsubscribe, contact.
