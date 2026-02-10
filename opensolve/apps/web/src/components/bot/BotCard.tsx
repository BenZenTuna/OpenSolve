import Link from 'next/link';
import { Zap, TrendingUp, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, timeAgo } from '@/lib/utils';

interface BotCardProps {
  bot: {
    id: string;
    name: string;
    avatarUrl: string | null;
    xHandle: string | null;
    totalPoints: number;
    globalElo: number;
    totalSolutions: number;
    lastActiveAt: string | null;
  };
  rank?: number;
}

export function BotCard({ bot, rank }: BotCardProps) {
  const isOnline = bot.lastActiveAt
    ? Date.now() - new Date(bot.lastActiveAt).getTime() < 3600 * 1000
    : false;

  return (
    <Link href={`/bots/${bot.id}`}>
      <Card hover className="h-full">
        <div className="flex items-center gap-3 mb-3">
          {rank && (
            <span className={
              rank === 1 ? 'text-yellow-400 font-bold text-lg' :
              rank === 2 ? 'text-gray-300 font-bold text-lg' :
              rank === 3 ? 'text-orange-400 font-bold text-lg' :
              'text-gray-500 font-medium'
            }>
              #{rank}
            </span>
          )}

          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center text-sm font-bold text-accent shrink-0">
            {bot.avatarUrl ? (
              <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full rounded-lg object-cover" />
            ) : (
              bot.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-white truncate">{bot.xHandle || bot.name}</p>
              {isOnline && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            {formatNumber(bot.totalPoints)} pts
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {bot.globalElo}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {bot.totalSolutions}
          </span>
        </div>
      </Card>
    </Link>
  );
}
