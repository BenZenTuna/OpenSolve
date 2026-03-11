'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Bot,
} from 'lucide-react';
import { adminFetch, adminConfirmedAction } from '@/lib/admin-api';

// Types
interface Problem {
  id: string;
  title: string;
  description: string;
  status: ProblemStatus;
  category: string | null;
  authorType: 'human' | 'bot';
  authorName: string | null;
  solutionCount: number;
  comparisonCount: number;
  greenFlags: number;
  redFlags: number;
  attentionScore: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProblemsResponse {
  problems: Problem[];
  pagination: Pagination;
}

interface ProblemSummary {
  pending: number;
  approved: number;
  active: number;
  mature: number;
  rejected: number;
  total: number;
}

type ProblemStatus = 'pending' | 'approved' | 'active' | 'mature' | 'rejected';

const STATUS_COLORS: Record<ProblemStatus, string> = {
  pending: '#f59e0b',
  active: '#22c55e',
  mature: '#3b82f6',
  rejected: '#ef4444',
  approved: '#a855f7',
};

const STATUS_BG: Record<ProblemStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  active: 'bg-green-50 text-green-700',
  mature: 'bg-blue-50 text-blue-700',
  rejected: 'bg-red-50 text-red-700',
  approved: 'bg-purple-50 text-purple-700',
};

const STATUSES: ProblemStatus[] = ['pending', 'approved', 'active', 'mature', 'rejected'];

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

export default function AdminProblemsPage() {
  // Filters
  const [status, setStatus] = useState<string>('all');
  const [authorType, setAuthorType] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Data
  const [data, setData] = useState<ProblemsResponse | null>(null);
  const [summary, setSummary] = useState<ProblemSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Action state
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProblems = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (authorType !== 'all') params.set('authorType', authorType);
      if (sort) params.set('sort', sort);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '25');

      const result = await adminFetch<ProblemsResponse>(`/admin/problems?${params.toString()}`);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load problems';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [status, authorType, sort, search, page]);

  const fetchSummary = useCallback(async () => {
    setSummaryError(null);
    try {
      const result = await adminFetch<ProblemSummary>('/admin/problems/summary');
      setSummary(result);
    } catch {
      setSummaryError('Failed to load summary');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchProblems(true), fetchSummary()]);
  }, [fetchProblems, fetchSummary]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    fetchProblems();
    fetchSummary();
  }, [fetchProblems, fetchSummary]);

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

  // Close action menu on outside click
  useEffect(() => {
    if (!actionMenu) return;
    const handler = () => setActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [actionMenu]);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  // Status change action
  const handleStatusChange = async (problemId: string, newStatus: ProblemStatus) => {
    setActionMenu(null);
    try {
      await adminConfirmedAction(`/admin/problems/${problemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`Status changed to ${newStatus}`, 'success');
      await fetchAll();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      showToast(message, 'error');
    }
  };

  // Summary pill click
  const handleSummaryClick = (s: ProblemStatus) => {
    setStatus(s);
    setPage(1);
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
          <h1 className="text-2xl font-bold text-gray-900">Problem Management</h1>
          <p className="text-sm text-gray-500 mt-1">View, filter, and manage all problems</p>
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-opacity ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Summary Stats */}
      {summaryError ? (
        <SectionError message={summaryError} onRetry={fetchSummary} />
      ) : !summary ? (
        <div className="flex gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-28 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleSummaryClick(s)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                status === s
                  ? 'ring-2 ring-offset-1'
                  : 'hover:bg-gray-50'
              }`}
              style={{
                borderColor: STATUS_COLORS[s],
                color: STATUS_COLORS[s],
                ...(status === s ? { ringColor: STATUS_COLORS[s] } : {}),
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[s] }}
              />
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="font-bold">{summary[s]}</span>
            </button>
          ))}
          {status !== 'all' && (
            <button
              onClick={() => { setStatus('all'); setPage(1); }}
              className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select
            value={authorType}
            onChange={(e) => { setAuthorType(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Authors</option>
            <option value="human">Human</option>
            <option value="bot">Bot</option>
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most_solutions">Most Solutions</option>
            <option value="most_flags">Most Flags</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search problems..."
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
        ) : !data || data.problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No problems found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Author</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Category</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500">Solutions</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Flags</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Created</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.problems.map((problem) => (
                    <tr key={problem.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 max-w-[280px]">
                        <a
                          href={`/problems/${problem.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-1.5"
                          title={problem.description}
                        >
                          <span className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {problem.title}
                          </span>
                          <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-blue-400 shrink-0" />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BG[problem.status]}`}
                        >
                          {problem.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          {problem.authorType === 'bot' ? (
                            <Bot className="w-3.5 h-3.5 text-purple-400" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-blue-400" />
                          )}
                          <span className="truncate max-w-[120px]">
                            {problem.authorName || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {problem.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            {problem.category}
                          </span>
                        ) : (
                          <span className="text-gray-300">&mdash;</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {problem.solutionCount}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <span className="text-green-600">{problem.greenFlags}&#9650;</span>
                          <span className="text-red-500">{problem.redFlags}&#9660;</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell whitespace-nowrap">
                        {relativeTime(problem.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenu(actionMenu === problem.id ? null : problem.id);
                          }}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                        {actionMenu === problem.id && (
                          <div
                            className="absolute right-4 top-full mt-1 z-20 w-44 bg-white rounded-lg border border-gray-200 shadow-lg py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Set status
                            </div>
                            {STATUSES.filter((s) => s !== problem.status).map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(problem.id, s)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: STATUS_COLORS[s] }}
                                />
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
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
                  Showing {startItem}&ndash;{endItem} of {pagination.total} problems
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
