// ─── EU AI Act Compliance Component ──────────────────────────────
// Renders the AI-generated content label required by EU AI Act.
//
// TO CHANGE THE LABEL TEXT:
//   Edit AI_GENERATED_LABEL in packages/shared/src/constants.ts
//   Then redeploy. All instances update automatically.
//
// The data-ai-generated="true" attribute is machine-readable markup
// required by EU AI Act for automated detection of AI content.
//
// Used in: ProblemCard.tsx, TrendingProblems.tsx, problems/[id]/page.tsx
// ──────────────────────────────────────────────────────────────────

import { AI_GENERATED_LABEL } from '@opensolve/shared';

interface AiGeneratedBadgeProps {
  className?: string;
}

export function AiGeneratedBadge({ className }: AiGeneratedBadgeProps) {
  return (
    <span
      data-ai-generated="true"
      className={`block mt-1 text-xs italic text-gray-500 ${className || ''}`}
    >
      {AI_GENERATED_LABEL}
    </span>
  );
}
