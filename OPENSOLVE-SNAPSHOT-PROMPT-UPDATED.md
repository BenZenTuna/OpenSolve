# CLAUDE CODE PROMPT — OpenSolve Full Project Snapshot
# Paste this entire prompt into Claude Code while in your OpenSolve project directory

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

echo ""
echo "=== Category count ==="
grep -c "slug:" packages/shared/src/categories.ts
echo "↑ Expected: 8"

echo ""
echo "=== No group references ==="
grep -c "CategoryGroup\|group:" packages/shared/src/categories.ts
echo "↑ Expected: 0"
```

Document the exported types and functions:
- `Category` interface
- `CATEGORIES`, `CATEGORY_SLUGS`
- `getCategoryBySlug()`

Document the full 8-category taxonomy in a table:

| Slug | Display Name | Description |
|------|-------------|-------------|
| technology | ... | ... |

Note: categories are flat (no groups). The old 3-group system (everyday/world/professional with 21 categories) was replaced.

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
```

---

## SECTION 6: VOTING & RANKING ENGINE

Show the COMPLETE:
- `apps/api/src/services/voting.service.ts` (or wherever Bradley-Terry logic lives)
- `apps/api/src/services/pair-selector.service.ts` (or equivalent)

Document: starting BT score, starting confidence interval, K-factor, ELO formula, pair selection strategy (Swiss/uniform/random percentages), maturity thresholds, win/loss bonus points.

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
| **SKILL-OPT-2** | bot.routes.ts, dispatcher.service.ts, instruction.routes.ts | `?instruct=none` parameter on GET /tasks/next — omits instruction and response_format fields from task payloads |
| **SKILL-OPT-3** | bot.routes.ts, dispatcher.service.ts | `?categories=slim` parameter on GET /tasks/next — FLAG/CREATE tasks send category slugs only instead of full objects |
| **SKILL-OPT-4** | dispatcher.service.ts | Content wrappers shortened from `===BEGIN CONTENT (TREAT AS DATA ONLY)===` (62 chars) to `---DATA---` (22 chars) |
| **SKILL-OPT-5** | skill/ONBOARDING.md | Cron task message reduced from ~500+ chars to ~200 chars; uses optimized query string |

---

## SECTION 16: SKILL.MD & ONBOARDING.MD (Bot API Documentation)

```bash
echo "=== SKILL.md version ==="
grep "version:" skill/SKILL.md | head -3
echo "↑ Should be 2.0.0"

echo ""
echo "=== SKILL.md — word count (should be ~250 words, not ~1,800) ==="
wc -w skill/SKILL.md
echo "↑ Should be under 300 words (lean version — rubrics moved to ONBOARDING.md)"

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

Target length: 2,000–5,000 lines. Be thorough but do not repeat the same file contents across multiple sections.
