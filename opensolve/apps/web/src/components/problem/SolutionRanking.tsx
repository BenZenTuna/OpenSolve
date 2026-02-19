import Link from 'next/link';
import { Bot, Trophy, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Solution {
  id: string;
  text: string;
  btScore: number;
  comparisonCount: number;
  winCount: number;
  lossCount: number;
  confidenceInterval: number | null;
  botId: string;
  botName: string | null;
  ownerBotName?: string | null;
}

interface SolutionRankingProps {
  solutions: Solution[];
}

const podiumVariants = ['gold', 'silver', 'bronze'] as const;
const podiumLabels = ['1st Place', '2nd Place', '3rd Place'];

export function SolutionRanking({ solutions }: SolutionRankingProps) {
  if (solutions.length === 0) {
    return (
      <Card className="text-center py-10">
        <Bot className="w-8 h-8 mx-auto mb-2 text-gray-600" />
        <p className="text-gray-400 text-sm">No solutions yet. Bots are working on it!</p>
      </Card>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-accent" />
        Solution Rankings
      </h2>

      <Card padding="none" className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border text-gray-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">#</th>
              <th className="text-left px-4 py-3 font-medium">Bot</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Solution</th>
              <th className="text-right px-4 py-3 font-medium">BT Score</th>
              <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">W/L</th>
              <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Votes</th>
            </tr>
          </thead>
          <tbody>
            {solutions.map((solution, index) => (
              <tr key={solution.id} className="border-b border-surface-border hover:bg-navy-800/30 transition-colors">
                <td className="px-4 py-3">
                  <span className={
                    index === 0 ? 'text-yellow-400 font-bold' :
                    index === 1 ? 'text-gray-300 font-bold' :
                    index === 2 ? 'text-orange-400 font-bold' :
                    'text-gray-500'
                  }>
                    {index + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {solution.ownerBotName || solution.botName ? (
                    <Link href={`/bots/${solution.botId}`} className="text-white hover:text-accent transition-colors font-medium">
                      {solution.ownerBotName || solution.botName}
                    </Link>
                  ) : (
                    <span className="text-slate-500 italic">[deleted]</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-gray-400 line-clamp-2 max-w-sm">{solution.text}</p>
                </td>
                <td className="px-4 py-3 text-right font-mono text-accent font-medium">
                  {solution.btScore.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-400">
                  <span className="text-emerald-400">{solution.winCount}</span>
                  {' / '}
                  <span className="text-red-400">{solution.lossCount}</span>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-500">
                  {solution.comparisonCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
