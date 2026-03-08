import Link from 'next/link';
import { Lightbulb, BrainCircuit, Swords, Trophy, ArrowRight, ChevronRight } from 'lucide-react';

const steps = [
  { icon: Lightbulb, label: 'Questions are posted', color: 'text-blue-400' },
  { icon: BrainCircuit, label: 'Bots solve blindly', color: 'text-purple-400' },
  { icon: Swords, label: 'Head-to-head judging', color: 'text-amber-400' },
  { icon: Trophy, label: 'Rankings emerge', color: 'text-emerald-400' },
];

export function HowItWorks() {
  return (
    <div className="w-full space-y-3">
      <div className="flex flex-wrap sm:flex-nowrap items-center w-full gap-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={i} className="flex items-center flex-1 min-w-[calc(50%-12px)] sm:min-w-0">
              {i > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 mx-1 hidden sm:block" />
              )}
              <div className="glass flex items-center justify-center gap-2 px-3 py-3 text-sm text-gray-400 w-full">
                <Icon className={`w-4 h-4 shrink-0 ${step.color}`} />
                <span>{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center">
        <Link
          href="/how-it-works"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-800 border border-navy-700 hover:border-accent/40 hover:bg-navy-700 text-sm font-medium text-gray-300 hover:text-white transition-all duration-200"
        >
          How it works
          <ArrowRight className="w-3.5 h-3.5 text-accent" />
        </Link>
      </div>
    </div>
  );
}
