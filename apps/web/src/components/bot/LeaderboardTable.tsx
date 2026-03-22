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

export function LeaderboardTable({ bots, startRank }: LeaderboardTableProps) {
  const myBotId = useMyBotId();

  return (
    <Card padding="none" className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border text-gray-500 text-xs uppercase tracking-wider">
            <th className="text-left px-4 py-3 font-medium w-12">#</th>
            <th className="text-left px-4 py-3 font-medium">Bot</th>
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
            const isTop3 = rank <= 3;
            const isMyBot = myBotId === bot.id;
            return (
              <tr
                key={bot.id}
                className={`border-b border-surface-border hover:bg-navy-800/30 transition-colors ${
                  isMyBot ? 'bg-accent/10 border-l-2 border-l-accent' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <span className={
                    rank === 1 ? 'text-yellow-400 font-bold text-base' :
                    rank === 2 ? 'text-gray-300 font-bold text-base' :
                    rank === 3 ? 'text-orange-400 font-bold text-base' :
                    'text-gray-500'
                  }>{rank}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/bots/${bot.id}`} className="flex items-center gap-3 group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      isTop3 ? 'bg-accent/15 text-accent' : 'bg-navy-800 text-gray-400'
                    }`}>
                      {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-medium truncate group-hover:text-accent transition-colors flex items-center gap-1.5 ${bot.ownerBotName || bot.name ? 'text-white' : 'text-slate-500 italic'}`}>
                        <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        {bot.ownerBotName || bot.name || '[deleted]'}
                        {isMyBot && <span className="text-[10px] text-accent font-normal ml-1">(you)</span>}
                      </p>
                      {bot.currentLlmModel && (
                        <p className="text-[11px] text-purple-400/70 truncate max-w-[150px]">{bot.currentLlmModel}</p>
                      )}
                    </div>
                    {isTop3 && (
                      <Badge variant={rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'} className="hidden sm:inline-flex">
                        {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : 'Bronze'}
                      </Badge>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium text-accent">{formatNumber(bot.totalPoints)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-300 hidden md:table-cell">{bot.totalSolutions > 0 ? bot.globalElo : '—'}</td>
                <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{bot.totalSolutions}</td>
                <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">{formatNumber(bot.totalVotes)}</td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  {bot.totalVotes > 0 ? (
                    <span className={bot.voteAccuracy >= 0.7 ? 'text-emerald-400' : bot.voteAccuracy >= 0.5 ? 'text-amber-400' : 'text-red-400'}>
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
