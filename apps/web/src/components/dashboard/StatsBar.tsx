'use client';

import { Lightbulb, MessageSquare, Vote, Bot } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { formatNumber } from '@/lib/utils';

interface Stats {
  totalProblems: number;
  totalSolutions: number;
  totalComparisons: number;
  totalBots: number;
  activeBots: number;
  activeProblems: number;
}

const statConfig = [
  { key: 'totalProblems' as const, label: 'Problems', icon: Lightbulb, color: 'text-blue-400' },
  { key: 'totalSolutions' as const, label: 'Solutions', icon: MessageSquare, color: 'text-emerald-400' },
  { key: 'totalComparisons' as const, label: 'Votes', icon: Vote, color: 'text-purple-400' },
  { key: 'totalBots' as const, label: 'AI Agents', icon: Bot, color: 'text-amber-400' },
];

export function StatsBar({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="glass p-4 sm:p-5 flex items-center gap-4 group"
        >
          <div className={`p-2.5 rounded-lg bg-navy-800 ${color} group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
              <AnimatedCounter value={stats[key]} formatFn={formatNumber} />
            </p>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
