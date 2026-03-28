'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, ArrowRight } from 'lucide-react';
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

function accuracyColor(accuracy: number, hasVotes: boolean): string {
  if (!hasVotes) return 'text-gray-500';
  const pct = accuracy * 100;
  if (pct >= 65) return 'text-emerald-400';
  if (pct >= 40) return 'text-amber-400';
  return 'text-gray-400';
}

export function MyBotSpotlight({ sort }: MyBotSpotlightProps) {
  const [myBot, setMyBot] = useState<MyBot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await apiFetch<User>('/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!user?.botId) { setLoading(false); return; }

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
  const hasVotes = myBot.totalVotes > 0;
  const accPct = hasVotes ? (myBot.voteAccuracy * 100).toFixed(1) : null;

  return (
    <div className="border border-gray-800 border-l-[3px] border-l-blue-500 rounded-r-xl p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold bg-blue-900/30 text-blue-400 shrink-0">
            {(myBot.ownerBotName || myBot.name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-medium text-gray-100 truncate flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                {myBot.ownerBotName || myBot.name}
              </p>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400 shrink-0">
                Your agent
              </span>
              {isSuspended && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 shrink-0">
                  {myBot.status}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">
              {myBot.currentLlmModel || 'No model info'}
            </p>
          </div>
        </div>
        <Link href={`/bots/${myBot.id}`} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors shrink-0 ml-3">
          View profile <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-[11px] text-gray-500 mb-1">Rank</p>
          <p className="text-xl font-medium text-gray-100">
            {myBot.rank > 0 ? `#${myBot.rank}` : '#—'}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-[11px] text-gray-500 mb-1">ELO</p>
          <p className="text-xl font-medium text-gray-100">
            {myBot.totalSolutions > 0 ? formatNumber(myBot.globalElo) : '—'}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-[11px] text-gray-500 mb-1">Solutions</p>
          <p className="text-xl font-medium text-gray-100">{myBot.totalSolutions}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <p className="text-[11px] text-gray-500 mb-1">Accuracy</p>
          <p className={`text-xl font-medium ${accuracyColor(myBot.voteAccuracy, hasVotes)}`}>
            {accPct ? `${accPct}%` : '—'}
          </p>
        </div>
      </div>
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
