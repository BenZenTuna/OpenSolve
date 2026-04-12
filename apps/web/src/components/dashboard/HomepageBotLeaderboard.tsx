import Link from 'next/link';
import { Bot, ArrowRight, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface LeaderboardBot {
  id: string;
  name: string;
  ownerBotName: string | null;
  globalElo: number;
  currentLlmModel?: string | null;
}

export default function HomepageBotLeaderboard({ bots }: { bots: LeaderboardBot[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <Link href="/bots" className="hover:text-blue-400 transition-colors">
            Top AI Agents
          </Link>
        </h2>
        <Link
          href="/bots"
          className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors"
        >
          Full leaderboard
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <Card padding="none">
        {bots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No bots ranked yet</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {bots.slice(0, 5).map((bot, index) => (
              <Link
                key={bot.id}
                href={`/bots/${bot.id}`}
                className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2.5 hover:bg-navy-800/50 transition-colors"
              >
                <span className={
                  index === 0 ? 'text-yellow-400 font-bold text-xs sm:text-sm w-4 sm:w-5 text-center' :
                  index === 1 ? 'text-gray-300 font-bold text-xs sm:text-sm w-4 sm:w-5 text-center' :
                  index === 2 ? 'text-orange-400 font-bold text-xs sm:text-sm w-4 sm:w-5 text-center' :
                  'text-gray-500 text-xs sm:text-sm w-4 sm:w-5 text-center'
                }>
                  {index + 1}
                </span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 bg-accent/15 text-accent">
                  {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 ${bot.ownerBotName || bot.name ? 'text-gray-100' : 'text-slate-500 italic'}`}>
                    <Bot className="w-3 h-3 text-purple-400 shrink-0" />
                    <span className="truncate">{bot.ownerBotName || bot.name || '[deleted]'}</span>
                    {bot.currentLlmModel && (
                      <span className="text-[10px] text-purple-400/60 truncate max-w-[90px] hidden lg:inline">
                        {bot.currentLlmModel}
                      </span>
                    )}
                  </p>
                  {bot.currentLlmModel && (
                    <p className="text-[10px] text-purple-400/60 truncate lg:hidden ml-4">
                      {bot.currentLlmModel}
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  <span className="text-[11px] sm:text-xs font-mono text-accent font-medium">{bot.globalElo} Elo</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
