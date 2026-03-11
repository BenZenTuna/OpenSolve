'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Bot,
  Mail,
  Key,
  Shield,
  Check,
  X as XIcon,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

// Types
interface UserItem {
  id: string;
  username: string | null;
  email: string;
  role: 'human' | 'admin';
  onboardingComplete: boolean;
  botName: string | null;
  hasApiKey: boolean;
  newsletterSubscribed: boolean;
  createdAt: string;
  lastUpdated: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UsersResponse {
  users: UserItem[];
  pagination: Pagination;
}

interface AdminStats {
  totalUsers: number;
  totalBots: number;
  activeBots: number;
  suspendedBots: number;
  bannedBots: number;
  totalProblems: number;
  pendingProblems: number;
  rejectedProblems: number;
  totalSolutions: number;
  totalComparisons: number;
  totalFlags: number;
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
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

export default function AdminUsersPage() {
  // Filters
  const [role, setRole] = useState<string>('all');
  const [hasBot, setHasBot] = useState<string>('all');
  const [newsletter, setNewsletter] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Data
  const [data, setData] = useState<UsersResponse | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Computed summary from current data
  const computedStats = data
    ? {
        admins: data.users.filter((u) => u.role === 'admin').length,
        botOperators: data.users.filter((u) => u.botName !== null).length,
        newsletterSubs: data.users.filter((u) => u.newsletterSubscribed).length,
      }
    : null;

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (role !== 'all') params.set('role', role);
      if (hasBot !== 'all') params.set('hasBot', hasBot);
      if (newsletter !== 'all') params.set('newsletter', newsletter);
      if (sort) params.set('sort', sort);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '25');

      const result = await adminFetch<UsersResponse>(`/admin/users?${params.toString()}`);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [role, hasBot, newsletter, sort, search, page]);

  const fetchStats = useCallback(async () => {
    setStatsError(null);
    try {
      const result = await adminFetch<AdminStats>('/admin/stats');
      setStats(result);
    } catch {
      setStatsError('Failed to load stats');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchUsers(true), fetchStats()]);
  }, [fetchUsers, fetchStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [fetchUsers, fetchStats]);

  useEffect(() => {
    const interval = setInterval(() => fetchAll(), 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  // Pagination helpers
  const pagination = data?.pagination;
  const startItem = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const endItem = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (!pagination) return [];
    const { totalPages } = pagination;
    const current = pagination.page;
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);

    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and filter all registered users</p>
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

      {/* Summary Stats */}
      {statsError ? (
        <SectionError message={statsError} onRetry={fetchStats} />
      ) : !stats ? (
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-32 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-indigo-300 text-indigo-600">
            <Users className="w-3.5 h-3.5" />
            Total Users
            <span className="font-bold">{stats.totalUsers}</span>
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-blue-300 text-blue-600">
            <Shield className="w-3.5 h-3.5" />
            Admins
            <span className="font-bold">{computedStats?.admins ?? 0}</span>
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-purple-300 text-purple-600">
            <Bot className="w-3.5 h-3.5" />
            Bot Operators
            <span className="font-bold">{computedStats?.botOperators ?? 0}</span>
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-green-300 text-green-600">
            <Mail className="w-3.5 h-3.5" />
            Newsletter
            <span className="font-bold">{computedStats?.newsletterSubs ?? 0}</span>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="human">Human</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={hasBot}
            onChange={(e) => { setHasBot(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="yes">Has Bot</option>
            <option value="no">No Bot</option>
          </select>

          <select
            value={newsletter}
            onChange={(e) => { setNewsletter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Newsletter</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="username">Username</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search username or email..."
              defaultValue={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {error ? (
          <SectionError message={error} onRetry={handleRefresh} />
        ) : loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data || data.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No users found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Bot Name</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 hidden md:table-cell">API Key</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Newsletter</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {user.username || <span className="text-gray-300">&mdash;</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-600 truncate max-w-[200px] block">
                          {user.email}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {user.botName ? (
                          <span className="inline-flex items-center gap-1 text-gray-700">
                            <Bot className="w-3.5 h-3.5 text-purple-400" />
                            {user.botName}
                          </span>
                        ) : (
                          <span className="text-gray-300">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        {user.hasApiKey ? (
                          <Key className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <Key className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        {user.newsletterSubscribed ? (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        ) : (
                          <XIcon className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {relativeTime(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {startItem}&ndash;{endItem} of {pagination.total} users
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  {getPageNumbers().map((p, i) =>
                    p === 'ellipsis' ? (
                      <span key={`e${i}`} className="px-2 text-gray-400 text-sm">
                        &hellip;
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          p === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
