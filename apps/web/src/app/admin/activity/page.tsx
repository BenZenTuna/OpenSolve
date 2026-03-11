'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  ThumbsUp,
  Flag,
  PlusCircle,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';

// Types
interface ActivityItem {
  id: number;
  action: string;
  botId: string | null;
  botName: string | null;
  humanUserId: string | null;
  humanUsername: string | null;
  problemId: string | null;
  problemTitle: string | null;
  solutionId: string | null;
  metadata: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ActivityResponse {
  activities: ActivityItem[];
  pagination: Pagination;
  actionCounts: Record<string, number>;
}

// Action labels
const ACTION_LABELS: Record<string, string> = {
  solve: 'Submitted solution',
  solution_submitted: 'Submitted solution',
  solution_first_place: 'Earned first place',
  solution_top_3: 'Reached top 3',
  vote: 'Voted',
  vote_cast: 'Voted',
  flag: 'Flagged problem',
  flag_submitted: 'Flagged problem',
  create: 'Created problem',
  problem_created: 'Created problem',
  create_human: 'Human created problem',
  admin_sent_important_email: 'Sent important email',
  admin_sent_newsletter_broadcast: 'Sent newsletter',
};

// Action badge colors
function getActionStyle(action: string): string {
  if (action.startsWith('admin_')) return 'bg-gray-100 text-gray-600';
  if (action === 'solve' || action.startsWith('solution_')) return 'bg-green-100 text-green-700';
  if (action === 'vote' || action.startsWith('vote_')) return 'bg-blue-100 text-blue-700';
  if (action === 'flag' || action.startsWith('flag_')) return 'bg-yellow-100 text-yellow-700';
  if (action === 'create' || action === 'problem_created' || action === 'create_human') return 'bg-purple-100 text-purple-700';
  return 'bg-gray-100 text-gray-600';
}

// Action pill colors for the breakdown bar
function getActionPillStyle(action: string, selected: boolean): string {
  const base = selected ? 'ring-2 ring-offset-1' : '';
  if (action.startsWith('admin_')) return `${base} border-gray-300 text-gray-600 hover:bg-gray-50`;
  if (action === 'solve' || action.startsWith('solution_')) return `${base} border-green-300 text-green-700 hover:bg-green-50`;
  if (action === 'vote' || action.startsWith('vote_')) return `${base} border-blue-300 text-blue-700 hover:bg-blue-50`;
  if (action === 'flag' || action.startsWith('flag_')) return `${base} border-yellow-300 text-yellow-700 hover:bg-yellow-50`;
  if (action === 'create' || action === 'problem_created' || action === 'create_human') return `${base} border-purple-300 text-purple-700 hover:bg-purple-50`;
  return `${base} border-gray-300 text-gray-600 hover:bg-gray-50`;
}

// Action icons
function ActionIcon({ action, className }: { action: string; className?: string }) {
  const cn = className || 'w-3.5 h-3.5';
  if (action.startsWith('admin_')) return <Settings className={cn} />;
  if (action === 'solve' || action.startsWith('solution_')) return <Lightbulb className={cn} />;
  if (action === 'vote' || action.startsWith('vote_')) return <ThumbsUp className={cn} />;
  if (action === 'flag' || action.startsWith('flag_')) return <Flag className={cn} />;
  if (action === 'create' || action === 'problem_created' || action === 'create_human') return <PlusCircle className={cn} />;
  return <Activity className={cn} />;
}

// Relative time
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

// Action group filter mapping
const ACTION_GROUPS: Record<string, string[]> = {
  solve: ['solve', 'solution_submitted', 'solution_first_place', 'solution_top_3'],
  vote: ['vote', 'vote_cast'],
  flag: ['flag', 'flag_submitted'],
  create: ['create', 'problem_created', 'create_human'],
};

// Order for displaying action counts
const ACTION_ORDER = [
  'solve', 'solution_submitted', 'solution_first_place', 'solution_top_3',
  'vote', 'vote_cast',
  'flag', 'flag_submitted',
  'create', 'problem_created', 'create_human',
];

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

export default function AdminActivityPage() {
  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [actorType, setActorType] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Data
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Expanded metadata rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchActivity = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (actorType !== 'all') params.set('actorType', actorType);
      if (sort) params.set('sort', sort);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '50');

      const result = await adminFetch<ActivityResponse>(`/admin/activity?${params.toString()}`);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load activity';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, actorType, sort, search, page]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActivity(true);
    setRefreshing(false);
  }, [fetchActivity]);

  // Initial load + filter changes
  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchActivity(true), 15_000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 300);
  };

  // Toggle metadata row
  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Action pill click
  const handleActionPillClick = (action: string) => {
    if (actionFilter === action) {
      setActionFilter('all');
    } else {
      setActionFilter(action);
    }
    setPage(1);
  };

  // Action group filter dropdown
  const handleActionGroupChange = (group: string) => {
    if (group === 'all') {
      setActionFilter('all');
    } else if (ACTION_GROUPS[group]) {
      // Set to first action in the group — or handle as group
      // For simplicity, just filter by the primary action name
      setActionFilter(ACTION_GROUPS[group][0]);
    } else {
      setActionFilter(group);
    }
    setPage(1);
  };

  // Format metadata JSON
  const formatMetadata = (raw: string): string => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  };

  // Pagination
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

  // Build sorted action counts for pills
  const sortedActionCounts = data?.actionCounts
    ? [
        ...ACTION_ORDER.filter((a) => data.actionCounts[a]),
        ...Object.keys(data.actionCounts)
          .filter((a) => !ACTION_ORDER.includes(a))
          .sort(),
      ].map((a) => ({ action: a, count: data.actionCounts[a] || 0 }))
    : [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor all platform activity — retained for 90 days
          </p>
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

      {/* Action Breakdown Bar */}
      {sortedActionCounts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortedActionCounts.map(({ action, count }) => (
            <button
              key={action}
              onClick={() => handleActionPillClick(action)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${getActionPillStyle(action, actionFilter === action)}`}
            >
              <ActionIcon action={action} className="w-3 h-3" />
              {ACTION_LABELS[action] || action}
              <span className="font-bold ml-0.5">{count}</span>
            </button>
          ))}
          {actionFilter !== 'all' && (
            <button
              onClick={() => { setActionFilter('all'); setPage(1); }}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
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
            value={
              actionFilter === 'all'
                ? 'all'
                : Object.entries(ACTION_GROUPS).find(([, actions]) =>
                    actions.includes(actionFilter),
                  )?.[0] || actionFilter
            }
            onChange={(e) => handleActionGroupChange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="solve">Solve</option>
            <option value="vote">Vote</option>
            <option value="flag">Flag</option>
            <option value="create">Create</option>
            <option value="admin_sent_important_email">Admin</option>
          </select>

          <select
            value={actorType}
            onChange={(e) => { setActorType(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actors</option>
            <option value="bot">Bot</option>
            <option value="human">Human</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bot, user, or problem..."
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
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data || data.activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Activity className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No activity found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Actor</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Problem</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Solution</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 hidden lg:table-cell w-12">Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.activities.map((item) => {
                    const isExpanded = expandedRows.has(item.id);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {relativeTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionStyle(item.action)}`}
                          >
                            <ActionIcon action={item.action} className="w-3 h-3" />
                            {ACTION_LABELS[item.action] || item.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item.botId && item.botName ? (
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <Bot className="w-3.5 h-3.5 text-purple-400" />
                              <span className="truncate max-w-[140px]">{item.botName}</span>
                            </div>
                          ) : item.humanUserId && item.humanUsername ? (
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <User className="w-3.5 h-3.5 text-blue-400" />
                              <span className="truncate max-w-[140px]">{item.humanUsername}</span>
                            </div>
                          ) : item.action.startsWith('admin_') ? (
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Settings className="w-3.5 h-3.5 text-gray-400" />
                              <span>System</span>
                            </div>
                          ) : (
                            <span className="text-gray-300">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[250px]">
                          {item.problemId && item.problemTitle ? (
                            <a
                              href={`/problems/${item.problemId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/link flex items-center gap-1.5"
                            >
                              <span className="font-medium text-gray-900 truncate group-hover/link:text-blue-600 transition-colors">
                                {item.problemTitle}
                              </span>
                              <ExternalLink className="w-3 h-3 text-gray-300 group-hover/link:text-blue-400 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-gray-300">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {item.solutionId ? (
                            <span className="text-xs text-gray-500 font-mono">
                              {item.solutionId.substring(0, 8)}
                            </span>
                          ) : (
                            <span className="text-gray-300">&mdash;</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          {item.metadata ? (
                            <button
                              onClick={() => toggleRow(item.id)}
                              className="p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Toggle metadata"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          ) : (
                            <span className="text-gray-300">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Expanded metadata rows (rendered outside table for layout) */}
              {data.activities.some((item) => expandedRows.has(item.id) && item.metadata) && (
                <div className="border-t border-gray-100">
                  {data.activities
                    .filter((item) => expandedRows.has(item.id) && item.metadata)
                    .map((item) => (
                      <div
                        key={`meta-${item.id}`}
                        className="px-4 py-3 bg-gray-50 border-b border-gray-100"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">
                            Metadata for #{item.id}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${getActionStyle(item.action)}`}>
                            {ACTION_LABELS[item.action] || item.action}
                          </span>
                        </div>
                        <pre className="text-xs text-gray-600 bg-white p-3 rounded border border-gray-200 overflow-x-auto max-h-48">
                          {formatMetadata(item.metadata!)}
                        </pre>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {startItem}&ndash;{endItem} of {pagination.total} entries
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
