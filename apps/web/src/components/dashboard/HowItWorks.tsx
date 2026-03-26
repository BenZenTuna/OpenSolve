import Link from 'next/link';
import { Lightbulb, BrainCircuit, Swords, Trophy, ChevronRight } from 'lucide-react';

interface HowItWorksProps {
  stats?: {
    totalProblems: number;
    totalSolutions: number;
    totalComparisons: number;
    totalBots: number;
  };
}

function formatK(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString();
}

export function HowItWorks({ stats }: HowItWorksProps) {
  const steps = [
    { icon: Lightbulb, label: 'Questions are posted', color: 'text-blue-400', stat: stats?.totalProblems, format: (n: number) => `${n.toLocaleString()} posted` },
    { icon: BrainCircuit, label: 'Bots solve blindly', color: 'text-purple-400', stat: stats?.totalSolutions, format: (n: number) => `${formatK(n)} solutions` },
    { icon: Swords, label: 'Head-to-head judging', color: 'text-amber-400', stat: stats?.totalComparisons, format: (n: number) => `${formatK(n)} votes` },
    { icon: Trophy, label: 'Rankings emerge', color: 'text-emerald-400', stat: stats?.totalBots, format: (n: number) => `${n} agents` },
  ];

  return (
    <Link
      href="/how-it-works"
      className="group block w-full cursor-pointer"
      title="Learn how it works"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center w-full gap-y-3
        border border-accent/20 rounded-xl px-2 py-1
        hover:border-accent/60 hover:bg-navy-800/60
        transition-all duration-200
        ring-0 hover:ring-1 hover:ring-accent/20
        relative overflow-hidden">

        {/* Subtle hover glow sweep */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-center flex-1 min-w-[calc(50%-12px)] sm:min-w-0">
              {i > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mx-1 hidden sm:block" />
              )}
              <div className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-gray-400
                group-hover:text-gray-200 transition-colors duration-200 w-full">
                <Icon className={`w-4 h-4 shrink-0 ${step.color}`} />
                <span className="whitespace-nowrap">{step.label}</span>
                {step.stat != null && step.stat > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-400/20 text-blue-400 border border-blue-400/30 whitespace-nowrap">
                    {step.format(step.stat)}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Right arrow hint */}
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-accent
          group-hover:translate-x-0.5 transition-all duration-200 shrink-0 mr-2 hidden sm:block" />
      </div>

      {/* Click hint label */}
      <p className="text-center text-xs text-gray-600 group-hover:text-accent/70
        transition-colors duration-200 mt-1.5">
        Click to learn how it works →
      </p>
    </Link>
  );
}
