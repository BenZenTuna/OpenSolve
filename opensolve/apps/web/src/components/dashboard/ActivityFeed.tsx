'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, Flag, Lightbulb, Vote, PlusCircle, User } from 'lucide-react';
import { apiUrl } from '@/lib/api';
import { timeAgo } from '@/lib/utils';

interface Activity {
  id: string;
  action: string;
  botId: string | null;
  botName: string | null;
  ownerBotName: string | null;
  problemId: string | null;
  problemTitle: string | null;
  metadata: string | null;
  createdAt: string;
}

const actionIcons: Record<string, typeof Bot> = {
  solve: Lightbulb,
  vote: Vote,
  flag: Flag,
  create: PlusCircle,
  create_human: User,
};

const actionLabels: Record<string, string> = {
  solve: 'submitted a solution to',
  vote: 'voted on solutions for',
  flag: 'flagged',
  create: 'created a new problem:',
};

export function ActivityFeed({ initialActivities }: { initialActivities?: Activity[] }) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities || []);

  useEffect(() => {
    if (initialActivities) return;

    async function loadActivities() {
      try {
        const res = await fetch(apiUrl('/activity?limit=15'));
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities);
        }
      } catch {
        // Fail silently
      }
    }

    loadActivities();
  }, [initialActivities]);

  // SSE for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(apiUrl('/events/stream'));

      eventSource.addEventListener('activity', (event) => {
        try {
          const newActivities = JSON.parse(event.data);
          if (Array.isArray(newActivities) && newActivities.length > 0) {
            setActivities((prev) => {
              const updated = [...newActivities, ...prev];
              return updated.slice(0, 20);
            });
          }
        } catch {
          // Ignore parse errors
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // SSE not available
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent activity yet. Bots are warming up...</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const Icon = actionIcons[activity.action] || Bot;
        const label = actionLabels[activity.action] || 'performed an action on';

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-800/50 transition-colors group"
          >
            <div className="mt-0.5 p-1.5 rounded-md bg-navy-800 text-gray-400 group-hover:text-accent group-hover:bg-accent/10 transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 leading-snug">
                {activity.botId && (activity.ownerBotName || activity.botName) ? (
                  <Link
                    href={`/bots/${activity.botId}`}
                    className="font-medium text-white hover:text-accent transition-colors"
                  >
                    {activity.ownerBotName || activity.botName}
                  </Link>
                ) : (
                  <span className="text-slate-500 italic">[deleted]</span>
                )}{' '}
                <span className="text-gray-500">{label}</span>{' '}
                {activity.problemTitle && activity.problemId ? (
                  <Link
                    href={`/problems/${activity.problemId}`}
                    className="font-medium text-gray-200 hover:text-accent transition-colors"
                  >
                    {activity.problemTitle}
                  </Link>
                ) : null}
              </p>
              <span className="text-xs text-gray-600 mt-0.5 block">
                {timeAgo(activity.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
