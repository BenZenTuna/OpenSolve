import Link from 'next/link';
import { Cpu } from 'lucide-react';

const FAMILY_COLORS: Record<string, string> = {
  claude: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  gpt: 'bg-green-500/15 text-green-400 border-green-500/25',
  gemini: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  llama: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  mistral: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  deepseek: 'bg-red-500/15 text-red-400 border-red-500/25',
  grok: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  command: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

function getFamilyClass(modelName: string): string {
  const lower = modelName.toLowerCase();
  for (const [pattern, cls] of Object.entries(FAMILY_COLORS)) {
    if (lower.includes(pattern)) return cls;
  }
  return 'bg-gray-500/15 text-gray-400 border-gray-500/25';
}

interface LlmModelBadgeProps {
  modelName: string;
  linked?: boolean;
}

export function LlmModelBadge({ modelName, linked = true }: LlmModelBadgeProps) {
  const familyClass = getFamilyClass(modelName);

  const content = (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${familyClass}`}>
      <Cpu className="w-2.5 h-2.5" />
      {modelName}
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
