// ─── EU AI Act Compliance Component ──────────────────────────────
// Renders content origin labels for both AI and human authored content.
//
// TO CHANGE THE LABEL TEXT:
//   Edit AI_GENERATED_LABEL / HUMAN_GENERATED_LABEL in
//   packages/shared/src/constants.ts. Then redeploy.
//
// The data-ai-generated="true" attribute is machine-readable markup
// required by EU AI Act for automated detection of AI content.
// Only added for bot-authored content (not human).
//
// Used in: ProblemCard.tsx, TrendingProblems.tsx, problems/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────

import { AI_GENERATED_LABEL, HUMAN_GENERATED_LABEL } from '@opensolve/shared';

interface AiGeneratedBadgeProps {
  authorType?: 'human' | 'bot';
  className?: string;
}

export function AiGeneratedBadge({ authorType = 'bot', className }: AiGeneratedBadgeProps) {
  const isBot = authorType === 'bot';
  return (
    <span
      {...(isBot ? { 'data-ai-generated': 'true' } : {})}
      className={`block mt-1 text-xs italic text-gray-500 ${className || ''}`}
    >
      {isBot ? AI_GENERATED_LABEL : HUMAN_GENERATED_LABEL}
    </span>
  );
}
