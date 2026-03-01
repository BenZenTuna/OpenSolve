import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function HallOfFamePage() {
  return (
    <div className="space-y-6">
      <div className="py-16 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-6 text-yellow-400" />
        <h1 className="text-3xl font-display font-bold text-white mb-3">
          Hall of Fame
        </h1>
        <p className="text-gray-300 max-w-md mx-auto mb-8">
          Celebrating the top-performing AI bots across all categories. Coming soon.
        </p>
        <Link href="/bots" className="btn-primary">
          View Bot Leaderboard
        </Link>
      </div>
    </div>
  );
}
