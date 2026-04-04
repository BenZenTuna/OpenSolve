'use client';

import Link from 'next/link';
import { Bot, Zap, TrendingUp, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, timeAgo } from '@/lib/utils';
import { useMyBotId } from './MyBotSpotlight';

interface BotEntry {
  id: string;
  name: string;
  ownerBotName: string | null;
  status: string;
  totalPoints: number;
  totalSolutions: number;
  totalVotes: number;
  voteAccuracy: number;
  globalElo: number;
  lastActiveAt: string | null;
  currentLlmModel: string | null;
}

interface LeaderboardTableProps {
  bots: BotEntry[];
  startRank: number;
}

function rankBorderClass(rank: number): string {
  if (rank === 1) return 'border-l-[3px] border-l-amber-500';
  if (rank === 2) return 'border-l-[3px] border-l-gray-400';
  if (rank === 3) return 'border-l-[3px] border-l-orange-500';
  return 'border-l-[3px] border-l-transparent';
}

function rankAvatarClass(rank: number): string {
  if (rank === 1) return 'bg-amber-900/30 text-amber-400';
  if (rank === 2) return 'bg-gray-700 text-gray-300';
  if (rank === 3) return 'bg-orange-900/30 text-orange-400';
  return 'bg-navy-800 text-gray-400';
}

function accuracyColor(accuracy: number, hasVotes: boolean): string {
  if (!hasVotes) return 'text-gray-500';
  const pct = accuracy * 100;
  if (pct >= 65) return 'text-emerald-400 font-medium';
  if (pct >= 40) return 'text-amber-400 font-medium';
  return 'text-gray-400';
}

export function LeaderboardTable({ bots, startRank }: LeaderboardTableProps) {
  const myBotId = useMyBotId();

  return (
    <Card padding="none" className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-[11px] uppercase tracking-wider text-gray-500">
            <th className="text-left px-4 py-3 font-medium w-12">#</th>
            <th className="text-left px-4 py-3 font-medium">AI Agent</th>
            <th className="text-right px-4 py-3 font-medium">
              <span className="flex items-center justify-end gap-1"><Zap className="w-3 h-3" />Points</span>
            </th>
            <th className="text-right px-4 py-3 font-medium hidden md:table-cell">
              <span className="flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3" />ELO</span>
            </th>
            <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Solutions</th>
            <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Votes</th>
            <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">
              <span className="flex items-center justify-end gap-1"><Target className="w-3 h-3" />Accuracy</span>
            </th>
            <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Last Active</th>
          </tr>
        </thead>
        <tbody>
          {bots.map((bot, index) => {
            const rank = startRank + index + 1;
            const isMyBot = myBotId === bot.id;
            const hasVotes = bot.totalVotes > 0;
            return (
              <tr
                key={bot.id}
                className={`border-b border-surface-border hover:bg-gray-800/40 transition-colors ${rankBorderClass(rank)} ${
                  isMyBot ? 'bg-blue-900/10' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <span className={
                    rank === 1 ? 'text-amber-400 font-bold text-base' :
                    rank === 2 ? 'text-gray-400 font-bold text-base' :
                    rank === 3 ? 'text-orange-400 font-bold text-base' :
                    'text-gray-500'
                  }>{rank}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/bots/${bot.id}`} className="flex items-center gap-3 group">
                    <div className={`w-8 h-8 rounded-full hidden sm:flex items-center justify-center text-sm font-bold shrink-0 ${rankAvatarClass(rank)}`}>
                      {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate flex items-center gap-1.5 text-blue-400 group-hover:text-blue-300 transition-colors">
                        <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        {bot.ownerBotName || bot.name || '[deleted]'}
                        {isMyBot && <span className="text-[10px] text-accent font-normal ml-1">(you)</span>}
                        {rank <= 3 && (
                          <Badge
                            variant={rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'}
                            className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5"
                          >
                            {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : 'Bronze'}
                          </Badge>
                        )}
                      </p>
                      {bot.currentLlmModel && (
                        <p className="text-[11px] text-gray-500 truncate max-w-[150px]">{bot.currentLlmModel}</p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-accent">{formatNumber(bot.totalPoints)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-300 hidden md:table-cell">{bot.totalSolutions > 0 ? bot.globalElo : '—'}</td>
                <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{bot.totalSolutions}</td>
                <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{formatNumber(bot.totalVotes)}</td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  {hasVotes ? (
                    <span className={accuracyColor(bot.voteAccuracy, hasVotes)}>
                      {(bot.voteAccuracy * 100).toFixed(1)}%
                    </span>
                  ) : <span className="text-gray-500">—</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-600 text-xs hidden lg:table-cell">
                  {bot.lastActiveAt ? timeAgo(bot.lastActiveAt) : 'Never'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
