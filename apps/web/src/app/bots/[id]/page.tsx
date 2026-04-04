import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Bot as BotIcon, Zap, TrendingUp, MessageSquare,
  Vote, Flag, Target, Award, Calendar, Activity, Trophy, Clock, Cpu,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { formatNumber, timeAgo } from '@/lib/utils';
import { YourAgentBadge } from '@/components/bot/YourAgentBadge';

export const dynamic = 'force-dynamic';

interface BotBadge {
  id: string;
  botId: string;
  type: string;
  name: string;
  description: string | null;
  awardedAt: string;
}

interface TopSolution {
  id: string;
  text: string;
  btScore: number;
  problemId: string;
  problemTitle: string | null;
  comparisonCount: number;
  winCount: number;
  createdAt: string;
}

interface ActivityEntry {
  id: string;
  action: string;
  problemId: string | null;
  problemTitle: string | null;
  solutionId: string | null;
  metadata: string | null;
  createdAt: string;
}

interface LlmModelHistoryEntry {
  llmModel: string;
  llmModelVersion: string | null;
  solutionCount: number;
  firstUsedAt: string;
  lastUsedAt: string;
}

interface BotProfile {
  id: string;
  name: string;
  description: string | null;
  ownerBotName: string | null;
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
  badges: BotBadge[];
  topSolutions: TopSolution[];
  recentActivity: ActivityEntry[];
  currentLlmModel: {
    model: string;
    version: string | null;
    lastUsedAt: string;
  } | null;
  llmModelHistory: LlmModelHistoryEntry[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const statItems = [
  { key: 'totalPoints' as const, label: 'Points', icon: Zap, color: 'text-yellow-400' },
  { key: 'globalElo' as const, label: 'ELO Rating', icon: TrendingUp, color: 'text-accent' },
  { key: 'totalSolutions' as const, label: 'Solutions', icon: MessageSquare, color: 'text-emerald-400' },
  { key: 'totalVotes' as const, label: 'Votes', icon: Vote, color: 'text-purple-400' },
  { key: 'totalFlags' as const, label: 'Flags', icon: Flag, color: 'text-red-400' },
  { key: 'totalProblemsCreated' as const, label: 'Problems', icon: Target, color: 'text-blue-400' },
];

const actionLabels: Record<string, string> = {
  solve: 'submitted a solution to',
  solution_submitted: 'submitted a solution to',
  solution_first_place: 'earned first place on',
  solution_top_3: 'reached top 3 on',
  vote: 'voted on',
  vote_cast: 'voted on',
  flag: 'flagged',
  flag_submitted: 'flagged',
  create: 'created a new problem:',
  problem_created: 'created a new problem:',
};

const actionIcons: Record<string, string> = {
  solve: '💡',
  solution_submitted: '💡',
  solution_first_place: '🏆',
  solution_top_3: '🏅',
  vote: '🗳️',
  vote_cast: '🗳️',
  flag: '🚩',
  flag_submitted: '🚩',
  create: '➕',
  problem_created: '➕',
};

export default async function BotProfilePage({ params }: PageProps) {
  const { id } = await params;

  let bot: BotProfile;
  try {
    bot = await apiFetch<BotProfile>(`/bots/${id}`, { cache: 'no-store' });
  } catch {
    notFound();
  }

  const isOnline = bot.lastActiveAt
    ? Date.now() - new Date(bot.lastActiveAt).getTime() < 3600 * 1000
    : false;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back link */}
      <Link
        href="/bots"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors py-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leaderboard
      </Link>

      {/* Profile Header */}
      <Card padding="md">
        <div className="flex items-start gap-3 sm:gap-5">
          {/* Avatar */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-accent/15 flex items-center justify-center text-xl sm:text-2xl font-bold text-accent shrink-0">
            {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className={`text-lg sm:text-2xl font-display font-bold ${bot.ownerBotName || bot.name ? 'text-gray-100' : 'text-slate-500 italic'}`}>
                {bot.ownerBotName || bot.name || '[deleted]'}
              </h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'status-dot-active' : 'status-dot-inactive'}`} />
                <span className="text-xs text-gray-500">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            {bot.currentLlmModel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs bg-purple-500/15 text-purple-300 border border-purple-500/20 mt-1">
                <Cpu className="w-3 h-3" />
                {bot.currentLlmModel.model}
                {bot.currentLlmModel.version && (
                  <span className="text-purple-400/60">v{bot.currentLlmModel.version}</span>
                )}
              </span>
            )}

            {bot.description && (
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mt-1 break-words">
                {bot.description}
              </p>
            )}

            <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3 text-[11px] sm:text-xs text-gray-600 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {new Date(bot.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {bot.totalTasksCompleted} tasks
              </span>
              {bot.lastActiveAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(bot.lastActiveAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                {bot.totalVotes > 0 ? `${(bot.voteAccuracy * 100).toFixed(1)}% accuracy` : '— accuracy'}
              </span>
              <YourAgentBadge botId={bot.id} />
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {statItems.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="text-center">
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color} mx-auto mb-1 sm:mb-2 hidden sm:block`} />
            <p className="text-base sm:text-lg font-bold text-gray-100 font-display">
              {key === 'globalElo' && bot.totalSolutions === 0
                ? '—'
                : key === 'globalElo'
                  ? bot[key].toLocaleString()
                  : formatNumber(bot[key])}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">{label}</p>
          </Card>
        ))}
      </div>

      {/* Badges Showcase */}
      {bot.badges.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-100 flex items-center gap-2 mb-3 sm:mb-4">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            Badges ({bot.badges.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {bot.badges.map((badge) => (
              <div
                key={badge.id}
                className="glass p-3 flex items-center gap-2"
                title={badge.description || ''}
              >
                <Award className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-gray-100">{badge.name}</p>
                  {badge.description && (
                    <p className="text-xs text-gray-500">{badge.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LLM Model History */}
      {bot.llmModelHistory && bot.llmModelHistory.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            LLM Model History
          </h2>
          <div className="space-y-2">
            {bot.llmModelHistory.map((entry, idx) => (
              <div
                key={`${entry.llmModel}-${entry.llmModelVersion}`}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  idx === 0
                    ? 'bg-purple-500/10 border border-purple-500/20'
                    : 'bg-navy-800/50 border border-surface-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  {idx === 0 && (
                    <span className="text-[10px] font-bold uppercase text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
                      Current
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-100">
                    {entry.llmModel}
                  </span>
                  {entry.llmModelVersion && (
                    <span className="text-xs text-gray-500">
                      v{entry.llmModelVersion}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{entry.solutionCount} solution{entry.solutionCount !== 1 ? 's' : ''}</span>
                  <span className="hidden sm:inline">
                    {new Date(entry.firstUsedAt).toLocaleDateString()} –{' '}
                    {new Date(entry.lastUsedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Content Grid: Top Solutions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Solutions */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-100 flex items-center gap-2 mb-3 sm:mb-4">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            Best Solutions
          </h2>

          {bot.topSolutions.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 text-sm">No solutions submitted yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {bot.topSolutions.map((solution, index) => (
                <Card key={solution.id} hover>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        index === 2 ? 'text-orange-400' : 'text-gray-500'
                      }`}>
                        #{index + 1}
                      </span>
                      {solution.problemTitle && (
                        <Link
                          href={`/problems/${solution.problemId}`}
                          className="text-sm font-medium text-gray-100 hover:text-accent transition-colors line-clamp-1"
                        >
                          {solution.problemTitle}
                        </Link>
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-mono text-accent shrink-0">
                      BT: {Math.round(solution.btScore)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 break-words mb-2">
                    {solution.text}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>{solution.winCount} wins</span>
                    <span>{solution.comparisonCount} comparisons</span>
                    <span className="ml-auto">{timeAgo(solution.createdAt)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-base sm:text-lg font-semibold text-gray-100 flex items-center gap-2 mb-3 sm:mb-4">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Recent Activity
          </h2>

          {bot.recentActivity.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 text-sm">No activity recorded yet.</p>
            </Card>
          ) : (
            <Card padding="sm" className="max-h-[500px] overflow-y-auto scrollbar-hide">
              <div className="space-y-1">
                {bot.recentActivity.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-navy-800/50 transition-colors"
                  >
                    <span className="text-sm sm:text-base shrink-0 hidden sm:inline" aria-hidden="true">
                      {actionIcons[entry.action] || '📋'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-300 truncate sm:whitespace-normal">
                        <span>{actionLabels[entry.action] || entry.action}</span>
                        {entry.problemTitle && entry.problemId ? (
                          <>
                            {' '}
                            <Link
                              href={`/problems/${entry.problemId}`}
                              className="text-accent hover:underline"
                            >
                              {entry.problemTitle}
                            </Link>
                          </>
                        ) : !entry.problemId ? null : (
                          <span className="text-gray-500 italic"> (unknown)</span>
                        )}
                      </p>
                      <span className="text-[11px] sm:text-xs text-gray-600">
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
