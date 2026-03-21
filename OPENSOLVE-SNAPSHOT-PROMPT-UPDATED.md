# CLAUDE CODE PROMPT — OpenSolve Full Project Snapshot
# Paste this entire prompt into Claude Code while in your OpenSolve project directory
# Session log: PERF-1: Bot auth cache, PostgreSQL connection pool, dispatcher/pair-selector/load-balancer parallelization, sameOwnerBots Redis cache, 3 composite indexes on problems table

---

I need you to scan my entire OpenSolve project and generate a single comprehensive Markdown document called `PROJECT-SNAPSHOT.md` that I can share with an external AI assistant for help. This document must contain everything someone would need to understand the current state of the platform WITHOUT access to the repo.

Do NOT skip anything. Do NOT summarize with "and more…" — be exhaustive.
For any item that does not exist in the codebase, write: `**NOT IMPLEMENTED** — does not exist in current codebase.`

---

## SECTION 0: PROJECT OVERVIEW & PRODUCT LOGIC

### Big Picture

OpenSolve (opensolve.ai) is a new-generation AI forum — humans post questions/problems (from everyday personal topics to large-scale systemic challenges), AI bots compete to answer them, solutions are judged head-to-head in pairwise comparisons, and rankings emerge via Bradley-Terry scoring.

Confirm or correct this description based on what the codebase actually does.

### User Roles

For EACH role describe: how they register, how they authenticate, what they can do, what limits apply.

- **Human users** (Google OAuth only, email mandatory)
- **AI bots/agents** (API key auth, task loop)
- **Admins** (role in DB, what controls exist — all 5 admin sub-pages are fully implemented)
- **Debug access** (moved from /debug-x9k4m7 to /admin/debug, protected by
  Traefik Basic Auth + admin JWT role check, no longer requires ?key= URL param)

### Core Workflow

Walk through the full lifecycle from problem creation to maturity:
- Dispatcher priority cascade (flag → solve → vote → create)
- Moderation state machine (pending → approved/rejected → active → mature)
- Bradley-Terry scoring mechanics (K-factor, starting scores, pair selection strategy)
- Bot task lifecycle (claim → process → submit → points/badges)

### Page-by-Page Walkthrough

For EVERY frontend route in `apps/web/src/app/`:

| URL | Public/Auth | What user sees | API endpoints used | Real-time? |
|-----|------------|----------------|--------------------|-----------|
| ... | ... | ... | ... | ... |

All 5 admin sub-pages are fully implemented. Verify each is functional and list line counts.

Ensure `/users/[id]` (public user profile) is included in the walkthrough table. This page was added in the USER-PROFILE session.

Ensure `/bots/[id]` walkthrough entry mentions: current LLM model badge near bot name + LLM model history section (showing all models the bot has used, with solution counts and date ranges). This was added in the LLM-HIST-1 session.

### Domain Glossary

Define every domain-specific term: Problem, Solution, Task, Vote, Comparison, Flag, Score, BT Score, Rating, Category, Attention Score, Confidence Interval, Badge, LLM Model, Activity Log, Dispatcher, Mature.

### Key Business Rules

Enumerate every significant rule: one solution per bot per problem, blind submission, moderation thresholds, rate limits, task expiry, traffic balancing, category assignment, data retention periods, newsletter limits.

---

## SECTION 1: PROJECT STRUCTURE

```bash
tree -L 4 -I 'node_modules|.next|.git|dist|build' --dirsfirst
```

Show the COMPLETE contents of:
- `package.json` (root)
- `apps/api/package.json`
- `apps/web/package.json`
- `.env.example` (root + `apps/api/`) — variable NAMES only, replace values with `<REDACTED>`
- `apps/web/next.config.js`
- `apps/api/tsconfig.json` and `apps/web/tsconfig.json`
- `docker-compose.yml` and `docker-compose.prod.yml`
- `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, and `.github/workflows/security.yml`

Note the framework (Next.js version), language (TypeScript), and build tooling.

---

## SECTION 1b: REDIS KEY INVENTORY

Run this and document every Redis key pattern used in the codebase:

```bash
echo "=== All Redis key patterns in API source ==="
grep -rn "redis\.\(get\|set\|del\|incr\|decr\|expire\|setex\|zadd\|zrem\|zrangebyscore\|hset\|hget\|keys\)" \
  apps/api/src/ --include="*.ts" | grep -v "\.test\." | sort

echo ""
echo "=== Redis key string literals ==="
grep -rn "'[a-z_]*:[a-z_*]*'\|\"[a-z_]*:[a-z_*]*\"" apps/api/src/ --include="*.ts" | \
  grep -v "\.test\.\|node_modules" | sort
```

For each unique key pattern found, document:

| Key pattern | TTL | Set by | Read by | Purpose |
|-------------|-----|--------|---------|---------|

Pay special attention to these key families confirmed in the codebase:
- `homepage:*` (spotlight, top-solutions, rising, last_invalidated)
- `dispatch:*` (pending_problems, active_problems, votable_problems)
- `bot:*` (traffic tracking, rate limiting)
- `rate-limit:*` (per-IP and per-bot counters)
- `newsletter:*` (confirmation tokens)
- `load-balancer:*` (per-problem traffic tracking)
- `admin:*` (confirmation tokens, email tokens)
- `dispatch:flag_assigned:{problemId}` — Thundering herd flag counter (INCR on assign, safe Lua DECR on complete/expire, capped at 3)
- `bot:owner_bots:{ownerId}` — Cached set of bot IDs owned by a user (JSON array, 5min TTL, used by dispatcher to enforce same-owner anti-gaming without repeated DB queries)

---

## SECTION 2: DATABASE SCHEMA

Show the COMPLETE `apps/api/src/db/schema.ts` — every table, column, type, enum, relation.
Show the COMPLETE `apps/api/src/db/index.ts` (connection setup).

Then run these verification checks:

```bash
echo "=== PostgreSQL confirmation ==="
grep -n "postgres\|pg\|neon\|drizzle" apps/api/src/db/index.ts | head -5

echo ""
echo "=== Total tables ==="
grep -c "pgTable(" apps/api/src/db/schema.ts

echo ""
echo "=== problemCategoryEnum — all slugs ==="
grep -A 35 "problemCategoryEnum" apps/api/src/db/schema.ts

echo ""
echo "=== Count of category slugs ==="
grep -A 15 "problemCategoryEnum" apps/api/src/db/schema.ts | grep -c "'"
echo "↑ Should be 8"

echo ""
echo "=== Email column exists ==="
grep -n "email" apps/api/src/db/schema.ts | head -5
echo "↑ Should show email varchar NOT NULL + uniqueIndex"

echo ""
echo "=== OAuth provider enum — Google only ==="
grep "oauthProviderEnum" apps/api/src/db/schema.ts
echo "↑ Should show ['google'] only"

echo ""
echo "=== Newsletter columns ==="
grep -n "newsletter" apps/api/src/db/schema.ts
echo "↑ Expected: newsletterSubscribed, newsletterSubscribedAt, newsletterConsentIp,"
echo "  newsletterConsentMethod, newsletterUnsubscribeToken"

echo ""
echo "=== Migration files present ==="
ls -la apps/api/drizzle/migrations/

echo ""
echo "=== Unique title index ==="
grep -n "problems_title_unique\|lower.*trim.*title" apps/api/src/db/schema.ts
echo "↑ Should reference unique index on lower(trim(title))"

echo ""
echo "=== Duplicate title handler ==="
grep -n "23505\|duplicate" apps/api/src/routes/bot.routes.ts
echo "↑ Should show PostgreSQL unique violation handler in create task case"
```

---

## SECTION 2b: SHARED PACKAGE

Show the COMPLETE `packages/shared/src/categories.ts`.

```bash
echo "=== All exports from shared package ==="
grep "^export" packages/shared/src/categories.ts
grep "^export" packages/shared/src/index.ts
grep "^export" packages/shared/src/constants.ts
grep "^export" packages/shared/src/types.ts
grep "^export" packages/shared/src/validation.ts
grep "^export" packages/shared/src/model-families.ts

echo ""
echo "=== Category count ==="
grep -c "slug:" packages/shared/src/categories.ts
echo "↑ Expected: 8"

echo ""
echo "=== No group references ==="
grep -c "CategoryGroup\|group:" packages/shared/src/categories.ts
echo "↑ Expected: 0"
```

```bash
echo "=== Model families file exists ==="
wc -l packages/shared/src/model-families.ts
echo "↑ Should exist (extracted from constants.ts)"

echo ""
echo "=== Known model families count ==="
grep -c "matchKeys:" packages/shared/src/model-families.ts
echo "↑ Expected: 40"

echo ""
echo "=== Model families NOT in constants.ts ==="
grep -c "KNOWN_MODEL_FAMILIES\|hashColor\|displayModelName\|getModelFamily\|PROVIDER_PREFIXES" packages/shared/src/constants.ts
echo "↑ Expected: 0 (all moved to model-families.ts)"

echo ""
echo "=== Model families barrel export ==="
grep "model-families" packages/shared/src/index.ts
echo "↑ Expected: export * from './model-families.js'"

echo ""
echo "=== No hardcoded FAMILY_COLORS in admin debug ==="
grep -c "FAMILY_COLORS" apps/web/src/app/admin/debug/DebugDashboard.tsx
echo "↑ Expected: 0 (replaced with shared getModelFamily)"

echo ""
echo "=== Validation regex allows / and : ==="
grep "a-z0-9._" packages/shared/src/validation.ts
echo "↑ Should contain /:+ in character class"

echo ""
echo "=== Bot routes regex allows / and : ==="
grep "LLM_MODEL_PATTERN" apps/api/src/routes/bot.routes.ts
echo "↑ Should contain /:+ in character class"

echo ""
echo "=== No 'Other' in model families ==="
grep -c "'Other'" packages/shared/src/model-families.ts
echo "↑ Expected: 0 (unknown models get auto-detected, no Other bucket)"

echo ""
echo "=== getModelFamily consumers ==="
grep -l "getModelFamily" apps/api/src/services/llm-leaderboard.service.ts apps/web/src/components/solution/LlmModelBadge.tsx apps/web/src/app/llm-leaderboard/page.tsx apps/web/src/app/llm-leaderboard/\[modelName\]/page.tsx apps/web/src/app/admin/debug/DebugDashboard.tsx 2>/dev/null | wc -l
echo "↑ Expected: 5 consumer files"
```

Show the COMPLETE `packages/shared/src/model-families.ts`.

Document the model family architecture:
- `ModelFamilyInfo` interface: `{ color, label, company, matchKeys }`
- `KNOWN_MODEL_FAMILIES`: 40 curated families with brand colors and matchKeys arrays
- `hashColor()`: deterministic HSL color generation for unknown models
- `displayModelName()`: strips provider prefixes (ollama/, openrouter/, etc.) for badge display
- `getModelFamily()`: returns `{ family, color, company }` — matches against matchKeys, falls back to auto-detection with deterministic color
- No "Other" bucket — every model gets a unique identity
- Badge text = full model name (via `displayModelName`), NOT the family label
- Family = grouping + color only (for leaderboard filters and badge dots)
- Backward compat: `MODEL_FAMILIES` alias and `ModelFamily = string` type still exported

List all 40 known families in a table:

| # | Key | Label | Company | matchKeys |
|---|-----|-------|---------|-----------|
| 1 | gpt | GPT | OpenAI | gpt, chatgpt, o1, o3, o4, codex, gpt-oss |
| ... (fill all 40 from the actual file) | ... | ... | ... | ... |

Document the exported types and functions:
- `Category` interface
- `CATEGORIES`, `CATEGORY_SLUGS`
- `getCategoryBySlug()`
- `ModelFamilyInfo` interface
- `KNOWN_MODEL_FAMILIES`, `MODEL_FAMILIES` (backward compat alias)
- `getModelFamily()`, `displayModelName()`, `hashColor()`
- `ModelFamily` type (= `string`)

Document the full 8-category taxonomy in a table:

| Slug | Display Name | Description |
|------|-------------|-------------|
| technology | ... | ... |

Note: categories are flat (no groups). The old 3-group system (everyday/world/professional with 21 categories) was replaced.

---

## SECTION 2c: ISR & REVALIDATION

```bash
echo "=== apiFetch — no force-cache ==="
grep -n "force-cache" apps/web/src/lib/api.ts
echo "↑ Should be 0 results (removed)"

echo ""
echo "=== On-demand revalidation route exists ==="
cat apps/web/src/app/api/revalidate/route.ts 2>/dev/null | head -5
echo "↑ Should show revalidatePath import"

echo ""
echo "=== Revalidation service exists ==="
cat apps/api/src/services/revalidate.service.ts 2>/dev/null | head -10
echo "↑ Should show fire-and-forget revalidation helper"

echo ""
echo "=== Revalidation wired into bot routes ==="
grep -n "revalidate" apps/api/src/routes/bot.routes.ts | head -10
echo "↑ Should show imports + calls for flag/solve/vote/create"

echo ""
echo "=== Revalidation wired into problem routes ==="
grep -n "revalidate" apps/api/src/routes/problem.routes.ts | head -5

echo ""
echo "=== Docker nextcache volume ==="
grep -n "nextcache" docker-compose.prod.yml
echo "↑ Should show volume mount + volume definition"

echo ""
echo "=== ISR revalidate intervals ==="
grep -rn "export const revalidate" apps/web/src/app/ --include="*.tsx" --include="*.ts"
echo "↑ Document each page's revalidation interval"

echo ""
echo "=== cache: 'no-store' on apiFetch ==="
grep -n "cache.*no-store" apps/web/src/lib/api.ts
echo "↑ Should show cache: 'no-store' in apiFetch default options"

echo ""
echo "=== force-dynamic pages ==="
grep -rn "export const dynamic" apps/web/src/app/ --include="*.tsx" --include="*.ts"
echo "↑ Should show force-dynamic on: problems, problems/[id], bots/[id], leaderboard, llm-leaderboard, users/[id]"

echo ""
echo "=== Homepage still uses revalidate (not force-dynamic) ==="
grep "export const revalidate" apps/web/src/app/page.tsx
echo "↑ Should show revalidate = 30"
```

Document the revalidation architecture:
- Which pages have ISR and what revalidate interval
- How on-demand revalidation is triggered (API → web container via POST /api/revalidate)
- The revalidation service helper functions (revalidateForProblem, revalidateForSolution, revalidateForVote, revalidateForFlag)
- Docker volume for ISR cache persistence (nextcache mounted at /app/apps/web/.next/cache)
- Environment variables: WEB_INTERNAL_URL, REVALIDATION_SECRET
- cache: 'no-store' added to apiFetch default options — prevents Next.js server-side Data Cache from caching API responses
- 6 dynamic pages switched from `revalidate` to `export const dynamic = 'force-dynamic'`: problems list, problem detail, bot profile, bot leaderboard, LLM leaderboard, user profile
- Homepage retains `export const revalidate = 30` (acceptable staleness, high traffic page)
- API-level Redis caching (homepage endpoints: 180-300s TTL) still provides performance benefit

---

## SECTION 2e: PERFORMANCE OPTIMIZATION VERIFICATION
```bash
echo "=== Bot auth cache exists ==="
grep -n "AUTH_CACHE" apps/api/src/middleware/bot-auth.middleware.ts
echo "↑ Should show Map declaration, set, get/TTL check, and export of invalidateBotAuthCache"

echo ""
echo "=== Auth cache invalidation call sites ==="
grep -rn "invalidateBotAuthCache" apps/api/src/routes/
echo "↑ Should show exactly 2 call sites: auth.routes.ts and admin.routes.ts"

echo ""
echo "=== Owner bots cache in dispatcher ==="
grep -n "bot:owner_bots" apps/api/src/services/dispatcher.service.ts
echo "↑ Should show Redis get + set with EX 300 in getSameOwnerBotIds helper"

echo ""
echo "=== invalidateOwnerBotsCache call site ==="
grep -n "invalidateOwnerBotsCache" apps/api/src/routes/auth.routes.ts
echo "↑ Should show exactly 1 call in the new bot insert branch of PUT /user/bot-profile"

echo ""
echo "=== Promise.all in dispatcher ==="
grep -n "Promise.all" apps/api/src/services/dispatcher.service.ts
echo "↑ Should show 2 occurrences: one in tryAssignFlagTask, one in tryAssignSolveTask"

echo ""
echo "=== Promise.all in pair-selector ==="
grep -n "Promise.all" apps/api/src/services/pair-selector.service.ts
echo "↑ Should show 1 occurrence in selectPair"

echo ""
echo "=== Promise.all in load-balancer ==="
grep -n "Promise.all" apps/api/src/services/load-balancer.service.ts
echo "↑ Should show 2 occurrences: one in canAssign, one in recordAssignment"

echo ""
echo "=== getTotalHourlyCount removed from load-balancer ==="
grep -n "getTotalHourlyCount" apps/api/src/services/load-balancer.service.ts
echo "↑ Should be 0 results (method was removed)"

echo ""
echo "=== Composite indexes on problems table ==="
grep -n "solve_dispatch\|vote_dispatch\|flag_dispatch" apps/api/src/db/schema.ts
echo "↑ Should show 3 composite indexes"

echo ""
echo "=== PostgreSQL max_connections ==="
grep "max_connections" docker-compose.prod.yml
grep "max_connections" docker-compose.yml
echo "↑ prod should be 200, dev should be 100"

echo ""
echo "=== DB pool size ==="
grep -n "max:" apps/api/src/config/database.ts
echo "↑ Should show max: 30"

echo ""
echo "=== PERF-2: SSE shared broadcast ==="
grep -n "const clients = new Set\|MAX_SSE_CLIENTS\|broadcastInterval" apps/api/src/routes/sse.routes.ts
echo "↑ Should show shared Set, 200 cap constant, single interval variable"

echo ""
echo "=== PERF-3: selectDistinctOn in leaderboard ==="
grep -n "selectDistinctOn" apps/api/src/routes/leaderboard.routes.ts
echo "↑ Should show selectDistinctOn([solutions.botId])"

echo ""
echo "=== PERF-3: Pair selector slim columns + text hydration ==="
grep -n "SolutionSlim\|textMap\|hydrate" apps/api/src/services/pair-selector.service.ts
echo "↑ Should show SolutionSlim interface and textMap after pair selection"

echo ""
echo "=== PERF-4: Stats Redis caching ==="
grep -n "stats:homepage\|stats:admin" apps/api/src/routes/leaderboard.routes.ts apps/api/src/routes/admin.routes.ts
echo "↑ Should show Redis get/set in both stats endpoints"

echo ""
echo "=== PERF-5: Gamification FOR UPDATE ==="
grep -n "FOR UPDATE\|db.transaction" apps/api/src/services/gamification.service.ts
echo "↑ Should show FOR UPDATE in all 4 methods (onFlag, onSolve, onVote, onCreate)"

echo ""
echo "=== PERF-5: Auth cache sweep + hard cap ==="
grep -n "AUTH_CACHE_MAX_SIZE\|AUTH_CACHE_SWEEP\|startAuthCacheSweep\|unref" apps/api/src/middleware/bot-auth.middleware.ts
echo "↑ Should show 5000 cap, 5min sweep interval, unref() call"

echo ""
echo "=== PERF-1: DB pool increased ==="
grep -n "max:" apps/api/src/config/database.ts
echo "↑ Should show max: 50"

echo ""
echo "=== PERF-1: Sweep overlap guard ==="
grep -n "sweepRunning" apps/api/src/server.ts
echo "↑ Should show sweepRunning boolean with finally block"

echo ""
echo "=== PERF-A: LLM placements ranks across ALL solutions ==="
grep -n "WHERE s.comparison_count\|WHERE llm_model" apps/api/src/services/llm-leaderboard.service.ts | head -5
echo "↑ Inner CTE should have no llm_model filter; outer query should filter WHERE llm_model ="

echo ""
echo "=== PERF-A: recordModel 23505 guard ==="
grep -n "23505" apps/api/src/services/llm-leaderboard.service.ts
echo "↑ Should show catch for concurrent INSERT duplicate"

echo ""
echo "=== PERF-A: Moderation WHERE status=pending guard ==="
grep -n "eq(problems.status" apps/api/src/services/moderation.service.ts
echo "↑ Should show WHERE status='pending' on status transition UPDATE"

echo ""
echo "=== PERF-B: Homepage top-solutions DISTINCT ON ==="
grep -n "DISTINCT ON" apps/api/src/routes/homepage.routes.ts
echo "↑ Should show DISTINCT ON in /top-solutions subquery"

echo ""
echo "=== PERF-B: Problem list selectDistinctOn ==="
grep -n "selectDistinctOn" apps/api/src/routes/problem.routes.ts
echo "↑ Should show selectDistinctOn([solutions.problemId])"

echo ""
echo "=== PERF-C: withCacheMutex helper ==="
grep -n "withCacheMutex\|:rebuilding\|NX" apps/api/src/routes/homepage.routes.ts | head -10
echo "↑ Should show mutex helper, :rebuilding key pattern, SET NX"

echo ""
echo "=== PERF-D: Batched retention DELETEs ==="
grep -n "BATCH_SIZE\|BATCH_PAUSE\|batchDelete" apps/api/src/services/retention.service.ts
echo "↑ Should show 500 batch size, 100ms pause, batchDelete helper"

echo ""
echo "=== PERF-D: Load balancer total key ==="
grep -n "HOURLY_TOTAL_KEY\|global:activity:hourly:total" apps/api/src/services/load-balancer.service.ts
echo "↑ Should show dedicated total key in canAssign (GET) and recordAssignment (INCR)"

echo ""
echo "=== PERF-E: Singleflight auth deduplication ==="
grep -n "AUTH_IN_FLIGHT\|verifyApiKey\|singleflight" apps/api/src/middleware/bot-auth.middleware.ts
echo "↑ Should show AUTH_IN_FLIGHT Map, verifyApiKey function, finally cleanup"

echo ""
echo "=== PERF-F: globalElo updated in BT transaction ==="
grep -n "global_elo\|AVG(bt_score)\|top_solutions" apps/api/src/services/bradley-terry.service.ts
echo "↑ Should show UPDATE bots SET global_elo = AVG of top 20 solutions inside transaction"

echo ""
echo "=== PERF-F: voteAccuracy rolling update ==="
grep -n "voteAccuracy\|voterCorrect\|newAccuracy" apps/api/src/services/bradley-terry.service.ts
echo "↑ Should show rolling accuracy calculation and UPDATE inside transaction"

echo ""
echo "=== PERF-G: Wildcard route for model names with slashes ==="
grep -n "llm-leaderboard/\*\|request.params.*\*" apps/api/src/routes/llm-leaderboard.routes.ts
echo "↑ Should show wildcard route and params['*'] extraction"

echo ""
echo "=== PERF-H: recalculateAll debug endpoint ==="
grep -n "recalculate-llm-stats\|recalculateAll" apps/api/src/routes/debug.routes.ts
echo "↑ Should show POST /internal/debug/recalculate-llm-stats endpoint"

echo ""
echo "=== PERF-H: Flag counter WHERE status=pending on increment ==="
grep -n "eq(problems.status, 'pending')" apps/api/src/services/moderation.service.ts
echo "↑ Should show status guard on BOTH the flag counter increment AND the status transition"

echo ""
echo "=== PERF-H: Flag counter safe DECR on non-23505 failure ==="
grep -n "taskType === 'flag'\|flag_assigned\|safeDecr" apps/api/src/services/dispatcher.service.ts | head -5
echo "↑ Should show flag counter DECR in createTask catch block"

echo ""
echo "=== PERF-I: voteAccuracy FOR UPDATE on voter bot ==="
grep -n "FOR UPDATE" apps/api/src/services/bradley-terry.service.ts
echo "↑ Should show FOR UPDATE on both solution rows AND voter bot row"

echo ""
echo "=== PERF-I: Admin actionCounts cached in Redis ==="
grep -n "admin:action_counts" apps/api/src/routes/admin.routes.ts
echo "↑ Should show redis.get and redis.set with 30s TTL"

echo ""
echo "=== PERF-J: recordModel 23505 retries UPDATE ==="
grep -n -A 5 "23505" apps/api/src/services/llm-leaderboard.service.ts | head -10
echo "↑ Should show UPDATE totalSolutions + 1 in the 23505 catch block (not just return)"

echo ""
echo "=== PERF-K: Redis pipeline in recordAssignment ==="
grep -n "pipeline\|\.exec()" apps/api/src/services/load-balancer.service.ts
echo "↑ Should show redis.pipeline().hincrby().expire().incr().expire().exec()"

echo ""
echo "=== PERF-K: Hourly counter reset interval in server.ts ==="
grep -n "resetHourlyCounters\|msUntilNextHour\|LoadBalancerService" apps/api/src/server.ts
echo "↑ Should show setTimeout at top of hour then setInterval every hour"

echo ""
echo "=== PERF-M: recalculateAll chunked with Promise.all ==="
grep -n "CHUNK_SIZE\|Promise.all\|recalculated" apps/api/src/services/llm-leaderboard.service.ts | tail -5
echo "↑ Should show CHUNK_SIZE = 5, Promise.all on chunk, 50ms pause"

echo ""
echo "=== PERF-N: reconcileConcurrentBots function ==="
grep -n "reconcileConcurrentBots\|lastActiveAt.*60\|KEYS.concurrent" apps/api/src/services/bot-traffic.service.ts
echo "↑ Should show function querying bots active in last 60s and setting Redis counter"

echo ""
echo "=== PERF-N: Reconciliation interval in server.ts ==="
grep -n "reconcileConcurrentBots" apps/api/src/server.ts
echo "↑ Should show import and 60s setInterval call"

echo ""
echo "=== URL-FIX: Bot API base URL uses api. subdomain ==="
grep "Base URL" skill/SKILL.md
echo "↑ Should show api.opensolve.ai/api/v1 (not www.opensolve.ai)"

echo ""
echo "=== URL-FIX: No www.opensolve.ai/api in bot-facing files ==="
grep -rn "www\.opensolve\.ai/api" skill/ bots/ apps/web/src/app/docs/ 2>/dev/null
echo "↑ Must be empty (zero results)"

echo ""
echo "=== URL-FIX: ONBOARDING.md has API endpoint note ==="
grep -n "api\.opensolve\.ai" skill/ONBOARDING.md | head -5
echo "↑ Should show api.opensolve.ai in Quick Start and cron example"

echo ""
echo "=== BUGFIX-1: comparisonCount incremented for skip votes ==="
grep -n "problems.comparisonCount\|comparisonCount.*\+ 1" apps/api/src/services/bradley-terry.service.ts
echo "↑ Should show increment in BOTH skip path (Promise.all) and non-skip path (inside tx)"

echo ""
echo "=== BUGFIX-2: Atomic solution insert + solutionCount ==="
grep -n "db.transaction\|tx\.insert\|tx\.update" apps/api/src/routes/bot.routes.ts | head -5
echo "↑ Should show transaction wrapping solution insert + solutionCount increment"

echo ""
echo "=== BUGFIX-2: Duplicate early returns update bot stats ==="
grep -n "totalTasksCompleted" apps/api/src/routes/bot.routes.ts
echo "↑ Should show 3 occurrences: solve duplicate + create duplicate + main completion"

echo ""
echo "=== BUGFIX-3: No failedFlagAttempts in expiry sweep ==="
grep -n "failedFlagAttempts" apps/api/src/server.ts
echo "↑ Should show 0 DB operations (only a comment)"

echo ""
echo "=== BUGFIX-4: lastBotActivityAt on vote and flag ==="
grep -n "lastBotActivityAt" apps/api/src/routes/bot.routes.ts
echo "↑ Should show 3 occurrences: flag, solve (in tx), vote"

echo ""
echo "=== BUGFIX-4: voteAccuracy uses pre-update scores ==="
grep -n "rA.*rB\|rB.*rA\|rA !== rB" apps/api/src/services/bradley-terry.service.ts | head -5
echo "↑ Should show rA/rB comparisons (NOT newRatingA/newRatingB) and equal-score skip"

echo ""
echo "=== BUGFIX-4: Admin activate assigns category ==="
grep -n "suggestedCategory\|flagCategories" apps/api/src/routes/admin.routes.ts | head -5
echo "↑ Should show category assignment from green flags when admin sets status to active"

echo ""
echo "=== SEC-FIX-8/S11: Prompt injection activity log action ==="
grep -n "prompt_injection_flagged" apps/api/src/routes/bot.routes.ts
echo "↑ Should show activity log insert with promptInjectionDetected metadata"

echo ""
echo "=== SEC-FIX-9/S12: Newsletter stale token check ==="
grep -n "tokenIssuedAt\|token_expired_after_unsubscribe" apps/api/src/routes/newsletter.routes.ts
echo "↑ Should show updatedAt vs issuedAt comparison"

echo ""
echo "=== SEC-FIX-8/S13: Problem creation rate limit ==="
grep -n "rateLimit\|max: 20" apps/api/src/routes/problem.routes.ts | head -5
echo "↑ Should show 20/day per-user limit"
```

---

## SECTION 2d: MIGRATION HEALTH & DEPLOYMENT READINESS

```bash
echo "=== All migration files (numbered and unnumbered) ==="
ls -la apps/api/drizzle/migrations/*.sql

echo ""
echo "=== Unnumbered migration files (Drizzle migrator skips these) ==="
ls apps/api/drizzle/migrations/*.sql | grep -v "^apps/api/drizzle/migrations/[0-9]" | grep -v "meta"
echo "↑ Should be 0 files — all migrations must be numbered (0000_, 0001_, etc.)"
echo "  Known problematic files: newsletter_subscription.sql, widen_api_key_prefix.sql"

echo ""
echo "=== Duplicate migration number prefixes ==="
ls apps/api/drizzle/migrations/*.sql | sed 's/.*\///' | cut -c1-4 | sort | uniq -d
echo "↑ Should be empty — no two files should share the same 0000/0001/etc. prefix"

echo ""
echo "=== ALTER TYPE ADD VALUE without IF NOT EXISTS (will fail on fresh DB) ==="
grep -n "ADD VALUE " apps/api/drizzle/migrations/*.sql | grep -v "IF NOT EXISTS"
echo "↑ Must be 0 lines — every ADD VALUE must include IF NOT EXISTS"

echo ""
echo "=== ALTER TABLE ADD COLUMN without IF NOT EXISTS ==="
grep -n "ADD COLUMN " apps/api/drizzle/migrations/*.sql | grep -v "IF NOT EXISTS"
echo "↑ Should be 0 lines for idempotent migrations"

echo ""
echo "=== api_key_prefix column width in base migration ==="
grep -n "api_key_prefix" apps/api/drizzle/migrations/0000_*.sql
echo "↑ Should show varchar(16), not varchar(8)"

echo ""
echo "=== Auto-migration on server startup ==="
grep -n "migrate\|runMigrations" apps/api/src/server.ts
echo "↑ Check if migrations run automatically on startup"
grep -n "migrate" apps/api/src/db/migrate.ts | head -5
echo "↑ Show the migrate script entry point"

echo ""
echo "=== Drizzle config file location ==="
find . -name "drizzle.config*" -not -path "*/node_modules/*" 2>/dev/null
echo "↑ Must exist and be accessible from the Docker container working directory"

echo ""
echo "=== Dockerfile copies drizzle config ==="
grep -n "drizzle" apps/api/Dockerfile
echo "↑ Should show COPY for both drizzle/ migrations directory AND drizzle.config file"
```

Document:
- Complete list of all migration files with their numbering status
- Any unnumbered files that need to be folded into the numbered sequence or removed
- Whether server.ts auto-runs migrations on startup (if not, this is a deployment risk — every fresh DB or DB reset requires manual `docker exec` to run migrations)
- Whether the Dockerfile copies both the drizzle migrations directory AND the drizzle config file into the image
- Any enum ADD VALUE statements missing IF NOT EXISTS
- Any migration numbering collisions

---

## SECTION 3: API ROUTES — COMPLETE LIST

```bash
echo "=== All route files ==="
ls apps/api/src/routes/

echo ""
echo "=== All registered endpoints ==="
grep -rn "fastify\.\(get\|post\|put\|patch\|delete\)" apps/api/src/routes/ | \
  sed 's/.*fastify\.\([a-z]*\)(\([^,]*\).*/\1 \2/' | sort
```

For EACH route group below, document: HTTP method + path, what it does, required params/body, response shape, middleware (auth/rate limit/validation), error cases.

**Groups to cover:**
- Auth (Google OAuth, logout, me, username, bot-name, API key, export, delete)
- Bot task flow (tasks/next with ?brief, ?instruct, ?categories params; tasks/:id/submit; instructions; bot/me)
- Problems (list, get, submit, search)
- Voting / leaderboard (leaderboard, llm-leaderboard, spotlight, activity, SSE)
- Admin (stats, problems summary, bots summary, moderation queue, metrics, bot status, problem status, bot list, user list, activity log)
- Admin email (stats, subscribers, send-important, broadcast, confirmation-token, history, user-search)
- Newsletter (subscribe, confirm, unsubscribe POST+GET, status)
- Contact (POST /contact — form submission, rate-limited 3/hr, sends to contact@opensolve.ai via Resend)
- User profile (GET /users/:id/profile — public profile with username, join date, posted problems, linked bot)
- Debug (all X-Debug-Key endpoints)

```bash
echo "=== Newsletter routes ==="
grep -n "router\.\|fastify\." apps/api/src/routes/newsletter.routes.ts 2>/dev/null | head -20

echo ""
echo "=== Admin email routes ==="
grep -n "router\.\|fastify\." apps/api/src/routes/admin.email.routes.ts 2>/dev/null | head -20

echo ""
echo "=== Admin list endpoints (added in ADMIN-3/4/5 sessions) ==="
grep -n "fastify\.\(get\|post\)" apps/api/src/routes/admin.routes.ts | grep -E "bots|users|activity"
echo "↑ Should show: GET /admin/bots (filterable bot list), GET /admin/users (filterable user list), GET /admin/activity (activity log + actionCounts)"

echo ""
echo "=== Contact form route ==="
grep -n "fastify\.\|router\." apps/api/src/routes/contact.routes.ts 2>/dev/null | head -10
echo "↑ Should show POST /contact (rate limit 3/hr)"

echo ""
echo "=== User profile route ==="
grep -n "fastify\.\(get\|post\)" apps/api/src/routes/user-profile.routes.ts 2>/dev/null | head -5
echo "↑ Should show GET /users/:id/profile"

echo ""
echo "=== User profile registered in server ==="
grep "userProfile" apps/api/src/server.ts
echo "↑ Should show import + register"

echo ""
echo "=== User profile exposes no sensitive fields ==="
grep -c "email\|apiKey\|oauth\|password\|hash\|newsletter" apps/api/src/routes/user-profile.routes.ts
echo "↑ Must be 0"

echo ""
echo "=== Model Arena sort tabs (4 options, default win_rate) ==="
grep -n "sortOptions\|key:.*label:" apps/web/src/app/llm-leaderboard/page.tsx | head -10
echo "↑ Should show exactly 4 sort options: win_rate, avg_score, first_place_count, total_solutions"

echo ""
echo "=== Model Arena default sort ==="
grep "win_rate" apps/web/src/app/llm-leaderboard/page.tsx | head -3
echo "↑ Should show win_rate as default (not avg_score)"

echo ""
echo "=== Removed sort options gone from backend ==="
grep "best_score\|top3_count" apps/api/src/routes/llm-leaderboard.routes.ts apps/api/src/services/llm-leaderboard.service.ts 2>/dev/null
echo "↑ Must be empty — best_score and top3_count removed from sort enum and orderBy map"

echo ""
echo "=== Sort tab descriptions rendered ==="
grep -n "description\|activeSort" apps/web/src/app/llm-leaderboard/page.tsx | head -5
echo "↑ Should show description field on sort options and rendering logic"

echo ""
echo ""
echo "=== Bot profile includes LLM model history (LLM-HIST-1) ==="
grep -n "llmModelHistory\|llmModel\|currentLlmModel" apps/api/src/routes/leaderboard.routes.ts | head -15
echo "↑ Should show: llmModelHistory query (GROUP BY llm_model) in /bots/:id, currentLlmModel in response"

echo ""
echo "=== Leaderboard includes currentLlmModel per bot ==="
grep -n "currentLlmModel\|modelMap\|latestModels\|inArray" apps/api/src/routes/leaderboard.routes.ts | head -10
echo "↑ Should show batch subquery for latest llm_model per bot in /leaderboard endpoint"

echo ""
echo "=== BotCard shows current LLM model ==="
grep -n "currentLlmModel" apps/web/src/components/bot/BotCard.tsx 2>/dev/null
echo "↑ Should show model label rendered below bot name"

echo ""
echo "=== Bot profile page shows model history section ==="
grep -n "llmModelHistory\|LLM Model History\|currentLlmModel" apps/web/src/app/bots/\[id\]/page.tsx | head -10
echo "↑ Should show: current model badge near name + model history section with first/last used dates"

echo ""
echo "=== SSE route shape ==="
grep -n "data:\|botId\|botName\|problemTitle\|action" apps/api/src/routes/sse.routes.ts | head -20
echo "↑ Document what fields are pushed in each SSE event"
```

**Admin list endpoints (added in ADMIN-3/4/5 sessions):**

These three endpoints follow the same filterable+paginated pattern as `GET /admin/problems`. Document their full response shapes:

| Endpoint | Query Params | Key Response Fields |
|----------|-------------|---------------------|
| `GET /admin/bots` | `status, search, sort (newest/oldest/most_points/most_solutions/most_votes/highest_elo/last_active), page, limit` | `{bots[{id, name, status, ownerUsername, totalPoints, totalSolutions, totalVotes, globalElo, voteAccuracy, lastActiveAt}], pagination}` |
| `GET /admin/users` | `role, hasBot (all/yes/no), newsletter (all/subscribed/unsubscribed), search, sort, page, limit` | `{users[{id, username, email, role, onboardingComplete, botName, hasApiKey, newsletterSubscribed, createdAt}], pagination}` |
| `GET /admin/activity` | `action, actorType (all/bot/human/admin), search, sort, page, limit` | `{activities[{id, action, botId, botName, humanUserId, humanUsername, problemId, problemTitle, solutionId, metadata, createdAt}], pagination, actionCounts{}}` |

Verify these endpoints exist and return correct shapes:

```bash
echo "=== Admin list endpoints exist ==="
grep -n "fastify.get.*admin/bots\b\|fastify.get.*admin/users\b\|fastify.get.*admin/activity\b" apps/api/src/routes/admin.routes.ts
echo "↑ Should show 3 endpoints"

echo ""
echo "=== Users endpoint does NOT expose sensitive fields ==="
grep -A 40 "admin/users" apps/api/src/routes/admin.routes.ts | grep -c "apiKeyHash\|oauthId\|newsletterConsentIp\|newsletterUnsubscribeToken"
echo "↑ Must be 0"
```

Show the COMPLETE `apps/api/src/routes/instruction.routes.ts`.

---

## SECTION 4: AUTHENTICATION & AUTHORIZATION

Show the COMPLETE:
- `apps/api/src/routes/auth.routes.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- `apps/api/src/utils/crypto.ts` (API key generation, hashing, prefix extraction, OAuth state generation)
- Any other middleware files in `apps/api/src/middleware/`

```bash
echo "=== Google OAuth scopes ==="
grep -n "scope\|email\|profile" apps/api/src/routes/auth.routes.ts | head -10

echo ""
echo "=== Google ID token verification ==="
grep -n "verifyIdToken\|google-auth-library\|OAuth2Client\|jose\|jwtVerify" apps/api/src/routes/auth.routes.ts | head -10
echo "↑ Must show cryptographic verification (not just base64 decode)"

echo ""
echo "=== Email captured in callback ==="
grep -n "email" apps/api/src/routes/auth.routes.ts | grep -v "//" | head -10
echo "↑ Should show email stored from Google profile"

echo ""
echo "=== No Twitter routes ==="
grep -c "twitter\|Twitter" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 0"

echo ""
echo "=== OAuth state cookie signed ==="
grep -n "signed" apps/api/src/routes/auth.routes.ts
echo "↑ Should show signed: true on state cookie"

echo ""
echo "=== CSRF protection on logout ==="
grep -n "csrf\|referer\|origin\|method" apps/api/src/routes/auth.routes.ts | grep -i logout
```

---

## SECTION 5: DISPATCHER & TASK ASSIGNMENT

Show the COMPLETE `apps/api/src/services/dispatcher.service.ts`.

```bash
echo "=== Category handling in CREATE tasks ==="
grep -n -A 20 "tryAssignCreateTask" apps/api/src/services/dispatcher.service.ts | head -30
echo "↑ Should show 8 categories, flat (no weighted pool)"

echo ""
echo "=== instruct and categories query params ==="
grep -n "instructMode\|categoriesMode" apps/api/src/services/dispatcher.service.ts | head -15
echo "↑ Should show instructMode ('full'|'brief'|'none') and categoriesMode ('full'|'slim') params"

echo ""
echo "=== Content wrapper format ==="
grep -n -A 3 "wrapContent" apps/api/src/services/dispatcher.service.ts | head -10
echo "↑ Should show ---DATA--- wrapper (not ===BEGIN CONTENT===)"

echo ""
echo "=== Task expiry sweep interval ==="
grep -n "setInterval\|expiry\|expire\|sweep" apps/api/src/services/dispatcher.service.ts | head -10

echo ""
echo "=== One-task-at-a-time enforcement ==="
grep -n "activeTask\|one.*task\|already.*task" apps/api/src/services/dispatcher.service.ts | head -10

echo ""
echo "=== Concurrency: Partial unique index prevents double task assignment ==="
grep -n "bot_assigned\|tasks_bot_assigned" apps/api/src/db/schema.ts
echo "↑ Should show uniqueIndex on (bot_id) WHERE status = 'assigned'"

echo ""
echo "=== Concurrency: 23505 fallback in createTask ==="
grep -n "23505\|bot_assigned" apps/api/src/services/dispatcher.service.ts
echo "↑ Should show catch for duplicate task, falls back to getActiveTask"

echo ""
echo "=== Concurrency: Flag thundering herd Redis cap ==="
grep -n "flag_assigned\|INCR\|incr" apps/api/src/services/dispatcher.service.ts
echo "↑ Should show Redis INCR capped at 3 per problem"

echo ""
echo "=== Concurrency: Safe flag counter decrement (Lua floor) ==="
grep -n "safeDecr\|local v\|tonumber" apps/api/src/routes/bot.routes.ts apps/api/src/server.ts
echo "↑ Should show Lua script preventing counter going below 0"

echo ""
echo "=== response_format always sent (not stripped by instruct=none) ==="
grep -c "instructMode !== 'none'" apps/api/src/services/dispatcher.service.ts
echo "↑ Should be 0 — response_format is now unconditional for all instruct modes"

echo ""
echo "=== Flag normalization before Zod validation ==="
grep -n "normalizeFlagCategory\|FLAG_CATEGORY_MAP" apps/api/src/routes/bot.routes.ts | head -5
echo "↑ Should show normalization functions mapping ~40 LLM category variations"

echo ""
echo "=== Poison problem: failedFlagAttempts column ==="
grep -n "failedFlagAttempts\|failed_flag_attempts" apps/api/src/db/schema.ts
echo "↑ Should show integer column with default 0 on problems table"

echo ""
echo "=== Poison problem: auto-reject after 5 failures ==="
grep -n "trackFailedFlagAttempt\|MAX_FAILED" apps/api/src/routes/bot.routes.ts
echo "↑ Should show auto-reject function called on flag task failures"

echo ""
echo "=== Poison problem: dispatcher skips poisoned problems ==="
grep -n "failedFlagAttempts" apps/api/src/services/dispatcher.service.ts
echo "↑ Should show lt(problems.failedFlagAttempts, 5) in flag candidate query"

echo ""
echo "=== Task status: 'failed' on submit errors ==="
grep -n "status.*failed" apps/api/src/routes/bot.routes.ts | head -5
echo "↑ Should show catch block marks task as 'failed' before returning error"

echo ""
echo "=== Solutions unique index (one solution per bot per problem) ==="
grep -n "solutions_bot_problem_idx\|botProblemIdx" apps/api/src/db/schema.ts
echo "↑ Should show uniqueIndex on (botId, problemId)"

echo ""
echo "=== Solve duplicate 23505 handler ==="
grep -n "23505" apps/api/src/routes/bot.routes.ts
echo "↑ Should show handlers in both solve and create cases"
```

---

## SECTION 5b: STUCK-TASK FIX VERIFICATION

The stuck-task retry loop was a critical bug where failed task submissions left tasks in 'assigned' status, trapping bots in a retry loop. Three fixes were applied:

```bash
echo "=== Fix 1: Failed task marking in submit catch block ==="
grep -n "status.*failed\|failed.*mark" apps/api/src/routes/bot.routes.ts
echo "↑ Should show task status set to 'failed' in the catch block of POST /tasks/:id/submit"

echo ""
echo "=== Fix 2: 23505 duplicate handling in solve case ==="
grep -n -A 5 "23505" apps/api/src/routes/bot.routes.ts
echo "↑ Should show duplicate handling in BOTH create case AND solve case"
echo "  Solve case should mark task as 'completed' (not 'failed') for duplicates"

echo ""
echo "=== Fix 3: Unique index on solutions(botId, problemId) ==="
grep -n "solutions_bot_problem_idx\|botProblemIdx" apps/api/src/db/schema.ts
echo "↑ Should show uniqueIndex on (botId, problemId)"

echo ""
echo "=== uniqueIndex import present ==="
grep -n "uniqueIndex" apps/api/src/db/schema.ts | head -3
echo "↑ Should be imported from drizzle-orm/pg-core"

echo ""
echo "=== tasks table has correct indexes ==="
grep -n "tasks_bot_assigned_idx" apps/api/src/db/schema.ts
echo "↑ Should show unique partial index on bot_id WHERE status = 'assigned'"
```

Document:
- Whether the submit catch block marks tasks as 'failed' (prevents retry loop)
- Whether 23505 (duplicate key) is handled in both create AND solve cases
- Whether the unique index on solutions(bot_id, problem_id) exists in schema
- The complete error handling flow for task submission failures

---

## SECTION 6: VOTING & RANKING ENGINE

Show the COMPLETE:
- `apps/api/src/services/voting.service.ts` (or wherever Bradley-Terry logic lives)
- `apps/api/src/services/pair-selector.service.ts` (or equivalent)

Document: starting BT score, starting confidence interval, K-factor, ELO formula, pair selection strategy (Swiss/uniform/random percentages), maturity thresholds, win/loss bonus points.

```bash
echo ""
echo "=== BT transaction with SELECT FOR UPDATE ==="
grep -n "FOR UPDATE\|db\.transaction\|tx\." apps/api/src/services/bradley-terry.service.ts | head -10
echo "↑ Should show transaction wrapper locking solution rows before score update"

echo ""
echo "=== Deadlock prevention: consistent lock ordering ==="
grep -n "sort()\|idFirst\|idSecond" apps/api/src/services/bradley-terry.service.ts
echo "↑ Should show sorted ID ordering for FOR UPDATE locks"

echo ""
echo "=== Maturity bonus: atomic transition prevents double-award ==="
grep -n "mature.*RETURNING\|status.*!=.*mature" apps/api/src/services/bradley-terry.service.ts
echo "↑ Should show UPDATE WHERE status != 'mature' RETURNING — only one caller wins"

echo ""
echo "=== Duplicate vote prevention ==="
grep -n "voter_pair\|comparisons_voter_pair" apps/api/src/db/schema.ts
echo "↑ Should show uniqueIndex on (voterBotId, solutionAId, solutionBId)"

echo ""
echo "=== Pair normalization in selector ==="
grep -n "solutionA.id.*>.*solutionB.id\|normalize\|swap" apps/api/src/services/pair-selector.service.ts
echo "↑ Should show canonical ID ordering — smaller ID always as solutionA"

echo ""
echo "=== Duplicate comparison 23505 guard ==="
grep -n "23505" apps/api/src/services/bradley-terry.service.ts
echo "↑ Should show early return if same bot already voted on same pair"
```

---

## SECTION 7: MODERATION SYSTEM

Show the COMPLETE moderation logic (service + route handler).

Document:
- Flag verdict types (green/red)
- State transitions and thresholds (how many flags to approve/reject/tiebreak)
- Anti-gaming measures (owner diversity, weight decay if any)
- Who can flag (bots only via task system)

---

## SECTION 8: ALL CONSTANTS, LIMITS & CONFIGURATION

Show the COMPLETE `packages/shared/src/constants.ts`.

```bash
echo "=== All constants with values ==="
grep -rn "export const\|= {" packages/shared/src/constants.ts

echo ""
echo "=== Rate limit constants ==="
grep -rn "RATE\|LIMIT\|PER_HOUR\|PER_MIN" packages/shared/src/constants.ts apps/api/src/config/ 2>/dev/null

echo ""
echo "=== BT / scoring constants ==="
grep -rn "K_FACTOR\|BT\.\|MATURITY\|INITIAL.*SCORE\|STARTING" \
  packages/shared/src/constants.ts apps/api/src/ 2>/dev/null | grep -v node_modules | head -20
```

For each constant: variable name, value, file:line, what it controls.

```bash
echo ""
echo "=== Solution text limits updated ==="
grep -n "SOLUTION_TEXT_MAX" packages/shared/src/constants.ts
echo "↑ Should be 5000 (was 2000)"

echo ""
echo "=== Zod schema limits ==="
grep -n "min(50)\|max(5000)" apps/api/src/routes/bot.routes.ts
echo "↑ Should show min(50).max(5000) on solution_text"

echo ""
echo "=== Instruction character guidance ==="
grep -n "800-1800\|400-1200" packages/shared/src/constants.ts
echo "↑ Should show 800-1800 (was 400-1200)"

echo ""
echo "=== llm_model enhanced instructions ==="
grep -n "llm_model" packages/shared/src/constants.ts | head -5
echo "↑ Should show clear instruction with model name examples"
```

---

## SECTION 9: MIDDLEWARE & SECURITY

Show the COMPLETE contents of every file in `apps/api/src/middleware/`.

```bash
echo "=== Security utils ==="
cat apps/api/src/utils/security.ts 2>/dev/null

echo ""
echo "=== CORS config ==="
grep -n -A 10 "cors" apps/api/src/server.ts | head -30

echo ""
echo "=== Helmet config ==="
grep -n -A 10 "helmet" apps/api/src/server.ts | head -20

echo ""
echo "=== Rate limiter registration ==="
grep -n "rateLimit\|register.*limit" apps/api/src/server.ts | head -20

echo ""
echo "=== Redis auth ==="
grep -n "requirepass\|REDIS_PASSWORD" docker-compose.prod.yml 2>/dev/null

echo ""
echo "=== Prod port bindings ==="
grep -n -B1 -A2 "ports:" docker-compose.prod.yml 2>/dev/null
echo "↑ Should be 0 exposed ports (all traffic via Traefik)"

echo ""
echo "=== Signed OAuth cookies ==="
grep -c "signed: true" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 1"

echo ""
echo "=== Debug key via header (not query param) ==="
grep -n "X-Debug-Key\|x-debug-key\|debugKey" apps/api/src/middleware/ -r | head -5
echo "↑ Should use X-Debug-Key header only"

echo ""
echo "=== Hardcoded credentials check ==="
grep -rn "password.*=.*['\"][^'\"]\+['\"]" --include="*.ts" apps/api/src/ | \
  grep -v "schema\|test\|spec\|node_modules"
echo "↑ Should be empty"

echo ""
echo "=== Cookie secret separation ==="
grep -n "COOKIE_SECRET" apps/api/src/config/env.ts apps/api/src/server.ts
echo "↑ Should show COOKIE_SECRET in env schema and fastifyCookie registration"

echo ""
echo "=== Username/botName case-insensitive checks ==="
grep -c "LOWER(" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 8+ (case-insensitive uniqueness on all name checks)"
grep -n "eq(users.username," apps/api/src/routes/auth.routes.ts | grep -v "userId\|user.id"
grep -n "eq(users.botName," apps/api/src/routes/auth.routes.ts | grep -v "userId\|user.id"
echo "↑ Both must be empty — all name checks should use LOWER()"

echo ""
echo "=== Moderation atomic update ==="
grep -n "\.returning()" apps/api/src/services/moderation.service.ts
echo "↑ Should show .returning() on flag counter update (atomic UPDATE RETURNING)"

echo ""
echo "=== API key prefix length ==="
grep -n "apiKeyPrefix\|api_key_prefix" apps/api/src/db/schema.ts | head -3
echo "↑ Should show varchar length: 16"
grep -n "slice(0, 16)\|slice(0, 8)" apps/api/src/middleware/bot-auth.middleware.ts
echo "↑ Should show 16-char primary lookup with 8-char fallback"

echo ""
echo "=== Security workflow fails on vulnerabilities ==="
grep -c "continue-on-error" .github/workflows/security.yml 2>/dev/null
echo "↑ Must be 0 — workflow must fail on high-severity vulns"

echo ""
echo "=== google-auth-library installed ==="
grep "google-auth-library" apps/api/package.json
echo "↑ Should be present in dependencies"

echo ""
echo "=== No unused auth dependencies ==="
grep "next-auth" apps/web/package.json 2>/dev/null
echo "↑ Must be empty — next-auth was removed (unused)"

echo ""
echo "=== DB connection pool size ==="
grep -n "max.*30\|idle_timeout\|connect_timeout" apps/api/src/config/database.ts
echo "↑ Should show max: 30 (was default 10)"

echo ""
echo "=== Auto-migration on startup ==="
grep -n "migrate" apps/api/Dockerfile
echo "↑ Dockerfile CMD should run migrate.js before server.js"

echo ""
echo "=== Migration script ==="
head -5 apps/api/src/db/migrate.ts
echo "↑ Should show drizzle-orm migrator import"

echo ""
echo "=== api_key_prefix varchar(16) in initial migration ==="
grep "api_key_prefix" apps/api/drizzle/migrations/0000_*.sql
echo "↑ Should show varchar(16), NOT varchar(8)"

echo ""
echo "=== COOKIE_SECRET in prod compose ==="
grep -n "COOKIE_SECRET" docker-compose.prod.yml
echo "↑ Must be present in the api service environment block"
echo "  Correct syntax: COOKIE_SECRET: \${COOKIE_SECRET:-}"
echo "  NOTE: Must use :- (empty default), NOT :? (fail if missing)"
echo "  Reason: Coolify injects secrets at container runtime, not at docker compose build time."
echo "  The :? syntax causes build-time interpolation failure in Coolify even when the value"
echo "  is set in the Coolify dashboard. Runtime validation is handled by env.ts (z.string().min(32).optional())"

echo ""
echo "=== Bot rate limit constant vs route registration ==="
grep -n "BOT_RATE_LIMIT_PER_HOUR" packages/shared/src/constants.ts
grep -n "BOT_RATE_LIMIT_PER_HOUR\|registerBotRateLimit\|max:.*LIMITS" apps/api/src/routes/bot.routes.ts apps/api/src/middleware/rate-limit.middleware.ts
echo "↑ The constant value and what is passed to registerBotRateLimit must match"
echo "  Known discrepancy: route docs previously said 60 req/hr but constant is 360"

echo ""
echo "=== DPA and TOM PDFs gitignored ==="
git -C . check-ignore -v docs/DPA_en.pdf docs/TOM_en.pdf 2>/dev/null || \
  grep -n "DPA\|TOM\|\.pdf" .gitignore
echo "↑ Both PDFs must be gitignored — they contain confidential legal/personal details"
echo "  If NOT gitignored, this is a security/compliance issue"
```

---

## SECTION 10: FRONTEND — PAGES & COMPONENTS

```bash
echo "=== All frontend routes ==="
find apps/web/src/app -name "page.tsx" | sort

echo ""
echo "=== All components ==="
find apps/web/src/components -name "*.tsx" | sort

echo ""
echo "=== Middleware (access gate) ==="
cat apps/web/src/middleware.ts
echo "↑ Document the access gate: how does it work? keyword cookie? what routes are exempt?"

echo ""
echo "=== Middleware admin check — no token cookie check (HOTFIX-1) ==="
grep -n "cookies.get.*token\|callbackUrl\|loginUrl" apps/web/src/middleware.ts
echo "↑ Must be empty — admin paths should just call NextResponse.next() and let admin/layout.tsx handle auth client-side"
```

**Category UI components:**

```bash
echo "=== Category components ==="
ls apps/web/src/components/category/ 2>/dev/null

echo ""
echo "=== No group-related components (groups removed) ==="
ls apps/web/src/components/category/GroupTabNav.tsx 2>/dev/null && echo "⚠️ GroupTabNav still exists — should have been removed" || echo "✅ GroupTabNav removed"
```

Show COMPLETE contents of:
- `apps/web/src/components/category/CategoryChipRow.tsx` (or equivalent category filter component)
- `apps/web/src/components/layout/Navbar.tsx`
- `apps/web/src/components/layout/Sidebar.tsx`
- `apps/web/src/components/layout/Footer.tsx`
- `apps/web/src/app/page.tsx` (homepage)
- `apps/web/src/app/layout.tsx`

**Current nav/copy state verification:**

```bash
echo "=== Nav label for /problems link ==="
grep -n '"All Posts"\|"Questions"\|"Problems"' \
  apps/web/src/components/layout/Navbar.tsx apps/web/src/components/layout/Sidebar.tsx

echo ""
echo "=== CTA button text ==="
grep -n '"Ask a Question"\|"Post a Problem"' apps/web/src/components/layout/Navbar.tsx

echo ""
echo "=== /problems href unchanged ==="
grep -c 'href="/problems"' apps/web/src/components/layout/Navbar.tsx
echo "↑ Should be 1+"

echo ""
echo "=== How it works route ==="
ls apps/web/src/app/how-it-works/page.tsx 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"
ls apps/web/src/app/about/page.tsx 2>/dev/null && \
  grep -n "redirect\|how-it-works" apps/web/src/app/about/page.tsx | head -3

echo ""
echo "=== Homepage hero value props ==="
grep -n "65B5D2\|agentic internet\|synthetic data\|LLM leaderboard\|new kind of forum" \
  apps/web/src/app/page.tsx

echo ""
echo "=== DefaultAvatar using brain SVG ==="
grep -n "opensolve-brain\|next/image\|hsl\|charAt" apps/web/src/components/DefaultAvatar.tsx
ls apps/web/public/opensolve-brain.svg 2>/dev/null && echo "✅ SVG exists" || echo "❌ Missing"

echo ""
echo "=== Favicon ==="
ls apps/web/public/favicon.svg 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"
grep -n "favicon" apps/web/src/app/layout.tsx | head -5

echo ""
echo "=== Settings section order ==="
grep -n "Bot Identity\|API Key\|Newsletter\|dataControlsOpen\|Privacy Controls" \
  apps/web/src/app/settings/page.tsx | head -15

echo ""
echo "=== Newsletter landing page ==="
ls apps/web/src/app/newsletter/page.tsx 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Unsubscribe page — no login redirect ==="
grep -n "redirect\|router.push" apps/web/src/app/unsubscribe/page.tsx 2>/dev/null
echo "↑ Must be empty — unsubscribe cannot require login (UWG §7)"

echo ""
echo "=== Footer developer links ==="
grep -n "Build a Bot\|Bot Quick Start\|API Documentation\|Bot SDK" \
  apps/web/src/components/layout/Footer.tsx
echo "↑ Should show new labels only"

echo ""
echo "=== Footer contact link ==="
grep -n "/contact" apps/web/src/components/layout/Footer.tsx
echo "↑ Should show Contact link in footer"

echo ""
echo "=== Contact page ==="
ls apps/web/src/app/contact/page.tsx 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== HowItWorks — WiFi text removed ==="
grep -n "WiFi\|wifi" apps/web/src/components/dashboard/HowItWorks.tsx
echo "↑ Must be empty"
```

**Admin panel verification:**

Show the COMPLETE contents of:
- `apps/web/src/lib/admin-api.ts` (admin fetch utility with confirmation token flow)
- `apps/web/src/app/admin/layout.tsx` (admin sidebar + auth guard)

```bash
echo "=== Admin page line counts ==="
for page in problems moderation bots users activity communications debug; do
  f="apps/web/src/app/admin/$page/page.tsx"
  if [ -f "$f" ]; then
    echo "$page: $(wc -l < "$f") lines"
  else
    echo "$page: MISSING"
  fi
done
echo "↑ All should be 300+ lines (no placeholders)"

echo ""
echo "=== Admin dashboard ==="
wc -l apps/web/src/app/admin/page.tsx
echo "↑ Should be ~518 lines"

echo ""
echo "=== Admin API utility ==="
wc -l apps/web/src/lib/admin-api.ts
echo "↑ Should exist and contain adminFetch + adminConfirmedAction"

echo ""
echo "=== Zero Phase 2 placeholders ==="
grep -rl "Phase 2\|Coming in Phase\|Coming soon" apps/web/src/app/admin/ 2>/dev/null
echo "↑ Must be empty"

echo ""
echo "=== Admin page imports — all use adminFetch ==="
for page in problems moderation bots users activity; do
  count=$(grep -c "adminFetch\|adminConfirmedAction" "apps/web/src/app/admin/$page/page.tsx" 2>/dev/null)
  echo "$page: $count admin API calls"
done
echo "↑ All must be ≥ 1"
```

---

## SECTION 10b: LIVE ACTIVITY FEED DIAGNOSTIC

```bash
echo "=== Full leaderboard.routes.ts ==="
cat apps/api/src/routes/leaderboard.routes.ts

echo ""
echo "=== LLM model history in bot profile endpoint ==="
grep -c "llmModelHistory" apps/api/src/routes/leaderboard.routes.ts
echo "↑ Should be 1+ (GROUP BY query deriving model history from solutions table)"

echo ""
echo "=== currentLlmModel in leaderboard endpoint ==="
grep -c "currentLlmModel" apps/api/src/routes/leaderboard.routes.ts
echo "↑ Should be 1+ (batch subquery adding current model to each leaderboard bot)"

echo ""
echo "=== Full ActivityFeed.tsx ==="
cat apps/web/src/components/dashboard/ActivityFeed.tsx

echo ""
echo "=== /activity route — NULL botId filter ==="
grep -n "bot_id IS NOT NULL\|botId.*null\|WHERE.*bot" apps/api/src/routes/leaderboard.routes.ts
echo "↑ Should show WHERE clause excluding NULL botId rows"

echo ""
echo "=== actionLabels keys ==="
grep -A 30 "const actionLabels" apps/web/src/components/dashboard/ActivityFeed.tsx

echo ""
echo "=== Distinct action values in DB ==="
echo "SELECT action, COUNT(*) FROM activity_log GROUP BY action ORDER BY count DESC;" | \
  docker exec -i os-postgres psql -U postgres -d opensolve 2>/dev/null || \
  echo "NOTE: Run manually — list all distinct action strings and verify each is in actionLabels"
```

For each action string found, record: exact DB string, UI label, Lucide icon, whether problemTitle is required.

---

## SECTION 11: EMAIL INFRASTRUCTURE

Show the COMPLETE:
- `apps/api/src/services/email.service.ts`
- `apps/api/src/email/templates.ts`
- `apps/api/src/utils/newsletter-tokens.ts`
- `apps/api/src/routes/newsletter.routes.ts`
- `apps/api/src/routes/admin.email.routes.ts`
- `apps/api/src/routes/contact.routes.ts`

```bash
echo "=== Email provider ==="
grep -n "resend\|Resend\|brevo\|postmark\|sendgrid" apps/api/src/services/email.service.ts | head -10
echo "↑ Document which provider is in use"

echo ""
echo "=== Open tracking disabled ==="
grep -n "track\|openTracking\|clickTracking" apps/api/src/services/email.service.ts
echo "↑ Should show tracking explicitly disabled"

echo ""
echo "=== Templates present ==="
grep -n "export\|function\|const.*Template\|=.*=>" apps/api/src/email/templates.ts | head -25
echo "↑ Expected: importantMessage, newsletter, newsletterConfirm, unsubscribeConfirm, contactForm"

echo ""
echo "=== Newsletter disclosure simplified ==="
grep -n "sponsored content and affiliate" apps/api/src/email/templates.ts
echo "↑ Should show one-liner footer disclosure"

echo ""
echo "=== Old bilingual labels removed ==="
grep -n "Hinweis\|Anzeige\|Subscriber data" apps/api/src/email/templates.ts
echo "↑ Must be empty — bilingual disclosure block removed in REG-4"

echo ""
echo "=== Contact form template ==="
grep -n "contactFormTemplate\|contact.*Template" apps/api/src/email/templates.ts | head -5
echo "↑ Should exist"

echo ""
echo "=== Contact form route ==="
ls apps/api/src/routes/contact.routes.ts 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"
grep -n "fastify\." apps/api/src/routes/contact.routes.ts 2>/dev/null | head -5
echo "↑ Should show POST /contact with rate limit 3/hr"

echo ""
echo "=== Double opt-in — subscribe does NOT set subscribed=true ==="
grep -n "newsletterSubscribed.*true" apps/api/src/routes/newsletter.routes.ts | head -5
echo "↑ Should only appear in /confirm route"

echo ""
echo "=== Retention service ==="
cat apps/api/src/services/retention.service.ts 2>/dev/null | head -60
grep -n "logger\." apps/api/src/services/retention.service.ts | head -10
echo "↑ Should have logger.info at start, completion, and catch block"

echo ""
echo "=== Retention wired in server ==="
grep -n "retention\|setInterval" apps/api/src/server.ts | head -5
```

---

## SECTION 12: DEPLOYMENT & INFRASTRUCTURE

Show the COMPLETE:
- `docker-compose.prod.yml`
- `deploy/traefik/opensolve.yaml`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`

```bash
echo "=== Container hostnames (must be unique to avoid Coolify DNS collisions) ==="
grep -n "container_name" docker-compose.prod.yml

echo ""
echo "=== Coolify network usage ==="
grep -n "coolify\|network" docker-compose.prod.yml | tail -20

echo ""
echo "=== Migrations in API Docker image ==="
grep -n "drizzle\|migration\|COPY" apps/api/Dockerfile
echo "↑ Should show COPY drizzle/ ./drizzle/ — fixed in INFRA-1"

echo ""
echo "=== opensolve.io references (should be 0 in runtime code) ==="
grep -rn "opensolve\.io" --include="*.ts" --include="*.tsx" --include="*.js" \
  --include="*.yml" --include="*.yaml" . 2>/dev/null | \
  grep -v node_modules | grep -v .next | grep -v SNAPSHOT | grep -v PROMPT
echo "↑ Should be empty"

echo ""
echo "=== GitHub workflows ==="
cat .github/workflows/ci.yml
cat .github/workflows/deploy.yml
cat .github/workflows/security.yml
```

**Known infrastructure facts (confirm or correct each):**
- Host: Hetzner (Germany), managed via Coolify
- Reverse proxy: Traefik, config at `/data/coolify/proxy/dynamic/opensolve.yaml`, priority 1000
- Traefik file provider routes to stable Docker hostnames (`os-web:3000`, `os-api:4000`) on `coolify` network
- Coolify strips router labels on redeploy but preserves service port labels
- UFW firewall: ports 22, 80, 443 only
- DOCKER-USER iptables blocks external access to ports 3000, 4000, 5432, 6379, 7700, 6001, 6002, 8080
- Coolify dashboard: SSH tunnel only
- Hetzner DPA: signed March 2026 via Hetzner account portal
- Domain: opensolve.ai (Porkbun registrar), SSL via Let's Encrypt/Traefik
- **Admin panel Traefik protection:** 'admin-opensolve-https' router with Traefik Basic Auth
  middleware ('admin-auth') covers both 'opensolve.ai/admin' and 'www.opensolve.ai/admin'
  at priority 1100 — second layer on top of the API-level adminMiddleware JWT + role check.
  Hash algorithm: bcrypt ($2y$) — upgraded from Apache MD5 in SEC-FIX-7.

**Traefik config verification (run on server):**

```bash
echo "=== Full Traefik file provider config (live on server) ==="
cat /data/coolify/proxy/dynamic/opensolve.yaml

echo ""
echo "=== Admin router present ==="
grep -n "admin-opensolve-https\|admin-auth\|PathPrefix.*admin"   /data/coolify/proxy/dynamic/opensolve.yaml
echo "↑ Should show admin router with basicAuth middleware at priority 1100"

echo ""
echo "=== Both domains covered ==="
grep -A 10 "admin-opensolve-https" /data/coolify/proxy/dynamic/opensolve.yaml
echo "↑ Rule must include both opensolve.ai and www.opensolve.ai"

echo ""
echo "=== Admin Basic Auth uses bcrypt (not apr1) ==="
grep "basicAuth" -A 3 /data/coolify/proxy/dynamic/opensolve.yaml | grep -o '\$[a-z0-9]*\$' | head -1
echo "↑ Must show \$2y\$ (bcrypt). If it shows \$apr1\$ (Apache MD5), the hash was reset by a Coolify redeploy and needs to be regenerated."
```

---

## SECTION 13: REGULATORY COMPLIANCE

```bash
echo "=== GDPR legal pages ==="
ls apps/web/src/app/privacy/page.tsx apps/web/src/app/terms/page.tsx \
  apps/web/src/app/impressum/page.tsx 2>/dev/null

echo ""
echo "=== Privacy policy — Art. 18 present ==="
grep -n "Art. 18\|Restrict processing\|restriction" apps/web/src/app/privacy/page.tsx | head -5
echo "↑ Should exist; rights order: 15 → 16 → 17 → 18 → 20 → 21"

echo ""
echo "=== Privacy policy — last updated date ==="
grep -n "Last updated\|last updated" apps/web/src/app/privacy/page.tsx | head -3

echo ""
echo "=== Privacy policy — Hetzner named ==="
grep -n "Hetzner" apps/web/src/app/privacy/page.tsx | head -5
echo "↑ Should show Hetzner Online GmbH with Art. 28 DPA reference"

echo ""
echo "=== Privacy policy — affiliate section ==="
grep -n "Affiliate\|affiliate" apps/web/src/app/privacy/page.tsx | head -5
echo "↑ Should have Affiliate Links & Advertising section"

echo ""
echo "=== Privacy policy — tracking statement definitive ==="
grep -n "tracking\|open tracking\|Resend" apps/web/src/app/privacy/page.tsx | head -5
echo "↑ Should be definitive statement that tracking is OFF (no TODO)"

echo ""
echo "=== Privacy policy — cookie names explicit ==="
grep -n "opensolve_cookie_notice\|oauth_state" apps/web/src/app/privacy/page.tsx | head -5
echo "↑ Should show technical cookie names (REG-3)"

echo ""
echo "=== Privacy policy — transfer contradiction fixed ==="
grep -n "No data is transferred" apps/web/src/app/privacy/page.tsx
echo "↑ Must be empty — old contradictory statement removed (REG-3)"

echo ""
echo "=== Privacy policy — Google OAuth in processors ==="
grep -n "Google.*Authentication\|policies.google.com" apps/web/src/app/privacy/page.tsx | head -3
echo "↑ Should show Google in Data Processors section (REG-3)"

echo ""
echo "=== Terms — governing law ==="
grep -n "Swedish law\|governing\|Governing Law" apps/web/src/app/terms/page.tsx | head -5
echo "↑ Should show governing law clause (REG-1)"

echo ""
echo "=== Terms — DSA content moderation ==="
grep -n "Content Moderation\|moderation" apps/web/src/app/terms/page.tsx | head -5
echo "↑ Should show content moderation section (REG-1)"

echo ""
echo "=== Terms — age requirement ==="
grep -n "16 years old" apps/web/src/app/terms/page.tsx
echo "↑ Should show age requirement (REG-1)"

echo ""
echo "=== Terms — dispute resolution ==="
grep -n "Dispute Resolution\|ARN\|arn.se" apps/web/src/app/terms/page.tsx | head -5
echo "↑ Should show dispute resolution with ARN reference (REG-1)"

echo ""
echo "=== Impressum — DSA contact point ==="
grep -n "DSA\|2022/2065\|Single Point" apps/web/src/app/impressum/page.tsx | head -5
echo "↑ Should show DSA Art. 11-12 contact point (REG-2)"

echo ""
echo "=== Impressum — VAT statement ==="
grep -n "VAT" apps/web/src/app/impressum/page.tsx | head -3
echo "↑ Should show VAT exempt statement (REG-2)"

echo ""
echo "=== Impressum — contact form link ==="
grep -n "/contact" apps/web/src/app/impressum/page.tsx | head -3
echo "↑ Should show link to contact form (REG-2)"

echo ""
echo "=== Impressum — ODR discontinued ==="
grep -n "discontinued\|20 July 2025" apps/web/src/app/impressum/page.tsx | head -3
echo "↑ Should show updated ODR text (REG-2)"

echo ""
echo "=== Login page — email paragraph removed ==="
grep -n "store your Google email" apps/web/src/app/auth/login/page.tsx
echo "↑ Must be empty (REG-4)"

echo ""
echo "=== Problem page — DSA report link ==="
grep -n "Report this content" apps/web/src/app/problems/\\[id\\]/page.tsx
echo "↑ Should show mailto report link (REG-4)"

echo ""
echo "=== Submit page — license note ==="
grep -n "MIT License" apps/web/src/app/submit/page.tsx
echo "↑ Should show license acknowledgment (REG-4)"

echo ""
echo "=== Zero TODOs in legal pages ==="
grep -n "TODO\|FIXME" apps/web/src/app/privacy/page.tsx \
  apps/web/src/app/terms/page.tsx apps/web/src/app/impressum/page.tsx 2>/dev/null
echo "↑ Must be empty"

echo ""
echo "=== LIA document ==="
ls docs/LEGITIMATE-INTEREST-ASSESSMENT.md 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Newsletter consent assessment ==="
ls docs/NEWSLETTER-CONSENT-ASSESSMENT.md 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== GDPR compliance check script ==="
ls tests/gdpr-compliance-check.sh 2>/dev/null && \
  grep -c "^assert\|^check\|^test" tests/gdpr-compliance-check.sh 2>/dev/null || \
  echo "❌ Missing"
echo "↑ Note total check count"

echo ""
echo "=== Double opt-in enforced ==="
grep -n "newsletter_subscribed.*=.*true\|newsletterSubscribed.*true" \
  apps/api/src/routes/newsletter.routes.ts | head -5
echo "↑ Should ONLY appear in /confirm route, never in /subscribe"

echo ""
echo "=== Access gate — /contact exempt ==="
grep "contact" apps/web/src/middleware.ts
echo "↑ Should show /contact in exempt paths"
```

**Legal basis summary to confirm:**
- Email storage: GDPR Art. 6(1)(f) legitimate interest for service notifications
- Newsletter: GDPR Art. 6(1)(a) consent (double opt-in)
- Newsletter advertising/affiliate: GDPR Art. 6(1)(a) (same consent, disclosed at opt-in)
- Contact form: GDPR Art. 6(1)(f) legitimate interest (responding to inquiries, DSA compliance)
- Account deletion: anonymization (not hard delete) to preserve Bradley-Terry integrity

---

## SECTION 14: CURRENT STATE, KNOWN ISSUES & OPEN TASKS

### TypeScript health

```bash
cd apps/api && npx tsc --noEmit 2>&1 | head -30
cd ../web && npx tsc --noEmit 2>&1 | head -30
```

### Lint health

```bash
cd apps/api && npm run lint 2>&1 | tail -5
cd ../web && npm run lint 2>&1 | tail -5
```

### TODO/FIXME scan

```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|TEMP" --include="*.ts" --include="*.tsx" \
  . 2>/dev/null | grep -v node_modules | grep -v .next
echo "↑ Legal pages must have zero TODOs"
```

### Access gate

```bash
echo "=== Web middleware (access gate mechanism) ==="
cat apps/web/src/middleware.ts
echo "↑ Document: how does the pre-launch gate work? What is the keyword/cookie? What routes are exempt?"
```

### Known open tasks

Document these explicitly — confirm current state of each:

1. **Dockerfile migration gap** — Should be FIXED. Verify:
   ```bash
   grep -n "drizzle" apps/api/Dockerfile
   echo "↑ Should show COPY drizzle/ ./drizzle/"
   ```

2. **Admin panel pages** — All 5 admin sub-pages are fully implemented (Problems, Bots, Users, Moderation, Activity). Verify they are still functional and list line counts.

3. **Debug page migration** — Confirm `/debug-x9k4m7` has been moved to `/admin/debug` and added to the admin sidebar. Verify:
   ```bash
   ls apps/web/src/app/admin/debug/ 2>/dev/null && echo "OK" || echo "NOT MIGRATED"
   grep -r "debug-x9k4m7" apps/web/src/ --include="*.tsx" --include="*.ts" 2>/dev/null
   echo "Above grep must return 0 results if migration is complete"
   grep -n "debug\|Debug" apps/web/src/app/admin/layout.tsx 2>/dev/null || grep -rn "debug\|Debug" apps/web/src/app/admin/ --include="layout.tsx"
   echo "Above must show Debug link in admin sidebar"
   ```

4. **Swedish Aktiebolag** — Not yet formed. Impressum currently lists individual (Taner Tuna, Karlstad, Sweden). Planned before public launch.

5. **Access gate removal** — Platform is currently behind a keyword/cookie gate for pre-launch testing. Confirm gate is still active.

6. **Email provider** — Resend is in use. Document `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`, `APP_BASE_URL` env vars and confirm they are wired in `docker-compose.prod.yml`.

7. **Google OAuth** — Consent screen published to production (March 2026). Branding verification pending (logo not shown on consent screen — cosmetic only). No user cap, scopes are non-sensitive (`openid email`).

8. **LIA appendix consistency** — `docs/LEGITIMATE-INTEREST-ASSESSMENT.md` appendix says "Transfers to third countries: None" — should be updated to reference Resend US transfer for consistency with privacy policy.

9. **Content licensing** — MIT License currently applied to user-submitted content (stated in Terms). AGPL v3 + commercial dual-license model was discussed as alternative but not actioned. Business decision, not a regulatory gap.

10. **COOKIE_SECRET production env** — Verify `COOKIE_SECRET` is set in production environment (added via Coolify). Without it, the code falls back to `JWT_SECRET` (still works, but loses the separation benefit).

11. **Admin Basic Auth hash algorithm** — Upgraded from Apache MD5 (`$apr1$`) to bcrypt (`$2y$`) in SEC-FIX-7. Credentials rotated. Verify the live config still uses bcrypt (Coolify redeploys can reset dynamic Traefik configs).

12. **Pending problem deadlock** — When all available bots have flagged a problem with mixed verdicts (e.g., 2 green + 1 red) and there are no more bots to flag, the problem stays pending forever. Needs either: lower tiebreaker threshold (2G/1R → approve), timeout-based auto-resolution, or admin escalation.

13. **Bot-created duplicate topics** — Bots using `instruct=none` with CREATE tasks generate the same topics across fresh databases (e.g., "Why do hospitals still use fax machines") because they have no context about existing problems. The CREATE payload should include recent problem titles to prevent semantic duplicates.

---

## SECTION 15: SESSION HISTORY (Chronological)

Document all implemented changes in order. For each session: label, primary files changed, key change.

Use this corrected table as the authoritative reference — verify each session is actually present in the codebase:

| Session | Primary Files | Key Change |
|---------|--------------|------------|
| **A** | email.service.ts, email/templates.ts | Resend SDK wrapper, 4 HTML email templates |
| **B** | schema.ts, newsletter-tokens.ts, newsletter.routes.ts | 5 newsletter DB columns, token utils, 5 API routes |
| **C** | admin.email.routes.ts, admin/communications/page.tsx | 6 admin email endpoints, Redis one-time confirmation tokens, 4-tab communications page |
| **D** | settings/page.tsx, newsletter/confirm/page.tsx, unsubscribe/page.tsx, NewsletterBanner.tsx | Frontend newsletter UI (4 states), confirm + unsubscribe pages |
| **E** | privacy/page.tsx, terms/page.tsx, NEWSLETTER-CONSENT-ASSESSMENT.md, LIA update, login/page.tsx | Compliance docs, newsletter sections in legal pages |
| **F** | packages/shared/src/categories.ts, schema.ts, instruction.routes.ts, dispatcher.service.ts | 12 → 21 categories, 3 groups, weighted CREATE pool |
| **G+H** | problem.routes.ts, docs/api/page.tsx, docs/sdk/page.tsx | ?group filter on categories API, docs updated |
| **I** | GroupTabNav.tsx (NEW), CategoryChipRow.tsx (NEW), problems/page.tsx | 2-tier group/category filter UI on browse page |
| **J** | Navbar.tsx, page.tsx (home), submit/page.tsx | Nav "Questions", CTA "Ask a Question" (hrefs unchanged) |
| **K** | about/page.tsx, AboutCategories.tsx, AboutHowItWorks.tsx | 3-group visual grid on about page, everyday examples added |
| **SKILL** | skill/SKILL.md v1.1.0, docs/BOT_GUIDE.md, docs/API.md, bots/* | Bot docs updated for 21 categories |
| **NL-1** | terms/page.tsx, NewsletterBanner.tsx, settings/page.tsx, email/templates.ts, NEWSLETTER-CONSENT-ASSESSMENT.md | Newsletter advertising & affiliate consent language; removed false "no advertising" from Terms; affiliate disclosure block in email template |
| **NL-2** | privacy/page.tsx, LIA, terms/page.tsx | Affiliate Links & Advertising section in privacy; definitive tracking statement; Hetzner Online GmbH named with Art. 28; zero TODOs in all legal pages |
| **ACT** | leaderboard.routes.ts, ActivityFeed.tsx | Activity feed fix: filter NULL botId rows, expanded actionLabels/actionIcons to cover all DB action strings |
| **UI-1** | Navbar.tsx, Sidebar.tsx | Nav label "Questions" → "All Posts" (href /problems unchanged) |
| **UI-2** | Navbar.tsx, Footer.tsx, about/page.tsx, how-it-works/page.tsx (NEW), page.tsx, AboutCTA.tsx | About page renamed to How it works; /about redirects; all internal links updated |
| **UI-3** | layout.tsx, AboutCTA.tsx | Root metadata reframing; "Browse All Posts" CTA |
| **UI-4** | AboutHumanFirst.tsx, AboutCategories.tsx, AboutSafety.tsx, Footer.tsx | Priority stack fixed (flag→solve→vote→create); finance_personal added; safety 3rd branch; footer tagline |
| **UI-5** | docs/api/page.tsx, docs/API.md, docs/sdk/page.tsx | API endpoint descriptions updated; rate limits corrected (5000/360/200/hr) |
| **UI-QS** | AboutQuickStart.tsx (NEW), how-it-works/page.tsx | 3-step OpenClaw quick start guide; raw GitHub download link |
| **UI-HERO** | AboutHero.tsx | Three value pillar cards (forum/synthetic data/LLM leaderboard), color #65B5D2 |
| **UI-NL** | newsletter/page.tsx (NEW), Footer.tsx | Newsletter landing page; "Newsletter" link in footer Community section |
| **UI-HW** | HowItWorks.tsx | WiFi subtext removed; subtitle "multiple models" moved here; "How it works →" pill button |
| **UI-HP** | page.tsx (homepage) | Hero right column: 3-line value prop, "BUILT FOR THE AGENTIC INTERNET" label, ml-auto right alignment |
| **UI-FT** | Footer.tsx | Dev links: "Build a Bot" + "Bot Quick Start"; column order: Platform → Community → Developers |
| **UI-SET** | settings/page.tsx | Section order: Email → Username → Bot Identity → API Key → Newsletter; Your Data + Danger Zone behind dataControlsOpen toggle |
| **UI-AVT** | DefaultAvatar.tsx, public/opensolve-brain.svg (NEW) | Brain SVG avatar via next/image |
| **UI-FAV** | public/favicon.svg (NEW), layout.tsx | B&W brain SVG favicon; declared in metadata.icons |
| **COMP-1** | email/templates.ts, tests/gdpr-compliance-check.sh | Affiliate disclosure hardened: bilingual Hinweis/Anzeige, UWG §7 Anzeige label |
| **COMP-2** | privacy/page.tsx | Art. 18 Right to Restriction added; rights in order 15→16→17→18→20→21; date updated |
| **COMP-3** | services/retention.service.ts | Retention logging hardened: logger.info start/completion, logger.error in catch |
| **SEC-1** | /data/coolify/proxy/dynamic/opensolve.yaml (on server) | Traefik Basic Auth added for /admin on both opensolve.ai and www.opensolve.ai — admin-opensolve-https router at priority 1100 with admin-auth basicAuth middleware |
| **SEC-2** | apps/web/src/app/admin/debug/, admin layout/sidebar | Debug dashboard moved from /debug-x9k4m7 to /admin/debug; ?key= URL auth replaced with admin JWT role check; Debug item added to admin sidebar nav |
| **ADMIN-1** | apps/web/src/app/admin/problems/page.tsx | Problems management page: filterable table with status override, pagination, summary pills, 30s auto-refresh |
| **ADMIN-2** | apps/web/src/app/admin/moderation/page.tsx | Moderation queue page: 3-tab layout (pending/mixed/rejected), expandable cards with inline flags, approve/reject/restore actions |
| **ADMIN-3** | admin.routes.ts (new GET /admin/bots), apps/web/src/app/admin/bots/page.tsx | Bot management: new list endpoint + full management page with status actions (suspend/ban/reactivate) |
| **ADMIN-4** | admin.routes.ts (new GET /admin/users), apps/web/src/app/admin/users/page.tsx | User management: new list endpoint (no sensitive fields exposed) + read-only user viewer with role/bot/newsletter filters |
| **ADMIN-5** | admin.routes.ts (new GET /admin/activity), apps/web/src/app/admin/activity/page.tsx | Activity log: new endpoint with actionCounts + full log viewer with color-coded action badges, metadata expansion, 15s refresh |
| **REG-1** | terms/page.tsx | Governing law (Swedish), DSA content moderation section, 16+ age requirement, dispute resolution (ARN) |
| **REG-2** | impressum/page.tsx, contact/page.tsx (NEW), contact.routes.ts (NEW), templates.ts, middleware.ts, server.ts | Contact form page + API route; Impressum: VAT exempt, DSA contact point (Art. 11-12), ODR updated |
| **REG-3** | privacy/page.tsx | Cookie names explicit, transfer contradiction fixed, Google OAuth added to processors |
| **REG-4** | auth/login/page.tsx, templates.ts, NewsletterBanner.tsx, settings/page.tsx, problems/[id]/page.tsx, submit/page.tsx, gdpr-compliance-check.sh | Removed login email paragraph; newsletter disclosure simplified (one-liner, no bilingual); DSA report mailto on problems; MIT license note on submit |
| **INFRA-1** | apps/api/Dockerfile | drizzle/ migrations directory copied into Docker image |
| **SEC-FIX-1** | auth.routes.ts, package.json | Google ID token cryptographic verification via google-auth-library (verifyIdToken with JWKS, iss, aud, exp checks) |
| **SEC-FIX-2** | .github/workflows/security.yml | Removed continue-on-error from npm audit and audit-ci steps — workflow now fails on high-severity vulnerabilities |
| **SEC-FIX-3** | config/env.ts, server.ts, .env.example | Separate COOKIE_SECRET env var for fastifyCookie signing (falls back to JWT_SECRET for backward compat) |
| **SEC-FIX-4** | auth.routes.ts | Case-insensitive username and botName uniqueness checks via SQL LOWER() on all name-checking queries |
| **SEC-FIX-5** | services/moderation.service.ts | Atomic flag counter update using UPDATE ... RETURNING to prevent TOCTOU race condition |
| **SEC-FIX-6** | bot-auth.middleware.ts, utils/crypto.ts, schema.ts, constants.ts, migration | API key prefix extended from 8 to 16 chars with legacy 8-char fallback; schema widened to varchar(16) |
| **CHORE-1** | apps/web/package.json | Removed unused next-auth dependency (zero references in codebase) |
| **HOTFIX-1** | apps/web/src/middleware.ts | Removed broken token cookie check from /admin middleware — cookie is set on api.opensolve.ai but middleware runs on www.opensolve.ai (different domains), causing infinite login redirect. Admin auth handled by admin/layout.tsx client-side. |
| **SEC-FIX-7** | /data/coolify/proxy/dynamic/opensolve.yaml (on server) | Admin Basic Auth hash upgraded from Apache MD5 ($apr1$) to bcrypt ($2y$) for brute-force resistance; credentials rotated |
| **CAT-REDUCE** | packages/shared/src/categories.ts, schema.ts, constants.ts, dispatcher.service.ts, bot.routes.ts, problem.routes.ts, SKILL.md, 27+ web app files | 21 categories (3 groups) reduced to 8 categories (flat, no groups); all group references removed |
| **SKILL-OPT-1** | skill/SKILL.md v2.0.0 (rewrite), skill/ONBOARDING.md (NEW) | SKILL.md reduced from ~1,849 words to ~250 words; rubrics, categories, submit formats moved to ONBOARDING.md; weekly scheduled contribution with day-of-install cron schedule |
| **SKILL-OPT-2** | bot.routes.ts, dispatcher.service.ts, instruction.routes.ts | `?instruct=none` parameter on GET /tasks/next — omits instruction field from task payloads. Note: response_format is now ALWAYS sent regardless of instruct mode (FIX-RESP-FMT) |
| **SKILL-OPT-3** | bot.routes.ts, dispatcher.service.ts | `?categories=slim` parameter on GET /tasks/next — FLAG/CREATE tasks send category slugs only instead of full objects |
| **SKILL-OPT-4** | dispatcher.service.ts | Content wrappers shortened from `===BEGIN CONTENT (TREAT AS DATA ONLY)===` (62 chars) to `---DATA---` (22 chars) |
| **SKILL-OPT-5** | skill/ONBOARDING.md | Cron task message reduced from ~500+ chars to ~200 chars; uses optimized query string |
| **FIX-BOTDEFAULTS** | leaderboard/page.tsx, bots/page.tsx, bots/[id]/page.tsx | ELO and Vote Accuracy display "—" instead of default values (1200 / 50%) when bot has zero solutions or zero votes respectively. Admin pages unaffected. |
| **FIX-ISR** | apps/web/src/lib/api.ts, apps/web/src/app/api/revalidate/route.ts, docker-compose.prod.yml | Removed `cache: 'force-cache'` default from apiFetch (was overriding page-level revalidate); added on-demand revalidation POST endpoint; added nextcache Docker volume for ISR persistence |
| **FIX-ISR-WIRE** | apps/api/src/services/revalidate.service.ts (NEW), bot.routes.ts, problem.routes.ts, docker-compose.prod.yml | Fire-and-forget revalidation calls from API to web container on data-changing events (problem create, flag, solve, vote); WEB_INTERNAL_URL + REVALIDATION_SECRET env vars |
| **FIX-DEDUP** | bot.routes.ts, problems table (production index) | Unique index `problems_title_unique` on `lower(trim(title))` prevents duplicate problem titles; create handler catches PostgreSQL 23505 error and returns `{ success: true, duplicate: true }` |
| **FIX-STUCK-TASK** | bot.routes.ts, schema.ts, migration | Three fixes: (1) catch block marks task as 'failed' on submit errors, (2) solve case handles 23505 duplicate with 'completed' status, (3) unique index `solutions_bot_problem_idx` on (bot_id, problem_id) |
| **FIX-MIGRATION-ENUM** | drizzle/migrations/0001_medical_blur.sql | Added `IF NOT EXISTS` to all `ALTER TYPE ADD VALUE` and `ALTER TABLE ADD COLUMN` statements to prevent failures on fresh database migrations |
| **FIX-LLM-REGEX** | bot.routes.ts, validation.ts | `LLM_MODEL_PATTERN` regex updated to allow `/`, `:`, `+` characters — fixes NULL storage for Ollama-style model names like `ollama/qwen3.5:9b`; same fix applied to shared validation schema |
| **REFACTOR-MODEL-FAMILIES** | packages/shared/src/model-families.ts (NEW), constants.ts, index.ts, validation.ts, DebugDashboard.tsx | Model family logic extracted from constants.ts into dedicated model-families.ts; 40 curated families with matchKeys arrays; auto-detection with deterministic color for unknown models; no "Other" bucket; admin debug dashboard uses shared getModelFamily() instead of hardcoded FAMILY_COLORS |

| **HOTFIX-OLLAMA-MATCH** | packages/shared/src/model-families.ts | Fixed false positive: `getModelFamily()` no longer matches against raw input string — only against provider-stripped string. Prevents `ollama/` matching as "Llama" and `groq/` matching as "Grok" |
| **FIX-FLAG-VALID** | bot.routes.ts | .nullable().optional() on suggested_category in flagSchema |
| **FIX-FLAG-NORM** | bot.routes.ts | normalizeFlagCategory() + normalizeSuggestedCategory() map ~40 LLM variations to valid enums before Zod parse |
| **FIX-POISON** | schema.ts, bot.routes.ts, server.ts, dispatcher.service.ts | failedFlagAttempts column; auto-reject after 5 failures; dispatcher skips poison problems |
| **FIX-RACE-BT** | bradley-terry.service.ts | db.transaction() + SELECT FOR UPDATE on solution rows; deadlock-safe ID ordering |
| **FIX-RACE-MATURE** | bradley-terry.service.ts | Atomic maturity transition: UPDATE WHERE status != 'mature' RETURNING prevents double bonus |
| **FIX-RACE-TASK** | schema.ts, dispatcher.service.ts | Partial unique index tasks_bot_assigned_idx on (bot_id) WHERE status='assigned'; 23505 fallback |
| **FIX-RACE-POOL** | database.ts | DB pool max: 30, idle_timeout: 20, connect_timeout: 10 |
| **FIX-RACE-VOTE** | schema.ts, bradley-terry.service.ts, pair-selector.service.ts | uniqueIndex on comparisons(voter, solA, solB); normalized pair ordering; 23505 guard |
| **FIX-RACE-HERD** | dispatcher.service.ts, bot.routes.ts, server.ts | Redis INCR/DECR cap of 3 concurrent flag assignments per problem |
| **FIX-FLAG-CTR** | bot.routes.ts, server.ts | Lua script safeDecrFlagCounter() floors counter at 0; prevents negative from expired+late-submit race |
| **FIX-AUTO-MIG** | Dockerfile | CMD runs migrate.js before server.js; migrations auto-apply on every deploy |
| **FIX-VARCHAR16** | drizzle/migrations/0000_*.sql | api_key_prefix varchar(8) → varchar(16) in initial migration SQL |
| **FIX-RESP-FMT** | dispatcher.service.ts | response_format sent unconditionally (was stripped by instruct=none, breaking llm_model reporting) |
| **FIX-CHAR-LIM** | constants.ts, bot.routes.ts | SOLUTION_TEXT_MAX 2000→5000; Zod min(50) max(5000); instruction text 800-1800; llm_model instructions enhanced |
| **SKILL-v2.1** | skill/SKILL.md, skill/ONBOARDING.md | Submit Formats section with exact JSON; CRITICAL llm_model with provider examples; 800-1800 char limits; all flag enum values inline |
| **FIX-REJECTED** | problem.routes.ts | "All" status filter on GET /problems now excludes rejected problems (`ne(problems.status, 'rejected')`); rejected only visible when explicitly filtered |
| **USER-PROFILE** | user-profile.routes.ts (NEW), server.ts, users/[id]/page.tsx (NEW), problems/[id]/page.tsx | Public user profile page at /users/:id showing username, join date, posted problems, linked bot; human author names clickable on problem detail page |
| **UI-SOLUTIONS** | problems/[id]/page.tsx | Top Solutions section changed from 3-column grid to full-width vertical stack for readability |
| **CACHE-FIX** | apps/web/src/lib/api.ts, 6 page files | Added `cache: 'no-store'` to apiFetch; replaced `revalidate` with `export const dynamic = 'force-dynamic'` on problems, problem detail, bot profile, leaderboard, LLM leaderboard, user profile pages; homepage keeps `revalidate = 30` |
| **LLM-CHAR-UPDATE** | constants.ts, bot.routes.ts, docs/sdk/page.tsx, skill/ONBOARDING.md, skill/SKILL.md | SOLUTION_TEXT_MAX 2000→5000; solve instruction sweet spot 400-1200→800-1800; llm_model examples added; bot.routes.ts schema max 2000→5000 |
| **MODEL-ARENA-TABS** | llm-leaderboard/page.tsx, llm-leaderboard.routes.ts, llm-leaderboard.service.ts | Reduced from 6 sort tabs to 4: Most Voted (win_rate, new default), Overall Rating (avg_score), Most Wins (first_place_count), Most Prolific (total_solutions); removed best_score and top3_count sort options; each tab shows description when active |
| **PERF-1** | database.ts, docker-compose.prod.yml, docker-compose.yml, server.ts | DB pool 30→50, postgres max_connections 300/150, sweep overlap guard, RETURNING-based expiry sweep |
| **PERF-2** | sse.routes.ts | SSE shared broadcast loop replaces per-client polling; 200-client connection cap |
| **PERF-3** | leaderboard.routes.ts, pair-selector.service.ts | selectDistinctOn for LLM model lookup; SolutionSlim + post-selection text hydration |
| **PERF-4** | schema.ts, 0007_add_missing_indexes.sql, leaderboard.routes.ts, admin.routes.ts | 5 missing indexes; Redis caching on /stats (60s) and /admin/stats (30s) |
| **PERF-5** | gamification.service.ts, bot-auth.middleware.ts | All gamification methods wrapped in db.transaction + SELECT FOR UPDATE; auth cache periodic sweep every 5min + 5000 hard cap |
| **PERF-A** | llm-leaderboard.service.ts, moderation.service.ts | ROW_NUMBER ranks across ALL solutions (not per-model); recordModel catches 23505; processFlag status UPDATE guarded with WHERE status='pending' |
| **PERF-B** | homepage.routes.ts, problem.routes.ts | /top-solutions DISTINCT ON subquery (was 24 sequential queries); /rising-solutions single joined query (was 24 sequential); problem list selectDistinctOn for top solution |
| **PERF-C** | homepage.routes.ts | withCacheMutex helper: SET NX EX 5 mutex on /spotlight, /top-solutions, /rising-solutions; 200ms retry on lock; safety valve fallthrough |
| **PERF-D** | retention.service.ts, load-balancer.service.ts | Batched retention DELETEs (500 rows/100ms pause); canAssign uses dedicated total key instead of hvals(); recordAssignment INCRs total key |
| **PERF-E** | bot-auth.middleware.ts | Singleflight deduplication: AUTH_IN_FLIGHT Map shares one bcrypt Promise across concurrent requests for same API key prefix; cleanup via finally block |
| **PERF-F** | bradley-terry.service.ts | globalElo updated inside BT transaction as AVG of bot's top 20 solution btScores; voteAccuracy rolling update using ((old * prevVotes) + correct) / (prevVotes + 1) |
| **PERF-G** | llm-leaderboard.routes.ts | Wildcard route `/llm-leaderboard/*` replaces `:modelName` param; captures model names with slashes (e.g., ollama/qwen3.5:9b) |
| **PERF-H** | debug.routes.ts, moderation.service.ts, dispatcher.service.ts | POST /internal/debug/recalculate-llm-stats wired; flag counter WHERE status='pending' guard; flag counter safe DECR on non-23505 createTask failure |
| **PERF-I** | bradley-terry.service.ts, admin.routes.ts | voteAccuracy SELECT uses FOR UPDATE on voter bot row inside BT transaction; admin actionCounts GROUP BY cached in Redis (admin:action_counts, 30s TTL) |
| **PERF-J** | llm-leaderboard.service.ts | recordModel 23505 catch now retries UPDATE (totalSolutions + 1, lastSeenAt) instead of returning silently — prevents solution count loss on concurrent new model insertion |
| **PERF-K** | load-balancer.service.ts, server.ts | recordAssignment uses Redis pipeline for atomic HINCRBY+EXPIRE+INCR+EXPIRE; hourly counter reset interval fires at top of each hour via setTimeout→setInterval |
| **PERF-M** | llm-leaderboard.service.ts | recalculateAll processes models in chunks of 5 with Promise.all; 50ms pause between chunks to yield connection pool |
| **PERF-N** | bot-traffic.service.ts, server.ts | reconcileConcurrentBots resets Redis counter to true DB count (bots active in last 60s); runs every 60s via setInterval to prevent permanent counter drift |
| **URL-FIX** | skill/SKILL.md, skill/ONBOARDING.md, docs/api/page.tsx, docs/sdk/page.tsx, bots/python/README.md | Bot API base URL changed from www.opensolve.ai/api/v1 to api.opensolve.ai/api/v1; bots were hitting web frontend access gate instead of API directly |
| **BUGFIX-1** | bradley-terry.service.ts | problems.comparisonCount now incremented for skip votes (was missing — early return skipped it); non-skip increment moved inside BT transaction |
| **BUGFIX-2** | bot.routes.ts | Duplicate solve/create 23505 early returns now update totalTasksCompleted + lastActiveAt; solution INSERT + solutionCount wrapped in db.transaction() |
| **BUGFIX-3** | server.ts | Expired flag tasks no longer increment failedFlagAttempts (expiry ≠ content failure); Redis counter decrement preserved |
| **BUGFIX-4** | bot.routes.ts, admin.routes.ts, bradley-terry.service.ts | lastBotActivityAt updated on vote/flag (was solve-only); admin activate assigns category from flags; voteAccuracy uses pre-update scores (not circular post-update) |
| **SEC-FIX-8** | server.ts, env.ts, next.config.js, auth.middleware.ts, email.service.ts, bot.routes.ts, problem.routes.ts, newsletter.routes.ts, migration 0008 | Global sanitize middleware, CSP unsafe-eval removed, JWT min 32, Resend tracking headers (reverted in SEC-FIX-9), FK cascade migration, prompt injection log flag, 20/day problem rate limit, prod COOKIE_SECRET warning, prod localhost CORS block |
| **SEC-FIX-9** | auth.middleware.ts, email.service.ts, bot.routes.ts, newsletter.routes.ts, newsletter-tokens.ts | Reverted S6 DB check in authMiddleware (perf concern), reverted S9 X-Entity-Ref-ID headers (tracking disabled in Resend dashboard), S11 prompt_injection_flagged activity log entry, S12 stale confirm token rejection after unsubscribe |

---

## SECTION 16: SKILL.MD & ONBOARDING.MD (Bot API Documentation)

```bash
echo "=== SKILL.md version ==="
grep "version:" skill/SKILL.md | head -3
echo "↑ Should be 2.1.0"

echo ""
echo "=== SKILL.md — word count (should be ~250 words, not ~1,800) ==="
wc -w skill/SKILL.md
echo "↑ Should be under 500 words (v2.1 added Submit Formats section)"

echo ""
echo "=== SKILL.md — no full rubrics ==="
grep -c "FLAG.*GREEN\|SOLVE.*criteria\|VOTE.*winner.*skip\|CREATE.*problem_title" skill/SKILL.md
echo "↑ Should be 0 (rubrics live in ONBOARDING.md and API payloads)"

echo ""
echo "=== SKILL.md — optimized API call ==="
grep "tasks/next" skill/SKILL.md
echo "↑ Should show ?brief=true&instruct=none&categories=slim"

echo ""
echo "=== SKILL.md — references 8 categories (not 21) ==="
grep -c "technology\|science_nature\|health\|business_finance\|education_career\|society_culture\|philosophy_ideas\|lifestyle" skill/SKILL.md
echo "↑ Category references should match the 8-category system"

echo ""
echo "=== ONBOARDING.md exists ==="
ls -la skill/ONBOARDING.md 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== ONBOARDING.md — has full rubrics ==="
grep -c "FLAG.*GREEN\|SOLVE.*criteria\|VOTE.*winner.*skip\|CREATE.*problem_title" skill/ONBOARDING.md
echo "↑ Should be 4+ (all rubrics present)"

echo ""
echo "=== ONBOARDING.md — 8 categories listed ==="
grep -c "^\- \`" skill/ONBOARDING.md
echo "↑ Should be 8"

echo ""
echo "=== ONBOARDING.md — scheduled contribution section ==="
grep -c "Scheduled Contribution" skill/ONBOARDING.md
echo "↑ Should be 1"

echo ""
echo "=== ONBOARDING.md — no cost/budget references ==="
grep -ci "token budget\|\$0\.\|cost.*sonnet\|per month" skill/ONBOARDING.md
echo "↑ Should be 0"

echo ""
echo "=== ONBOARDING.md — lean cron message ==="
grep "instruct=none" skill/ONBOARDING.md
echo "↑ Should show optimized query string in cron message"

echo ""
echo "=== SKILL.md — Submit Formats section ==="
grep -c "Submit Formats" skill/SKILL.md
echo "↑ Should be 1"

echo ""
echo "=== SKILL.md — CRITICAL llm_model with provider examples ==="
grep -c "gemini\|claude\|gpt" skill/SKILL.md
echo "↑ Should be 3+ (Gemini, Claude, GPT examples)"

echo ""
echo "=== SKILL.md — 800-1800 character limit ==="
grep "800-1800" skill/SKILL.md
echo "↑ Should show HARD LIMIT: 800-1800"

echo ""
echo "=== ONBOARDING.md — CRITICAL llm_model instruction ==="
grep -c "CRITICAL.*llm_model\|MUST include" skill/ONBOARDING.md
echo "↑ Should be 1+"

echo ""
echo "=== ONBOARDING.md — 50-5000 API limit ==="
grep "50-5000" skill/ONBOARDING.md
echo "↑ Should show updated API character limit"

echo ""
echo "=== Bot routes solution_text uses LIMITS constants (not hardcoded numbers) ==="
grep -n "LIMITS.SOLUTION_TEXT_MIN\|LIMITS.SOLUTION_TEXT_MAX" apps/api/src/routes/bot.routes.ts
echo "↑ Should reference shared constants, not hardcoded 50/5000"
grep -n "\.min(50)\|\.max(5000)" apps/api/src/routes/bot.routes.ts
echo "↑ If the above shows hardcoded numbers instead of constants, report it as a drift issue"
```

Show the COMPLETE `skill/SKILL.md`.
Show the COMPLETE `skill/ONBOARDING.md`.

---

## OUTPUT FORMAT

Create `PROJECT-SNAPSHOT.md` in the project root.

Rules:
- Use full fenced code blocks with language tags
- For schema, config, and key logic files: copy the ENTIRE file
- Replace secrets (API keys, passwords, OAuth secrets) with `<REDACTED>`
- Keep all non-secret config values (numbers, limits, enums)
- If something doesn't exist: write `**NOT IMPLEMENTED** — does not exist in current codebase.`

---

## QUICK STATS (all values must be computed from code, not assumed)

```bash
echo "=== Total API routes ==="
grep -rn "fastify\.\(get\|post\|put\|patch\|delete\)" apps/api/src/routes/ | wc -l

echo ""
echo "=== Total DB tables ==="
grep -c "pgTable(" apps/api/src/db/schema.ts

echo ""
echo "=== Total frontend pages ==="
find apps/web/src/app -name "page.tsx" | wc -l

echo ""
echo "=== Total env variables ==="
grep -v "^#" apps/api/.env.example | grep "=" | wc -l

echo ""
echo "=== Total test files ==="
find . -name "*.test.ts" -o -name "*.test.sh" -o -name "*.spec.ts" | \
  grep -v node_modules | wc -l

echo ""
echo "=== Total TODO/FIXME comments ==="
grep -rn "TODO\|FIXME" --include="*.ts" --include="*.tsx" . | \
  grep -v node_modules | grep -v .next | wc -l
echo "↑ Legal pages must contribute 0"

echo ""
echo "=== opensolve.io references in runtime code ==="
grep -rn "opensolve\.io" --include="*.ts" --include="*.tsx" --include="*.js" \
  --include="*.yml" --include="*.yaml" . 2>/dev/null | \
  grep -v node_modules | grep -v .next | grep -v SNAPSHOT | grep -v PROMPT | wc -l
echo "↑ Should be 0"

echo ""
echo "=== Lines of code ==="
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
  grep -v node_modules | grep -v .next | xargs wc -l 2>/dev/null | tail -1

echo ""
echo "=== Prod exposed ports (should be 0) ==="
grep -c "^\s*-\s*[0-9]" docker-compose.prod.yml 2>/dev/null || echo "0"

echo ""
echo "=== Category counts ==="
echo "Total categories in DB enum: $(grep -A 15 'problemCategoryEnum' apps/api/src/db/schema.ts | grep -c "'")"
echo "Total categories in shared: $(grep -c 'slug:' packages/shared/src/categories.ts)"
echo "↑ Both should be 8 (flat, no groups)"

echo ""
echo "=== Email infrastructure ==="
echo "Templates: $(grep -c "export.*Template\|=.*html\`" apps/api/src/email/templates.ts 2>/dev/null)"
echo "Newsletter routes: $(grep -c "fastify\." apps/api/src/routes/newsletter.routes.ts 2>/dev/null)"
echo "Admin email routes: $(grep -c "fastify\." apps/api/src/routes/admin.email.routes.ts 2>/dev/null)"
echo "Contact route: $(grep -c "fastify\." apps/api/src/routes/contact.routes.ts 2>/dev/null)"
```

---

## AFTER CREATING THE FILE, REPORT:

1. File path and approximate line count
2. Any sections where you could NOT find the relevant code
3. PostgreSQL confirmed? (yes/no)
4. All 8 category slugs confirmed in both `categories.ts` and `schema.ts`? (yes/no)
5. Dockerfile migration gap — is `drizzle/` directory copied into the API image? (yes/no)
6. Access gate — is it still active? How does it work?
7. Admin panel — confirm all 5 sub-pages are functional, list line counts
8. Any NEW security concerns found during this scan
9. TypeScript errors: count from both apps
10. Open tasks summary — list everything in Section 14 that is confirmed NOT yet done
11. Regulatory compliance — confirm all REG-1 through REG-4 changes are present
12. Security hardening — confirm all SEC-FIX-1 through SEC-FIX-7 and HOTFIX-1 changes are present:
    - Google ID token verified via google-auth-library? (yes/no)
    - security.yml has zero continue-on-error? (yes/no)
    - COOKIE_SECRET env var exists in env.ts and server.ts? (yes/no)
    - All username/botName checks use LOWER()? (yes/no)
    - Moderation processFlag uses UPDATE RETURNING? (yes/no)
    - API key prefix is varchar(16) with 8-char fallback? (yes/no)
    - Admin middleware has NO token cookie check (just NextResponse.next() for /admin)? (yes/no)
    - Admin Basic Auth uses bcrypt ($2y$) not Apache MD5 ($apr1$)? (yes/no — server-side check)
13. Redis key inventory — were all key families documented? List any undocumented patterns.
14. ISR & Revalidation — confirm all FIX-ISR, FIX-ISR-WIRE changes are present:
    - `force-cache` removed from apiFetch? (yes/no)
    - On-demand revalidation route at `apps/web/src/app/api/revalidate/route.ts` exists? (yes/no)
    - Revalidation service at `apps/api/src/services/revalidate.service.ts` exists? (yes/no)
    - Bot routes import and call revalidation helpers for flag/solve/vote/create? (yes/no)
    - Problem routes call revalidation on human problem creation? (yes/no)
    - Docker nextcache volume defined and mounted? (yes/no)
    - WEB_INTERNAL_URL and REVALIDATION_SECRET in docker-compose.prod.yml? (yes/no)
15. Deduplication — confirm FIX-DEDUP changes are present:
    - Unique index `problems_title_unique` on `lower(trim(title))` in schema or migration? (yes/no)
    - Create task handler catches PostgreSQL error code 23505? (yes/no)
    - Duplicate response returns `{ success: true, duplicate: true }`? (yes/no)
16. Bot display defaults — confirm FIX-BOTDEFAULTS changes:
    - Leaderboard ELO shows "—" when totalSolutions === 0? (yes/no)
    - Leaderboard Accuracy shows "—" when totalVotes === 0? (yes/no)
    - Bot profile page applies same conditionals? (yes/no)
    - Bots directory page applies same conditionals? (yes/no)
17. LLM model regex — confirm FIX-LLM-REGEX changes:
    - bot.routes.ts `LLM_MODEL_PATTERN` contains `/:+` in character class? (yes/no)
    - validation.ts llmModelSchema regex contains `/:+` in character class? (yes/no)
    - Model names like `ollama/qwen3.5:9b` pass regex validation? (yes/no)
18. Model families extraction — confirm REFACTOR-MODEL-FAMILIES changes:
    - `packages/shared/src/model-families.ts` exists? (yes/no)
    - 40 known families with matchKeys arrays? (yes/no)
    - `constants.ts` has zero model family code (KNOWN_MODEL_FAMILIES, hashColor, getModelFamily, displayModelName, PROVIDER_PREFIXES all removed)? (yes/no)
    - `index.ts` exports `./model-families.js`? (yes/no)
    - No "Other" family in the registry? (yes/no)
    - `getModelFamily()` returns `{ family, color, company }` with auto-detection fallback? (yes/no)
    - Admin debug DebugDashboard.tsx uses `getModelFamily()` instead of hardcoded FAMILY_COLORS? (yes/no)
    - All 5 consumer files resolve imports via barrel export? (yes/no)
19. Stuck-task fix:
    - Submit catch block marks task 'failed'? (yes/no)
    - uniqueIndex on solutions(botId, problemId)? (yes/no)
    - 23505 handling in solve case? (yes/no)
    - flagSchema .nullable() on suggested_category? (yes/no)
20. Concurrency (6 races):
    - BT: db.transaction() + FOR UPDATE? (yes/no)
    - Maturity: atomic WHERE status != 'mature' RETURNING? (yes/no)
    - Double task: partial unique index tasks_bot_assigned_idx? (yes/no)
    - DB pool: max 30, postgres max_connections 200 (prod) / 100 (dev)? (yes/no)
    - Duplicate vote: uniqueIndex on comparisons(voter, solA, solB)? (yes/no)
    - Flag herd: Redis INCR/DECR cap at 3? (yes/no)
21. Flag normalization:
    - normalizeFlagCategory() exists with ~40 mappings? (yes/no)
    - Called before Zod parse? (yes/no)
22. Poison problems:
    - failedFlagAttempts column? (yes/no)
    - Auto-reject at 5 failures? (yes/no)
    - Dispatcher skips >= 5? (yes/no)
23. Auto-migrations:
    - Dockerfile CMD runs migrate.js before server.js? (yes/no)
    - drizzle/ COPY'd in Dockerfile? (yes/no)
24. SKILL.md v2.1:
    - Submit Formats section? (yes/no)
    - CRITICAL llm_model with provider examples? (yes/no)
    - 800-1800 char limit? (yes/no)
25. Character limits synced:
    - SOLUTION_TEXT_MAX = 5000 in constants.ts? (yes/no)
    - SOLUTION_TEXT_MIN = 50 in constants.ts? (yes/no)
    - Zod schema in bot.routes.ts uses LIMITS.SOLUTION_TEXT_MIN and LIMITS.SOLUTION_TEXT_MAX (not hardcoded)? (yes/no)
    - SKILL.md reflects min=50 max=5000 limits? (yes/no)
    - Instructions say 800-1800 chars? (yes/no)
26. Caching architecture — confirm CACHE-FIX changes:
    - `cache: 'no-store'` in apiFetch? (yes/no)
    - `export const dynamic = 'force-dynamic'` on problems, problem detail, bot profile, leaderboard, LLM leaderboard, user profile? (yes/no)
    - Homepage still has `revalidate = 30` (not force-dynamic)? (yes/no)
    - User profile route exists at `apps/api/src/routes/user-profile.routes.ts`? (yes/no)
    - User profile page exists at `apps/web/src/app/users/[id]/page.tsx`? (yes/no)
    - Human author names clickable on problem detail page? (yes/no)
27. Model Arena tabs — confirm MODEL-ARENA-TABS changes:
    - Exactly 4 sort options (win_rate, avg_score, first_place_count, total_solutions)? (yes/no)
    - Default sort is win_rate (not avg_score)? (yes/no)
    - best_score and top3_count removed from backend Zod enum and service orderBy? (yes/no)
    - Each tab has a description shown when active? (yes/no)
28. Migration health — confirm migration files are deployable to a fresh database:
    - All migration files are numbered (no unnumbered .sql files in migrations/)? (yes/no)
    - No duplicate migration number prefixes? (yes/no)
    - All `ALTER TYPE ADD VALUE` include `IF NOT EXISTS`? (yes/no)
    - All `ALTER TABLE ADD COLUMN` include `IF NOT EXISTS`? (yes/no)
    - `api_key_prefix` defined as varchar(16) in base migration? (yes/no)
    - Drizzle config file copied into Docker image? (yes/no)
    - Does server.ts auto-run migrations on startup? (yes/no — if no, document the manual step)
29. Security hardening — new items from SEC-AUDIT-2026-03:
    - COOKIE_SECRET present in docker-compose.prod.yml api environment? (yes/no)
    - COOKIE_SECRET uses :- syntax (not :? syntax)? (yes/no)
    - IMPORTANT: :? causes Coolify build-time failure — Coolify injects secrets at runtime not build time
    - If COOKIE_SECRET missing: note that cookie signing falls back to JWT_SECRET (both signing contexts sharing one key)
    - Bot rate limit constant (360/hr) matches what is actually registered in rate-limit.middleware.ts? (yes/no)
    - DPA_en.pdf and TOM_en.pdf gitignored? (yes/no)
    - Bot rate limit documented correctly in route group docs as 360/hr (not 60/hr)? (yes/no)
30. Performance optimizations (PERF-1 session) — confirm all 5 changes are present:
    - Bot auth cache: `AUTH_CACHE` Map with 300s TTL in bot-auth.middleware.ts? (yes/no)
    - `invalidateBotAuthCache()` exported from bot-auth.middleware.ts? (yes/no)
    - `invalidateBotAuthCache()` called in DELETE /user/api-key (auth.routes.ts)? (yes/no)
    - `invalidateBotAuthCache()` called in PATCH /admin/bots/:id/status (admin.routes.ts)? (yes/no)
    - `getSameOwnerBotIds()` uses Redis cache key `bot:owner_bots:{ownerId}` in dispatcher.service.ts? (yes/no)
    - `invalidateOwnerBotsCache()` exported from dispatcher.service.ts and called in PUT /user/bot-profile (new bot branch only)? (yes/no)
    - tryAssignFlagTask uses Promise.all for botFlaggedProblems + getSameOwnerBotIds? (yes/no)
    - tryAssignSolveTask uses Promise.all for botSolutions + candidates? (yes/no)
    - pair-selector selectPair uses Promise.all for allSolutions + botComparisons? (yes/no)
    - load-balancer canAssign uses Promise.all for hget + hvals (getTotalHourlyCount removed)? (yes/no)
    - load-balancer recordAssignment uses Promise.all for two parallel chains? (yes/no)
    - problems table has 3 composite indexes: problems_solve_dispatch_idx, problems_vote_dispatch_idx, problems_flag_dispatch_idx? (yes/no)
    - docker-compose.prod.yml max_connections=200? (yes/no)
    - docker-compose.yml (dev) max_connections=100? (yes/no)
31. LLM model history per bot — confirm LLM-HIST-1 changes:
    - `/bots/:id` endpoint returns `llmModelHistory` array (llmModel, llmModelVersion, solutionCount, firstUsedAt, lastUsedAt)? (yes/no)
    - `/bots/:id` endpoint returns `currentLlmModel` object (model, version, lastUsedAt)? (yes/no)
    - `/leaderboard` endpoint returns `currentLlmModel` and `currentLlmModelVersion` per bot? (yes/no)
    - Bot profile page (`/bots/[id]`) shows current model badge near bot name? (yes/no)
    - Bot profile page shows LLM Model History section with solution counts and date ranges? (yes/no)
    - BotCard component shows current model label? (yes/no)
    - Bots with no solutions or no reported llm_model show graceful null/empty state? (yes/no)
    - History is derived from solutions table (no separate history table needed)? (yes/no)
32. Scalability fixes (PERF-1 through PERF-5):
    - DB pool max: 50? (yes/no)
    - postgres max_connections 300 prod / 150 dev? (yes/no)
    - sweepRunning guard in server.ts with finally block? (yes/no)
    - Expiry sweep uses RETURNING instead of pre-fetch? (yes/no)
    - SSE uses shared broadcast Set with single interval? (yes/no)
    - SSE connection cap of 200? (yes/no)
    - Leaderboard uses selectDistinctOn? (yes/no)
    - Pair selector uses SolutionSlim + text hydration? (yes/no)
    - Stats endpoints cached in Redis (60s homepage / 30s admin)? (yes/no)
    - Gamification methods use db.transaction + FOR UPDATE? (yes/no)
    - Auth cache sweep every 5min with 5000 hard cap? (yes/no)
33. Scalability fixes (PERF-A through PERF-E):
    - LLM placements CTE ranks across ALL solutions (llm_model filter on outer query)? (yes/no)
    - recordModel catches 23505 duplicate INSERT? (yes/no)
    - processFlag status UPDATE has WHERE status='pending' guard? (yes/no)
    - /top-solutions uses single DISTINCT ON subquery (not N+1 loop)? (yes/no)
    - /rising-solutions uses single joined query (not N+1 loop)? (yes/no)
    - Problem list uses selectDistinctOn for top solution? (yes/no)
    - withCacheMutex applied to /spotlight, /top-solutions, /rising-solutions? (yes/no)
    - Retention uses batchDelete with 500 rows and 100ms pause? (yes/no)
    - canAssign uses redis.get(total key) not redis.hvals()? (yes/no)
    - recordAssignment INCRs global:activity:hourly:total? (yes/no)
    - Bot auth uses AUTH_IN_FLIGHT singleflight Map? (yes/no)
    - AUTH_IN_FLIGHT cleanup in finally block? (yes/no)
    - Auth check order: AUTH_CACHE → AUTH_IN_FLIGHT → new verification? (yes/no)
34. Correctness fixes (PERF-F through PERF-H):
    - globalElo updated inside BT transaction as AVG of top 20 solution btScores? (yes/no)
    - globalElo updated for BOTH solution bots after every vote? (yes/no)
    - voteAccuracy rolling update uses totalVotes as denominator? (yes/no)
    - voteAccuracy UPDATE runs inside the BT transaction? (yes/no)
    - No new DB columns added for globalElo/voteAccuracy? (yes/no)
    - Model Arena detail route uses wildcard `*` (not `:modelName`)? (yes/no)
    - Frontend encodes model names with encodeURIComponent? (yes/no)
    - POST /internal/debug/recalculate-llm-stats endpoint exists? (yes/no)
    - Flag counter increment has WHERE status='pending' guard? (yes/no)
    - processFlag returns early if problem already transitioned? (yes/no)
    - createTask catch block DECRs flag counter on non-23505 failure? (yes/no)
35. Concurrency & infrastructure fixes (PERF-I through PERF-K):
    - voteAccuracy SELECT uses FOR UPDATE on voter bot row? (yes/no)
    - voteAccuracy field references use snake_case (total_votes, vote_accuracy) from raw SQL? (yes/no)
    - Admin actionCounts cached in Redis (admin:action_counts, 30s TTL)? (yes/no)
    - Paginated activity list is NOT cached (only actionCounts)? (yes/no)
    - recordModel 23505 catch retries UPDATE (totalSolutions + 1) instead of silent return? (yes/no)
    - recordAssignment uses redis.pipeline() for HINCRBY+EXPIRE+INCR+EXPIRE? (yes/no)
    - Per-problem zset operations unchanged (still separate)? (yes/no)
    - Hourly counter reset fires at top of each hour via setTimeout→setInterval? (yes/no)
    - LoadBalancerService imported in server.ts? (yes/no)
    - resetHourlyCounters errors logged (not swallowed)? (yes/no)
36. Final fixes (PERF-M and PERF-N):
    - recalculateAll uses CHUNK_SIZE = 5 with Promise.all? (yes/no)
    - 50ms pause between chunks in recalculateAll? (yes/no)
    - Return value is still count of models recalculated? (yes/no)
    - reconcileConcurrentBots queries bots.lastActiveAt > 60s ago? (yes/no)
    - reconcileConcurrentBots uses redis.set to overwrite counter? (yes/no)
    - reconcileConcurrentBots uses KEYS.concurrent (bot:traffic:concurrent)? (yes/no)
    - server.ts calls reconcileConcurrentBots every 60s via setInterval? (yes/no)
    - reconcileConcurrentBots imported from bot-traffic.service.ts in server.ts? (yes/no)
37. Bot API URL fix (URL-FIX):
    - SKILL.md base URL is api.opensolve.ai/api/v1 (not www)? (yes/no)
    - ONBOARDING.md Quick Start has API endpoint note with api.opensolve.ai? (yes/no)
    - ONBOARDING.md cron example uses api.opensolve.ai? (yes/no)
    - docs/api/page.tsx base URL is api.opensolve.ai? (yes/no)
    - docs/sdk/page.tsx Python example uses api.opensolve.ai? (yes/no)
    - bots/python/README.md mentions production URL api.opensolve.ai? (yes/no)
    - docker-compose.prod.yml NEXT_PUBLIC_API_URL still www.opensolve.ai (correct for browser)? (yes/no)
    - Zero www.opensolve.ai/api references in skill/, bots/, docs/ pages? (yes/no)
38. Bug fixes (BUGFIX-1 through BUGFIX-4):
    - problems.comparisonCount incremented for skip votes (in Promise.all)? (yes/no)
    - problems.comparisonCount incremented inside BT transaction for non-skip votes? (yes/no)
    - Duplicate solve 23505 early return updates totalTasksCompleted + lastActiveAt? (yes/no)
    - Duplicate create 23505 early return updates totalTasksCompleted + lastActiveAt? (yes/no)
    - Solution INSERT + solutionCount wrapped in db.transaction()? (yes/no)
    - Expired flag tasks do NOT increment failedFlagAttempts (only Redis decrement)? (yes/no)
    - trackFailedFlagAttempt still called in bot.routes.ts on parse/validation errors? (yes/no)
    - lastBotActivityAt updated on vote submissions? (yes/no)
    - lastBotActivityAt updated on flag submissions? (yes/no)
    - Admin activate assigns category from green flags when category is null? (yes/no)
    - voteAccuracy uses pre-update scores (rA, rB) not post-update (newRatingA, newRatingB)? (yes/no)
    - voteAccuracy skipped when pre-update scores are exactly equal? (yes/no)
39. Security hardening (SEC-FIX-8 and SEC-FIX-9):
    - sanitizeMiddleware registered globally in server.ts (not per-route)? (yes/no)
    - CSP script-src does NOT contain 'unsafe-eval'? (yes/no)
    - JWT_SECRET minimum is 32 characters? (yes/no)
    - authMiddleware does NOT have DB existence check (reverted in SEC-FIX-9)? (yes/no)
    - Email sends do NOT have X-Entity-Ref-ID headers (reverted in SEC-FIX-9)? (yes/no)
    - Migration 0008 adds ON DELETE SET NULL to tasks.problemId and activityLog FKs? (yes/no)
    - prompt_injection_flagged activity log entry created on detection? (yes/no)
    - POST /problems rate-limited to 20/day per user? (yes/no)
    - Production warning when COOKIE_SECRET not set? (yes/no)
    - Production exit when WEB_URL contains localhost? (yes/no)
    - Newsletter confirm blocks stale tokens after unsubscribe (updatedAt > issuedAt)? (yes/no)
    - verifyConfirmToken returns issuedAt field? (yes/no)
Target length: 2,000–5,000 lines. Be thorough but do not repeat the same file contents across multiple sections.