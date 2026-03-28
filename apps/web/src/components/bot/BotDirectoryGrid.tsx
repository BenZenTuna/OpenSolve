'use client';

import Link from 'next/link';
import { Bot as BotIcon, Zap, TrendingUp, MessageSquare, Activity } from 'lucide-react';
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

function BotCard({ bot, isMyBot }: { bot: BotEntry; isMyBot: boolean }) {
  return (
    <Link href={`/bots/${bot.id}`}>
      <Card hover className={`h-full flex flex-col ${isMyBot ? 'border-accent/30 ring-1 ring-accent/20' : ''}`}>
        {/* Bot header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-sm sm:text-base font-bold shrink-0 bg-accent/15 text-accent">
            {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate flex items-center gap-1.5 ${bot.ownerBotName || bot.name ? 'text-gray-100' : 'text-slate-500 italic'}`}>
              <BotIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400 shrink-0" />
              {bot.ownerBotName || bot.name || '[deleted]'}
            </p>
            {bot.currentLlmModel && (
              <p className="text-[11px] text-purple-400/70 truncate">{bot.currentLlmModel}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isMyBot && (
              <span className="text-[10px] font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                Your Agent
              </span>
            )}
            <Badge variant={bot.status === 'active' ? 'default' : 'bronze'} size="sm">
              {bot.status}
            </Badge>
          </div>
        </div>

        {/* Stats — compact inline on mobile, grid on desktop */}
        <div className="flex items-center gap-3 text-xs text-gray-400 sm:hidden">
          <span>{formatNumber(bot.totalPoints)} pts</span>
          <span className="text-gray-600">&middot;</span>
          <span>{bot.totalSolutions > 0 ? bot.globalElo : '—'} ELO</span>
          <span className="text-gray-600">&middot;</span>
          <span>{bot.totalSolutions} sol</span>
          <span className="text-gray-600">&middot;</span>
          <span>{bot.totalVotes > 0 ? `${(bot.voteAccuracy * 100).toFixed(0)}%` : '—'}</span>
        </div>
        <div className="hidden sm:grid grid-cols-2 gap-3 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5 text-accent" />
            <span className="text-gray-400">Points</span>
            <span className="text-gray-100 font-medium ml-auto">{formatNumber(bot.totalPoints)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-400">ELO</span>
            <span className="text-gray-100 font-medium ml-auto">{bot.totalSolutions > 0 ? bot.globalElo : '—'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-gray-400">Solutions</span>
            <span className="text-gray-100 font-medium ml-auto">{bot.totalSolutions}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-gray-400">Accuracy</span>
            <span className="text-gray-100 font-medium ml-auto">{bot.totalVotes > 0 ? `${(bot.voteAccuracy * 100).toFixed(0)}%` : '—'}</span>
          </div>
        </div>

        {/* Last active */}
        <div className="mt-2 sm:mt-4 pt-2 sm:pt-3 border-t border-surface-border text-[11px] sm:text-xs text-gray-600">
          Last active: {bot.lastActiveAt ? timeAgo(bot.lastActiveAt) : 'Never'}
        </div>
      </Card>
    </Link>
  );
}

interface BotDirectoryGridProps {
  bots: BotEntry[];
}

export function BotDirectoryGrid({ bots }: BotDirectoryGridProps) {
  const myBotId = useMyBotId();

  // Pin user's bot first, remove duplicate from rest
  const myBot = myBotId ? bots.find(b => b.id === myBotId) : null;
  const otherBots = myBot ? bots.filter(b => b.id !== myBotId) : bots;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {myBot && <BotCard bot={myBot} isMyBot={true} />}
      {otherBots.map((bot) => (
        <BotCard key={bot.id} bot={bot} isMyBot={false} />
      ))}
    </div>
  );
}
