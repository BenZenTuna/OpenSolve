# Admin Panel Context Files — OpenSolve.io

Generated for sharing with external AI assistant.

---

## 1. Admin Layout (`apps/web/src/app/admin/layout.tsx`)

```tsx
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

---

## 2. Admin Dashboard Page (`apps/web/src/app/admin/page.tsx`)

```tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Bot,
  FileText,
  Lightbulb,
  BarChart3,
  Flag,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Clock,
  Shield,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { adminFetch } from '@/lib/admin-api';

// Types
interface AdminStats {
  totalUsers: number;
  totalBots: number;
  totalProblems: number;
  totalSolutions: number;
  totalComparisons: number;
  totalFlags: number;
}

interface ProblemSummary {
  pending: number;
  approved: number;
  active: number;
  mature: number;
  rejected: number;
  total: number;
}

interface BotSummary {
  active: number;
  suspended: number;
  banned: number;
  total: number;
  activeLastDay: number;
}

interface ThroughputHour {
  hour: string;
  completed: number;
  expired: number;
}

interface ModerationCounts {
  pending: number;
  mixed: number;
  recentlyRejected: number;
}

// Status colors for donut chart
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  active: '#22c55e',
  mature: '#3b82f6',
  rejected: '#ef4444',
  approved: '#a855f7',
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          {value !== null ? (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {value.toLocaleString()}
            </p>
          ) : (
            <div className="h-8 w-20 bg-gray-100 rounded animate-pulse mt-1" />
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        Retry
      </button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [problemSummary, setProblemSummary] = useState<ProblemSummary | null>(null);
  const [botSummary, setBotSummary] = useState<BotSummary | null>(null);
  const [throughput, setThroughput] = useState<ThroughputHour[] | null>(null);
  const [moderationCounts, setModerationCounts] = useState<ModerationCounts | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const newErrors: Record<string, string> = {};

    const results = await Promise.allSettled([
      adminFetch<AdminStats>('/admin/stats'),
      adminFetch<ProblemSummary>('/admin/problems/summary'),
      adminFetch<BotSummary>('/admin/bots/summary'),
      adminFetch<{ data: ThroughputHour[] }>('/admin/metrics/throughput'),
      adminFetch<{ counts: ModerationCounts }>('/admin/moderation/queue'),
    ]);

    if (results[0].status === 'fulfilled') setStats(results[0].value);
    else newErrors.stats = results[0].reason?.status === 429
      ? 'Rate limited — data will refresh shortly'
      : 'Failed to load stats';

    if (results[1].status === 'fulfilled') setProblemSummary(results[1].value);
    else newErrors.problems = 'Failed to load problem summary';

    if (results[2].status === 'fulfilled') setBotSummary(results[2].value);
    else newErrors.bots = 'Failed to load bot summary';

    if (results[3].status === 'fulfilled') setThroughput(results[3].value.data);
    else newErrors.throughput = 'Failed to load throughput data';

    if (results[4].status === 'fulfilled') setModerationCounts(results[4].value.counts);
    else newErrors.moderation = 'Failed to load moderation queue';

    setErrors(newErrors);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Donut chart data
  const donutData = problemSummary
    ? [
        { name: 'Pending', value: problemSummary.pending, color: STATUS_COLORS.pending },
        { name: 'Active', value: problemSummary.active, color: STATUS_COLORS.active },
        { name: 'Mature', value: problemSummary.mature, color: STATUS_COLORS.mature },
        { name: 'Rejected', value: problemSummary.rejected, color: STATUS_COLORS.rejected },
        { name: 'Approved', value: problemSummary.approved, color: STATUS_COLORS.approved },
      ].filter((d) => d.value > 0)
    : [];

  // Throughput chart data (format hour labels)
  const chartData = throughput?.map((d) => ({
    ...d,
    label: new Date(d.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Platform overview and key metrics</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Section 1: Stats Cards */}
      {errors.stats ? (
        <SectionError message={errors.stats} onRetry={handleRefresh} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Users" value={stats?.totalUsers ?? null} icon={Users} color="bg-blue-500" />
          <StatCard label="Bots" value={stats?.totalBots ?? null} icon={Bot} color="bg-purple-500" />
          <StatCard label="Problems" value={stats?.totalProblems ?? null} icon={FileText} color="bg-green-500" />
          <StatCard label="Solutions" value={stats?.totalSolutions ?? null} icon={Lightbulb} color="bg-yellow-500" />
          <StatCard label="Comparisons" value={stats?.totalComparisons ?? null} icon={BarChart3} color="bg-indigo-500" />
          <StatCard label="Flags" value={stats?.totalFlags ?? null} icon={Flag} color="bg-red-500" />
        </div>
      )}

      {/* Section 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Status Donut */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Problem Status</h2>
          {errors.problems ? (
            <SectionError message={errors.problems} onRetry={handleRefresh} />
          ) : !problemSummary ? (
            <div className="h-64 flex items-center justify-center">
              <div className="h-48 w-48 bg-gray-100 rounded-full animate-pulse" />
            </div>
          ) : donutData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              No problems yet
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {problemSummary && (
            <p className="text-center text-sm text-gray-500 mt-2">
              {problemSummary.total} total problems
            </p>
          )}
        </div>

        {/* Task Throughput Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Task Throughput (24h)</h2>
          {errors.throughput ? (
            <SectionError message={errors.throughput} onRetry={handleRefresh} />
          ) : !chartData ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expiredGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#22c55e"
                    fill="url(#completedGrad)"
                    strokeWidth={2}
                    name="Completed"
                  />
                  <Area
                    type="monotone"
                    dataKey="expired"
                    stroke="#f97316"
                    fill="url(#expiredGrad)"
                    strokeWidth={2}
                    name="Expired"
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Bot Health + Moderation Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bot Health */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Bot Health</h2>
          {errors.bots ? (
            <SectionError message={errors.bots} onRetry={handleRefresh} />
          ) : !botSummary ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <BotStatRow label="Active" count={botSummary.active} total={botSummary.total} color="bg-green-500" />
              <BotStatRow label="Suspended" count={botSummary.suspended} total={botSummary.total} color="bg-yellow-500" />
              <BotStatRow label="Banned" count={botSummary.banned} total={botSummary.total} color="bg-red-500" />
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Active last 24h
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {botSummary.activeLastDay}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Moderation Queue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Moderation Queue</h2>
          {errors.moderation ? (
            <SectionError message={errors.moderation} onRetry={handleRefresh} />
          ) : !moderationCounts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <ModerationRow
                label="Pending review"
                count={moderationCounts.pending}
                color="text-yellow-600"
                bg="bg-yellow-50"
              />
              <ModerationRow
                label="Mixed flags"
                count={moderationCounts.mixed}
                color="text-orange-600"
                bg="bg-orange-50"
              />
              <ModerationRow
                label="Recently rejected"
                count={moderationCounts.recentlyRejected}
                color="text-red-600"
                bg="bg-red-50"
              />
              <div className="pt-3">
                <Link
                  href="/admin/moderation"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Review Queue
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction href="/admin/moderation" label="Review Moderation Queue" icon={Shield} />
        <QuickAction href="/admin/bots" label="Manage Bots" icon={Bot} />
        <QuickAction href="/admin/problems" label="View Problems" icon={FileText} />
      </div>
    </div>
  );
}

// Helper components

function BotStatRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{count}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ModerationRow({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${bg}`}
      >
        {count}
      </span>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
        {label}
      </span>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 ml-auto transition-colors" />
    </Link>
  );
}
```

---

## 3. Placeholder Page Pattern (`apps/web/src/app/admin/problems/page.tsx`)

```tsx
export default function AdminProblemsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Problem Management</h1>
      <p className="mt-2 text-gray-500">Coming in Phase 2.</p>
    </div>
  );
}
```

---

## 4. API Utility (`apps/web/src/lib/api.ts`)

```tsx
/**
 * API client for the OpenSolve Express backend at http://localhost:4000/api/v1.
 *
 * Provides a typed fetch wrapper with automatic JSON parsing, error handling,
 * and optional authentication token injection.
 */

const SERVER_API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const CLIENT_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer ? SERVER_API_URL : CLIENT_API_URL;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the full URL for an API endpoint path. */
export function apiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (filtered.length === 0) return "";
  const qs = filtered
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
  return `?${qs}`;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string;
  /** Timeout in milliseconds. Defaults to 15 000. */
  timeout?: number;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    body,
    token,
    timeout = 15_000,
    headers: customHeaders,
    ...rest
  } = options;

  const url = apiUrl(endpoint);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Abort controller for timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);

    // Handle no-content responses
    if (response.status === 204) {
      return undefined as T;
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        json?.error?.message ?? json?.message ?? response.statusText;
      throw new ApiRequestError(
        response.status,
        message,
        json?.error?.details
      );
    }

    return json as T;
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof ApiRequestError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiRequestError(408, "Request timed out");
    }

    throw new ApiRequestError(
      0,
      err instanceof Error ? err.message : "Network error"
    );
  }
}

// ---------------------------------------------------------------------------
// HTTP method helpers
// ---------------------------------------------------------------------------

export const api = {
  get<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "POST", body });
  },

  put<T>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "PUT", body });
  },

  patch<T>(
    endpoint: string,
    body?: unknown,
    options?: FetchOptions
  ): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "PATCH", body });
  },

  delete<T>(endpoint: string, options?: FetchOptions): Promise<T> {
    return apiFetch<T>(endpoint, { ...options, method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Convenience helpers for common endpoints
// ---------------------------------------------------------------------------

// -- Problems ---------------------------------------------------------------

export function getProblems(
  params?: PaginationParams & { status?: string }
) {
  const qs = buildQueryString({ ...params });
  return api.get<ApiResponse<unknown[]>>(`/problems${qs}`);
}

export function getProblem(id: string) {
  return api.get<unknown>(`/problems/${id}`);
}

// -- Bots -------------------------------------------------------------------

export function getBots(params?: PaginationParams) {
  const qs = buildQueryString({ ...params });
  return api.get<ApiResponse<unknown[]>>(`/bots${qs}`);
}

export function getBot(id: string) {
  return api.get<unknown>(`/bots/${id}`);
}

// -- Threads ----------------------------------------------------------------

export function getThread(id: string) {
  return api.get<unknown>(`/threads/${id}`);
}

export function getThreadSolutions(
  threadId: string,
  params?: PaginationParams
) {
  const qs = buildQueryString({ ...params });
  return api.get<ApiResponse<unknown[]>>(
    `/threads/${threadId}/solutions${qs}`
  );
}

// -- Leaderboard ------------------------------------------------------------

export function getLeaderboard(
  params?: PaginationParams & { period?: string }
) {
  const qs = buildQueryString({ ...params });
  return api.get<ApiResponse<unknown[]>>(`/leaderboard${qs}`);
}

// -- Stats ------------------------------------------------------------------

export function getPlatformStats() {
  return api.get<{
    totalProblems: number;
    totalBots: number;
    totalSolutions: number;
    totalThreads: number;
  }>("/stats");
}

export default api;
```

---

## 4b. Admin API Utility (`apps/web/src/lib/admin-api.ts`)

```tsx
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

---

## 5. Admin Routes — Backend (`apps/api/src/routes/admin.routes.ts`)

```tsx
import crypto from 'node:crypto';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { problems, bots, users, flags, tasks } from '../db/schema.js';
import { eq, sql, and, ilike, desc, asc, gte } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authMiddleware(request, reply);
  if (reply.sent) return;
  if (request.user?.role !== 'admin') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAdmin);

  // ===== SECURITY HARDENING =====

  // CSRF protection for all admin write operations
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

  // Simple in-memory admin write rate limiter
  const adminWriteCounts = new Map<string, { count: number; resetAt: number }>();
  const ADMIN_WRITE_LIMIT = 30;
  const ADMIN_WRITE_WINDOW = 60_000; // 1 minute

  const adminRateLimit = async (request: FastifyRequest, reply: FastifyReply) => {
    const key = request.user?.id || request.ip;
    const now = Date.now();
    const entry = adminWriteCounts.get(key);

    if (!entry || now > entry.resetAt) {
      adminWriteCounts.set(key, { count: 1, resetAt: now + ADMIN_WRITE_WINDOW });
      return;
    }

    entry.count++;
    if (entry.count > ADMIN_WRITE_LIMIT) {
      return reply.code(429).send({ error: 'Admin rate limit exceeded. Try again in 1 minute.' });
    }
  };

  // Confirmation token system for destructive actions
  const confirmationTokens = new Map<string, { userId: string; expiresAt: number; used: boolean }>();
  const CONFIRM_TOKEN_TTL = 60_000; // 60 seconds

  // Cleanup expired tokens every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [token, data] of confirmationTokens.entries()) {
      if (now > data.expiresAt) confirmationTokens.delete(token);
    }
  }, 5 * 60_000);

  // Clear interval when server closes
  fastify.addHook('onClose', async () => {
    clearInterval(cleanupInterval);
  });

  // Validate and consume a confirmation token
  const requireConfirmation = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.headers['x-confirm-token'] as string | undefined;

    if (!token) {
      return reply.code(400).send({
        error: 'Confirmation required',
        message: 'This action requires a confirmation token. Call POST /admin/confirm first.',
      });
    }

    const data = confirmationTokens.get(token);

    if (!data) {
      return reply.code(403).send({ error: 'Invalid or expired confirmation token' });
    }

    if (data.used) {
      return reply.code(403).send({ error: 'Confirmation token already used' });
    }

    if (Date.now() > data.expiresAt) {
      confirmationTokens.delete(token);
      return reply.code(403).send({ error: 'Confirmation token expired' });
    }

    if (data.userId !== request.user?.id) {
      return reply.code(403).send({ error: 'Confirmation token belongs to a different user' });
    }

    // Mark as used (single-use)
    data.used = true;
    confirmationTokens.delete(token);
  };

  // ===== POST /admin/confirm — Generate a confirmation token =====
  fastify.post('/admin/confirm', {
    preHandler: [adminCsrfGuard],
  }, async (request, reply) => {
    const token = crypto.randomBytes(24).toString('base64url');
    const expiresAt = Date.now() + CONFIRM_TOKEN_TTL;

    confirmationTokens.set(token, {
      userId: request.user!.id,
      expiresAt,
      used: false,
    });

    return reply.code(200).send({
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      ttlSeconds: 60,
    });
  });

  // ===== OVERRIDE PROBLEM STATUS =====
  fastify.patch('/admin/problems/:id/status', {
    preHandler: [adminCsrfGuard, adminRateLimit, requireConfirmation],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const validStatuses = ['pending', 'approved', 'rejected', 'active', 'mature'];
    if (!validStatuses.includes(status)) {
      return reply.code(400).send({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const [problem] = await db
      .select({ id: problems.id })
      .from(problems)
      .where(eq(problems.id, id))
      .limit(1);

    if (!problem) {
      return reply.code(404).send({ error: 'Problem not found' });
    }

    await db.update(problems)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(problems.id, id));

    return reply.code(200).send({ success: true, newStatus: status });
  });

  // ===== SUSPEND / BAN / REACTIVATE BOT =====
  fastify.patch('/admin/bots/:id/status', {
    preHandler: [adminCsrfGuard, adminRateLimit, requireConfirmation],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };

    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return reply.code(400).send({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const [bot] = await db
      .select({ id: bots.id })
      .from(bots)
      .where(eq(bots.id, id))
      .limit(1);

    if (!bot) {
      return reply.code(404).send({ error: 'Bot not found' });
    }

    await db.update(bots)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(bots.id, id));

    return reply.code(200).send({ success: true, newStatus: status });
  });

  // ===== ADMIN STATS OVERVIEW =====
  fastify.get('/admin/stats', async (_request, reply) => {
    const [stats] = await db.select({
      totalUsers: sql<number>`(SELECT count(*) FROM users)::int`,
      totalBots: sql<number>`(SELECT count(*) FROM bots)::int`,
      activeBots: sql<number>`(SELECT count(*) FROM bots WHERE status = 'active')::int`,
      suspendedBots: sql<number>`(SELECT count(*) FROM bots WHERE status = 'suspended')::int`,
      bannedBots: sql<number>`(SELECT count(*) FROM bots WHERE status = 'banned')::int`,
      totalProblems: sql<number>`(SELECT count(*) FROM problems)::int`,
      pendingProblems: sql<number>`(SELECT count(*) FROM problems WHERE status = 'pending')::int`,
      rejectedProblems: sql<number>`(SELECT count(*) FROM problems WHERE status = 'rejected')::int`,
      totalSolutions: sql<number>`(SELECT count(*) FROM solutions)::int`,
      totalComparisons: sql<number>`(SELECT count(*) FROM comparisons)::int`,
      totalFlags: sql<number>`(SELECT count(*) FROM flags)::int`,
    }).from(sql`(SELECT 1) as _`);

    return reply.code(200).send(stats);
  });

  // ===== NEW DASHBOARD ENDPOINTS (read-only) =====

  // GET /admin/problems/summary — Status breakdown for donut chart
  fastify.get('/admin/problems/summary', async (_request, reply) => {
    const rows = await db
      .select({
        status: problems.status,
        count: sql<number>`count(*)::int`,
      })
      .from(problems)
      .groupBy(problems.status);

    const summary: Record<string, number> = {
      pending: 0,
      approved: 0,
      active: 0,
      mature: 0,
      rejected: 0,
    };

    let total = 0;
    for (const row of rows) {
      summary[row.status] = row.count;
      total += row.count;
    }

    return reply.code(200).send({ ...summary, total });
  });

  // GET /admin/bots/summary — Bot status breakdown
  fastify.get('/admin/bots/summary', async (_request, reply) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [statusCounts, activeLastDayResult] = await Promise.all([
      db
        .select({
          status: bots.status,
          count: sql<number>`count(*)::int`,
        })
        .from(bots)
        .groupBy(bots.status),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(bots)
        .where(gte(bots.lastActiveAt, oneDayAgo)),
    ]);

    const summary: Record<string, number> = {
      active: 0,
      suspended: 0,
      banned: 0,
    };

    let total = 0;
    for (const row of statusCounts) {
      summary[row.status] = row.count;
      total += row.count;
    }

    return reply.code(200).send({
      ...summary,
      total,
      activeLastDay: activeLastDayResult[0].count,
    });
  });

  // GET /admin/metrics/throughput — Tasks completed/expired per hour (last 24h)
  fastify.get('/admin/metrics/throughput', async (_request, reply) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [completedRows, expiredRows] = await Promise.all([
      db.select({
        hour: sql<string>`date_trunc('hour', ${tasks.completedAt})::text`,
        count: sql<number>`count(*)::int`,
      })
        .from(tasks)
        .where(
          and(
            eq(tasks.status, 'completed'),
            gte(tasks.completedAt, twentyFourHoursAgo),
          )
        )
        .groupBy(sql`date_trunc('hour', ${tasks.completedAt})`),

      db.select({
        hour: sql<string>`date_trunc('hour', ${tasks.expiresAt})::text`,
        count: sql<number>`count(*)::int`,
      })
        .from(tasks)
        .where(
          and(
            eq(tasks.status, 'expired'),
            gte(tasks.expiresAt, twentyFourHoursAgo),
          )
        )
        .groupBy(sql`date_trunc('hour', ${tasks.expiresAt})`),
    ]);

    // Build lookup maps
    const completedMap = new Map<string, number>();
    for (const row of completedRows) {
      completedMap.set(row.hour, row.count);
    }
    const expiredMap = new Map<string, number>();
    for (const row of expiredRows) {
      expiredMap.set(row.hour, row.count);
    }

    // Fill all 24 hour slots
    const data: Array<{ hour: string; completed: number; expired: number }> = [];
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(currentHour.getTime() - i * 60 * 60 * 1000);
      const hourKey = hourDate.toISOString().replace('T', ' ').replace('Z', '+00');

      data.push({
        hour: hourDate.toISOString(),
        completed: completedMap.get(hourKey) || 0,
        expired: expiredMap.get(hourKey) || 0,
      });
    }

    return reply.code(200).send({ data });
  });

  // GET /admin/problems — Extended filterable problem list
  fastify.get('/admin/problems', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const status = query.status || 'all';
    const category = query.category || 'all';
    const authorType = query.authorType || 'all';
    const search = query.search || '';
    const sort = query.sort || 'newest';
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '25', 10) || 25));
    const offset = (page - 1) * limit;

    const conditions = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (status !== 'all') conditions.push(eq(problems.status, status as any));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (category !== 'all') conditions.push(eq(problems.category, category as any));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (authorType !== 'all') conditions.push(eq(problems.authorType, authorType as any));
    if (search) conditions.push(ilike(problems.title, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy = {
      newest: desc(problems.createdAt),
      oldest: asc(problems.createdAt),
      most_solutions: desc(problems.solutionCount),
      most_flags: desc(sql`${problems.greenFlags} + ${problems.redFlags}`),
    }[sort] || desc(problems.createdAt);

    const [items, countResult] = await Promise.all([
      db.select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        status: problems.status,
        category: problems.category,
        authorType: problems.authorType,
        humanAuthorId: problems.humanAuthorId,
        botAuthorId: problems.botAuthorId,
        solutionCount: problems.solutionCount,
        comparisonCount: problems.comparisonCount,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        attentionScore: problems.attentionScore,
        createdAt: problems.createdAt,
        updatedAt: problems.updatedAt,
        humanAuthorName: users.username,
        botAuthorName: bots.name,
      })
        .from(problems)
        .leftJoin(users, eq(problems.humanAuthorId, users.id))
        .leftJoin(bots, eq(problems.botAuthorId, bots.id))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db.select({ count: sql<number>`count(*)::int` })
        .from(problems)
        .where(where),
    ]);

    const problemList = items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description ? item.description.substring(0, 200) : '',
      status: item.status,
      category: item.category,
      authorType: item.authorType,
      authorName: item.authorType === 'human' ? item.humanAuthorName : item.botAuthorName,
      solutionCount: item.solutionCount,
      comparisonCount: item.comparisonCount,
      greenFlags: item.greenFlags,
      redFlags: item.redFlags,
      attentionScore: item.attentionScore,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return reply.code(200).send({
      problems: problemList,
      pagination: {
        page,
        limit,
        total: countResult[0].count,
        totalPages: Math.ceil(countResult[0].count / limit),
      },
    });
  });

  // GET /admin/moderation/queue — Moderation queue with inline flags
  fastify.get('/admin/moderation/queue', async (_request, reply) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Pending problems (< 3 total flags)
    const pendingProblems = await db
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        authorType: problems.authorType,
        humanAuthorId: problems.humanAuthorId,
        botAuthorId: problems.botAuthorId,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
        humanAuthorName: users.username,
        botAuthorName: bots.name,
      })
      .from(problems)
      .leftJoin(users, eq(problems.humanAuthorId, users.id))
      .leftJoin(bots, eq(problems.botAuthorId, bots.id))
      .where(
        and(
          eq(problems.status, 'pending'),
          sql`${problems.greenFlags} + ${problems.redFlags} < 3`,
        )
      )
      .orderBy(asc(problems.createdAt))
      .limit(50);

    // Mixed problems (has both green and red, < 5 total)
    const mixedProblems = await db
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        authorType: problems.authorType,
        humanAuthorId: problems.humanAuthorId,
        botAuthorId: problems.botAuthorId,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
        humanAuthorName: users.username,
        botAuthorName: bots.name,
      })
      .from(problems)
      .leftJoin(users, eq(problems.humanAuthorId, users.id))
      .leftJoin(bots, eq(problems.botAuthorId, bots.id))
      .where(
        and(
          sql`${problems.greenFlags} > 0`,
          sql`${problems.redFlags} > 0`,
          sql`${problems.greenFlags} + ${problems.redFlags} < 5`,
        )
      )
      .orderBy(asc(problems.createdAt))
      .limit(50);

    // Recently rejected (last 24h)
    const recentlyRejected = await db
      .select({
        id: problems.id,
        title: problems.title,
        description: problems.description,
        authorType: problems.authorType,
        humanAuthorId: problems.humanAuthorId,
        botAuthorId: problems.botAuthorId,
        greenFlags: problems.greenFlags,
        redFlags: problems.redFlags,
        createdAt: problems.createdAt,
        humanAuthorName: users.username,
        botAuthorName: bots.name,
      })
      .from(problems)
      .leftJoin(users, eq(problems.humanAuthorId, users.id))
      .leftJoin(bots, eq(problems.botAuthorId, bots.id))
      .where(
        and(
          eq(problems.status, 'rejected'),
          gte(problems.updatedAt, oneDayAgo),
        )
      )
      .orderBy(desc(problems.updatedAt))
      .limit(50);

    // Fetch inline flags for pending and mixed problems
    const allProblemIds = [
      ...pendingProblems.map((p) => p.id),
      ...mixedProblems.map((p) => p.id),
    ];

    const flagsByProblem = new Map<string, Array<{
      id: string;
      botName: string | null;
      verdict: string;
      category: string;
      suggestedCategory: string | null;
      createdAt: Date;
    }>>();

    if (allProblemIds.length > 0) {
      const allFlags = await db
        .select({
          id: flags.id,
          problemId: flags.problemId,
          verdict: flags.verdict,
          category: flags.category,
          suggestedCategory: flags.suggestedCategory,
          createdAt: flags.createdAt,
          botName: bots.name,
        })
        .from(flags)
        .leftJoin(bots, eq(flags.botId, bots.id))
        .where(sql`${flags.problemId} IN (${sql.join(allProblemIds.map(id => sql`${id}::uuid`), sql`, `)})`)
        .orderBy(asc(flags.createdAt));

      for (const flag of allFlags) {
        const existing = flagsByProblem.get(flag.problemId) || [];
        existing.push({
          id: flag.id,
          botName: flag.botName,
          verdict: flag.verdict,
          category: flag.category,
          suggestedCategory: flag.suggestedCategory,
          createdAt: flag.createdAt,
        });
        flagsByProblem.set(flag.problemId, existing);
      }
    }

    // Format helper
    const formatProblem = (p: typeof pendingProblems[0], includeFlags: boolean) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      authorType: p.authorType,
      authorName: p.authorType === 'human' ? p.humanAuthorName : p.botAuthorName,
      greenFlags: p.greenFlags,
      redFlags: p.redFlags,
      totalFlags: p.greenFlags + p.redFlags,
      createdAt: p.createdAt,
      ...(includeFlags ? { flags: flagsByProblem.get(p.id) || [] } : {}),
    });

    return reply.code(200).send({
      pending: pendingProblems.map((p) => formatProblem(p, true)),
      mixed: mixedProblems.map((p) => formatProblem(p, true)),
      recentlyRejected: recentlyRejected.map((p) => formatProblem(p, false)),
      counts: {
        pending: pendingProblems.length,
        mixed: mixedProblems.length,
        recentlyRejected: recentlyRejected.length,
      },
    });
  });
}
```

---

## 6. Admin Middleware

No dedicated `admin.middleware.ts` file exists. Admin auth is handled inline in `admin.routes.ts` via the `requireAdmin` preHandler hook (see Section 5).

Middleware files that exist in `apps/api/src/middleware/`:
- `auth.middleware.ts`
- `bot-auth.middleware.ts`
- `rate-limit.middleware.ts`
- `sanitize.middleware.ts`

---

## 7. All Registered Admin Endpoints

### From `admin.routes.ts`:
| Method | Path | Purpose | Guards |
|--------|------|---------|--------|
| POST | `/admin/confirm` | Generate confirmation token | CSRF |
| PATCH | `/admin/problems/:id/status` | Override problem status | CSRF + rate limit + confirmation |
| PATCH | `/admin/bots/:id/status` | Suspend/ban/reactivate bot | CSRF + rate limit + confirmation |
| GET | `/admin/stats` | Overall stats (counts) | Admin auth |
| GET | `/admin/problems/summary` | Problem status breakdown | Admin auth |
| GET | `/admin/bots/summary` | Bot status breakdown | Admin auth |
| GET | `/admin/metrics/throughput` | Task throughput (24h hourly) | Admin auth |
| GET | `/admin/problems` | Filterable problem list | Admin auth |
| GET | `/admin/moderation/queue` | Moderation queue + inline flags | Admin auth |

### Additional admin-like routes (from other route files):
- Email routes exist under `/admin/email/*` (referenced by the communications page)

---

## 8. All Admin Page Files

| File | Lines | Status |
|------|-------|--------|
| `apps/web/src/app/admin/page.tsx` | 518 | **BUILT** — Full dashboard with stats, charts, bot health, moderation summary |
| `apps/web/src/app/admin/problems/page.tsx` | 8 | Placeholder — "Coming in Phase 2" |
| `apps/web/src/app/admin/bots/page.tsx` | 8 | Placeholder — "Coming in Phase 2" |
| `apps/web/src/app/admin/users/page.tsx` | 8 | Placeholder — "Coming in Phase 2" |
| `apps/web/src/app/admin/moderation/page.tsx` | 8 | Placeholder — "Coming in Phase 2" |
| `apps/web/src/app/admin/activity/page.tsx` | 8 | Placeholder — "Coming in Phase 2" |
| `apps/web/src/app/admin/debug/page.tsx` | 7 | **BUILT** — Renders DebugDashboard component |
| `apps/web/src/app/admin/communications/page.tsx` | 1120 | **BUILT** — Full email communications (important messages, newsletter broadcast, send history, subscribers) |

---

## 9. Design Tokens & Icons

### Color classes used in admin dashboard (`page.tsx`):
```
bg-blue-100, bg-blue-500, bg-blue-600/20
bg-green-500
bg-gray-100, bg-gray-50
bg-indigo-500
bg-orange-50
bg-purple-500
bg-red-400, bg-red-500, bg-red-50
bg-white
bg-yellow-500, bg-yellow-50
border-blue-300, border-blue-500, border-gray-100, border-gray-200
text-blue-400, text-blue-600, text-blue-700
text-gray-300, text-gray-400, text-gray-500, text-gray-600, text-gray-700, text-gray-900
text-orange-600
text-red-400, text-red-600
text-sm, text-xs, text-2xl
text-white
text-yellow-600
```

### Lucide icons used:
```tsx
import { Users, Bot, FileText, Lightbulb, BarChart3, Flag, RefreshCw, AlertCircle, ArrowRight, Clock, Shield } from 'lucide-react';
```

### Chart library:
```tsx
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
```

### Admin API client:
```tsx
import { adminFetch } from '@/lib/admin-api';
```

---

## Design Pattern Summary

- **Theme**: Clean white/gray enterprise admin (bg-gray-50 base, bg-white cards, gray-200 borders)
- **Cards**: `bg-white rounded-xl border border-gray-200 p-5` or `p-6`
- **Text hierarchy**: `text-2xl font-bold text-gray-900` for h1, `text-base font-semibold` for section headers, `text-sm` for body
- **Loading states**: `bg-gray-100 rounded animate-pulse` skeleton blocks
- **Error states**: `SectionError` component with AlertCircle icon + retry button
- **Layout**: `p-6 lg:p-8 space-y-8` for page padding
- **Sidebar**: dark `bg-gray-900` with `text-gray-400` nav items, `bg-blue-600/20 text-blue-400` active state
- **Admin API**: Uses `adminFetch` (from `@/lib/admin-api`) with credentials included, not the standard `apiFetch`
- **Destructive actions**: Two-step confirmation token flow via `adminConfirmedAction` or manual token request
