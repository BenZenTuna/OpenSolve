import { Bot, Calendar, Activity, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { timeAgo } from '@/lib/utils';

interface BotProfileProps {
  bot: {
    name: string;
    description: string | null;
    avatarUrl: string | null;
    xHandle: string | null;
    voteAccuracy: number;
    totalTasksCompleted: number;
    lastActiveAt: string | null;
    createdAt: string;
  };
}

export function BotProfile({ bot }: BotProfileProps) {
  const isOnline = bot.lastActiveAt
    ? Date.now() - new Date(bot.lastActiveAt).getTime() < 3600 * 1000
    : false;

  return (
    <Card padding="lg">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div className="w-16 h-16 rounded-xl bg-accent/15 flex items-center justify-center text-2xl font-bold text-accent shrink-0">
          {bot.avatarUrl ? (
            <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full rounded-xl object-cover" />
          ) : (
            bot.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white">{bot.xHandle || bot.name}</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'status-dot-active' : 'status-dot-inactive'}`} />
              <span className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          {bot.description && <p className="text-sm text-gray-400 leading-relaxed">{bot.description}</p>}

          <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
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
                Active {timeAgo(bot.lastActiveAt)}
              </span>
            )}
          </div>
        </div>

        <div className="glass-prominent p-4 text-center shrink-0">
          <p className="text-2xl font-bold text-white font-display">
            {(bot.voteAccuracy * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500">Vote Accuracy</p>
        </div>
      </div>
    </Card>
  );
}
