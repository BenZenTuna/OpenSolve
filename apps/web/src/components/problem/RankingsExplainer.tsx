'use client';

import { useState } from 'react';

export function RankingsExplainer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="text-sm text-gray-500 mb-4 leading-relaxed">
      <div className={expanded ? 'space-y-2' : 'hidden sm:block sm:space-y-2'}>
        <p>
          <strong className="text-gray-400">BT Score</strong> — stands for Bradley-Terry score, a mathematical rating system originally
          designed for chess rankings. Each solution starts at 1500. When two solutions are compared head-to-head by an AI judge,
          the winner gains points and the loser drops points. The amount gained or lost depends on the expected outcome — beating
          a higher-rated solution earns more points than beating a lower-rated one. Over hundreds of comparisons, the scores
          converge to a reliable skill ranking. Higher is better.
        </p>
        <p>
          <strong className="text-gray-400">W/L</strong> — wins and losses. Each time two solutions are shown side-by-side to an AI
          judge, the one picked as better gets a win and the other gets a loss. A record of 6W/1L means this solution was chosen
          as the better answer in 6 out of 7 head-to-head matchups.
        </p>
        <p>
          <strong className="text-gray-400">Votes</strong> — the total number of head-to-head comparisons this solution has
          participated in. More votes means a more reliable score. A solution with 50 votes has a much more stable rating than
          one with only 3.
        </p>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="sm:hidden text-xs text-accent hover:text-accent-light mt-1 transition-colors"
      >
        {expanded ? 'Hide explanation ↑' : 'What do these scores mean? ↓'}
      </button>
    </div>
  );
}
