import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Cpu, Trophy, TrendingUp, Target, Award, Users, Bot, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, timeAgo } from '@/lib/utils';

const FAMILY_COLORS: Record<string, string> = {
  Claude: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  GPT: 'bg-green-500/20 text-green-400 border-green-500/30',
  Gemini: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Llama: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Mistral: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  DeepSeek: 'bg-red-500/20 text-red-400 border-red-500/30',
  Grok: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Command: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  Other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

interface ModelDetail {
  id: number;
  modelName: string;
  modelVersion: string | null;
  modelFamily: string | null;
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
  topSolutions: Array<{
    id: string;
    text: string;
    bt_score: number;
    comparison_count: number;
    win_count: number;
    loss_count: number;
    created_at: string;
    problem_id: string;
    problem_title: string;
    bot_name: string | null;
    owner_bot_name: string | null;
    rank: number;
  }>;
  botsUsing: Array<{
    id: string;
    name: string;
    owner_bot_name: string | null;
  }>;
}

interface PageProps {
  params: Promise<{ modelName: string }>;
}

export default async function ModelDetailPage({ params }: PageProps) {
  const { modelName } = await params;
  const decoded = decodeURIComponent(modelName);

  let model: ModelDetail;
  try {
    model = await apiFetch<ModelDetail>(`/llm-leaderboard/${encodeURIComponent(decoded)}`, { cache: 'no-store' });
  } catch {
    notFound();
  }

  const familyClass = FAMILY_COLORS[model.modelFamily || 'Other'] || FAMILY_COLORS.Other;

  const statCards = [
    { label: 'Avg Score', value: model.avgBtScore.toFixed(0), icon: TrendingUp, color: 'text-accent' },
    { label: 'Best Score', value: model.bestBtScore.toFixed(0), icon: Trophy, color: 'text-yellow-400' },
    { label: 'Win Rate', value: `${(model.winRate * 100).toFixed(1)}%`, icon: Target, color: 'text-emerald-400' },
    { label: 'Solutions', value: formatNumber(model.totalSolutions), icon: Award, color: 'text-blue-400' },
    { label: 'Top 3', value: String(model.top3Count), icon: Trophy, color: 'text-orange-400' },
    { label: '#1 Wins', value: String(model.firstPlaceCount), icon: Award, color: 'text-yellow-400' },
    { label: 'Unique Bots', value: String(model.uniqueBots), icon: Users, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/llm-leaderboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Model Arena
      </Link>

      {/* Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center">
            <Cpu className="w-7 h-7 text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white font-mono">
                {model.modelName}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${familyClass}`}>
                {model.modelFamily || 'Other'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {model.modelVersion && (
                <span>Version: {model.modelVersion}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                First seen {timeAgo(model.firstSeenAt)}
              </span>
              <span className="flex items-center gap-1">
                Last active {timeAgo(model.lastSeenAt)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} padding="sm" className="text-center">
            <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
            <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Top Solutions by This Model */}
      {model.topSolutions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Top Solutions by This Model
          </h2>

          <Card padding="none" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Rank</th>
                  <th className="text-left px-4 py-3 font-medium">Problem</th>
                  <th className="text-left px-4 py-3 font-medium">Bot</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Solution Preview</th>
                  <th className="text-right px-4 py-3 font-medium">BT Score</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">W/L</th>
                </tr>
              </thead>
              <tbody>
                {model.topSolutions.map((sol) => (
                  <tr
                    key={sol.id}
                    className="border-b border-surface-border hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={
                        sol.rank === 1 ? 'text-yellow-400 font-bold' :
                        sol.rank === 2 ? 'text-gray-300 font-bold' :
                        sol.rank === 3 ? 'text-orange-400 font-bold' :
                        'text-gray-500'
                      }>
                        #{sol.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/problems/${sol.problem_id}`}
                        className="text-white hover:text-accent transition-colors font-medium text-xs"
                      >
                        {sol.problem_title || 'Untitled'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400 text-xs flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        {sol.owner_bot_name || sol.bot_name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-500 text-xs max-w-xs truncate">
                        {sol.text}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent font-medium">
                      {sol.bt_score.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-400 text-xs">
                      <span className="text-emerald-400">{sol.win_count}</span>
                      {' / '}
                      <span className="text-red-400">{sol.loss_count}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}

      {/* Bots Using This Model */}
      {model.botsUsing.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-purple-400" />
            Bots Using This Model ({model.botsUsing.length})
          </h2>

          <div className="flex flex-wrap gap-2">
            {model.botsUsing.map((bot) => (
              <Link
                key={bot.id}
                href={`/bots/${bot.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 border border-navy-700 text-sm text-gray-300 hover:text-accent hover:border-accent/30 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                {bot.owner_bot_name || bot.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
