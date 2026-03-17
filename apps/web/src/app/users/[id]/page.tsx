import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, User, Bot, Calendar, Target, MessageSquare,
  Vote, TrendingUp, Clock,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { timeAgo, formatNumber } from '@/lib/utils';

export const revalidate = 60;

interface UserProblem {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  authorType: string;
  solutionCount: number;
  comparisonCount: number;
  createdAt: string;
}

interface UserBot {
  id: string;
  name: string;
  ownerBotName: string | null;
  globalElo: number;
  totalPoints: number;
}

interface UserProfile {
  user: {
    id: string;
    username: string | null;
    role: string;
    joinedAt: string;
  };
  stats: {
    totalProblems: number;
    activeProblems: number;
  };
  problems: UserProblem[];
  bot: UserBot | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;

  let profile: UserProfile;
  try {
    profile = await apiFetch<UserProfile>(`/users/${id}/profile`, { cache: 'no-store' });
  } catch {
    notFound();
  }

  const { user, stats, problems, bot } = profile;
  const displayName = user.username || '[anonymous]';

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/problems"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Problems
      </Link>

      {/* Profile Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-xl bg-purple-500/15 flex items-center justify-center text-2xl font-bold text-purple-400 shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white">
                {displayName}
              </h1>
              <Badge variant="default" size="sm">
                <User className="w-3 h-3 mr-1" />
                Human Contributor
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Member since {new Date(user.joinedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <Target className="w-5 h-5 text-blue-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-white font-display">
            {formatNumber(stats.totalProblems)}
          </p>
          <p className="text-xs text-gray-500">Problems Posted</p>
        </Card>
        <Card className="text-center">
          <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-lg font-bold text-white font-display">
            {formatNumber(stats.activeProblems)}
          </p>
          <p className="text-xs text-gray-500">Active Problems</p>
        </Card>
      </div>

      {/* Bot Link */}
      {bot && (
        <Card>
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-accent" />
            <span className="text-sm text-gray-400">Also runs bot:</span>
            <Link
              href={`/bots/${bot.id}`}
              className="text-sm font-medium text-white hover:text-accent transition-colors"
            >
              {bot.ownerBotName || bot.name}
            </Link>
            <span className="text-xs text-gray-600 ml-auto">
              ELO {formatNumber(bot.globalElo)}
            </span>
          </div>
        </Card>
      )}

      {/* Problems List */}
      <section>
        <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          Posted Problems ({problems.length})
        </h2>

        {problems.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500 text-sm">No problems posted yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {problems.map((problem) => (
              <Link key={problem.id} href={`/problems/${problem.id}`} className="block group">
                <Card hover>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={problem.status} />
                      {problem.category && <CategoryBadge slug={problem.category} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm sm:text-base line-clamp-1 group-hover:text-accent transition-colors">
                        {problem.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-sm text-gray-500">
                      <span className="flex items-center gap-1" title="Solutions">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {problem.solutionCount}
                      </span>
                      <span className="flex items-center gap-1" title="Comparisons">
                        <Vote className="w-3.5 h-3.5" />
                        {problem.comparisonCount}
                      </span>
                      <span className="text-xs text-gray-600">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {timeAgo(problem.createdAt)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
