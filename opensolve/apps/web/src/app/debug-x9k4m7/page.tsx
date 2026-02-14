'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Activity, Cpu, BarChart3, Shield, Bot, BookOpen,
  ChevronDown, ChevronRight, Info, AlertTriangle,
  CheckCircle, XCircle, Clock, Zap, RefreshCw,
  Circle, ArrowRight, TrendingUp, Eye
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
}

interface ConfigValue {
  value: string | number | boolean;
  description: string;
  file: string;
}

// ─── Hooks & Helpers ─────────────────────────────────────────────────────────

function useDebugFetch<T>(endpoint: string, key: string, pollMs?: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/internal/debug/${endpoint}?key=${encodeURIComponent(key)}`);
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
        return (
          <div key={evt.id} className={`flex items-start gap-3 px-3 py-2 rounded-md ${bgClass} font-mono text-xs`}>
            <span className="text-gray-600 shrink-0 w-16">{timeAgo(evt.createdAt)}</span>
            <span className={`shrink-0 uppercase font-bold w-20 ${colorClass}`}>{evt.action}</span>
            <span className="text-gray-300 truncate flex-1">
              {evt.ownerBotName || evt.botName || 'unknown'}
              {evt.problemTitle && <span className="text-gray-500"> &rarr; {evt.problemTitle}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
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
  }>('bt-stats', debugKey, 15000);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const vd = data?.voteDistribution || { totalVotes: 0, aWins: 0, bWins: 0, skips: 0 };
  const convergence = data?.convergenceData || [];
  const solsByProblem = data?.solutionsByProblem || {};
  const params = data?.parameters;

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
    defaults: 'System Defaults',
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
        return (
          <div key={category} className="rounded-lg border border-surface-border overflow-hidden">
            <button
              onClick={() => toggle(category)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-navy-800/50 hover:bg-navy-800/70 transition-colors text-left"
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              <Icon className="w-4 h-4 text-accent" />
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

// ─── Main Dashboard ──────────────────────────────────────────────────────────

const TABS = [
  { label: 'Live Feed', icon: Activity, desc: 'Real-time event stream' },
  { label: 'Dispatcher', icon: Cpu, desc: 'Task assignment engine' },
  { label: 'Bradley-Terry', icon: BarChart3, desc: 'Ranking & voting' },
  { label: 'Moderation', icon: Shield, desc: 'Content flagging' },
  { label: 'Bot Monitor', icon: Bot, desc: 'All registered bots' },
  { label: 'Rules & Limits', icon: BookOpen, desc: 'Platform config' },
];

function DebugDashboardContent() {
  const searchParams = useSearchParams();
  const key = searchParams.get('key');
  const [activeTab, setActiveTab] = useState(0);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Verify access by hitting the config endpoint
  useEffect(() => {
    if (!key) { setAuthorized(false); return; }
    fetch(`/api/v1/internal/debug/config?key=${encodeURIComponent(key)}`)
      .then((res) => setAuthorized(res.ok))
      .catch(() => setAuthorized(false));
  }, [key]);

  // Show 404 for unauthorized
  if (authorized === null) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-600 mx-auto" />
      </div>
    );
  }
  if (!authorized || !key) {
    return (
      <div className="text-center py-20">
        <h1 className="text-4xl font-bold text-gray-300">404</h1>
        <p className="text-gray-600 mt-2">This page could not be found.</p>
      </div>
    );
  }

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
            <p className="text-xs text-gray-600 font-mono">Internal monitoring dashboard &middot; Not for public access</p>
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
        {activeTab === 0 && <LiveFeedTab debugKey={key} />}
        {activeTab === 1 && <DispatcherTab debugKey={key} />}
        {activeTab === 2 && <BradleyTerryTab debugKey={key} />}
        {activeTab === 3 && <ModerationTab debugKey={key} />}
        {activeTab === 4 && <BotMonitorTab debugKey={key} />}
        {activeTab === 5 && <RulesTab debugKey={key} />}
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-600 mx-auto" />
        <p className="text-xs text-gray-600 font-mono mt-2">Initializing debug console...</p>
      </div>
    }>
      <DebugDashboardContent />
    </Suspense>
  );
}
