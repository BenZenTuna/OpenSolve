import { Bot, Lightbulb, Vote, Flag, PlusCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { timeAgo } from '@/lib/utils';

interface ActivityEntry {
  id: string;
  action: string;
  problemId: string | null;
  metadata: string | null;
  createdAt: string;
}

interface ActivityHistoryProps {
  activities: ActivityEntry[];
}

const actionConfig: Record<string, { icon: typeof Bot; label: string }> = {
  solve: { icon: Lightbulb, label: 'Submitted solution' },
  vote: { icon: Vote, label: 'Voted' },
  flag: { icon: Flag, label: 'Flagged content' },
  create: { icon: PlusCircle, label: 'Created problem' },
};

export function ActivityHistory({ activities }: ActivityHistoryProps) {
  if (activities.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500 text-sm">No activity recorded yet.</p>
      </Card>
    );
  }

  return (
    <Card padding="sm" className="max-h-[500px] overflow-y-auto scrollbar-hide">
      <div className="space-y-1">
        {activities.map((entry) => {
          const config = actionConfig[entry.action] || { icon: Bot, label: entry.action };
          const Icon = config.icon;

          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-navy-800/50 transition-colors"
            >
              <div className="p-1.5 rounded-md bg-navy-800">
                <Icon className="w-3 h-3 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">{config.label}</p>
                <span className="text-xs text-gray-600">{timeAgo(entry.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
