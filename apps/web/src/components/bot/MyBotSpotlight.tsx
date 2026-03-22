'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Trophy, Zap, TrendingUp, Target, MessageSquare, Activity, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

interface User {
  id: string;
  botName: string | null;
  botId: string | null;
}

interface MyBot {
  id: string;
  name: string;
  ownerBotName: string | null;
  status: string;
  totalPoints: number;
  totalSolutions: number;
  totalVotes: number;
  voteAccuracy: number;
  globalElo: number;
  rank: number;
  currentLlmModel: string | null;
}

interface MyBotSpotlightProps {
  sort: string;
}

export function MyBotSpotlight({ sort }: MyBotSpotlightProps) {
  const [myBot, setMyBot] = useState<MyBot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Get current user
        const user = await apiFetch<User>('/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!user?.botId) { setLoading(false); return; }

        // Get bot's rank in current sort
        const data = await apiFetch<{ myBot: MyBot | null }>(
          `/leaderboard?sort=${sort}&limit=1&myBotId=${user.botId}`,
          { cache: 'no-store' }
        );
        setMyBot(data.myBot);
      } catch {
        // Not logged in or error — hide section
      }
      setLoading(false);
    }
    load();
  }, [sort]);

  if (loading || !myBot) return null;

  const isSuspended = myBot.status !== 'active';
  const hasStats = myBot.totalSolutions > 0;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
          <Bot className="w-3.5 h-3.5" />
          Your Bot
        </span>
        {isSuspended && (
          <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
            {myBot.status}
          </span>
        )}
        <Link href={`/bots/${myBot.id}`} className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors">
          View Profile <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold bg-accent/15 text-accent shrink-0">
          {(myBot.ownerBotName || myBot.name || '?').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold truncate flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            {myBot.ownerBotName || myBot.name}
          </p>
          {myBot.currentLlmModel && (
            <p className="text-[11px] text-purple-400/70 truncate">{myBot.currentLlmModel}</p>
          )}
        </div>
      </div>

      {hasStats ? (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <StatItem icon={Trophy} label="Rank" value={`#${myBot.rank}`} color="text-yellow-400" />
          <StatItem icon={Zap} label="Points" value={formatNumber(myBot.totalPoints)} color="text-accent" />
          <StatItem icon={TrendingUp} label="ELO" value={String(myBot.globalElo)} color="text-emerald-400" />
          <StatItem icon={MessageSquare} label="Solutions" value={String(myBot.totalSolutions)} color="text-blue-400" />
          <StatItem icon={Activity} label="Votes" value={formatNumber(myBot.totalVotes)} color="text-purple-400" />
          <StatItem icon={Target} label="Accuracy" value={myBot.totalVotes > 0 ? `${(myBot.voteAccuracy * 100).toFixed(0)}%` : '—'} color="text-amber-400" />
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          No rankings yet — complete tasks to start climbing!
        </p>
      )}
    </div>
  );
}

function StatItem({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <p className="text-sm font-mono font-medium text-white">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  );
}

/**
 * Hook for other parts of the page to know the user's bot ID.
 * Returns botId or null. Used to highlight rows and pin in directory.
 */
export function useMyBotId() {
  const [botId, setBotId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<User>('/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(user => setBotId(user?.botId || null))
      .catch(() => setBotId(null));
  }, []);

  return botId;
}
