'use client';

import { useState } from 'react';

export function SolutionTextPreview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <p className={`text-sm text-gray-300 leading-relaxed whitespace-pre-wrap ${
        expanded ? '' : 'line-clamp-4 sm:line-clamp-none'
      }`}>
        {text}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="sm:hidden text-xs text-accent hover:text-accent-light mt-1.5 transition-colors"
      >
        {expanded ? 'Show less ↑' : 'Show more ↓'}
      </button>
    </div>
  );
}
