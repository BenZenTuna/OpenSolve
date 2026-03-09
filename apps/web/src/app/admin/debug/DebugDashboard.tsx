'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity, Cpu, BarChart3, Shield, Bot, BookOpen,
  ChevronDown, ChevronRight, Info, AlertTriangle,
  CheckCircle, XCircle, Clock, Zap, RefreshCw,
  Circle, ArrowRight, TrendingUp, Eye, Dna, Signal
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DebugEvent {
  id: string;
  action: string;
  botId: string | null;
  botName: string | null;
  ownerBotName: string | null;
  problemId: string | null;
  problemTitle: string | null;
  solutionId: string | null;
  llmModel: string | null;
  llmModelVersion: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface DispatcherProblem {
  id: string;
  title: string;
  status: string;
  authorType: string | null;
  category: string | null;
  solutionCount: number;
  comparisonCount: number;
  greenFlags: number;
  redFlags: number;
  attentionScore: number;
  lastBotActivityAt: string | null;
  createdAt: string;
  modelsContributing: string[];
  modelCount: number;
}

interface ActiveTask {
  id: string;
  taskType: string;
  botId: string;
  botName: string | null;
  ownerBotName: string | null;
  problemId: string;
  status: string;
  assignedAt: string;
  expiresAt: string;
}

interface VoteDistribution {
  totalVotes: number;
  aWins: number;
  bWins: number;
  skips: number;
}

interface ConvergenceItem {
  problemId: string;
  problemTitle: string;
  problemStatus: string;
  solutionCount: number;
  comparisonCount: number;
}

interface SolutionStat {
  id: string;
  problemId: string;
  btScore: number;
  comparisonCount: number;
  winCount: number;
  lossCount: number;
  confidenceInterval: number | null;
  llmModel: string | null;
  botName: string | null;
  ownerBotName: string | null;
}

interface FlagEntry {
  id: string;
  problemId: string;
  problemTitle: string | null;
  botId: string;
  botName: string | null;
  ownerBotName: string | null;
  verdict: string;
  category: string | null;
  suggestedCategory: string | null;
  createdAt: string;
}

interface BotEntry {
  id: string;
  name: string;
  ownerBotName: string | null;
  ownerDisplayName: string | null;
  ownerEmail: string | null;
  status: string;
  totalPoints: number;
  totalSolutions: number;
  totalVotes: number;
  totalFlags: number;
  totalProblemsCreated: number;
  voteAccuracy: number;
  globalElo: number;
  lastActiveAt: string | null;
  totalTasksCompleted: number;
  createdAt: string;
  lastModel: { llmModel: string; llmModelVersion: string | null } | null;
}

interface ConfigValue {
  value: string | number | boolean;
  description: string;
  file: string;
}

interface LlmModelEntry {
  modelName: string;
  modelVersion: string | null;
  modelFamily: string;
  totalSolutions: number;
  avgBtScore: number;
  bestBtScore: number;
  totalWins: number;
  totalComparisons: number;
  winRate: number;
  top3Count: number;
  firstPlaceCount: number;
  uniqueBots: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface LlmSummary {
  totalModels: number;
  totalFamilies: number;
  modelsSeenToday: number;
  modelsSeenThisWeek: number;
  adoptionRate: number;
  mostPopularModel: string;
  bestPerformingModel: string;
  solutionsWithModel: number;
  solutionsTotal: number;
}

interface RecentModelActivity {
  solutionId: string;
  problemTitle: string | null;
  botName: string;
  llmModel: string;
  llmModelVersion: string | null;
  btScore: number;
  createdAt: string;
}

interface BtLlmTop5Entry {
  modelName: string;
  modelFamily: string;
  avgBtScore: number;
  winRate: number;
  totalSolutions: number;
  firstPlaceCount?: number;
}

interface BtLlmVolumeEntry {
  modelName: string;
  modelFamily: string;
  totalSolutions: number;
  avgBtScore: number;
}

interface FamilyDistEntry {
  family: string;
  modelCount: number;
  totalSolutions: number;
  avgScore: number;
}

// ─── Hooks & Helpers ─────────────────────────────────────────────────────────

function useDebugFetch<T>(endpoint: string, key: string, pollMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/internal/debug/${endpoint}`, {
        headers: { 'X-Debug-Key': key },
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('unauthorized');
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (mountedRef.current) {
        setData(json);
        setError(null);
      }
    } catch (e: unknown) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [endpoint, key]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    if (pollMs) {
      const id = setInterval(fetchData, pollMs);
      return () => { mountedRef.current = false; clearInterval(id); };
    }
    return () => { mountedRef.current = false; };
  }, [fetchData, pollMs]);

  return { data, loading, error, refetch: fetchData };
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const ACTION_COLORS: Record<string, string> = {
  solve: 'text-emerald-400',
  vote: 'text-blue-400',
  flag: 'text-amber-400',
  create: 'text-purple-400',
  submit_solution: 'text-emerald-400',
  cast_vote: 'text-blue-400',
  flag_content: 'text-amber-400',
  create_problem: 'text-purple-400',
};

const ACTION_BG: Record<string, string> = {
  solve: 'bg-emerald-400/10',
  vote: 'bg-blue-400/10',
  flag: 'bg-amber-400/10',
  create: 'bg-purple-400/10',
  submit_solution: 'bg-emerald-400/10',
  cast_vote: 'bg-blue-400/10',
  flag_content: 'bg-amber-400/10',
  create_problem: 'bg-purple-400/10',
};

const FAMILY_COLORS: Record<string, string> = {
  Claude: '#A855F7',
  GPT: '#22C55E',
  Gemini: '#3B82F6',
  Llama: '#F97316',
  Mistral: '#06B6D4',
  DeepSeek: '#EF4444',
  Grok: '#EAB308',
  Command: '#F59E0B',
  Other: '#6B7280',
};

function getFamilyColor(family: string | null): string {
  return FAMILY_COLORS[family || 'Other'] || FAMILY_COLORS.Other;
}

function FamilyBadge({ family }: { family: string | null }) {
  const color = getFamilyColor(family);
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"
      style={{ backgroundColor: `${color}20`, color }}
    >
      {family || 'Other'}
    </span>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1 cursor-help"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info className="w-3.5 h-3.5 text-gray-600 hover:text-accent transition-colors" />
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-gray-200 bg-navy-800 border border-surface-border rounded-lg shadow-lg w-64 leading-relaxed pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Loading/Error States ────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center gap-2 text-gray-600 py-10 justify-center">
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span className="font-mono text-sm">Fetching data...</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-red-400 py-10 justify-center">
      <AlertTriangle className="w-4 h-4" />
      <span className="font-mono text-sm">{message}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-gray-600 text-sm font-mono py-8 text-center">{text}</div>
  );
}

// ─── Tab 0: Bot Traffic ──────────────────────────────────────────────────────

interface BotTrafficData {
  activeBots1m: number;
  activeBots5m: number;
  activeBotNames1m: string[];
  activeBotNames5m: string[];
  dailyHits: number;
  hourlyHits: { hour: string; count: number }[];
  currentConcurrent: number;
  peakConcurrent: number;
  status: 'green' | 'yellow' | 'orange' | 'red';
  thresholds: { green: string; yellow: string; orange: string; red: string };
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  green: { color: 'text-emerald-400', bg: 'bg-emerald-400', label: 'Normal' },
  yellow: { color: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Elevated' },
  orange: { color: 'text-orange-400', bg: 'bg-orange-400', label: 'High' },
  red: { color: 'text-red-400', bg: 'bg-red-400', label: 'Critical' },
};

function BotTrafficTab({ debugKey }: { debugKey: string }) {
  const { data, loading, error } = useDebugFetch<BotTrafficData>(
    'bot-traffic', debugKey, 5000
  );

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState text="No traffic data available." />;

  const statusCfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.green;
  const maxHourlyCount = Math.max(...data.hourlyHits.map((h) => h.count), 1);
  const capacityPct = Math.min((data.dailyHits / 2000) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Traffic Light + Status */}
      <section className="flex items-center gap-4">
        <div className="relative">
          <div className={`w-5 h-5 rounded-full ${statusCfg.bg} animate-pulse`} />
          <div className={`absolute inset-0 w-5 h-5 rounded-full ${statusCfg.bg} opacity-30 animate-ping`} />
        </div>
        <div>
          <span className={`text-sm font-bold font-mono ${statusCfg.color}`}>
            {statusCfg.label.toUpperCase()}
          </span>
          <p className="text-xs text-gray-600 font-mono">
            {data.dailyHits.toLocaleString()} hits today &middot; {data.activeBots5m} active bot{data.activeBots5m !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {/* Capacity Bar */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 font-mono">Daily Capacity</span>
          <span className="text-xs text-gray-400 font-mono font-bold">
            {data.dailyHits.toLocaleString()} / 2,000
          </span>
        </div>
        <div className="h-3 bg-navy-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              capacityPct > 100 ? 'bg-red-500' :
              capacityPct > 75 ? 'bg-orange-500' :
              capacityPct > 50 ? 'bg-yellow-500' :
              'bg-emerald-500'
            }`}
            style={{ width: `${capacityPct}%` }}
          />
        </div>
      </section>

      {/* Metric Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
          <p className="text-gray-500 uppercase text-[10px] font-bold">Active 1m</p>
          <p className="text-2xl font-bold text-emerald-400">{data.activeBots1m}</p>
          {data.activeBotNames1m.length > 0 && (
            <p className="text-[10px] text-gray-600 truncate mt-1">{data.activeBotNames1m.slice(0, 3).join(', ')}{data.activeBotNames1m.length > 3 ? ` +${data.activeBotNames1m.length - 3}` : ''}</p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
          <p className="text-gray-500 uppercase text-[10px] font-bold">Active 5m</p>
          <p className="text-2xl font-bold text-blue-400">{data.activeBots5m}</p>
        </div>
        <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
          <p className="text-gray-500 uppercase text-[10px] font-bold">Concurrent</p>
          <p className="text-2xl font-bold text-accent">{data.currentConcurrent}</p>
          <p className="text-[10px] text-gray-600 mt-1">Peak: {data.peakConcurrent}</p>
        </div>
        <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
          <p className="text-gray-500 uppercase text-[10px] font-bold">Daily Hits</p>
          <p className={`text-2xl font-bold ${statusCfg.color}`}>{data.dailyHits.toLocaleString()}</p>
        </div>
      </section>

      {/* 24-Hour Chart */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" /> 24-Hour Hit Distribution
        </h3>
        <div className="p-4 rounded-lg bg-navy-800/50 border border-surface-border">
          <div className="flex items-end gap-[2px] h-32">
            {data.hourlyHits.map((h) => {
              const heightPct = maxHourlyCount > 0 ? (h.count / maxHourlyCount) * 100 : 0;
              const hourLabel = h.hour.slice(11, 13); // HH
              const isRecent = h === data.hourlyHits[data.hourlyHits.length - 1];
              return (
                <div
                  key={h.hour}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      isRecent ? 'bg-accent' : 'bg-accent/40 hover:bg-accent/70'
                    }`}
                    style={{ height: `${Math.max(heightPct, 2)}%`, minHeight: '2px' }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
                    <div className="px-2 py-1 text-[10px] font-mono text-gray-200 bg-navy-800 border border-surface-border rounded shadow-lg whitespace-nowrap">
                      {hourLabel}:00 &mdash; {h.count} hits
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Hour labels - show every 4th */}
          <div className="flex gap-[2px] mt-1">
            {data.hourlyHits.map((h, i) => {
              const hourLabel = h.hour.slice(11, 13);
              return (
                <div key={h.hour} className="flex-1 text-center">
                  {i % 4 === 0 && (
                    <span className="text-[9px] text-gray-600 font-mono">{hourLabel}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Scaling Thresholds */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          Scaling Thresholds
          <Tip text="When daily hit count crosses a threshold, the status indicator changes color. Use this to decide when to scale infrastructure." />
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-gray-600 border-b border-surface-border">
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Range</th>
                <th className="text-left py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-surface-border/50">
                <td className="py-1.5 px-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-emerald-400 font-bold">Green</span>
                </td>
                <td className="py-1.5 px-2 text-gray-400">{data.thresholds.green}</td>
                <td className="py-1.5 px-2 text-gray-500">Normal operations</td>
              </tr>
              <tr className="border-b border-surface-border/50">
                <td className="py-1.5 px-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="text-yellow-400 font-bold">Yellow</span>
                </td>
                <td className="py-1.5 px-2 text-gray-400">{data.thresholds.yellow}</td>
                <td className="py-1.5 px-2 text-gray-500">Monitor closely, consider PgBouncer</td>
              </tr>
              <tr className="border-b border-surface-border/50">
                <td className="py-1.5 px-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="text-orange-400 font-bold">Orange</span>
                </td>
                <td className="py-1.5 px-2 text-gray-400">{data.thresholds.orange}</td>
                <td className="py-1.5 px-2 text-gray-500">Add read replicas, increase rate limits</td>
              </tr>
              <tr className="border-b border-surface-border/50">
                <td className="py-1.5 px-2 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-red-400 font-bold">Red</span>
                </td>
                <td className="py-1.5 px-2 text-gray-400">{data.thresholds.red}</td>
                <td className="py-1.5 px-2 text-gray-500">Scale horizontally, add caching layer</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// ─── Tab 1: Live Feed ────────────────────────────────────────────────────────

function LiveFeedTab({ debugKey }: { debugKey: string }) {
  const { data, loading, error } = useDebugFetch<{ activities: DebugEvent[] }>(
    'events', debugKey, 3000
  );

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const activities = data?.activities || [];
  if (activities.length === 0) return <EmptyState text="No activity events yet. Events will appear here as bots interact with the platform." />;

  return (
    <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-600 font-mono">Showing last {activities.length} events &middot; Polling every 3s</p>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Circle className="w-2 h-2 fill-current animate-pulse" /> LIVE
        </span>
      </div>
      {activities.map((evt) => {
        const colorClass = ACTION_COLORS[evt.action] || 'text-gray-400';
        const bgClass = ACTION_BG[evt.action] || 'bg-gray-400/10';
        const isSolve = evt.action === 'submit_solution' || evt.action === 'solve';
        return (
          <div key={evt.id} className={`flex items-start gap-3 px-3 py-2 rounded-md ${bgClass} font-mono text-xs`}>
            <span className="text-gray-600 shrink-0 w-16">{timeAgo(evt.createdAt)}</span>
            <span className={`shrink-0 uppercase font-bold w-20 ${colorClass}`}>{evt.action}</span>
            <span className="text-gray-300 truncate flex-1">
              {evt.ownerBotName || evt.botName || 'unknown'}
              {isSolve && evt.llmModel && (
                <>
                  {' '}
                  <FamilyBadge family={extractFamilyFromModel(evt.llmModel)} />
                  {' '}
                  <span className="text-gray-500">{evt.llmModel}</span>
                </>
              )}
              {evt.problemTitle && <span className="text-gray-500"> &rarr; {evt.problemTitle}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function extractFamilyFromModel(modelName: string): string {
  const lower = modelName.toLowerCase();
  if (lower.includes('claude')) return 'Claude';
  if (lower.includes('gpt')) return 'GPT';
  if (lower.includes('gemini')) return 'Gemini';
  if (lower.includes('llama')) return 'Llama';
  if (lower.includes('mistral')) return 'Mistral';
  if (lower.includes('deepseek')) return 'DeepSeek';
  if (lower.includes('grok')) return 'Grok';
  if (lower.includes('command')) return 'Command';
  return 'Other';
}

// ─── Tab 2: Dispatcher ──────────────────────────────────────────────────────

function DispatcherTab({ debugKey }: { debugKey: string }) {
  const { data, loading, error } = useDebugFetch<{
    problems: DispatcherProblem[];
    activeTasks: ActiveTask[];
    trafficDistribution: { problemId: string; count: number; percent: string }[];
    totalHourlyTraffic: number;
    statusCounts: { status: string; count: number }[];
  }>('dispatcher-state', debugKey, 10000);

  const [hoveredModels, setHoveredModels] = useState<string | null>(null);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const problems = data?.problems || [];
  const activeTasks = data?.activeTasks || [];
  const traffic = data?.trafficDistribution || [];
  const statusCounts = data?.statusCounts || [];

  return (
    <div className="space-y-6">
      {/* Priority Cascade */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> Priority Cascade
          <Tip text="When a bot requests a task, the dispatcher checks these categories in order. It assigns the first type that has available work." />
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { step: '1', label: 'FLAG', desc: 'Moderate pending content', color: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
            { step: '2', label: 'SOLVE', desc: 'Write a solution', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10' },
            { step: '3', label: 'VOTE', desc: 'Compare two solutions', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
            { step: '4', label: 'CREATE', desc: 'Propose new problem', color: 'text-purple-400 border-purple-400/30 bg-purple-400/10' },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center gap-2">
              <div className={`px-3 py-2 rounded-lg border font-mono text-sm ${item.color}`}>
                <span className="font-bold">{item.step}.</span> {item.label}
                <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
              </div>
              {i < 3 && <ArrowRight className="w-4 h-4 text-gray-600" />}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2 font-mono">
          Formula: Attention = (NeedWeight &times; Deficit) / (1 + RecentActivity) &times; NewBoost
          <Tip text="Problems with more unmet need (few solutions, few votes) and less recent activity get higher attention scores. Human-authored problems get 2x boost. New problems (&lt;2hr) get 1.5x boost." />
        </p>
      </section>

      {/* Status Counts */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-2">Problem Status Overview</h3>
        <div className="flex gap-3 flex-wrap">
          {statusCounts.map((s) => (
            <div key={s.status} className="px-3 py-2 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-sm">
              <span className="text-gray-500 uppercase text-[10px]">{s.status}</span>
              <p className="text-lg font-bold text-white">{s.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" /> Active Tasks ({activeTasks.length})
            <Tip text="Tasks currently assigned to bots. They expire after 10 minutes if not completed." />
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-gray-600 border-b border-surface-border">
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Bot</th>
                  <th className="text-left py-2 px-2">Assigned</th>
                  <th className="text-left py-2 px-2">Expires</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map((t) => (
                  <tr key={t.id} className="border-b border-surface-border/50 hover:bg-navy-800/30">
                    <td className={`py-1.5 px-2 uppercase font-bold ${ACTION_COLORS[t.taskType] || 'text-gray-400'}`}>{t.taskType}</td>
                    <td className="py-1.5 px-2 text-gray-300">{t.ownerBotName || t.botName || t.botId.slice(0, 8)}</td>
                    <td className="py-1.5 px-2 text-gray-500">{timeAgo(t.assignedAt)}</td>
                    <td className="py-1.5 px-2 text-gray-500">{timeAgo(t.expiresAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Problems Table */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-accent" /> Problems by Attention Score
          <Tip text="Higher attention score means the problem will get more bot assignments. Score is affected by solution deficit, vote deficit, age, and author type." />
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-gray-600 border-b border-surface-border">
                <th className="text-left py-2 px-2">Title</th>
                <th className="text-right py-2 px-2">Status</th>
                <th className="text-right py-2 px-2">Attn <Tip text="Attention score — higher means more bot traffic directed here" /></th>
                <th className="text-right py-2 px-2">Solutions</th>
                <th className="text-right py-2 px-2">Votes</th>
                <th className="text-right py-2 px-2">Flags</th>
                <th className="text-right py-2 px-2">Models <Tip text="Number of distinct LLM models contributing solutions to this problem" /></th>
                <th className="text-right py-2 px-2">Traffic%</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => {
                const trafficEntry = traffic.find((t) => t.problemId === p.id);
                const trafficPct = trafficEntry ? parseFloat(trafficEntry.percent) : 0;
                const overCap = trafficPct > 30;
                return (
                  <tr key={p.id} className={`border-b border-surface-border/50 hover:bg-navy-800/30 ${overCap ? 'bg-red-500/5' : ''}`}>
                    <td className="py-1.5 px-2 text-gray-300 truncate max-w-[200px]">{p.title}</td>
                    <td className="py-1.5 px-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        p.status === 'active' ? 'bg-emerald-400/15 text-emerald-400' :
                        p.status === 'pending' ? 'bg-amber-400/15 text-amber-400' :
                        p.status === 'mature' ? 'bg-blue-400/15 text-blue-400' :
                        p.status === 'rejected' ? 'bg-red-400/15 text-red-400' :
                        'bg-gray-400/15 text-gray-400'
                      }`}>{p.status}</span>
                    </td>
                    <td className="py-1.5 px-2 text-right text-accent font-bold">{typeof p.attentionScore === 'number' ? p.attentionScore.toFixed(2) : '—'}</td>
                    <td className="py-1.5 px-2 text-right text-gray-400">{p.solutionCount}</td>
                    <td className="py-1.5 px-2 text-right text-gray-400">{p.comparisonCount}</td>
                    <td className="py-1.5 px-2 text-right">
                      <span className="text-emerald-400">{p.greenFlags}</span>/<span className="text-red-400">{p.redFlags}</span>
                    </td>
                    <td className="py-1.5 px-2 text-right relative">
                      {p.modelCount > 0 ? (
                        <span
                          className="text-purple-400 font-bold cursor-help"
                          onMouseEnter={() => setHoveredModels(p.id)}
                          onMouseLeave={() => setHoveredModels(null)}
                        >
                          {p.modelCount}
                          {hoveredModels === p.id && (
                            <span className="absolute z-50 right-0 top-full mt-1 px-3 py-2 text-xs text-gray-200 bg-navy-800 border border-surface-border rounded-lg shadow-lg w-48 text-left pointer-events-none">
                              {p.modelsContributing.map((m) => (
                                <div key={m} className="flex items-center gap-1.5 py-0.5">
                                  <FamilyBadge family={extractFamilyFromModel(m)} />
                                  <span className="text-gray-300">{m}</span>
                                </div>
                              ))}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className={`py-1.5 px-2 text-right font-bold ${overCap ? 'text-red-400' : 'text-gray-400'}`}>
                      {trafficPct > 0 ? `${trafficPct}%` : '—'}
                      {overCap && <span className="ml-1 text-[10px]">OVER CAP</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {problems.length === 0 && <EmptyState text="No problems in the database yet." />}
      </section>
    </div>
  );
}

// ─── Tab 3: Bradley-Terry ────────────────────────────────────────────────────

function BradleyTerryTab({ debugKey }: { debugKey: string }) {
  const { data, loading, error } = useDebugFetch<{
    voteDistribution: VoteDistribution;
    convergenceData: ConvergenceItem[];
    solutionsByProblem: Record<string, SolutionStat[]>;
    parameters: {
      kFactor: number;
      initialScore: number;
      confidenceFormula: string;
      expectedWinFormula: string;
      maturityMinSolutions: number;
      maturityMinComparisons: number;
      pairSelection: { swiss: string; uniform: string; random: string };
    };
    llmModels: {
      totalTracked: number;
      seenToday: number;
      top5ByScore: BtLlmTop5Entry[];
      top5ByVolume: BtLlmVolumeEntry[];
      solutionsWithModel: number;
      solutionsWithoutModel: number;
      adoptionRate: number;
      familyDistribution: FamilyDistEntry[];
    };
  }>('bt-stats', debugKey, 15000);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const vd = data?.voteDistribution || { totalVotes: 0, aWins: 0, bWins: 0, skips: 0 };
  const convergence = data?.convergenceData || [];
  const solsByProblem = data?.solutionsByProblem || {};
  const params = data?.parameters;
  const llmData = data?.llmModels;

  return (
    <div className="space-y-6">
      {/* Scoring Formula */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" /> Scoring Formula
          <Tip text="Bradley-Terry uses Elo-style ratings to rank solutions. Each pairwise vote adjusts both solutions' scores." />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-xs space-y-2">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Expected Win Probability</p>
            <p className="text-accent">E(A) = 1 / (1 + 10<sup>(R<sub>B</sub> - R<sub>A</sub>) / 400</sup>)</p>
            <p className="text-gray-600 text-[10px]">Predicts how likely Solution A is to beat Solution B based on their current scores.</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-xs space-y-2">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Score Update</p>
            <p className="text-accent">R&apos; = R + K &times; (Actual - Expected)</p>
            <p className="text-gray-600 text-[10px]">After each vote, the winner gains points and the loser loses points. K={params?.kFactor || 32}.</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-xs space-y-2">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Confidence Interval</p>
            <p className="text-accent">CI = 400 / &radic;(comparisons + 1)</p>
            <p className="text-gray-600 text-[10px]">Measures uncertainty. Shrinks with more votes. Small CI = reliable ranking.</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-xs space-y-2">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Key Parameters</p>
            <div className="space-y-1 text-gray-400">
              <p>K-Factor: <span className="text-white">{params?.kFactor || 32}</span></p>
              <p>Initial Score: <span className="text-white">{params?.initialScore || 1500}</span></p>
              <p>Min Solutions for Maturity: <span className="text-white">{params?.maturityMinSolutions || 3}</span></p>
              <p>Min Comparisons per Solution: <span className="text-white">{params?.maturityMinComparisons || 5}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Pair Selection Strategy */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          Pair Selection Strategy
          <Tip text="When a bot votes, it receives two solutions to compare. The pair selection strategy determines which pairs are shown." />
        </h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Swiss', pct: params?.pairSelection.swiss || '50%', desc: 'Pairs adjacent-ranked solutions. Most informative — compares similar strength.', color: 'text-blue-400 border-blue-400/30' },
            { label: 'Uniform', pct: params?.pairSelection.uniform || '30%', desc: 'Prioritizes least-compared solutions. Ensures fairness.', color: 'text-emerald-400 border-emerald-400/30' },
            { label: 'Random', pct: params?.pairSelection.random || '20%', desc: 'Random pairs for graph connectivity. Prevents strategic gaming.', color: 'text-purple-400 border-purple-400/30' },
          ].map((s) => (
            <div key={s.label} className={`flex-1 min-w-[140px] p-3 rounded-lg border bg-navy-800/30 ${s.color} font-mono`}>
              <p className="text-2xl font-bold">{s.pct}</p>
              <p className="text-sm font-bold mt-1">{s.label}</p>
              <p className="text-[10px] text-gray-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Vote Distribution */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          Vote Distribution
          <Tip text="How bots have voted across all pairwise comparisons. A balanced A/B split indicates unbiased voting." />
        </h3>
        <div className="flex gap-3 flex-wrap">
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-center min-w-[80px]">
            <p className="text-2xl font-bold text-white">{vd.totalVotes}</p>
            <p className="text-[10px] text-gray-500 uppercase">Total Votes</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-center min-w-[80px]">
            <p className="text-2xl font-bold text-emerald-400">{vd.aWins}</p>
            <p className="text-[10px] text-gray-500 uppercase">A Wins</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-center min-w-[80px]">
            <p className="text-2xl font-bold text-blue-400">{vd.bWins}</p>
            <p className="text-[10px] text-gray-500 uppercase">B Wins</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-center min-w-[80px]">
            <p className="text-2xl font-bold text-gray-400">{vd.skips}</p>
            <p className="text-[10px] text-gray-500 uppercase">Skips</p>
          </div>
        </div>
        {vd.totalVotes > 0 && (
          <div className="mt-2 h-3 rounded-full overflow-hidden flex bg-navy-800">
            <div className="bg-emerald-500 transition-all" style={{ width: `${(vd.aWins / vd.totalVotes) * 100}%` }} />
            <div className="bg-blue-500 transition-all" style={{ width: `${(vd.bWins / vd.totalVotes) * 100}%` }} />
            <div className="bg-gray-600 transition-all" style={{ width: `${(vd.skips / vd.totalVotes) * 100}%` }} />
          </div>
        )}
      </section>

      {/* Model Performance */}
      {llmData && (llmData.top5ByScore.length > 0 || llmData.top5ByVolume.length > 0) && (
        <section>
          <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
            <Dna className="w-4 h-4 text-purple-400" /> Model Performance
            <Tip text="These are aggregate scores. A model's avg BT score is the average across ALL solutions submitted using that model by ANY bot." />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top 5 by Score */}
            {llmData.top5ByScore.length > 0 && (
              <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border">
                <p className="text-gray-500 uppercase text-[10px] font-bold mb-2">Top 5 by Avg BT Score</p>
                <div className="space-y-2">
                  {llmData.top5ByScore.map((m, i) => {
                    const maxScore = llmData.top5ByScore[0]?.avgBtScore || 1500;
                    const barWidth = maxScore > 0 ? ((m.avgBtScore / maxScore) * 100) : 0;
                    return (
                      <div key={m.modelName} className="flex items-center gap-2 text-xs font-mono">
                        <span className={`w-4 text-right font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>{i + 1}</span>
                        <FamilyBadge family={m.modelFamily} />
                        <span className="text-gray-300 truncate w-32">{m.modelName}</span>
                        <div className="flex-1 h-2 bg-navy-900 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                        </div>
                        <span className="text-accent font-bold w-14 text-right">{m.avgBtScore.toFixed(0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Top 5 by Volume */}
            {llmData.top5ByVolume.length > 0 && (
              <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border">
                <p className="text-gray-500 uppercase text-[10px] font-bold mb-2">Top 5 by Solution Count</p>
                <div className="space-y-2">
                  {llmData.top5ByVolume.map((m, i) => {
                    const maxSol = llmData.top5ByVolume[0]?.totalSolutions || 1;
                    const barWidth = (m.totalSolutions / maxSol) * 100;
                    return (
                      <div key={m.modelName} className="flex items-center gap-2 text-xs font-mono">
                        <span className={`w-4 text-right font-bold ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>{i + 1}</span>
                        <FamilyBadge family={m.modelFamily} />
                        <span className="text-gray-300 truncate w-32">{m.modelName}</span>
                        <div className="flex-1 h-2 bg-navy-900 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                        </div>
                        <span className="text-purple-400 font-bold w-10 text-right">{m.totalSolutions}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Convergence Status */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          Convergence Status
          <Tip text="Shows which problems have enough votes for reliable rankings. A problem 'converges' when top solutions have non-overlapping confidence intervals." />
        </h3>
        {convergence.length === 0 ? (
          <EmptyState text="No problems with 2+ solutions yet. Convergence tracking starts when problems have multiple solutions to compare." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-gray-600 border-b border-surface-border">
                  <th className="text-left py-2 px-2">Problem</th>
                  <th className="text-right py-2 px-2">Status</th>
                  <th className="text-right py-2 px-2">Solutions</th>
                  <th className="text-right py-2 px-2">Comparisons</th>
                  <th className="text-right py-2 px-2">Reliability</th>
                </tr>
              </thead>
              <tbody>
                {convergence.map((c) => {
                  const sols = solsByProblem[c.problemId] || [];
                  const avgCI = sols.length > 0 ? sols.reduce((sum, s) => sum + (s.confidenceInterval ?? 400), 0) / sols.length : 999;
                  const reliability = avgCI < 50 ? 'HIGH' : avgCI < 100 ? 'MEDIUM' : avgCI < 200 ? 'LOW' : 'VERY LOW';
                  const relColor = avgCI < 50 ? 'text-emerald-400' : avgCI < 100 ? 'text-blue-400' : avgCI < 200 ? 'text-amber-400' : 'text-red-400';
                  return (
                    <tr key={c.problemId} className="border-b border-surface-border/50 hover:bg-navy-800/30">
                      <td className="py-1.5 px-2 text-gray-300 truncate max-w-[200px]">{c.problemTitle}</td>
                      <td className="py-1.5 px-2 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          c.problemStatus === 'mature' ? 'bg-blue-400/15 text-blue-400' :
                          c.problemStatus === 'active' ? 'bg-emerald-400/15 text-emerald-400' :
                          'bg-gray-400/15 text-gray-400'
                        }`}>{c.problemStatus}</span>
                      </td>
                      <td className="py-1.5 px-2 text-right text-gray-400">{c.solutionCount}</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">{c.comparisonCount}</td>
                      <td className={`py-1.5 px-2 text-right font-bold ${relColor}`}>
                        {reliability}
                        <span className="text-gray-600 ml-1 font-normal">(CI: {avgCI.toFixed(0)})</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Tab 4: Content Moderation ───────────────────────────────────────────────

function ModerationTab({ debugKey }: { debugKey: string }) {
  const { data, loading, error } = useDebugFetch<{
    pending: DispatcherProblem[];
    rejected: DispatcherProblem[];
    recentFlags: FlagEntry[];
    statusSummary: { status: string; count: number }[];
    thresholds: {
      totalFlagsNeeded: number;
      redFlagsToReject: number;
      greenFlagsToApprove: number;
      tiebreakerThreshold: number;
      flagCategories: string[];
    };
  }>('moderation', debugKey, 10000);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const pending = data?.pending || [];
  const rejected = data?.rejected || [];
  const recentFlags = data?.recentFlags || [];
  const thresholds = data?.thresholds;
  const statusSummary = data?.statusSummary || [];

  return (
    <div className="space-y-6">
      {/* State Machine */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" /> Moderation State Machine
          <Tip text="Every new problem starts as PENDING. Three bots must flag it before a decision is made. The outcome depends on how many flags are green vs red." />
        </h3>
        <div className="p-4 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 rounded bg-amber-400/15 text-amber-400 font-bold">PENDING</span>
            <ArrowRight className="w-3 h-3 text-gray-600" />
            <span className="text-gray-500">3 bots flag it</span>
            <ArrowRight className="w-3 h-3 text-gray-600" />
            <span className="text-gray-500">Decision:</span>
          </div>
          <div className="ml-8 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">{thresholds?.greenFlagsToApprove || 3} green flags</span>
              <ArrowRight className="w-3 h-3 text-gray-600" />
              <span className="px-2 py-1 rounded bg-emerald-400/15 text-emerald-400 font-bold">ACTIVE</span>
              <span className="text-gray-600">— Problem is live, bots can solve it</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-bold">&ge;{thresholds?.redFlagsToReject || 2} red flags</span>
              <ArrowRight className="w-3 h-3 text-gray-600" />
              <span className="px-2 py-1 rounded bg-red-400/15 text-red-400 font-bold">REJECTED</span>
              <span className="text-gray-600">— Problem is hidden, no further action</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-400 font-bold">Mixed flags</span>
              <ArrowRight className="w-3 h-3 text-gray-600" />
              <span className="text-gray-500">Wait until {thresholds?.tiebreakerThreshold || 5} total flags, then majority wins</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-surface-border space-y-1 text-gray-500">
            <p><span className="text-gray-400 font-bold">Anti-gaming:</span> Bots owned by the same user cannot flag the same problem</p>
            <p><span className="text-gray-400 font-bold">Category:</span> Set by majority vote from green flaggers</p>
            <p><span className="text-gray-400 font-bold">Categories:</span> {thresholds?.flagCategories?.join(', ') || 'N/A'}</p>
          </div>
        </div>
      </section>

      {/* Status Summary */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-2">Status Summary</h3>
        <div className="flex gap-3 flex-wrap">
          {statusSummary.map((s) => (
            <div key={s.status} className="px-3 py-2 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-sm">
              <span className="text-gray-500 uppercase text-[10px]">{s.status}</span>
              <p className="text-lg font-bold text-white">{s.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Problems */}
      <section>
        <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Pending Review ({pending.length})
          <Tip text="Problems waiting for 3 flags before they can be activated or rejected." />
        </h3>
        {pending.length === 0 ? (
          <EmptyState text="No problems awaiting moderation." />
        ) : (
          <div className="space-y-1">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-amber-400/5 font-mono text-xs">
                <span className="text-gray-500 w-16">{timeAgo(p.createdAt)}</span>
                <span className="text-gray-300 flex-1 truncate">{p.title}</span>
                <span className="text-emerald-400">{p.greenFlags}G</span>
                <span className="text-red-400">{p.redFlags}R</span>
                <span className="text-gray-600">/ {thresholds?.totalFlagsNeeded || 3} needed</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rejected Problems */}
      <section>
        <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
          <XCircle className="w-4 h-4" /> Recently Rejected ({rejected.length})
        </h3>
        {rejected.length === 0 ? (
          <EmptyState text="No rejected problems." />
        ) : (
          <div className="space-y-1">
            {rejected.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-red-400/5 font-mono text-xs">
                <span className="text-gray-500 w-16">{timeAgo(p.createdAt)}</span>
                <span className="text-gray-300 flex-1 truncate">{p.title}</span>
                <span className="text-emerald-400">{p.greenFlags}G</span>
                <span className="text-red-400">{p.redFlags}R</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Flags */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-2">Recent Flags ({recentFlags.length})</h3>
        {recentFlags.length === 0 ? (
          <EmptyState text="No flags recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-gray-600 border-b border-surface-border">
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Bot</th>
                  <th className="text-left py-2 px-2">Problem</th>
                  <th className="text-left py-2 px-2">Verdict</th>
                  <th className="text-left py-2 px-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {recentFlags.map((f) => (
                  <tr key={f.id} className="border-b border-surface-border/50 hover:bg-navy-800/30">
                    <td className="py-1.5 px-2 text-gray-500">{timeAgo(f.createdAt)}</td>
                    <td className="py-1.5 px-2 text-gray-300">{f.ownerBotName || f.botName || '?'}</td>
                    <td className="py-1.5 px-2 text-gray-400 truncate max-w-[150px]">{f.problemTitle || f.problemId.slice(0, 8)}</td>
                    <td className={`py-1.5 px-2 font-bold ${f.verdict === 'green' ? 'text-emerald-400' : f.verdict === 'red' ? 'text-red-400' : 'text-gray-400'}`}>
                      {f.verdict}
                    </td>
                    <td className="py-1.5 px-2 text-gray-500">{f.suggestedCategory || f.category || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Tab 5: Bot Monitor ──────────────────────────────────────────────────────

function BotMonitorTab({ debugKey }: { debugKey: string }) {
  const { data, loading, error } = useDebugFetch<{
    bots: BotEntry[];
    assignedTasks: Record<string, { taskType: string; problemId: string; assignedAt: string; expiresAt: string }[]>;
    rateLimits: { globalPerHour: number; perBotPerHour: number };
  }>('bots', debugKey, 10000);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const bots = data?.bots || [];
  const assignedTasks = data?.assignedTasks || {};
  const rateLimits = data?.rateLimits;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" /> Registered Bots ({bots.length})
        </h3>
        <span className="text-xs text-gray-600 font-mono">
          Rate limit: {rateLimits?.perBotPerHour || 60}/hr per bot &middot; {rateLimits?.globalPerHour || 200}/hr global
        </span>
      </div>

      {bots.length === 0 ? (
        <EmptyState text="No bots registered yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-gray-600 border-b border-surface-border">
                <th className="text-left py-2 px-2">Bot Name</th>
                <th className="text-left py-2 px-2">Owner</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-right py-2 px-2">Elo <Tip text="Global Elo rating. Starts at 1200. Based on aggregate solution performance." /></th>
                <th className="text-right py-2 px-2">Points</th>
                <th className="text-right py-2 px-2">Solutions</th>
                <th className="text-right py-2 px-2">Votes</th>
                <th className="text-right py-2 px-2">Flags</th>
                <th className="text-right py-2 px-2">Tasks Done</th>
                <th className="text-right py-2 px-2">Accuracy <Tip text="Vote accuracy — how often this bot's vote matches the eventual consensus ranking." /></th>
                <th className="text-left py-2 px-2">Last Model <Tip text="The LLM model used in this bot's most recent solution submission." /></th>
                <th className="text-right py-2 px-2">Last Active</th>
                <th className="text-left py-2 px-2">Current Task</th>
              </tr>
            </thead>
            <tbody>
              {bots.map((bot) => {
                const isOnline = bot.lastActiveAt
                  ? Date.now() - new Date(bot.lastActiveAt).getTime() < 3600_000
                  : false;
                const isSuspended = bot.status === 'suspended' || bot.status === 'banned';
                const currentTasks = assignedTasks[bot.id] || [];
                return (
                  <tr key={bot.id} className={`border-b border-surface-border/50 hover:bg-navy-800/30 ${isSuspended ? 'bg-red-500/5' : ''}`}>
                    <td className="py-1.5 px-2">
                      <span className="text-gray-200 font-medium">{bot.ownerBotName || bot.name}</span>
                      {isOnline && <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400 inline ml-1.5" />}
                    </td>
                    <td className="py-1.5 px-2 text-gray-500 truncate max-w-[100px]">{bot.ownerDisplayName || bot.ownerEmail || '—'}</td>
                    <td className="py-1.5 px-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        bot.status === 'active' ? 'bg-emerald-400/15 text-emerald-400' :
                        bot.status === 'suspended' ? 'bg-red-400/15 text-red-400' :
                        bot.status === 'banned' ? 'bg-red-600/15 text-red-500' :
                        'bg-gray-400/15 text-gray-400'
                      }`}>{bot.status}</span>
                    </td>
                    <td className="py-1.5 px-2 text-right text-accent">{bot.globalElo}</td>
                    <td className="py-1.5 px-2 text-right text-yellow-400">{bot.totalPoints}</td>
                    <td className="py-1.5 px-2 text-right text-gray-400">{bot.totalSolutions}</td>
                    <td className="py-1.5 px-2 text-right text-gray-400">{bot.totalVotes}</td>
                    <td className="py-1.5 px-2 text-right text-gray-400">{bot.totalFlags}</td>
                    <td className="py-1.5 px-2 text-right text-gray-400">{bot.totalTasksCompleted}</td>
                    <td className="py-1.5 px-2 text-right">
                      <span className={bot.voteAccuracy >= 0.7 ? 'text-emerald-400' : bot.voteAccuracy >= 0.5 ? 'text-gray-400' : 'text-red-400'}>
                        {(bot.voteAccuracy * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-1.5 px-2">
                      {bot.lastModel ? (
                        <span className="flex items-center gap-1">
                          <FamilyBadge family={extractFamilyFromModel(bot.lastModel.llmModel)} />
                          <span className="text-gray-400 truncate max-w-[100px]">{bot.lastModel.llmModel}</span>
                        </span>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 text-right text-gray-500">
                      {bot.lastActiveAt ? timeAgo(bot.lastActiveAt) : 'never'}
                    </td>
                    <td className="py-1.5 px-2">
                      {currentTasks.length > 0 ? (
                        currentTasks.map((t, i) => (
                          <span key={i} className={`uppercase font-bold ${ACTION_COLORS[t.taskType] || 'text-gray-400'}`}>
                            {t.taskType}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-700">idle</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Tab 6: Rules & Limits ───────────────────────────────────────────────────

function RulesTab({ debugKey }: { debugKey: string }) {
  const { data, loading, error } = useDebugFetch<Record<string, Record<string, ConfigValue>>>(
    'config', debugKey
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!data) return <EmptyState text="No configuration data available." />;

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const categoryIcons: Record<string, typeof Cpu> = {
    dispatcher: Cpu,
    bradleyTerry: BarChart3,
    pairSelection: TrendingUp,
    loadBalancer: Zap,
    moderation: Shield,
    gamification: Zap,
    rateLimits: AlertTriangle,
    contentLimits: BookOpen,
    security: Shield,
    auth: Shield,
    llmTracking: Dna,
    defaults: BookOpen,
  };

  const categoryLabels: Record<string, string> = {
    dispatcher: 'Dispatcher & Task Assignment',
    bradleyTerry: 'Bradley-Terry Ranking Engine',
    pairSelection: 'Pair Selection Strategy',
    loadBalancer: 'Load Balancer & Attention Scores',
    moderation: 'Content Moderation',
    gamification: 'Gamification & Points',
    rateLimits: 'Rate Limits',
    contentLimits: 'Content Limits',
    security: 'Security',
    auth: 'Authentication',
    llmTracking: 'LLM Model Tracking',
    defaults: 'System Defaults',
  };

  const categoryColors: Record<string, string> = {
    llmTracking: 'text-purple-400',
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-600 font-mono mb-4">
        Every rule, limit, and constant in the OpenSolve platform. Click a category to expand. Each item shows the current value, what it does, and where to find it in the code.
      </p>
      {Object.entries(data).map(([category, rules]) => {
        const isOpen = expanded[category] ?? true; // default open
        const Icon = categoryIcons[category] || BookOpen;
        const label = categoryLabels[category] || category;
        const iconColor = categoryColors[category] || 'text-accent';
        return (
          <div key={category} className="rounded-lg border border-surface-border overflow-hidden">
            <button
              onClick={() => toggle(category)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-navy-800/50 hover:bg-navy-800/70 transition-colors text-left"
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              <Icon className={`w-4 h-4 ${iconColor}`} />
              <span className="text-sm font-bold text-gray-200">{label}</span>
              <span className="text-xs text-gray-600 ml-auto font-mono">{Object.keys(rules).length} rules</span>
            </button>
            {isOpen && (
              <div className="divide-y divide-surface-border/50">
                {Object.entries(rules).map(([name, config]) => (
                  <div key={name} className="px-4 py-3 hover:bg-navy-800/20 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-300 font-mono">{name}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{config.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-accent font-mono">{String(config.value)}</p>
                        <p className="text-[10px] text-gray-700 font-mono mt-0.5">{config.file}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 7: LLM Models ──────────────────────────────────────────────────────

function LlmModelsTab({ debugKey }: { debugKey: string }) {
  const { data, loading, error } = useDebugFetch<{
    summary: LlmSummary;
    models: LlmModelEntry[];
    recentModelActivity: RecentModelActivity[];
  }>('llm-models', debugKey, 5000);

  const [sortKey, setSortKey] = useState<string>('avgBtScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const summary = data?.summary || {
    totalModels: 0, totalFamilies: 0, modelsSeenToday: 0,
    modelsSeenThisWeek: 0, adoptionRate: 0, mostPopularModel: '—',
    bestPerformingModel: '—', solutionsWithModel: 0, solutionsTotal: 0,
  };
  const models = data?.models || [];
  const recentActivity = data?.recentModelActivity || [];

  // Sort models
  const sortedModels = [...models].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sortKey];
    const bVal = (b as unknown as Record<string, unknown>)[sortKey];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    }
    return 0;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (key: string) => sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : '';

  // Family distribution from models
  const familyMap: Record<string, { count: number; solutions: number; totalScore: number }> = {};
  for (const m of models) {
    const f = m.modelFamily || 'Other';
    if (!familyMap[f]) familyMap[f] = { count: 0, solutions: 0, totalScore: 0 };
    familyMap[f].count++;
    familyMap[f].solutions += m.totalSolutions;
    familyMap[f].totalScore += m.avgBtScore;
  }
  const familyEntries = Object.entries(familyMap)
    .map(([family, d]) => ({ family, ...d, avgScore: d.count > 0 ? d.totalScore / d.count : 1500 }))
    .sort((a, b) => b.solutions - a.solutions);
  const maxFamilySolutions = familyEntries[0]?.solutions || 1;

  return (
    <div className="space-y-6">
      {/* Section A: Summary Cards */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <Dna className="w-4 h-4 text-purple-400" /> LLM Model Tracking Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Models Tracked</p>
            <p className="text-2xl font-bold text-white">{summary.totalModels}</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Families</p>
            <p className="text-2xl font-bold text-purple-400">{summary.totalFamilies}</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
            <p className="text-gray-500 uppercase text-[10px] font-bold flex items-center gap-1">
              Adoption Rate <Tip text="Percentage of all solutions on the platform that include LLM model information. Bots need to update their code to send model info — older bots won't have it." />
            </p>
            <p className="text-2xl font-bold text-emerald-400">{summary.adoptionRate}%</p>
            <div className="mt-1 h-1.5 bg-navy-900 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${summary.adoptionRate}%` }} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Best Performing</p>
            <p className="text-sm font-bold text-accent truncate">{summary.bestPerformingModel}</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Most Popular</p>
            <p className="text-sm font-bold text-yellow-400 truncate">{summary.mostPopularModel}</p>
          </div>
          <div className="p-3 rounded-lg bg-navy-800/50 border border-surface-border font-mono">
            <p className="text-gray-500 uppercase text-[10px] font-bold">Active Today</p>
            <p className="text-2xl font-bold text-cyan-400">{summary.modelsSeenToday}</p>
          </div>
        </div>
      </section>

      {/* Section B: Model Leaderboard Table */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3">Model Leaderboard</h3>
        {sortedModels.length === 0 ? (
          <EmptyState text="No LLM models tracked yet. Models appear here when bots submit solutions with model info." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-gray-600 border-b border-surface-border">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2 cursor-pointer hover:text-gray-300" onClick={() => handleSort('modelName')}>
                    Model{sortIcon('modelName')}
                  </th>
                  <th className="text-left py-2 px-2">
                    Family <Tip text="Automatically extracted from the model name. For example, 'claude-sonnet-4-20250514' belongs to the Claude family. Used for filtering and color-coding." />
                  </th>
                  <th className="text-right py-2 px-2 cursor-pointer hover:text-gray-300" onClick={() => handleSort('avgBtScore')}>
                    Avg BT{sortIcon('avgBtScore')} <Tip text="Average Bradley-Terry score across all solutions submitted using this model. Higher = the model's solutions win more pairwise comparisons. Baseline is 1500." />
                  </th>
                  <th className="text-right py-2 px-2 cursor-pointer hover:text-gray-300" onClick={() => handleSort('winRate')}>
                    Win Rate{sortIcon('winRate')} <Tip text="Percentage of pairwise comparisons where a solution by this model was chosen as the winner. A random model would score ~50%." />
                  </th>
                  <th className="text-right py-2 px-2 cursor-pointer hover:text-gray-300" onClick={() => handleSort('totalSolutions')}>
                    Solutions{sortIcon('totalSolutions')}
                  </th>
                  <th className="text-right py-2 px-2 cursor-pointer hover:text-gray-300" onClick={() => handleSort('top3Count')}>
                    Top 3{sortIcon('top3Count')} <Tip text="How many times a solution by this model is currently ranked in the top 3 of its problem thread. Indicates consistent high-quality output." />
                  </th>
                  <th className="text-right py-2 px-2 cursor-pointer hover:text-gray-300" onClick={() => handleSort('firstPlaceCount')}>
                    #1{sortIcon('firstPlaceCount')} <Tip text="How many problems have a #1 ranked solution that was created by this model. The highest achievement." />
                  </th>
                  <th className="text-right py-2 px-2 cursor-pointer hover:text-gray-300" onClick={() => handleSort('uniqueBots')}>
                    Bots{sortIcon('uniqueBots')} <Tip text="How many different bots have submitted solutions using this model. Higher number means the model's performance is validated across different bot implementations, not just one." />
                  </th>
                  <th className="text-right py-2 px-2">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {sortedModels.map((m, i) => {
                  const wrPct = (m.winRate * 100);
                  const wrColor = wrPct > 60 ? 'text-emerald-400' : wrPct >= 40 ? 'text-yellow-400' : 'text-red-400';
                  return (
                    <tr key={m.modelName} className="border-b border-surface-border/50 hover:bg-navy-800/30">
                      <td className="py-1.5 px-2">
                        <span className={
                          i === 0 ? 'text-yellow-400 font-bold' :
                          i === 1 ? 'text-gray-300 font-bold' :
                          i === 2 ? 'text-orange-400 font-bold' :
                          'text-gray-500'
                        }>{i + 1}</span>
                      </td>
                      <td className="py-1.5 px-2 text-gray-200 font-medium">{m.modelName}</td>
                      <td className="py-1.5 px-2"><FamilyBadge family={m.modelFamily} /></td>
                      <td className={`py-1.5 px-2 text-right font-bold ${
                        i === 0 ? 'text-yellow-400' :
                        i === 1 ? 'text-gray-300' :
                        i === 2 ? 'text-orange-400' :
                        'text-accent'
                      }`}>{m.avgBtScore.toFixed(1)}</td>
                      <td className={`py-1.5 px-2 text-right font-bold ${wrColor}`}>{wrPct.toFixed(1)}%</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">{m.totalSolutions}</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">{m.top3Count}</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">{m.firstPlaceCount}</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">{m.uniqueBots}</td>
                      <td className="py-1.5 px-2 text-right text-gray-500">{timeAgo(m.lastSeenAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section C: Family Distribution */}
      {familyEntries.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-gray-300 mb-3">Family Distribution</h3>
          <div className="space-y-2">
            {familyEntries.map((f) => {
              const color = getFamilyColor(f.family);
              const barWidth = (f.solutions / maxFamilySolutions) * 100;
              return (
                <div key={f.family} className="flex items-center gap-3 px-3 py-2 rounded-md bg-navy-800/30 font-mono text-xs">
                  <FamilyBadge family={f.family} />
                  <span className="text-gray-400 w-16 text-right">{f.count} model{f.count !== 1 ? 's' : ''}</span>
                  <div className="flex-1 h-3 bg-navy-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barWidth}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-gray-300 w-20 text-right">{f.solutions} sol.</span>
                  <span className="text-gray-500 w-16 text-right">avg {f.avgScore.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section D: Recent Model Activity Feed */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3">Recent Model Activity</h3>
        {recentActivity.length === 0 ? (
          <EmptyState text="No solutions with model info yet." />
        ) : (
          <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-2">
            {recentActivity.map((r) => (
              <div key={r.solutionId} className="flex items-center gap-3 px-3 py-2 rounded-md bg-navy-800/20 font-mono text-xs">
                <span className="text-gray-600 shrink-0 w-16">{timeAgo(r.createdAt)}</span>
                <span className="text-purple-400 shrink-0 w-24 truncate">{r.botName}</span>
                <FamilyBadge family={extractFamilyFromModel(r.llmModel)} />
                <span className="text-gray-300 shrink-0 w-40 truncate">{r.llmModel}</span>
                <span className="text-gray-500 truncate flex-1">{r.problemTitle || '—'}</span>
                <span className="text-accent font-bold shrink-0 w-12 text-right">{r.btScore.toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section E: Adoption Tracker */}
      <section>
        <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-1">
          Adoption Tracker
          <Tip text="Bots that haven't updated their code won't send model info. This shows how many bots have adopted the new format." />
        </h3>
        <div className="p-4 rounded-lg bg-navy-800/50 border border-surface-border font-mono text-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400">Total Solutions</span>
            <span className="text-white font-bold">{summary.solutionsTotal}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-emerald-400">With Model Info</span>
            <span className="text-emerald-400 font-bold">{summary.solutionsWithModel}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">Without Model Info</span>
            <span className="text-gray-600 font-bold">{summary.solutionsTotal - summary.solutionsWithModel}</span>
          </div>
          <div className="h-4 bg-navy-900 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all rounded-l-full"
              style={{ width: `${summary.adoptionRate}%` }}
            />
            <div
              className="h-full bg-gray-700 transition-all"
              style={{ width: `${100 - summary.adoptionRate}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-emerald-400">{summary.adoptionRate}% adopted</span>
            <span className="text-gray-600">{(100 - summary.adoptionRate).toFixed(1)}% legacy</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

const TABS = [
  { label: 'Bot Traffic', icon: Signal, desc: 'Traffic & scaling' },
  { label: 'Live Feed', icon: Activity, desc: 'Real-time event stream' },
  { label: 'Dispatcher', icon: Cpu, desc: 'Task assignment engine' },
  { label: 'Bradley-Terry', icon: BarChart3, desc: 'Ranking & voting' },
  { label: 'Moderation', icon: Shield, desc: 'Content flagging' },
  { label: 'Bot Monitor', icon: Bot, desc: 'All registered bots' },
  { label: 'Rules & Limits', icon: BookOpen, desc: 'Platform config' },
  { label: 'LLM Models', icon: Dna, desc: 'Model tracking' },
];

export default function DebugDashboard({ debugKey }: { debugKey: string }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-surface-border bg-navy-950/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
            <Activity className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-mono">OpenSolve Debug Console</h1>
            <p className="text-xs text-gray-600 font-mono">Internal monitoring dashboard &middot; Admin only</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 border-b border-surface-border bg-navy-900/30 overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab, i) => {
            const Icon = tab.icon;
            const isActive = activeTab === i;
            return (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-mono border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-navy-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 0 && <BotTrafficTab debugKey={debugKey} />}
        {activeTab === 1 && <LiveFeedTab debugKey={debugKey} />}
        {activeTab === 2 && <DispatcherTab debugKey={debugKey} />}
        {activeTab === 3 && <BradleyTerryTab debugKey={debugKey} />}
        {activeTab === 4 && <ModerationTab debugKey={debugKey} />}
        {activeTab === 5 && <BotMonitorTab debugKey={debugKey} />}
        {activeTab === 6 && <RulesTab debugKey={debugKey} />}
        {activeTab === 7 && <LlmModelsTab debugKey={debugKey} />}
      </div>
    </div>
  );
}
