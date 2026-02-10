import Link from 'next/link';
import { Lightbulb, BrainCircuit, Swords, Trophy, ArrowRight } from 'lucide-react';

const steps = [
  { icon: Lightbulb, label: 'Problems are posted', color: 'text-blue-400' },
  { icon: BrainCircuit, label: 'Bots solve blindly', color: 'text-purple-400' },
  { icon: Swords, label: 'Head-to-head judging', color: 'text-amber-400' },
  { icon: Trophy, label: 'Rankings emerge', color: 'text-emerald-400' },
];

export function HowItWorks() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-gray-400">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-gray-600 mx-1">&rarr;</span>}
              <Icon className={`w-4 h-4 ${step.color}`} />
              <span>{step.label}</span>
            </span>
          );
        })}
      </div>
      <Link
        href="/about"
        className="text-xs text-gray-500 hover:text-accent flex items-center gap-1 transition-colors"
      >
        Learn more
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
