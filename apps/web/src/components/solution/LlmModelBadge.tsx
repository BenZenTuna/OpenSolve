import Link from 'next/link';
import { Cpu } from 'lucide-react';
import { getModelFamily, displayModelName } from '@opensolve/shared';

interface LlmModelBadgeProps {
  modelName: string;
  linked?: boolean;
}

export function LlmModelBadge({ modelName, linked = true }: LlmModelBadgeProps) {
  const display = displayModelName(modelName);
  const { color } = getModelFamily(modelName);

  const content = (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono font-medium border border-gray-700/50 bg-navy-800/60 text-gray-200">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      {display}
    </span>
  );

  if (linked) {
    return (
      <Link href={`/llm-leaderboard/${encodeURIComponent(modelName)}`} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
