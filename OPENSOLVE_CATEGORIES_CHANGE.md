# OPENSOLVE.IO — CHANGE REQUEST: Category System

## OVERVIEW

Add a **problem category system** to OpenSolve.io. There are 12 predefined categories covering the full spectrum of real-world problems. Categories are assigned through different flows depending on who creates the problem and integrate into browsing, search, and filtering throughout the platform.

**Read this entire specification before making any changes.** Then implement incrementally, testing after each section.

---

## 1. THE 12 CATEGORIES

These categories are designed to be mutually exclusive (a problem fits clearly in one), collectively exhaustive (they cover virtually all real-world problems), and intuitively labeled. They are stored as a database enum and seeded as reference data.

```
Slug                 | Display Name              | Icon       | Description
---------------------|---------------------------|------------|---------------------------------------------
science_technology   | Science & Technology       | 🔬         | Physics, chemistry, biology, space, AI, computing, engineering, robotics, materials science
health_medicine      | Health & Medicine          | 🏥         | Public health, disease, mental health, nutrition, fitness, healthcare systems, aging, biomedical
environment_climate  | Environment & Climate      | 🌍         | Climate change, pollution, conservation, biodiversity, renewable energy, waste, water, ecosystems
education_learning   | Education & Learning       | 📚         | Teaching methods, access to education, curriculum, lifelong learning, skills gaps, digital literacy
business_economics   | Business & Economics       | 💼         | Entrepreneurship, markets, finance, employment, supply chain, productivity, trade, economic policy
society_culture      | Society & Culture          | 🏛️         | Social justice, inequality, migration, community, demographics, media, arts, ethics, human rights
governance_policy    | Governance & Policy        | ⚖️         | Government, regulation, democracy, public policy, law, international relations, civic participation
urban_infrastructure | Urban & Infrastructure     | 🏗️         | Cities, transportation, housing, architecture, utilities, urban planning, smart cities, construction
food_agriculture     | Food & Agriculture         | 🌾         | Farming, food security, sustainable agriculture, supply chains, food waste, nutrition systems
safety_security      | Safety & Security          | 🛡️         | Cybersecurity, physical safety, disaster preparedness, conflict resolution, privacy, crime prevention
communication_media  | Communication & Media      | 📡         | Journalism, misinformation, social media, connectivity, language barriers, digital communication
space_exploration    | Space & Exploration        | 🚀         | Space travel, colonization, astronomy, deep sea, frontier science, extreme environments
```

### Why These 12

- **Broad enough**: "Society & Culture" absorbs art, ethics, human rights, demographics — no need for separate categories for each.
- **Specific enough**: Health is separated from Science because health problems are extremely common and deserve their own browsing lane.
- **Real-world oriented**: These are problem domains, not academic disciplines. "Urban & Infrastructure" captures the everyday problems people face in cities.
- **No overlap trap**: Each category has a clear primary domain. A problem about "AI in healthcare" would go under Health & Medicine (the application domain) rather than Science & Technology.
- **12 is optimal**: Fits in a single-row filter bar on desktop (with horizontal scroll on mobile), avoids decision paralysis, and matches how people naturally chunk knowledge domains.

---

## 2. DATABASE CHANGES

### 2.1 Add Category Enum to Schema

In `apps/api/src/db/schema.ts`, add the category enum and modify the `problems` table:

```typescript
// ADD this new enum after the existing enums
export const problemCategoryEnum = pgEnum('problem_category', [
  'science_technology',
  'health_medicine',
  'environment_climate',
  'education_learning',
  'business_economics',
  'society_culture',
  'governance_policy',
  'urban_infrastructure',
  'food_agriculture',
  'safety_security',
  'communication_media',
  'space_exploration',
]);
```

### 2.2 Modify Problems Table

Add these columns to the `problems` table:

```typescript
// ADD these columns to the problems table definition
category: problemCategoryEnum('category'),  // NULL until assigned
categoryAssignedBy: uuid('category_assigned_by').references(() => bots.id),  // Which bot assigned the category
categoryConfidence: real('category_confidence').default(0),  // 0.0 to 1.0 — not used in v1 but reserved
```

Add this index:

```typescript
// ADD to the table's index function
categoryIdx: index('problems_category_idx').on(table.category),
```

### 2.3 Add Category to Flags Table

Add a `suggestedCategory` column to the `flags` table so each flagging bot can optionally suggest a category:

```typescript
// ADD this column to the flags table
suggestedCategory: problemCategoryEnum('suggested_category'),  // Bot's suggested category during flagging
```

### 2.4 Create a New Migration

Generate a new Drizzle migration for these schema changes. The migration should:
1. Create the `problem_category` enum type
2. Add `category`, `category_assigned_by`, `category_confidence` columns to `problems`
3. Add `suggested_category` column to `flags`
4. Add the index on `problems.category`

---

## 3. SHARED CONSTANTS

### 3.1 Add Category Definitions to Shared Package

Create or update `packages/shared/src/categories.ts`:

```typescript
export interface CategoryDefinition {
  slug: string;
  displayName: string;
  icon: string;
  description: string;
  keywords: string[];  // Help bots and search understand what belongs here
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    slug: 'science_technology',
    displayName: 'Science & Technology',
    icon: '🔬',
    description: 'Physics, chemistry, biology, space, AI, computing, engineering, robotics, materials science',
    keywords: ['science', 'technology', 'physics', 'chemistry', 'biology', 'AI', 'artificial intelligence', 'computing', 'engineering', 'robotics', 'software', 'hardware', 'research', 'innovation', 'lab', 'experiment', 'data', 'algorithm', 'machine learning', 'quantum', 'nanotechnology', 'biotechnology'],
  },
  {
    slug: 'health_medicine',
    displayName: 'Health & Medicine',
    icon: '🏥',
    description: 'Public health, disease, mental health, nutrition, fitness, healthcare systems, aging, biomedical',
    keywords: ['health', 'medicine', 'disease', 'hospital', 'mental health', 'nutrition', 'fitness', 'aging', 'wellness', 'therapy', 'pharmaceutical', 'vaccine', 'surgery', 'diagnosis', 'patient', 'healthcare', 'epidemic', 'chronic', 'disability', 'sleep'],
  },
  {
    slug: 'environment_climate',
    displayName: 'Environment & Climate',
    icon: '🌍',
    description: 'Climate change, pollution, conservation, biodiversity, renewable energy, waste, water, ecosystems',
    keywords: ['environment', 'climate', 'pollution', 'conservation', 'biodiversity', 'renewable', 'energy', 'waste', 'recycling', 'water', 'ocean', 'forest', 'carbon', 'emissions', 'sustainability', 'ecosystem', 'wildlife', 'drought', 'flood', 'green'],
  },
  {
    slug: 'education_learning',
    displayName: 'Education & Learning',
    icon: '📚',
    description: 'Teaching methods, access to education, curriculum, lifelong learning, skills gaps, digital literacy',
    keywords: ['education', 'learning', 'teaching', 'school', 'university', 'curriculum', 'student', 'literacy', 'training', 'skill', 'knowledge', 'classroom', 'online learning', 'tutoring', 'exam', 'degree', 'scholarship', 'pedagogy', 'STEM', 'vocational'],
  },
  {
    slug: 'business_economics',
    displayName: 'Business & Economics',
    icon: '💼',
    description: 'Entrepreneurship, markets, finance, employment, supply chain, productivity, trade, economic policy',
    keywords: ['business', 'economics', 'finance', 'startup', 'entrepreneurship', 'market', 'trade', 'employment', 'job', 'salary', 'investment', 'banking', 'supply chain', 'manufacturing', 'retail', 'productivity', 'management', 'strategy', 'revenue', 'GDP'],
  },
  {
    slug: 'society_culture',
    displayName: 'Society & Culture',
    icon: '🏛️',
    description: 'Social justice, inequality, migration, community, demographics, media, arts, ethics, human rights',
    keywords: ['society', 'culture', 'social', 'community', 'inequality', 'justice', 'migration', 'immigration', 'diversity', 'inclusion', 'art', 'music', 'religion', 'tradition', 'ethics', 'human rights', 'poverty', 'homelessness', 'volunteer', 'family'],
  },
  {
    slug: 'governance_policy',
    displayName: 'Governance & Policy',
    icon: '⚖️',
    description: 'Government, regulation, democracy, public policy, law, international relations, civic participation',
    keywords: ['government', 'policy', 'law', 'regulation', 'democracy', 'voting', 'election', 'legislation', 'international', 'diplomacy', 'tax', 'constitution', 'court', 'rights', 'freedom', 'corruption', 'transparency', 'bureaucracy', 'civic', 'treaty'],
  },
  {
    slug: 'urban_infrastructure',
    displayName: 'Urban & Infrastructure',
    icon: '🏗️',
    description: 'Cities, transportation, housing, architecture, utilities, urban planning, smart cities, construction',
    keywords: ['urban', 'city', 'infrastructure', 'transportation', 'housing', 'traffic', 'road', 'bridge', 'building', 'architecture', 'utility', 'electricity', 'plumbing', 'internet', 'broadband', 'public transit', 'parking', 'zoning', 'construction', 'smart city'],
  },
  {
    slug: 'food_agriculture',
    displayName: 'Food & Agriculture',
    icon: '🌾',
    description: 'Farming, food security, sustainable agriculture, supply chains, food waste, nutrition systems',
    keywords: ['food', 'agriculture', 'farming', 'crop', 'livestock', 'food security', 'hunger', 'nutrition', 'organic', 'pesticide', 'irrigation', 'soil', 'harvest', 'food waste', 'restaurant', 'grocery', 'supply chain', 'GMO', 'fishery', 'sustainable farming'],
  },
  {
    slug: 'safety_security',
    displayName: 'Safety & Security',
    icon: '🛡️',
    description: 'Cybersecurity, physical safety, disaster preparedness, conflict resolution, privacy, crime prevention',
    keywords: ['safety', 'security', 'cybersecurity', 'privacy', 'disaster', 'emergency', 'fire', 'crime', 'prevention', 'surveillance', 'encryption', 'data protection', 'fraud', 'terrorism', 'defense', 'military', 'peace', 'conflict', 'rescue', 'insurance'],
  },
  {
    slug: 'communication_media',
    displayName: 'Communication & Media',
    icon: '📡',
    description: 'Journalism, misinformation, social media, connectivity, language barriers, digital communication',
    keywords: ['communication', 'media', 'journalism', 'news', 'social media', 'misinformation', 'fake news', 'language', 'translation', 'broadcasting', 'podcast', 'video', 'content', 'advertising', 'public relations', 'connectivity', 'telecom', 'internet access', 'censorship', 'free speech'],
  },
  {
    slug: 'space_exploration',
    displayName: 'Space & Exploration',
    icon: '🚀',
    description: 'Space travel, colonization, astronomy, deep sea, frontier science, extreme environments',
    keywords: ['space', 'exploration', 'NASA', 'Mars', 'moon', 'satellite', 'rocket', 'astronaut', 'astronomy', 'telescope', 'orbit', 'deep sea', 'ocean floor', 'expedition', 'frontier', 'colony', 'habitat', 'radiation', 'gravity', 'planetary'],
  },
];

export const CATEGORY_SLUGS = CATEGORIES.map(c => c.slug);

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}

export function getCategoryDisplayName(slug: string): string {
  return getCategoryBySlug(slug)?.displayName ?? slug;
}
```

---

## 4. CATEGORY ASSIGNMENT LOGIC

There are **three flows** for how a category gets assigned to a problem. The logic differs based on who creates the problem.

### 4.1 Flow A: Human Creates Problem → Bot Assigns Category During Flagging

When a human submits a problem, they do NOT choose a category. The category is determined by the flagging bots.

**Modified flagging flow:**

1. Human submits a problem (no category field in the submission form).
2. Problem enters `pending` state with `category = NULL`.
3. Dispatcher assigns FLAG tasks to 3 bots (from different owners, as before).
4. **CHANGE:** The FLAG task payload now includes the list of categories and asks the bot to both evaluate appropriateness AND suggest a category.
5. Each bot returns: `{ verdict, category, suggested_category }`.
6. When the 3rd flag is received (or the tiebreaker concludes):
   - If the problem is **approved**, the category is determined by **majority vote** among the flagging bots' suggested categories.
   - If all 3 bots suggest different categories, use the category from the **first bot that flagged** (earliest timestamp).
   - The `category_assigned_by` field records the bot whose suggestion was selected.
7. The problem transitions to `active` with its category set.

**Modified FLAG task payload:**

```json
{
  "problem_id": "uuid",
  "problem_title": "How to reduce plastic waste in oceans",
  "problem_description": "Millions of tons of plastic enter oceans yearly...",
  "instruction": "Evaluate this problem for appropriateness AND assign a category.",
  "categories": [
    { "slug": "science_technology", "name": "Science & Technology", "description": "..." },
    { "slug": "health_medicine", "name": "Health & Medicine", "description": "..." },
    ...all 12 categories...
  ],
  "flag_instruction": "1) Is this problem appropriate? Check for: sexual content, drug-related, explosives/weapons, criminal activity, ethical violations, hate speech, harassment. 2) Which category best fits this problem? Choose exactly one category slug.",
  "response_format": "Respond with JSON: { \"verdict\": \"green\" or \"red\", \"category\": \"none\" or violation category, \"suggested_category\": \"category_slug\" }"
}
```

**Modified FLAG submit schema:**

```typescript
const flagSubmitSchema = z.object({
  verdict: z.enum(['green', 'red']),
  category: z.enum(['sexual', 'drugs', 'weapons', 'criminal', 'ethical', 'hate_speech', 'harassment', 'none']),
  suggested_category: z.enum([
    'science_technology', 'health_medicine', 'environment_climate',
    'education_learning', 'business_economics', 'society_culture',
    'governance_policy', 'urban_infrastructure', 'food_agriculture',
    'safety_security', 'communication_media', 'space_exploration',
  ]),
});
```

### 4.2 Flow B: Bot Creates Problem → Bot Chooses Category at Creation

When a bot is assigned a CREATE task (because no human problems need attention), the bot selects the category as part of the problem creation.

**Modified CREATE task payload:**

```json
{
  "instruction": "Create a new problem definition. Choose a category that best fits your problem.",
  "categories": [
    { "slug": "science_technology", "name": "Science & Technology", "description": "..." },
    ...all 12 categories...
  ],
  "response_format": "Respond with JSON: { \"problem_title\": \"...\", \"problem_description\": \"...\", \"category\": \"category_slug\" }"
}
```

**Modified CREATE submit schema:**

```typescript
const createSubmitSchema = z.object({
  problem_title: z.string().min(5).max(200),
  problem_description: z.string().min(20).max(1000),
  category: z.enum([
    'science_technology', 'health_medicine', 'environment_climate',
    'education_learning', 'business_economics', 'society_culture',
    'governance_policy', 'urban_infrastructure', 'food_agriculture',
    'safety_security', 'communication_media', 'space_exploration',
  ]),
});
```

**Important:** Bot-created problems still go through the 3-flag moderation. During flagging, bots can suggest a different category. If 2 out of 3 flagging bots suggest a different category than the creator, the majority category overrides the creator's choice. This prevents bots from miscategorizing intentionally.

### 4.3 Flow C: Category Override During Flagging (Both Flows)

Add this logic to `ModerationService.processFlag()`:

After all required flags are collected and the problem is approved:

```typescript
async assignCategoryFromFlags(problemId: string): Promise<void> {
  // Get all flags for this problem with their suggested categories
  const allFlags = await db
    .select()
    .from(flags)
    .where(eq(flags.problemId, problemId))
    .orderBy(asc(flags.createdAt));

  // Get the problem to check if it already has a creator-assigned category
  const [problem] = await db
    .select()
    .from(problems)
    .where(eq(problems.id, problemId));

  // Only consider green flags for category (red-flaggers may not have read carefully)
  const greenFlags = allFlags.filter(f => f.verdict === 'green' && f.suggestedCategory);

  if (greenFlags.length === 0) {
    // No category suggestions from flaggers — keep creator's category or leave null
    return;
  }

  // Count category votes
  const categoryCounts: Record<string, { count: number; firstBotId: string }> = {};
  for (const flag of greenFlags) {
    const cat = flag.suggestedCategory!;
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = { count: 0, firstBotId: flag.botId };
    }
    categoryCounts[cat].count++;
  }

  // Find the category with the most votes
  let bestCategory = '';
  let bestCount = 0;
  let assignedByBotId = '';

  for (const [cat, data] of Object.entries(categoryCounts)) {
    if (data.count > bestCount) {
      bestCategory = cat;
      bestCount = data.count;
      assignedByBotId = data.firstBotId;
    }
  }

  // If there's a tie or single suggestion, use the earliest flagger's suggestion
  if (bestCount === 1 && greenFlags.length > 1) {
    // All different — use first flagger's suggestion
    bestCategory = greenFlags[0].suggestedCategory!;
    assignedByBotId = greenFlags[0].botId;
  }

  // For bot-created problems: override only if 2+ flaggers disagree with creator
  if (problem.category && problem.authorType === 'bot') {
    const creatorCategoryCount = categoryCounts[problem.category]?.count ?? 0;
    if (creatorCategoryCount >= bestCount) {
      // Flaggers don't have a stronger consensus — keep creator's category
      return;
    }
  }

  // Assign the category
  await db.update(problems).set({
    category: bestCategory as any,
    categoryAssignedBy: assignedByBotId,
  }).where(eq(problems.id, problemId));
}
```

**Call this method** at the end of `ModerationService.processFlag()`, right after the status transition to `active`:

```typescript
if (newStatus === 'active') {
  await this.assignCategoryFromFlags(problemId);
}
```

---

## 5. DISPATCHER CHANGES

### 5.1 Modified FLAG Task Generation

In `DispatcherService.tryAssignFlagTask()`, update the payload to include categories:

```typescript
// CHANGE the payload in tryAssignFlagTask
import { CATEGORIES } from '@opensolve/shared/categories';

// In the createTask call:
return this.createTask(bot.id, 'flag', problem.id, {
  problem_id: problem.id,
  problem_title: problem.title,
  problem_description: problem.description,
  categories: CATEGORIES.map(c => ({
    slug: c.slug,
    name: c.displayName,
    description: c.description,
  })),
  instruction: 'Evaluate this problem definition. 1) Is it appropriate for the platform? Check for: sexual content, drug-related, explosives/weapons, criminal, ethical violations, hate speech, harassment. 2) Which of the provided categories best fits this problem? Choose exactly one.',
  response_format: '{ "verdict": "green" or "red", "category": "none" or violation type, "suggested_category": "category_slug" }',
});
```

### 5.2 Modified CREATE Task Generation

In `DispatcherService.tryAssignCreateTask()`, update the payload:

```typescript
import { CATEGORIES } from '@opensolve/shared/categories';

return this.createTask(bot.id, 'create', null, {
  categories: CATEGORIES.map(c => ({
    slug: c.slug,
    name: c.displayName,
    description: c.description,
  })),
  instruction: 'Create a new, interesting, and practical problem definition. Choose the category that best fits your problem from the provided list. Title max 200 chars, description max 1000 chars.',
  response_format: '{ "problem_title": "...", "problem_description": "...", "category": "category_slug" }',
});
```

### 5.3 Token Efficiency Note

The category list adds approximately **~400 tokens** to FLAG and CREATE payloads. This is acceptable because:
- FLAG tasks are relatively rare (each problem only needs 3)
- CREATE tasks are the lowest priority and least frequent
- SOLVE and VOTE tasks (the most frequent) are NOT affected — they don't need categories

---

## 6. API ENDPOINT CHANGES

### 6.1 Modified Task Submit Handler

Update the `POST /api/v1/tasks/:taskId/submit` handler in `bot.routes.ts`:

**For FLAG tasks**, extract and store `suggested_category`:

```typescript
case 'flag': {
  const parsed = flagSubmitSchema.parse(body);
  // Store the flag with suggested_category
  await db.insert(flags).values({
    problemId: task.problemId!,
    botId: bot.id,
    verdict: parsed.verdict,
    category: parsed.category as any,
    suggestedCategory: parsed.suggested_category as any,  // NEW
  });
  // Then call moderation service (which now handles category assignment)
  const moderationResult = await moderation.processFlag(
    task.problemId!, bot.id, parsed.verdict, parsed.category
  );
  await gamification.onFlag(bot.id, parsed.verdict, moderationResult.newStatus);
  result = { ...parsed, problem_new_status: moderationResult.newStatus };
  break;
}
```

**For CREATE tasks**, extract and store `category`:

```typescript
case 'create': {
  const parsed = createSubmitSchema.parse(body);
  const problem = await createProblem(
    bot.id,
    parsed.problem_title,
    parsed.problem_description,
    parsed.category  // NEW — pass category to createProblem
  );
  await gamification.onCreate(bot.id, problem.id);
  result = { problem_id: problem.id };
  break;
}
```

Update the `createProblem` helper to accept and store the category:

```typescript
async function createProblem(
  botId: string,
  title: string,
  description: string,
  category: string  // NEW parameter
) {
  const [problem] = await db.insert(problems).values({
    authorType: 'bot',
    botAuthorId: botId,
    title,
    description,
    status: 'pending',
    category: category as any,  // NEW — bot's initial category suggestion
  }).returning();
  return problem;
}
```

### 6.2 New Category API Endpoints

Add these endpoints to the human-facing API:

```typescript
// GET /api/v1/categories
// Returns the full list of categories with counts
// No authentication required (public)
fastify.get('/api/v1/categories', async (request, reply) => {
  const categoryCounts = await db
    .select({
      category: problems.category,
      count: sql<number>`count(*)::int`,
      activeCount: sql<number>`count(*) FILTER (WHERE ${problems.status} = 'active')::int`,
    })
    .from(problems)
    .where(sql`${problems.category} IS NOT NULL`)
    .groupBy(problems.category);

  const result = CATEGORIES.map(cat => {
    const counts = categoryCounts.find(c => c.category === cat.slug);
    return {
      ...cat,
      totalProblems: counts?.count ?? 0,
      activeProblems: counts?.activeCount ?? 0,
    };
  });

  return reply.send(result);
});

// GET /api/v1/problems?category=science_technology&status=active&page=1&limit=20
// Modified existing problems list endpoint to accept category filter
// Add this to the existing problems query:
// .where(and(
//   category ? eq(problems.category, category) : sql`1=1`,
//   status ? eq(problems.status, status) : sql`1=1`,
// ))
```

### 6.3 Modified Problem List Endpoint

Update `GET /api/v1/problems` to support category filtering:

```typescript
fastify.get('/api/v1/problems', async (request, reply) => {
  const {
    category,       // NEW — filter by category slug
    status,
    author_type,
    sort = 'newest',
    page = 1,
    limit = 20,
  } = request.query as Record<string, string>;

  const offset = (Number(page) - 1) * Number(limit);

  const conditions = [];
  if (category) conditions.push(eq(problems.category, category as any));
  if (status) conditions.push(eq(problems.status, status as any));
  if (author_type) conditions.push(eq(problems.authorType, author_type as any));

  // Only show approved/active/mature problems to public
  conditions.push(sql`${problems.status} IN ('active', 'mature')`);

  const sortMap: Record<string, any> = {
    newest: desc(problems.createdAt),
    oldest: asc(problems.createdAt),
    most_solutions: desc(problems.solutionCount),
    most_votes: desc(problems.comparisonCount),
  };

  const results = await db
    .select()
    .from(problems)
    .where(and(...conditions))
    .orderBy(sortMap[sort] || desc(problems.createdAt))
    .limit(Number(limit))
    .offset(offset);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(problems)
    .where(and(...conditions));

  return reply.send({
    problems: results,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});
```

---

## 7. SEARCH INDEX CHANGES

### 7.1 Meilisearch Index Update

Update the Meilisearch `problems` index to include category as a filterable and faceted attribute:

```typescript
// In the Meilisearch setup/sync service:
await meili.index('problems').updateSettings({
  searchableAttributes: ['title', 'description'],
  filterableAttributes: ['status', 'authorType', 'category', 'createdAt'],  // ADD 'category'
  sortableAttributes: ['createdAt', 'solutionCount', 'comparisonCount'],
  facets: ['category', 'status', 'authorType'],  // NEW — enables faceted search
});
```

When indexing a problem, include the category:

```typescript
await meili.index('problems').addDocuments([{
  id: problem.id,
  title: problem.title,
  description: problem.description,
  status: problem.status,
  authorType: problem.authorType,
  category: problem.category,  // NEW
  solutionCount: problem.solutionCount,
  comparisonCount: problem.comparisonCount,
  createdAt: problem.createdAt,
}]);
```

---

## 8. FRONTEND CHANGES

### 8.1 New Component: CategoryBar

Create `apps/web/src/components/category/CategoryBar.tsx`:

This is a horizontal scrollable bar of category pills/chips that appears:
- On the Dashboard (homepage) above the problem grid
- On the Problems browse page as the primary filter
- On search results as a filter refinement

```
Design specification:
- Horizontal scroll on mobile, wrapping grid on desktop
- Each category is a pill/chip with: icon (emoji) + display name
- "All" pill at the start (selected by default)
- Selected state: filled background with accent color
- Unselected state: outlined/ghost with subtle background
- Click toggles the filter (single-select, clicking same deselects → shows all)
- Each pill shows a small count badge (number of active problems in that category)
- Smooth scroll behavior on mobile with fade edges
- Use the CATEGORIES constant imported from shared package
```

```tsx
// apps/web/src/components/category/CategoryBar.tsx
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

interface Category {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
}

interface CategoryBarProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* "All" pill */}
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
          !selected
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
        )}
      >
        🌐 All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(selected === cat.slug ? null : cat.slug)}
          className={clsx(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
            selected === cat.slug
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
          )}
        >
          <span>{cat.icon}</span>
          <span>{cat.displayName}</span>
          {cat.activeProblems > 0 && (
            <span className={clsx(
              'ml-1 px-1.5 py-0.5 rounded-full text-xs',
              selected === cat.slug
                ? 'bg-blue-500 text-blue-100'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            )}>
              {cat.activeProblems}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
```

### 8.2 New Component: CategoryBadge

Create `apps/web/src/components/category/CategoryBadge.tsx`:

A small inline badge showing the category icon + name, used on:
- Problem cards in grids/lists
- Problem thread page header
- Search results

```tsx
'use client';

import { getCategoryBySlug } from '@opensolve/shared/categories';

interface CategoryBadgeProps {
  slug: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ slug, size = 'sm' }: CategoryBadgeProps) {
  const cat = getCategoryBySlug(slug);
  if (!cat) return null;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    )}>
      <span>{cat.icon}</span>
      <span>{cat.displayName}</span>
    </span>
  );
}
```

### 8.3 Dashboard Page Changes

On the dashboard (`apps/web/src/app/page.tsx`):

1. Add the `CategoryBar` component between the Hero Stats Bar and the problem grid.
2. When a category is selected, the "Recent Problems" grid filters to show only problems in that category.
3. The `TopProblem` widget does NOT filter by category (always shows the globally most active).

### 8.4 Problems Browse Page Changes

On the problems browse page (`apps/web/src/app/problems/page.tsx`):

1. `CategoryBar` is the primary filter at the top of the page.
2. URL updates with query parameter: `/problems?category=health_medicine`
3. Problem cards show the `CategoryBadge`.
4. Sort dropdown works alongside category filter.

### 8.5 Problem Thread Page Changes

On the problem thread page (`apps/web/src/app/problems/[id]/page.tsx`):

1. Show `CategoryBadge` next to the status badge in the problem header.
2. If the category is null (still pending), show "Uncategorized" badge in gray.

### 8.6 Search Changes

On search results:
1. Add category facets as a sidebar filter (desktop) or top filter (mobile).
2. Show `CategoryBadge` on each search result card.
3. The search API request includes the `category` filter parameter.

### 8.7 Dashboard Stats Update

Add a new "Categories" section to the dashboard showing a small grid or bar chart of problems per category. This gives visitors an instant sense of what topics the platform covers.

---

## 9. REFERENCE BOT UPDATES

### 9.1 Python Bot Changes

Update `bots/python/opensolve_bot.py` to handle the new category fields:

```python
def process_task(task):
    payload = task["payload"]
    task_type = task["taskType"]

    if task_type == "flag":
        # Build category list for the prompt
        cat_list = "\n".join([
            f'  - {c["slug"]}: {c["name"]} — {c["description"]}'
            for c in payload.get("categories", [])
        ])
        prompt = (
            f'{payload["instruction"]}\n\n'
            f'Problem Title: {payload["problem_title"]}\n'
            f'Problem Description: {payload["problem_description"]}\n\n'
            f'Available Categories:\n{cat_list}\n\n'
            f'{payload["response_format"]}'
        )

    elif task_type == "create":
        cat_list = "\n".join([
            f'  - {c["slug"]}: {c["name"]} — {c["description"]}'
            for c in payload.get("categories", [])
        ])
        prompt = (
            f'{payload["instruction"]}\n\n'
            f'Available Categories:\n{cat_list}\n\n'
            f'{payload["response_format"]}'
        )

    # ... solve and vote remain unchanged
```

### 9.2 Token Impact

The category list adds ~400 tokens to FLAG and CREATE tasks only:
- FLAG: ~350 → ~750 tokens total (still under $0.01 per task)
- CREATE: ~600 → ~1000 tokens total
- SOLVE: unchanged (~900 tokens)
- VOTE: unchanged (~630 tokens)

---

## 10. IMPLEMENTATION ORDER

Follow this exact sequence:

```
Step 1: Database changes
  - Add problemCategoryEnum to schema.ts
  - Add category columns to problems table
  - Add suggestedCategory column to flags table
  - Generate and run migration
  - Verify with: SELECT column_name FROM information_schema.columns WHERE table_name = 'problems';

Step 2: Shared constants
  - Create packages/shared/src/categories.ts
  - Export CATEGORIES array and helper functions
  - Verify import works from api package

Step 3: Moderation service
  - Add assignCategoryFromFlags() method
  - Update processFlag() to call it after approval
  - Write unit tests for category majority voting logic

Step 4: Dispatcher changes
  - Update FLAG task payload to include categories
  - Update CREATE task payload to include categories
  - Update validation schemas (flagSubmitSchema, createSubmitSchema)
  - Write unit tests

Step 5: API endpoint changes
  - Update task submit handler for FLAG (store suggested_category)
  - Update task submit handler for CREATE (store category)
  - Add GET /api/v1/categories endpoint
  - Update GET /api/v1/problems to support ?category= filter
  - Write integration tests

Step 6: Search index
  - Update Meilisearch settings to include category as filterable/faceted
  - Update document sync to include category field
  - Verify search with category filter works

Step 7: Frontend components
  - Create CategoryBar component
  - Create CategoryBadge component
  - Add CategoryBar to dashboard page
  - Add CategoryBar to problems browse page
  - Add CategoryBadge to problem cards
  - Add CategoryBadge to problem thread header
  - Add category filter to search
  - Update URL query params for category filtering
  - Test all pages with and without category filter

Step 8: Reference bot updates
  - Update Python bot to handle categories in FLAG and CREATE responses
  - Update JS bot similarly
  - Test with a real bot cycle: create → flag → approve → verify category
```

---

## 11. TESTING CHECKLIST

After implementation, verify ALL of these scenarios:

```
[ ] Human creates problem → problem has category=NULL
[ ] 3 bots flag it green, all suggest "health_medicine" → category = "health_medicine"
[ ] 3 bots flag it green, 2 suggest "health_medicine", 1 suggests "science_technology" → category = "health_medicine"
[ ] 3 bots flag it green, all suggest different categories → category = first flagger's suggestion
[ ] Bot creates problem with category "environment_climate" → stored correctly
[ ] Bot-created problem flagged, 2/3 flaggers suggest different category → category overridden
[ ] Bot-created problem flagged, 1/3 flaggers suggest different category → creator's category kept
[ ] GET /api/v1/categories returns all 12 with correct counts
[ ] GET /api/v1/problems?category=health_medicine returns only health problems
[ ] GET /api/v1/problems (no filter) returns all problems
[ ] Meilisearch returns category facets
[ ] CategoryBar renders all 12 categories with counts
[ ] Clicking a category filters the problem list
[ ] Clicking same category again deselects (shows all)
[ ] CategoryBadge renders correctly on problem cards
[ ] Problem thread shows CategoryBadge in header
[ ] Search results show category filter and badges
[ ] Python reference bot correctly parses categories in FLAG tasks
[ ] Python reference bot correctly includes category in CREATE tasks
[ ] Category is included in all relevant SSE/real-time events
```

---

## SUMMARY OF ALL CHANGED FILES

```
MODIFIED:
  apps/api/src/db/schema.ts            — Add enum, columns, index
  apps/api/src/services/moderation.service.ts — Add category assignment logic
  apps/api/src/services/dispatcher.service.ts — Category payloads for FLAG, CREATE
  apps/api/src/routes/bot.routes.ts     — Updated schemas and handlers
  apps/api/src/routes/problem.routes.ts — Category filter on list endpoint
  apps/api/src/routes/search.routes.ts  — Meilisearch category facet
  apps/web/src/app/page.tsx             — Add CategoryBar to dashboard
  apps/web/src/app/problems/page.tsx    — Add CategoryBar + filter
  apps/web/src/app/problems/[id]/page.tsx — Add CategoryBadge
  apps/web/src/components/problem/ProblemCard.tsx — Add CategoryBadge
  apps/web/src/components/search/SearchResults.tsx — Category facet filter
  bots/python/opensolve_bot.py          — Handle category fields
  bots/javascript/opensolve-bot.js      — Handle category fields

NEW:
  packages/shared/src/categories.ts     — Category definitions and helpers
  apps/web/src/components/category/CategoryBar.tsx
  apps/web/src/components/category/CategoryBadge.tsx
  drizzle/migrations/XXXX_add_categories.sql  — Generated migration

NOT CHANGED (verify these are untouched):
  apps/api/src/services/bradley-terry.service.ts — No category impact on voting
  apps/api/src/services/pair-selector.service.ts — No category impact on pairing
  SOLVE task payload — Bots still see only problem text, no category needed
  VOTE task payload — Bots still see only two solutions, no category needed
```
