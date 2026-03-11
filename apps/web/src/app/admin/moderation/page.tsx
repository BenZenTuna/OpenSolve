'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Shield,
  Flag,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { adminFetch, adminConfirmedAction } from '@/lib/admin-api';

// Types

interface ModerationFlag {
  id: string;
  botName: string | null;
  verdict: 'green' | 'red';
  category: string;
  suggestedCategory: string | null;
  createdAt: string;
}

interface ModerationProblem {
  id: string;
  title: string;
  description: string;
  authorType: 'human' | 'bot';
  authorName: string | null;
  greenFlags: number;
  redFlags: number;
  totalFlags: number;
  createdAt: string;
  flags?: ModerationFlag[];
}

interface ModerationQueueResponse {
  pending: ModerationProblem[];
  mixed: ModerationProblem[];
  recentlyRejected: ModerationProblem[];
  counts: {
    pending: number;
    mixed: number;
    recentlyRejected: number;
  };
}

type TabKey = 'pending' | 'mixed' | 'recentlyRejected';

const TAB_CONFIG: { key: TabKey; label: string; emptyIcon: typeof Shield; emptyText: string }[] = [
  { key: 'pending', label: 'Pending', emptyIcon: Shield, emptyText: 'No problems pending review' },
  { key: 'mixed', label: 'Mixed', emptyIcon: Flag, emptyText: 'No problems with mixed flags' },
  { key: 'recentlyRejected', label: 'Rejected', emptyIcon: XCircle, emptyText: 'No recently rejected problems' },
];

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

function FlagProgressBar({ green, red, total }: { green: number; red: number; total: number }) {
  if (total === 0) {
    return <span className="text-xs text-gray-400 italic">Awaiting flags</span>;
  }
  const greenPct = (green / total) * 100;
  const redPct = (red / total) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
        {greenPct > 0 && (
          <div className="h-full bg-green-500 rounded-l-full" style={{ width: `${greenPct}%` }} />
        )}
        {redPct > 0 && (
          <div className="h-full bg-red-500 rounded-r-full" style={{ width: `${redPct}%` }} />
        )}
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {green} green / {red} red
      </span>
    </div>
  );
}

export default function AdminModerationPage() {
  const [data, setData] = useState<ModerationQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const fetchQueue = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await adminFetch<ModerationQueueResponse>('/admin/moderation/queue');
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load moderation queue';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchQueue(true);
    setRefreshing(false);
  }, [fetchQueue]);

  // Initial load
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchQueue(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Default to first non-empty tab
  useEffect(() => {
    if (!data) return;
    if (data.counts.pending > 0) { setActiveTab('pending'); return; }
    if (data.counts.mixed > 0) { setActiveTab('mixed'); return; }
    if (data.counts.recentlyRejected > 0) { setActiveTab('recentlyRejected'); return; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data === null]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (problemId: string, newStatus: string) => {
    setActionLoading(problemId);
    try {
      await adminConfirmedAction(`/admin/problems/${problemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      showToast(`Status changed to ${newStatus}`, 'success');
      await fetchQueue(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      showToast(message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const scrollToTab = (tab: TabKey) => {
    setActiveTab(tab);
    document.getElementById('moderation-tabs')?.scrollIntoView({ behavior: 'smooth' });
  };

  const counts = data?.counts ?? { pending: 0, mixed: 0, recentlyRejected: 0 };
  const activeProblems = data ? data[activeTab] : [];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Review flagged problems and override statuses</p>
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

      {/* Summary Count Pills */}
      {loading ? (
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-40 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      ) : error ? null : (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => scrollToTab('pending')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-yellow-300 text-yellow-700 hover:bg-yellow-50 transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            Pending review
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
              {counts.pending}
            </span>
          </button>
          <button
            onClick={() => scrollToTab('mixed')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            Mixed flags
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              {counts.mixed}
            </span>
          </button>
          <button
            onClick={() => scrollToTab('recentlyRejected')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            Recently rejected
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {counts.recentlyRejected}
            </span>
          </button>
        </div>
      )}

      {/* Tab Bar + Content */}
      <div id="moderation-tabs" className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {error ? (
          <SectionError message={error} onRetry={handleRefresh} />
        ) : loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {TAB_CONFIG.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === key
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label} ({counts[key]})
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 space-y-3">
              {activeProblems.length === 0 ? (
                <EmptyState tab={activeTab} />
              ) : (
                activeProblems.map((problem) => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    tab={activeTab}
                    isExpanded={expanded.has(problem.id)}
                    onToggle={() => toggleExpanded(problem.id)}
                    onApprove={() => handleStatusChange(problem.id, 'active')}
                    onReject={() => handleStatusChange(problem.id, 'rejected')}
                    onRestore={() => handleStatusChange(problem.id, 'pending')}
                    isLoading={actionLoading === problem.id}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Sub-components

function EmptyState({ tab }: { tab: TabKey }) {
  const config = TAB_CONFIG.find((t) => t.key === tab)!;
  const Icon = config.emptyIcon;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-sm text-gray-500">{config.emptyText}</p>
    </div>
  );
}

function ProblemCard({
  problem,
  tab,
  isExpanded,
  onToggle,
  onApprove,
  onReject,
  onRestore,
  isLoading,
}: {
  problem: ModerationProblem;
  tab: TabKey;
  isExpanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRestore: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Collapsed row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        {/* Expand icon */}
        <button className="shrink-0 text-gray-400">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Title + author */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{problem.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {problem.authorType === 'bot' ? (
              <Bot className="w-3 h-3 text-purple-400" />
            ) : (
              <User className="w-3 h-3 text-blue-400" />
            )}
            <span className="text-xs text-gray-500 truncate">
              {problem.authorName || 'Unknown'}
            </span>
          </div>
        </div>

        {/* Flag bar */}
        <div className="w-48 hidden sm:block">
          <FlagProgressBar
            green={problem.greenFlags}
            red={problem.redFlags}
            total={problem.totalFlags}
          />
        </div>

        {/* Time */}
        <span className="text-xs text-gray-400 whitespace-nowrap hidden md:block">
          {relativeTime(problem.createdAt)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {tab === 'recentlyRejected' ? (
            <button
              onClick={onRestore}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              Restore
            </button>
          ) : (
            <>
              <button
                onClick={onApprove}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-3 h-3" />
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3 h-3" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50">
          {/* Description */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{problem.description}</p>
          </div>

          {/* Mobile flag bar */}
          <div className="mb-4 sm:hidden">
            <FlagProgressBar
              green={problem.greenFlags}
              red={problem.redFlags}
              total={problem.totalFlags}
            />
          </div>

          {/* Flags detail */}
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Flag Details ({problem.totalFlags})
            </p>
            {!problem.flags || problem.flags.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No flags submitted yet</p>
            ) : (
              <div className="space-y-2">
                {problem.flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="flex items-center gap-3 text-sm bg-white rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-gray-700 truncate min-w-0">
                      {flag.botName || 'Unknown bot'}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                        flag.verdict === 'green'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {flag.verdict}
                    </span>
                    {flag.category !== 'none' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
                        {flag.category}
                      </span>
                    )}
                    {flag.verdict === 'green' && flag.suggestedCategory && (
                      <span className="text-xs text-gray-400 shrink-0">
                        suggested: {flag.suggestedCategory}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      {relativeTime(flag.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
