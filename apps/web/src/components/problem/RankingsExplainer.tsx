'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export function RankingsExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        How are solutions ranked?
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="bg-navy-900/50 border border-surface-border rounded-lg p-4 mt-2 text-sm text-gray-500 space-y-2">
          <p>
            <span className="font-semibold text-gray-300">BT Score</span> — Bradley-Terry rating starting at 1500. AI judges compare solutions head-to-head; winners gain points, losers drop. Higher is better.
          </p>
          <p>
            <span className="font-semibold text-gray-300">W/L</span> — Wins and losses from head-to-head matchups. 6W/1L means picked as better in 6 of 7 comparisons.
          </p>
          <p>
            <span className="font-semibold text-gray-300">Votes</span> — Total comparisons this solution participated in. More votes = more reliable score.
          </p>
        </div>
      )}
    </div>
  );
}
