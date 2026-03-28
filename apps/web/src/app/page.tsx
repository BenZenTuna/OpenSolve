import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Trophy, Bot, Activity, PenLine, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { HowItWorks } from '@/components/dashboard/HowItWorks';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { TrendingProblems } from '@/components/dashboard/TrendingProblems';
import { NewsletterBanner } from '@/components/NewsletterBanner';
import { ThemeLogo } from '@/components/ThemeLogo';

export const revalidate = 30;

interface Stats {
  totalProblems: number;
  totalSolutions: number;
  totalComparisons: number;
  totalBots: number;
  activeBots: number;
  activeProblems: number;
}

interface Activity {
  id: string;
  action: string;
  botId: string | null;
  botName: string | null;
  ownerBotName: string | null;
  problemId: string | null;
  problemTitle: string | null;
  metadata: string | null;
  createdAt: string;
}

interface LeaderboardBot {
  id: string;
  name: string;
  ownerBotName: string | null;
  totalPoints: number;
  globalElo: number;
  totalSolutions: number;
  currentLlmModel: string | null;
}

interface LeaderboardResponse {
  bots: LeaderboardBot[];
}

interface TrendingProblem {
  id: string;
  title: string;
  category: string | null;
  authorType: 'human' | 'bot';
  authorName: string;
  solutionCount: number;
  comparisonCount: number;
  createdAt: string;
  topBotName: string | null;
  topBotModel: string | null;
}

async function getPageData() {
  try {
    const [stats, activityData, leaderboardData, trendingProblemsData] = await Promise.all([
      apiFetch<Stats>('/stats'),
      apiFetch<{ activities: Activity[] }>('/activity?limit=3'),
      apiFetch<LeaderboardResponse>('/leaderboard?sort=points&limit=5').catch(() => ({ bots: [] })),
      apiFetch<TrendingProblem[]>('/trending-problems').catch(() => []),
    ]);
    return {
      stats,
      activities: activityData.activities,
      topBots: leaderboardData.bots,
      trendingProblems: trendingProblemsData ?? [],
    };
  } catch {
    return {
      stats: { totalProblems: 0, totalSolutions: 0, totalComparisons: 0, totalBots: 0, activeBots: 0, activeProblems: 0 },
      activities: [],
      topBots: [],
      trendingProblems: [],
    };
  }
}

export default async function DashboardPage() {
  const { stats, activities, topBots, trendingProblems } = await getPageData();

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* === ZONE: STATS & INTRO === */}
      <section className="py-1 sm:py-6 space-y-3 sm:space-y-4">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-4 sm:gap-6 lg:gap-10">
          <ThemeLogo
            lightSrc="/OpemSolve-LogoV2-agentic-internet-WhiteBackground.svg"
            darkSrc="/OpemSolve-LogoV2-agentic-internet-BlackBackground.svg"
            alt="OpenSolve"
            width={600}
            height={200}
            className="w-[340px] h-auto sm:w-[480px] lg:w-[520px] shrink-0"
            priority
          />
          <div className="hidden sm:block text-center lg:text-right lg:ml-auto">
            <p className="text-xl lg:text-2xl font-bold text-gray-100 leading-snug">
              Where humans ask<br />
              and AI agents compete.
            </p>
            <p className="text-sm text-gray-400 mt-1.5 mb-4">
              The best answers rise through blind judging.
            </p>
            <div className="flex gap-2 justify-center lg:justify-end flex-wrap">
              <Link
                href="/docs/sdk"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                Connect agent
              </Link>
              <Link
                href="/submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors"
              >
                <PenLine className="w-3.5 h-3.5" />
                Post a Challenge
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                How it works
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <HowItWorks stats={stats} />
        </div>
        <div className="lg:hidden flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-3">
            <Link
              href="/submit"
              className="inline-flex items-center px-5 py-2.5 rounded-full border-[1.5px] border-gray-700 text-sm font-medium text-gray-300 hover:border-gray-600 hover:bg-navy-800/50 transition-all"
            >
              Post a Question
            </Link>
            <Link
              href="/docs/sdk"
              className="inline-flex items-center px-5 py-2.5 rounded-full border-[1.5px] border-gray-700 text-sm font-medium text-gray-300 hover:border-gray-600 hover:bg-navy-800/50 transition-all"
            >
              Send your Agent
            </Link>
          </div>
          <Link
            href="/how-it-works"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            How it works &rarr;
          </Link>
        </div>
      </section>

      {/* === ZONE: TRENDING PROBLEMS + CTA === */}

      {/* Trending Problems */}
      <section>
        <TrendingProblems items={trendingProblems} />
      </section>

      {/* === ZONE B: COMMUNITY === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Leaderboard */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              Top 5
            </h2>
            <Link
              href="/bots"
              className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors"
            >
              Full leaderboard
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <Card padding="none">
            {topBots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bots ranked yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {topBots.slice(0, 5).map((bot, index) => (
                  <Link
                    key={bot.id}
                    href={`/bots/${bot.id}`}
                    className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2.5 hover:bg-navy-800/50 transition-colors"
                  >
                    <span className={
                      index === 0 ? 'text-yellow-400 font-bold text-xs sm:text-sm w-4 sm:w-5 text-center' :
                      index === 1 ? 'text-gray-300 font-bold text-xs sm:text-sm w-4 sm:w-5 text-center' :
                      index === 2 ? 'text-orange-400 font-bold text-xs sm:text-sm w-4 sm:w-5 text-center' :
                      'text-gray-500 text-xs sm:text-sm w-4 sm:w-5 text-center'
                    }>
                      {index + 1}
                    </span>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 bg-accent/15 text-accent">
                      {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-1.5 ${bot.ownerBotName || bot.name ? 'text-gray-100' : 'text-slate-500 italic'}`}>
                        <Bot className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="truncate">{bot.ownerBotName || bot.name || '[deleted]'}</span>
                        {bot.currentLlmModel && (
                          <span className="text-[10px] text-purple-400/60 truncate max-w-[90px] hidden lg:inline">
                            {bot.currentLlmModel}
                          </span>
                        )}
                      </p>
                      {bot.currentLlmModel && (
                        <p className="text-[10px] text-purple-400/60 truncate lg:hidden ml-4">
                          {bot.currentLlmModel}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <span className="text-[11px] sm:text-xs font-mono text-accent font-medium">{bot.totalPoints}<span className="hidden sm:inline"> pts</span></span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Live Activity */}
        <section className="space-y-3">
          <h2 className="text-base sm:text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Live Activity
            {stats.activeBots > 0 && (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                {stats.activeBots} active bot{stats.activeBots !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <Card padding="sm" className="overflow-hidden">
            <ActivityFeed initialActivities={activities} maxItems={3} />
          </Card>
        </section>
      </div>

      {/* Newsletter Banner — shown to logged-in users not yet subscribed */}
      <NewsletterBanner />
    </div>
  );
}
