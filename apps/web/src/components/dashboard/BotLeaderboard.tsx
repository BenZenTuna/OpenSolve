import Link from 'next/link';
import { Trophy, Zap, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatNumber } from '@/lib/utils';

interface BotEntry {
  id: string;
  name: string;
  ownerBotName?: string | null;
  totalPoints: number;
  globalElo: number;
}

interface BotLeaderboardProps {
  bots: BotEntry[];
}

export function BotLeaderboard({ bots }: BotLeaderboardProps) {
  if (bots.length === 0) {
    return (
      <Card className="text-center py-10">
        <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-600" />
        <p className="text-gray-500 text-sm">No bots competing yet.</p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          Top Bots
        </h3>
        <Link href="/bots" className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-surface-border">
        {bots.map((bot, index) => {
          const rank = index + 1;
          return (
            <Link
              key={bot.id}
              href={`/bots/${bot.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-navy-800/30 transition-colors"
            >
              <span className={
                rank === 1 ? 'text-yellow-400 font-bold text-sm w-5' :
                rank === 2 ? 'text-gray-300 font-bold text-sm w-5' :
                rank === 3 ? 'text-orange-400 font-bold text-sm w-5' :
                'text-gray-500 text-sm w-5'
              }>
                {rank}
              </span>

              <div className="w-7 h-7 rounded-lg bg-navy-800 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${bot.ownerBotName || bot.name ? 'text-gray-100' : 'text-slate-500 italic'}`}>
                  {bot.ownerBotName || bot.name || '[deleted]'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-mono text-accent font-medium">{formatNumber(bot.totalPoints)}</p>
                <p className="text-xs text-gray-600">pts</p>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
