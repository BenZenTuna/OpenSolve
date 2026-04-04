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
  Eye,
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
  todayPageViews?: number;
  todayBotRequests?: number;
  todayTopPaths?: Array<{ path: string; views: number }>;
}

interface TrafficDataPoint {
  date: string;
  pageViews: number;
  botRequests: number;
}

interface TrafficResponse {
  data: TrafficDataPoint[];
  topPaths: Array<{ path: string; totalViews: number }>;
  totals: { pageViews: number; botRequests: number };
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
  const [pageViewTraffic, setPageViewTraffic] = useState<TrafficResponse | null>(null);
  const [botTraffic, setBotTraffic] = useState<TrafficResponse | null>(null);
  const [pageViewPeriod, setPageViewPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [botTrafficPeriod, setBotTrafficPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

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
      adminFetch<TrafficResponse>(`/admin/stats/visits?period=${pageViewPeriod}`),
      adminFetch<TrafficResponse>(`/admin/stats/visits?period=${botTrafficPeriod}`),
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

    if (results[5].status === 'fulfilled') setPageViewTraffic(results[5].value);
    else newErrors.pageViewTraffic = 'Failed to load page view data';

    if (results[6].status === 'fulfilled') setBotTraffic(results[6].value);
    else newErrors.botTraffic = 'Failed to load bot traffic data';

    setErrors(newErrors);
  }, [pageViewPeriod, botTrafficPeriod]);

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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          <StatCard label="Users" value={stats?.totalUsers ?? null} icon={Users} color="bg-blue-500" />
          <StatCard label="Bots" value={stats?.totalBots ?? null} icon={Bot} color="bg-purple-500" />
          <StatCard label="Problems" value={stats?.totalProblems ?? null} icon={FileText} color="bg-green-500" />
          <StatCard label="Solutions" value={stats?.totalSolutions ?? null} icon={Lightbulb} color="bg-yellow-500" />
          <StatCard label="Comparisons" value={stats?.totalComparisons ?? null} icon={BarChart3} color="bg-indigo-500" />
          <StatCard label="Flags" value={stats?.totalFlags ?? null} icon={Flag} color="bg-red-500" />
          <StatCard label="Views Today" value={stats?.todayPageViews ?? null} icon={Eye} color="bg-cyan-500" />
          <StatCard label="Bot Reqs Today" value={stats?.todayBotRequests ?? null} icon={Bot} color="bg-amber-500" />
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

      {/* Section 2b: Traffic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Page Views Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Page Views</h2>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPageViewPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    pageViewPeriod === p
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {{ daily: 'Day', weekly: 'Week', monthly: 'Month', yearly: 'Year' }[p]}
                </button>
              ))}
            </div>
          </div>
          {errors.pageViewTraffic ? (
            <SectionError message={errors.pageViewTraffic} onRetry={handleRefresh} />
          ) : !pageViewTraffic ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : pageViewTraffic.data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              No page view data yet
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pageViewTraffic.data.map(d => ({
                    ...d,
                    label: pageViewPeriod === 'yearly'
                      ? new Date(d.date).toLocaleDateString([], { year: 'numeric' })
                      : pageViewPeriod === 'monthly'
                      ? new Date(d.date).toLocaleDateString([], { month: 'short', year: 'numeric' })
                      : new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                  }))}>
                    <defs>
                      <linearGradient id="pageViewGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
                    <Area type="monotone" dataKey="pageViews" stroke="#3b82f6" fill="url(#pageViewGrad)" strokeWidth={2} name="Page Views" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {pageViewTraffic.topPaths.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Top Pages</h3>
                  <div className="space-y-1">
                    {pageViewTraffic.topPaths.slice(0, 6).map((p, i) => (
                      <div key={p.path} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 truncate"><span className="text-gray-400 mr-1">{i + 1}.</span>{p.path}</span>
                        <span className="text-gray-900 font-medium ml-2 shrink-0">{p.totalViews.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-500">
                Total: <span className="font-medium text-gray-700">{pageViewTraffic.totals.pageViews.toLocaleString()}</span> views
              </div>
            </>
          )}
        </div>

        {/* Bot API Requests Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Bot API Requests</h2>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setBotTrafficPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    botTrafficPeriod === p
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {{ daily: 'Day', weekly: 'Week', monthly: 'Month', yearly: 'Year' }[p]}
                </button>
              ))}
            </div>
          </div>
          {errors.botTraffic ? (
            <SectionError message={errors.botTraffic} onRetry={handleRefresh} />
          ) : !botTraffic ? (
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          ) : botTraffic.data.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              No bot traffic data yet
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={botTraffic.data.map(d => ({
                    ...d,
                    label: botTrafficPeriod === 'yearly'
                      ? new Date(d.date).toLocaleDateString([], { year: 'numeric' })
                      : botTrafficPeriod === 'monthly'
                      ? new Date(d.date).toLocaleDateString([], { month: 'short', year: 'numeric' })
                      : new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                  }))}>
                    <defs>
                      <linearGradient id="botReqGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} interval="preserveStartEnd" tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
                    <Area type="monotone" dataKey="botRequests" stroke="#f59e0b" fill="url(#botReqGrad)" strokeWidth={2} name="Bot Requests" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Total: <span className="font-medium text-gray-700">{botTraffic.totals.botRequests.toLocaleString()}</span> requests
              </div>
            </>
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

