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
- **Admins** (role in DB, what controls exist — including which admin pages are LIVE vs placeholder)
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

Mark which admin pages are **fully implemented** vs **Phase 2 placeholder**.

### Domain Glossary

Define every domain-specific term: Problem, Solution, Task, Vote, Comparison, Flag, Score, BT Score, Rating, Category, Group, Attention Score, Confidence Interval, Badge, LLM Model, Activity Log, Dispatcher, Mature.

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
- `.github/workflows/ci.yml` and `.github/workflows/deploy.yml`

Note the framework (Next.js version), language (TypeScript), and build tooling.

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
grep -A 35 "problemCategoryEnum" apps/api/src/db/schema.ts | grep -c "'"
echo "↑ Should be 21"

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
echo "↑ KNOWN GAP: migration files may NOT be copied into Docker image"
echo "  If so, document this as an open infrastructure task"
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
echo "=== Category counts by group ==="
grep "'everyday'" packages/shared/src/categories.ts | grep -c "group"
grep "'world'" packages/shared/src/categories.ts | grep -c "group"
grep "'professional'" packages/shared/src/categories.ts | grep -c "group"
echo "↑ Expected: 9 everyday, 8 world, 4 professional"
```

Document the exported types and functions:
- `CategoryGroup` type, `Category` interface, `CategoryGroupDefinition` interface
- `CATEGORY_GROUP_DEFINITIONS`, `CATEGORIES`, `CATEGORY_SLUGS`
- `getCategoryBySlug()`, `getCategoriesByGroup()`

Document the full 21-category taxonomy in a table:

| Group | Label | Slug |
|-------|-------|------|
| everyday | ... | ... |

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
- Bot task flow (tasks/next, tasks/:id/submit, instructions, bot/me)
- Problems (list, get, submit, search)
- Voting / leaderboard (leaderboard, llm-leaderboard, spotlight, activity, SSE)
- Admin (stats, problems summary, bots summary, moderation queue, metrics, bot status, problem status)
- Admin email (stats, subscribers, send-important, broadcast, confirmation-token, history, user-search)
- Newsletter (subscribe, confirm, unsubscribe POST+GET, status)
- Debug (all X-Debug-Key endpoints)

```bash
echo "=== Newsletter routes ==="
grep -n "router\.\|fastify\." apps/api/src/routes/newsletter.routes.ts 2>/dev/null | head -20

echo ""
echo "=== Admin email routes ==="
grep -n "router\.\|fastify\." apps/api/src/routes/admin.email.routes.ts 2>/dev/null | head -20

echo ""
echo "=== SSE route shape ==="
grep -n "data:\|botId\|botName\|problemTitle\|action" apps/api/src/routes/sse.routes.ts | head -20
echo "↑ Document what fields are pushed in each SSE event"
```

Show the COMPLETE `apps/api/src/routes/instruction.routes.ts`.

---

## SECTION 4: AUTHENTICATION & AUTHORIZATION

Show the COMPLETE:
- `apps/api/src/routes/auth.routes.ts`
- `apps/api/src/middleware/auth.middleware.ts`
- Any other middleware files in `apps/api/src/middleware/`

```bash
echo "=== Google OAuth scopes ==="
grep -n "scope\|email\|profile" apps/api/src/routes/auth.routes.ts | head -10

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
echo "=== Category pool for CREATE tasks ==="
grep -n -A 50 "CREATE_TASK_CATEGORIES\|categoryPool\|category.*pool\|weighted" \
  apps/api/src/services/dispatcher.service.ts | head -60
echo "↑ Should show 21 categories, everyday+world doubled for ~40% weight each"

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
```

**Category UI components:**

```bash
echo "=== Category components ==="
ls apps/web/src/components/category/ 2>/dev/null

echo ""
for f in GroupTabNav.tsx CategoryChipRow.tsx TopicDropdown.tsx CategoryBadge.tsx; do
  ls apps/web/src/components/category/$f 2>/dev/null && echo "✅ $f" || echo "❌ MISSING: $f"
done
```

Show COMPLETE contents of:
- `apps/web/src/components/category/GroupTabNav.tsx`
- `apps/web/src/components/category/CategoryChipRow.tsx`
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
echo "=== HowItWorks — WiFi text removed ==="
grep -n "WiFi\|wifi" apps/web/src/components/dashboard/HowItWorks.tsx
echo "↑ Must be empty"
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
grep -n "export\|function\|const.*Template\|=.*=>" apps/api/src/email/templates.ts | head -20
echo "↑ Expected: importantMessage, newsletter, newsletterConfirm, unsubscribeConfirm"

echo ""
echo "=== Affiliate disclosure in newsletter template ==="
grep -n "Hinweis\|Anzeige\|affiliate\|disclosure" apps/api/src/email/templates.ts | head -10
echo "↑ Should show bilingual disclosure block (German UWG §7)"

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
echo "↑ KNOWN GAP: If drizzle/ dir is NOT copied into image, document as open infra task"
echo "  (This caused a production outage — fix is to add COPY drizzle/ ./drizzle/ to Dockerfile)"

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
  at priority 1100 — second layer on top of the API-level adminMiddleware JWT + role check

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
echo "=== Login page newsletter disclosure ==="
grep -c "newsletter" apps/web/src/app/auth/login/page.tsx
echo "↑ Should be 1+"
```

**Legal basis summary to confirm:**
- Email storage: GDPR Art. 6(1)(f) legitimate interest for service notifications
- Newsletter: GDPR Art. 6(1)(a) consent (double opt-in)
- Newsletter advertising/affiliate: GDPR Art. 6(1)(a) (same consent, disclosed at opt-in)
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

### Known open infrastructure tasks

Document these explicitly — confirm current state of each:

1. **Dockerfile migration gap** — `drizzle/` migrations directory may not be copied into the API Docker image. Confirm with:
   ```bash
   grep -n "drizzle\|migration" apps/api/Dockerfile
   ```
   If `COPY drizzle/ ./drizzle/` is absent, this is an open task (future schema changes would require raw SQL).

2. **Admin panel Phase 2 pages** — Which of `/admin/problems`, `/admin/bots`, `/admin/users`, `/admin/moderation`, `/admin/activity` are still placeholder? List them.

3b. **Debug page migration** — Confirm `/debug-x9k4m7` has been moved to `/admin/debug` and added to the admin sidebar. Verify:
   ```bash
   ls apps/web/src/app/admin/debug/ 2>/dev/null && echo "OK" || echo "NOT MIGRATED"
   grep -r "debug-x9k4m7" apps/web/src/ --include="*.tsx" --include="*.ts" 2>/dev/null
   echo "Above grep must return 0 results if migration is complete"
   grep -n "debug\|Debug" apps/web/src/app/admin/layout.tsx 2>/dev/null || grep -rn "debug\|Debug" apps/web/src/app/admin/ --include="layout.tsx"
   echo "Above must show Debug link in admin sidebar"
   ```

3. **Swedish Aktiebolag** — Not yet formed. Impressum currently lists individual (Taner Tuna, Karlstad, Sweden). Planned before public launch.

4. **Access gate removal** — Platform is currently behind a keyword/cookie gate for pre-launch testing. Confirm gate is still active.

5. **Email provider** — Resend is in use. Document `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`, `APP_BASE_URL` env vars and confirm they are wired in `docker-compose.prod.yml`.

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
| **NL-1** | terms/page.tsx, NewsletterBanner.tsx, settings/page.tsx, email/templates.ts, NEWSLETTER-CONSENT-ASSESSMENT.md | Newsletter advertising & affiliate consent language; removed false "no advertising" from Terms; affiliate disclosure block in email template (bilingual Hinweis/Anzeige, UWG §7) |
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

---

## SECTION 16: SKILL.MD (Bot API Documentation)

```bash
echo "=== SKILL.md version ==="
grep "version:" skill/SKILL.md | head -3
echo "↑ Should be 1.1.0"

echo ""
echo "=== SKILL.md — category count ==="
grep -c "everyday_life\|tech_help\|health_wellness" skill/SKILL.md
echo "↑ Should include all 9 everyday slugs"
```

Show the COMPLETE `skill/SKILL.md`.

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
echo "Total categories: $(grep -A 35 'problemCategoryEnum' apps/api/src/db/schema.ts | grep -c "'")"
echo "Everyday slugs in shared: $(grep "'everyday'" packages/shared/src/categories.ts | grep -c 'group')"
echo "World slugs in shared: $(grep "'world'" packages/shared/src/categories.ts | grep -c 'group')"
echo "Professional slugs in shared: $(grep "'professional'" packages/shared/src/categories.ts | grep -c 'group')"

echo ""
echo "=== Email infrastructure ==="
echo "Templates: $(grep -c "export.*Template\|=.*html\`" apps/api/src/email/templates.ts 2>/dev/null)"
echo "Newsletter routes: $(grep -c "fastify\." apps/api/src/routes/newsletter.routes.ts 2>/dev/null)"
echo "Admin email routes: $(grep -c "fastify\." apps/api/src/routes/admin.email.routes.ts 2>/dev/null)"
```

---

## AFTER CREATING THE FILE, REPORT:

1. File path and approximate line count
2. Any sections where you could NOT find the relevant code
3. PostgreSQL confirmed? (yes/no)
4. All 21 category slugs confirmed in both `categories.ts` and `schema.ts`? (yes/no)
5. Dockerfile migration gap — is `drizzle/` directory copied into the API image? (yes/no — if no, it's an open task)
6. Access gate — is it still active? How does it work?
7. Admin panel — list which pages are fully implemented vs Phase 2 placeholder
8. Any NEW security concerns found during this scan
9. TypeScript errors: count from both apps
10. Open tasks summary — list everything in Section 14 that is confirmed NOT yet done

Target length: 2,000–5,000 lines. Be thorough but do not repeat the same file contents across multiple sections.
