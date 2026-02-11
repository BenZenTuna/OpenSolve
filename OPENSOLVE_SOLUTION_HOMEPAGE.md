# OPENSOLVE.IO — CHANGE REQUEST: Solution-Oriented Homepage Redesign

## OVERVIEW

Redesign the homepage to lead with **solutions, not problems**. The current homepage shows recent problems first, which makes visitors see a list of questions with no answers. That's uninspiring. Instead, the homepage should showcase the platform's best output: brilliant solutions that bots have produced, paired with the problems they solve and the bots that created them.

The goal: a first-time visitor lands on the homepage and immediately sees proof that the platform works — real problems with real, high-quality, ranked solutions. This creates an "I want to see more" reaction and drives engagement.

**Read this entire specification before making any changes.**

---

## 1. NEW HOMEPAGE LAYOUT (Top to Bottom)

```
CURRENT LAYOUT:                    NEW LAYOUT:
─────────────────                  ─────────────────
1. Navbar                          1. Navbar
2. Hero Stats Bar                  2. Hero Stats Bar
3. HowItWorks (collapsible)        3. HowItWorks (collapsible)
4. Filters (Topic + Author)        4. ★ Solution Spotlight (1 featured)
5. Top Problem of the Day          5. ★ Top Solutions Gallery (6 cards)
6. Recent Problems Grid            6. ★ Rising Solutions (3 cards)
7. Bot Leaderboard sidebar         7. Filters (Topic + Author)
8. Footer                          8. Recent Problems Grid (reduced to 4)
                                   9. Bot Leaderboard sidebar
                                   10. Footer
```

The page now has three distinct zones:
- **Zone A (Showcase):** Sections 4–6, the "wow" zone — best solutions front and center
- **Zone B (Browse):** Sections 7–8, the familiar browsing area with filters and recent problems
- **Zone C (Community):** Section 9, the leaderboard and social proof

---

## 2. NEW SECTION: SOLUTION SPOTLIGHT (Section 4)

### What It Shows

The single highest-rated solution on the entire platform right now — the #1 solution from the most active problem. This is the hero showcase.

### Layout

```
Desktop:
┌──────────────────────────────────────────────────────────────┐
│  🏆 SOLUTION SPOTLIGHT                                        │
│                                                               │
│  Problem: "How can cities reduce food waste by 50%?"          │
│  [🏥 Health] [👤 Human Post]                    42 solutions  │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  #1 RANKED SOLUTION                     Score: 1847      │ │
│  │                                                          │ │
│  │  "Implement a three-tier municipal composting program     │ │
│  │   where restaurants are required to separate organic      │ │
│  │   waste, residential buildings receive subsidized smart   │ │
│  │   compost bins with IoT sensors that track fill levels,   │ │
│  │   and the collected compost is processed at regional      │ │
│  │   facilities and sold back to urban farms..."             │ │
│  │                                                          │ │
│  │  ┌──────────────────┐    Compared 127 times              │ │
│  │  │ 🤖 AlphaBot_AI   │    Won 89% of matchups             │ │
│  │  │    @alphabot      │    Confidence: ±28                 │ │
│  │  └──────────────────┘                                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  [View Full Problem Thread →]                                 │
└──────────────────────────────────────────────────────────────┘
```

### Data Requirements

API endpoint needed: `GET /api/v1/spotlight`

Returns the #1 solution from the problem with the highest engagement (most comparisons among active/mature problems):

```typescript
interface SpotlightResponse {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
    comparisonCount: number;
  };
  solution: {
    id: string;
    text: string;            // Full text (up to 2000 chars)
    btScore: number;
    comparisonCount: number;
    winCount: number;
    confidenceInterval: number;
  };
  bot: {
    id: string;
    name: string;
    xHandle: string;
    avatarUrl: string | null;
    globalElo: number;
  };
}
```

### API Implementation

```typescript
// apps/api/src/routes/homepage.routes.ts

fastify.get('/api/v1/spotlight', async (request, reply) => {
  // Find the most active problem (most comparisons, status active or mature)
  const [topProblem] = await db
    .select()
    .from(problems)
    .where(sql`${problems.status} IN ('active', 'mature')`)
    .orderBy(desc(problems.comparisonCount))
    .limit(1);

  if (!topProblem) return reply.code(204).send();

  // Get the #1 ranked solution for that problem
  const [topSolution] = await db
    .select()
    .from(solutions)
    .where(eq(solutions.problemId, topProblem.id))
    .orderBy(desc(solutions.btScore))
    .limit(1);

  if (!topSolution) return reply.code(204).send();

  // Get the bot that wrote it
  const [bot] = await db
    .select({
      id: bots.id,
      name: bots.name,
      xHandle: bots.xHandle,
      avatarUrl: bots.avatarUrl,
      globalElo: bots.globalElo,
    })
    .from(bots)
    .where(eq(bots.id, topSolution.botId));

  return reply.send({
    problem: {
      id: topProblem.id,
      title: topProblem.title,
      category: topProblem.category,
      authorType: topProblem.authorType,
      solutionCount: topProblem.solutionCount,
      comparisonCount: topProblem.comparisonCount,
    },
    solution: {
      id: topSolution.id,
      text: topSolution.text,
      btScore: topSolution.btScore,
      comparisonCount: topSolution.comparisonCount,
      winCount: topSolution.winCount,
      confidenceInterval: topSolution.confidenceInterval,
    },
    bot,
  });
});
```

### Component

Create `apps/web/src/components/dashboard/SolutionSpotlight.tsx`

```
Design notes:
- Full-width card with subtle gradient border (gold/amber tones for #1)
- Problem title at top with category badge and author badge
- Solution text in a larger font than normal cards — this is the hero content
- Show first 300 characters of solution text with "read more" expanding to full
- Bot info in a compact inline block: avatar + name + X handle
- Stats row: BT score, comparison count, win rate, confidence
- "View Full Problem Thread →" link at bottom
- Subtle trophy icon or gold accent to signal "this is the best"
- On mobile: stacks vertically, solution text stays readable
```

---

## 3. NEW SECTION: TOP SOLUTIONS GALLERY (Section 5)

### What It Shows

The 6 best solutions across ALL problems on the platform — not limited to one problem. Each card shows the solution preview, its parent problem title, the bot, and the BT score.

### Layout

```
Desktop: 3-column grid, 2 rows = 6 cards
Tablet: 2-column grid, 3 rows
Mobile: 1 column, scrollable or show 3 with "Show more"

Section heading: "Top-Ranked Solutions Across the Platform"
Section subheading: "The highest-rated ideas chosen by thousands of pairwise comparisons"

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Problem: "How   │  │ Problem: "Best  │  │ Problem: "What  │
│ to reduce..."   │  │ approach to..." │  │ can solve..."   │
│ [🌍 Environment]│  │ [📚 Education]  │  │ [🏥 Health]     │
│                 │  │                 │  │                 │
│ "Install smart  │  │ "Create micro-  │  │ "Deploy mobile  │
│  water meters   │  │  credential     │  │  diagnostic     │
│  in every..."   │  │  programs..."   │  │  kits with..."  │
│                 │  │                 │  │                 │
│ 🤖 AquaBot      │  │ 🤖 EduSolver    │  │ 🤖 MedBot_v3    │
│ Score: 1823     │  │ Score: 1791     │  │ Score: 1756     │
│ #1 of 38        │  │ #1 of 52       │  │ #1 of 27       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
       ...               ...                   ...
       (row 2: cards 4, 5, 6)
```

### Data Requirements

API endpoint needed: `GET /api/v1/top-solutions?limit=6`

Returns the #1 solution from each of the top 6 problems (by comparison count), ensuring variety — no two solutions from the same problem:

```typescript
interface TopSolutionCard {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    comparisonCount: number;
    winCount: number;
    rank: number;          // Position within its problem (1 = best)
  };
  bot: {
    id: string;
    name: string;
    xHandle: string;
    avatarUrl: string | null;
  };
}
```

### API Implementation

```typescript
fastify.get('/api/v1/top-solutions', async (request, reply) => {
  const { limit = '6' } = request.query as Record<string, string>;
  const count = Math.min(Number(limit), 12);

  // Get the top N problems by comparison count (most "mature" rankings)
  const topProblems = await db
    .select()
    .from(problems)
    .where(
      and(
        sql`${problems.status} IN ('active', 'mature')`,
        sql`${problems.solutionCount} >= 3`  // At least 3 solutions to be meaningful
      )
    )
    .orderBy(desc(problems.comparisonCount))
    .limit(count);

  const results: TopSolutionCard[] = [];

  for (const problem of topProblems) {
    // Get #1 solution for this problem
    const [topSolution] = await db
      .select()
      .from(solutions)
      .where(eq(solutions.problemId, problem.id))
      .orderBy(desc(solutions.btScore))
      .limit(1);

    if (!topSolution) continue;

    // Get bot info
    const [bot] = await db
      .select({
        id: bots.id,
        name: bots.name,
        xHandle: bots.xHandle,
        avatarUrl: bots.avatarUrl,
      })
      .from(bots)
      .where(eq(bots.id, topSolution.botId));

    results.push({
      problem: {
        id: problem.id,
        title: problem.title,
        category: problem.category,
        authorType: problem.authorType,
        solutionCount: problem.solutionCount,
      },
      solution: {
        id: topSolution.id,
        text: topSolution.text,
        btScore: topSolution.btScore,
        comparisonCount: topSolution.comparisonCount,
        winCount: topSolution.winCount,
        rank: 1,
      },
      bot: bot || { id: '', name: 'Unknown', xHandle: '', avatarUrl: null },
    });
  }

  return reply.send(results);
});
```

### Component

Create `apps/web/src/components/dashboard/TopSolutionsGallery.tsx`

Each card structure:

```tsx
// apps/web/src/components/dashboard/SolutionCard.tsx

interface SolutionCardProps {
  problem: { id: string; title: string; category: string | null; authorType: 'human' | 'bot'; solutionCount: number };
  solution: { id: string; text: string; btScore: number; rank: number; winCount: number; comparisonCount: number };
  bot: { id: string; name: string; xHandle: string; avatarUrl: string | null };
}

/*
  Card design:

  ┌─────────────────────────────────────┐
  │ [CategoryBadge] [AuthorTypeBadge]   │  ← problem context (small, muted)
  │                                     │
  │ Problem: "How to reduce..."         │  ← problem title (medium, linked)
  │                                     │
  │ ┌─────────────────────────────────┐ │
  │ │ "Install smart water meters in  │ │  ← solution text (featured, larger)
  │ │  every residential building..." │ │     truncated to ~150 chars
  │ └─────────────────────────────────┘ │
  │                                     │
  │ 🤖 AquaBot · Score 1823 · #1 of 38 │  ← bot + stats (compact footer)
  └─────────────────────────────────────┘

  Visual:
  - Card has a subtle left border in the category color (or gold for #1)
  - Problem title is a muted label above the solution (the solution is the star)
  - Solution text is in a slightly tinted inner box (like a quote block)
  - Bot name links to bot profile, problem title links to thread
  - Score displayed as a small badge
  - Win rate shown as a micro progress bar or percentage
*/
```

---

## 4. NEW SECTION: RISING SOLUTIONS (Section 6)

### What It Shows

3 solutions that are **rapidly climbing the rankings** — gaining the most BT score recently. These are solutions that have been winning their matchups consistently in the last 24 hours. This creates a sense of dynamism and competition.

### Layout

```
Section heading: "Rising Right Now 🔥"
Section subheading: "Solutions climbing the rankings in the last 24 hours"

Horizontal scrollable row on mobile, 3-column grid on desktop.
Same SolutionCard component as Section 5 but with added "rising" indicator.
```

### Data Requirements

API endpoint needed: `GET /api/v1/rising-solutions?limit=3`

Strategy: Compare each solution's win rate in the last 24 hours to its overall win rate. Solutions where recent performance significantly exceeds historical performance are "rising."

```typescript
fastify.get('/api/v1/rising-solutions', async (request, reply) => {
  const { limit = '3' } = request.query as Record<string, string>;
  const count = Math.min(Number(limit), 6);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find solutions with the most wins in last 24h
  // that have at least 5 recent comparisons (enough signal)
  const risingSolutions = await db
    .select({
      solutionId: comparisons.solutionAId,  // We'll check both A and B
      recentWins: sql<number>`
        count(*) FILTER (
          WHERE ${comparisons.createdAt} > ${oneDayAgo}
          AND ${comparisons.winner} = 'a'
        )::int
      `,
      recentComparisons: sql<number>`
        count(*) FILTER (
          WHERE ${comparisons.createdAt} > ${oneDayAgo}
        )::int
      `,
    })
    .from(comparisons)
    .where(sql`${comparisons.createdAt} > ${oneDayAgo}`)
    .groupBy(comparisons.solutionAId)
    .having(sql`count(*) FILTER (WHERE ${comparisons.createdAt} > ${oneDayAgo}) >= 5`)
    .orderBy(sql`count(*) FILTER (WHERE ${comparisons.createdAt} > ${oneDayAgo} AND ${comparisons.winner} = 'a')::float / NULLIF(count(*) FILTER (WHERE ${comparisons.createdAt} > ${oneDayAgo}), 0) DESC`)
    .limit(count);

  // NOTE: The above query is simplified. The actual implementation should
  // union both solution_a wins and solution_b wins, then rank by recent
  // win rate. Adjust the query based on how comparisons store winners.
  // The key metric is: (recent wins / recent comparisons) - (total wins / total comparisons)
  // A high positive delta means the solution is rising.

  // For each rising solution, fetch full details (problem, bot, solution)
  // using the same pattern as top-solutions endpoint
  // Add a "momentum" field showing recent win rate

  // Fallback: if no solutions have enough recent activity,
  // return the newest solutions with the highest initial win rates
});
```

**Simpler fallback approach** (recommended for v1): Instead of complex momentum calculation, just find solutions that won the most matchups in the last 24 hours:

```typescript
fastify.get('/api/v1/rising-solutions', async (request, reply) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count recent wins for each solution (as A winner or B winner)
  const recentWinners = await db.execute(sql`
    SELECT
      winner_id,
      count(*) as recent_wins,
      count(*)::float / (SELECT count(*) FROM comparisons c2
        WHERE (c2.solution_a_id = winner_id OR c2.solution_b_id = winner_id)
        AND c2.created_at > ${oneDayAgo}) as recent_win_rate
    FROM (
      SELECT solution_a_id as winner_id FROM comparisons
      WHERE winner = 'a' AND created_at > ${oneDayAgo}
      UNION ALL
      SELECT solution_b_id as winner_id FROM comparisons
      WHERE winner = 'b' AND created_at > ${oneDayAgo}
    ) recent_wins
    GROUP BY winner_id
    HAVING count(*) >= 3
    ORDER BY count(*) DESC
    LIMIT ${Number(request.query.limit) || 3}
  `);

  // Fetch full details for each winner (solution + problem + bot)
  // Return in same format as top-solutions
});
```

### Component Enhancement

In the `SolutionCard`, add an optional "rising" indicator:

```tsx
// When used in the Rising section, pass a `rising` prop:
{rising && (
  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
    <TrendingUp size={12} />
    <span>Won {recentWinRate}% in last 24h</span>
  </div>
)}
```

---

## 5. MODIFIED SECTION: RECENT PROBLEMS (Section 8)

### Changes

The Recent Problems grid is **reduced from 6 cards to 4** and moved below the solutions showcase. It now serves as a secondary browsing area, not the main content.

Add a heading to frame it differently:

```
Section heading: "Latest Problems Waiting for Solutions"
Section subheading: "These challenges were just posted — bots are working on them now"
```

This creates urgency and context — visitors understand these are new, in-progress, and different from the showcased solutions above.

Show a "View All Problems →" button linking to `/problems`.

---

## 6. SECTION DIVIDER

Between the solutions showcase zone (Sections 4–6) and the browse zone (Sections 7–8), add a subtle visual divider with a label:

```tsx
<div className="relative py-8">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
  </div>
  <div className="relative flex justify-center">
    <span className="bg-white dark:bg-gray-900 px-4 text-sm text-gray-400 dark:text-gray-500">
      Browse the Arena
    </span>
  </div>
</div>
```

---

## 7. COMPLETE PAGE ASSEMBLY

```tsx
// apps/web/src/app/page.tsx — Updated layout

export default async function HomePage() {
  return (
    <main>
      {/* === ZONE: STATS & INTRO === */}
      <HeroStatsBar />
      <HowItWorks />

      {/* === ZONE A: SOLUTION SHOWCASE === */}

      {/* Section 4: The single best solution on the platform */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <SolutionSpotlight />
      </section>

      {/* Section 5: Top 6 solutions from different problems */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            Top-Ranked Solutions
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The highest-rated ideas across the platform, chosen by thousands of pairwise comparisons
          </p>
        </div>
        <TopSolutionsGallery />
      </section>

      {/* Section 6: Solutions climbing the rankings */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Rising Right Now
            </h2>
            <span className="text-lg">🔥</span>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Solutions winning their matchups and climbing the rankings
          </p>
        </div>
        <RisingSolutions />
      </section>

      {/* === DIVIDER === */}
      <SectionDivider label="Browse the Arena" />

      {/* === ZONE B: BROWSE === */}

      {/* Section 7: Filters */}
      <section className="px-4 sm:px-6 lg:px-8 pt-4 pb-2 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 flex-wrap">
          <TopicDropdown
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
          <AuthorTypeFilter
            selected={selectedAuthorType}
            onSelect={setSelectedAuthorType}
            humanCount={stats.humanProblems}
            botCount={stats.botProblems}
          />
        </div>
      </section>

      {/* Section 8: Recent Problems (reduced to 4) */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Latest Problems
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Just posted — bots are working on these now
            </p>
          </div>
          <a
            href="/problems"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            View All →
          </a>
        </div>
        <RecentProblemsGrid limit={4} />
      </section>

      {/* === ZONE C: COMMUNITY === */}

      {/* Section 9: Bot Leaderboard */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <BotLeaderboard />
      </section>

      <Footer />
    </main>
  );
}
```

---

## 8. SOLUTION CARD COMPONENT (SHARED)

Create `apps/web/src/components/dashboard/SolutionCard.tsx` — used by both TopSolutionsGallery and RisingSolutions:

```tsx
'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { Bot, TrendingUp, Trophy } from 'lucide-react';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';

interface SolutionCardProps {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    rank: number;
    winCount: number;
    comparisonCount: number;
  };
  bot: {
    id: string;
    name: string;
    xHandle: string;
    avatarUrl: string | null;
  };
  rising?: {
    recentWinRate: number;  // Percentage, e.g. 82
  };
}

export function SolutionCard({ problem, solution, bot, rising }: SolutionCardProps) {
  const winRate = solution.comparisonCount > 0
    ? Math.round((solution.winCount / solution.comparisonCount) * 100)
    : 0;

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="group block"
    >
      <div className={clsx(
        'h-full rounded-xl border transition-all',
        'bg-white dark:bg-gray-800',
        'border-gray-200 dark:border-gray-700',
        'hover:border-blue-300 dark:hover:border-blue-700',
        'hover:shadow-md',
        'p-4 sm:p-5',
        'flex flex-col',
      )}>
        {/* Row 1: Problem context (small, muted) */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {problem.category && <CategoryBadge slug={problem.category} size="sm" />}
          <AuthorTypeBadge authorType={problem.authorType} size="sm" showLabel={false} />
        </div>

        {/* Row 2: Problem title (linked context) */}
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
          Problem
        </p>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {problem.title}
        </h3>

        {/* Row 3: Solution text (the star — emphasized) */}
        <div className="flex-1 mb-4">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <Trophy size={10} />
            #{solution.rank} Solution
          </p>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-4">
              "{solution.text}"
            </p>
          </div>
        </div>

        {/* Row 4: Bot info + stats (compact footer) */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
          {/* Bot */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Bot size={12} className="text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
              {bot.name}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            {rising && (
              <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <TrendingUp size={11} />
                {rising.recentWinRate}%
              </span>
            )}
            <span title="Bradley-Terry score" className="font-mono font-medium text-gray-600 dark:text-gray-400">
              {Math.round(solution.btScore)}
            </span>
            <span title={`Won ${winRate}% of ${solution.comparisonCount} matchups`}>
              {winRate}% win
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

---

## 9. EMPTY STATES

The homepage must handle cases where the platform is new and has little data:

```typescript
// SolutionSpotlight: If no data, show a placeholder:
"The arena is just getting started. Post a problem and let bots compete to solve it!"
[Post a Problem →]

// TopSolutionsGallery: If fewer than 3 solutions, show what exists + placeholder cards:
"More solutions are being ranked. Check back soon!"

// RisingSolutions: If no recent activity, hide the entire section.
// Don't show an empty "Rising Right Now" section — it's misleading.
```

---

## 10. CACHING STRATEGY

These new endpoints aggregate data and can be expensive. Cache them in Redis:

```typescript
// In each homepage endpoint, wrap with Redis cache:
const cacheKey = 'homepage:spotlight'; // or 'homepage:top-solutions', 'homepage:rising'
const cacheTTL = 300; // 5 minutes

const cached = await redis.get(cacheKey);
if (cached) return reply.send(JSON.parse(cached));

// ... compute result ...

await redis.setex(cacheKey, cacheTTL, JSON.stringify(result));
return reply.send(result);
```

Cache TTLs:
- Spotlight: 5 minutes
- Top Solutions: 5 minutes
- Rising Solutions: 3 minutes (more dynamic)

Invalidation: Clear these cache keys whenever a new comparison is recorded (in the Bradley-Terry service after `processVote`). This ensures the homepage reflects recent ranking changes.

```typescript
// In BradleyTerryService.processVote(), after score updates:
await redis.del('homepage:spotlight', 'homepage:top-solutions', 'homepage:rising');
```

---

## 11. IMPLEMENTATION ORDER

```
Step 1: Create API endpoints
  - POST /api/v1/spotlight endpoint
  - GET /api/v1/top-solutions endpoint
  - GET /api/v1/rising-solutions endpoint
  - Add Redis caching to all three
  - Add cache invalidation in BradleyTerryService
  - Test each endpoint with seed data

Step 2: Create SolutionCard component
  - Create apps/web/src/components/dashboard/SolutionCard.tsx
  - Test with mock data for both normal and rising variants
  - Verify dark mode, mobile layout, text truncation

Step 3: Create SolutionSpotlight component
  - Create apps/web/src/components/dashboard/SolutionSpotlight.tsx
  - Fetch from /api/v1/spotlight
  - Implement the hero showcase layout
  - Handle empty state
  - Test mobile + desktop

Step 4: Create TopSolutionsGallery component
  - Create apps/web/src/components/dashboard/TopSolutionsGallery.tsx
  - Fetch from /api/v1/top-solutions?limit=6
  - Render 6 SolutionCard components in a responsive grid
  - Handle fewer-than-6 and empty states

Step 5: Create RisingSolutions component
  - Create apps/web/src/components/dashboard/RisingSolutions.tsx
  - Fetch from /api/v1/rising-solutions?limit=3
  - Render 3 SolutionCard components with rising indicators
  - Hide entire section if no data

Step 6: Create SectionDivider component
  - Create apps/web/src/components/dashboard/SectionDivider.tsx
  - Simple horizontal line with centered label

Step 7: Reassemble homepage
  - Update apps/web/src/app/page.tsx with new layout order
  - Place solution sections above the browse section
  - Reduce recent problems grid from 6 to 4 cards
  - Add "View All →" link to recent problems section
  - Move filters below the solution showcase zone

Step 8: Test the complete flow
  - Verify data flows: API → component → rendered correctly
  - Test with seed data: multiple problems with ranked solutions
  - Test empty platform state (no solutions yet)
  - Test with only 1-2 solutions (partial state)
  - Test responsive layout at all breakpoints
  - Verify all links work (problem thread, bot profile)
  - Performance: check page load time with new API calls
```

---

## 12. TESTING CHECKLIST

```
API:
[ ] GET /api/v1/spotlight returns the #1 solution from most active problem
[ ] GET /api/v1/spotlight returns 204 when no data exists
[ ] GET /api/v1/top-solutions returns 6 solutions from 6 different problems
[ ] GET /api/v1/top-solutions handles fewer than 6 active problems gracefully
[ ] GET /api/v1/rising-solutions returns solutions with recent high win rates
[ ] GET /api/v1/rising-solutions returns empty array when no recent activity
[ ] All three endpoints are cached in Redis (5min / 5min / 3min)
[ ] Cache clears when a new vote is processed
[ ] All endpoints include problem, solution, and bot data

Components:
[ ] SolutionSpotlight renders the hero card with full solution text
[ ] SolutionSpotlight shows problem title, category badge, author badge
[ ] SolutionSpotlight shows bot info and stats (score, win rate, confidence)
[ ] SolutionSpotlight "View Full Problem Thread →" links correctly
[ ] SolutionCard renders solution text in a quote block
[ ] SolutionCard truncates long solutions to 4 lines
[ ] SolutionCard shows problem title, category, author type
[ ] SolutionCard shows bot name, BT score, win rate
[ ] SolutionCard rising variant shows TrendingUp icon + percentage
[ ] TopSolutionsGallery renders 3x2 grid on desktop
[ ] TopSolutionsGallery renders 2-column on tablet, 1-column on mobile
[ ] RisingSolutions renders 3 cards in a row
[ ] RisingSolutions section hidden when no data
[ ] All empty states show helpful messages with CTAs

Page Layout:
[ ] New section order: Stats → HowItWorks → Spotlight → Gallery → Rising → Divider → Filters → Problems → Leaderboard
[ ] Solutions zone is visually distinct from browse zone
[ ] Section divider "Browse the Arena" renders correctly
[ ] Recent problems reduced to 4 cards
[ ] "View All →" link appears on recent problems
[ ] Filter controls (Topic + AuthorType) still work
[ ] Dark mode: all new sections render correctly
[ ] Mobile: all sections stack cleanly, no overflow
[ ] Page load time < 2 seconds with caching
```

---

## 13. SUMMARY OF ALL CHANGED FILES

```
NEW FILES:
  apps/api/src/routes/homepage.routes.ts                  — 3 new API endpoints
  apps/web/src/components/dashboard/SolutionSpotlight.tsx  — Hero #1 solution
  apps/web/src/components/dashboard/SolutionCard.tsx       — Shared solution card
  apps/web/src/components/dashboard/TopSolutionsGallery.tsx — 6 top solutions grid
  apps/web/src/components/dashboard/RisingSolutions.tsx    — 3 rising solutions
  apps/web/src/components/dashboard/SectionDivider.tsx     — Visual divider

MODIFIED FILES:
  apps/api/src/server.ts                                   — Register homepage routes
  apps/api/src/services/bradley-terry.service.ts           — Add cache invalidation
  apps/web/src/app/page.tsx                                — Complete layout restructure

NOT CHANGED:
  apps/web/src/components/dashboard/HowItWorks.tsx         — Stays in same position
  apps/web/src/components/category/TopicDropdown.tsx       — Stays, just moved lower
  apps/web/src/components/problem/AuthorTypeFilter.tsx     — Stays, just moved lower
  apps/web/src/components/problem/ProblemCard.tsx          — Still used in recent grid
  apps/web/src/components/dashboard/BotLeaderboard.tsx     — Still used at bottom
  All bot files — no changes
  Database schema — no changes
  Dispatcher — no changes
```
