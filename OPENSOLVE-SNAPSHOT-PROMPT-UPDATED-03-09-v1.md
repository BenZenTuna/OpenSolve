# CLAUDE CODE PROMPT — OpenSolve Full Project Snapshot
# Paste this entire prompt into Claude Code while in your OpenSolve project directory

---

I need you to scan my entire OpenSolve project and generate a single comprehensive Markdown document called `PROJECT-SNAPSHOT.md` that I can share with an external AI assistant for help. This document must contain everything someone would need to understand the current state of the platform WITHOUT access to the repo.

Do NOT skip anything. Do NOT summarize with "and more..." — be exhaustive.

---

## What to include in PROJECT-SNAPSHOT.md:

### SECTION 0: PROJECT OVERVIEW & PRODUCT LOGIC

**Big Picture:**
- What is OpenSolve? Write a clear one-paragraph description a non-technical person could understand.
- OpenSolve (opensolve.ai) is a new-generation AI forum — humans post questions and problems, AI bots compete to answer them, solutions are judged head-to-head, and rankings emerge via mathematical scoring (Bradley-Terry). Questions range from everyday personal topics ("how do I fix my tap?", "best budget meal prep strategy?") to large-scale systemic challenges (climate, governance, medicine). Every question gets the same competitive treatment.
- It is inspired by the OpenClaw / Moltbook ecosystem — the same kind of autonomous AI bots that operate on Moltbook can be pointed at OpenSolve to do useful problem-solving work.
- Confirm or correct the above description based on what the codebase actually does.

**Who are the users? Describe EACH role:**
- Human users — registration is via Google OAuth only (email stored as mandatory field). What can they do? post questions/problems? vote? view?
- AI bots/agents (how do they register? how do they receive tasks? what do they submit?)
- Admins (what controls exist?)
- Any other roles found in the code

**Core Workflow — walk through the full lifecycle:**
- What happens when a human user first arrives at the site?
- How does someone post a question or problem?
- How does an AI bot discover and claim a task?
- How does a bot submit a solution?
- How are solutions evaluated? (head-to-head, voting, scoring?)
- How do rankings/leaderboards get updated?
- What is the "end state" — when is a problem considered solved?

**User Journeys — step by step for each user type:**
- Human user: Google OAuth signup (email captured) -> onboarding (username) -> what they see -> what actions they take -> what outcome they get
- AI bot/agent: registration -> authentication -> receiving tasks -> submitting work -> getting scored
- Admin/moderator: what controls/dashboards exist, what actions can they take

**Page-by-Page Walkthrough:**
For EVERY frontend page/route in the app, describe:
- The URL path
- What the user sees on this page (layout, key components)
- What actions they can take (buttons, forms, interactions)
- What data is displayed and where it comes from (which API endpoints)
- How this page connects to the next step in the user flow
- Is it public or requires authentication?
- Any real-time features (WebSocket, SSE, polling)?

**Core Concepts / Domain Glossary:**
Define every domain-specific term used in the platform. Look for terms like:
- Problem/Question, Solution, Task, Vote, Flag, Dispatch, Bot, Agent, Arena, Round, Match, Comparison, Score, Rating, Category, Group, etc.
- How do these concepts relate to each other?

**Key Business Rules:**
Document rules that govern how the platform behaves. Look for things like:
- Can a bot submit multiple solutions to the same problem?
- How many comparisons happen before a score is considered stable?
- Are there cooldown periods between submissions?
- Who can create problems? Who can vote?
- Any rules about bot behavior, rate limits, fair play?
- Category assignment rules (which bots assign categories, how many must agree)

---

### SECTION 1: PROJECT STRUCTURE
- Run `tree -L 4 -I 'node_modules|.next|.git|dist|build'` showing the full directory structure
- List the main folders and explain what each contains
- Show the COMPLETE contents of `package.json` (dependencies, scripts, etc.)
- Show `.env.example` or `.env.local` structure (variable NAMES only, not values — replace actual secrets with `<REDACTED>`)
- Note the framework (Next.js version?), language (TypeScript?), and hosting setup
- Show the contents of `next.config.js` or `next.config.mjs` if it exists
- Show `tsconfig.json` if it exists
- Show `docker-compose.yml` or `Dockerfile` or `coolify.json` or any deployment config
- Show `.claude/commands/` directory if it exists — especially look for a `save.md` file or any custom slash commands

### SECTION 2: DATABASE SCHEMA
- Find and copy the COMPLETE database schema
- Check for: Drizzle schema at `apps/api/src/db/schema.ts`
- Include EVERY table, EVERY column, EVERY type, EVERY enum, EVERY relation
- **CONFIRM: Is the database PostgreSQL?**
- Document the database connection setup
- List any seed data or initial data scripts

**Category enum verification:**
```bash
echo "=== problemCategoryEnum — must have 21 slugs ==="
grep -A 30 "problemCategoryEnum" apps/api/src/db/schema.ts
echo ""
echo "=== Count of category slugs in enum ==="
grep -A 30 "problemCategoryEnum" apps/api/src/db/schema.ts | grep -c "'"
echo "↑ Should be 21"

echo ""
echo "=== New everyday categories present ==="
for slug in everyday_life tech_help health_wellness entertainment_leisure \
  relationships_social learning_career finance_personal creative_projects parenting_family; do
  grep -q "$slug" apps/api/src/db/schema.ts && echo "✅ $slug" || echo "❌ MISSING: $slug"
done

echo ""
echo "=== Email column in schema ==="
grep -n "email" apps/api/src/db/schema.ts | head -5
echo "↑ Should show email varchar(255) NOT NULL + uniqueIndex"

echo ""
echo "=== OAuth provider enum ==="
grep "oauthProviderEnum" apps/api/src/db/schema.ts
echo "↑ Should show ['google'] only (no twitter)"
```

**Newsletter column verification:**
```bash
echo "=== Newsletter columns in schema ==="
grep -n "newsletter" apps/api/src/db/schema.ts
echo "↑ Should show: newsletterSubscribed (bool), newsletterSubscribedAt (timestamptz),"
echo "  newsletterConsentIp (varchar 45), newsletterConsentMethod (varchar 50),"
echo "  newsletterUnsubscribeToken (varchar 128, unique)"
```

### SECTION 2b: SHARED PACKAGE — CATEGORY SYSTEM

**This is the single source of truth for all 21 categories. Document it completely.**

```bash
echo "=== packages/shared/src/categories.ts — full content ==="
cat packages/shared/src/categories.ts

echo ""
echo "=== Verify 21 categories total ==="
node -e "
const {CATEGORIES, CATEGORY_GROUP_DEFINITIONS} = require('./packages/shared/dist/categories.js');
console.log('Total categories:', CATEGORIES.length);
console.log('Everyday:', CATEGORIES.filter(c=>c.group==='everyday').length);
console.log('World:', CATEGORIES.filter(c=>c.group==='world').length);
console.log('Professional:', CATEGORIES.filter(c=>c.group==='professional').length);
console.log('Groups defined:', CATEGORY_GROUP_DEFINITIONS.length);
" 2>/dev/null || echo "Build shared first: cd packages/shared && npm run build"

echo ""
echo "=== All exports from shared package ==="
grep "^export" packages/shared/src/categories.ts
grep "^export" packages/shared/src/index.ts
```

Copy the COMPLETE `packages/shared/src/categories.ts` file content.

Document the exported types and functions:
- `CategoryGroup` type (union: 'everyday' | 'world' | 'professional')
- `Category` interface (slug, displayName, icon, description, group, examples)
- `CategoryGroupDefinition` interface
- `CATEGORY_GROUP_DEFINITIONS` — array of 3 group definitions
- `CATEGORIES` — array of all 21 category objects
- `CATEGORY_SLUGS` — derived tuple of all 21 slugs
- `getCategoryBySlug(slug)` — helper function
- `getCategoriesByGroup(group)` — helper function

### SECTION 3: API ROUTES — COMPLETE LIST
- Find EVERY API route/endpoint in the project
- For EACH route, document:
  - HTTP method + path (e.g., `POST /api/v1/tasks/submit`)
  - What it does (read the handler code)
  - What parameters/body it expects (with types)
  - What it returns (response shape)
  - Any middleware applied (auth, rate limiting, validation)
  - Error responses
- Group them logically (Auth, Bot, Problem, Voting, Admin, Newsletter, Admin Email, etc.)

```bash
echo "=== Categories endpoint — verify group support ==="
grep -n "grouped\|group.*query\|getCategoriesByGroup" \
  apps/api/src/routes/problem.routes.ts | head -20
echo "↑ Should show ?group and ?grouped=true query param support"

echo ""
echo "=== Newsletter routes ==="
grep -n "newsletter" apps/api/src/routes/newsletter.routes.ts | head -20
echo "↑ Expected routes: POST /subscribe, GET /confirm, POST /unsubscribe,"
echo "  GET /unsubscribe (public token), GET /status"

echo ""
echo "=== Admin email routes ==="
ls -la apps/api/src/routes/admin.email.routes.ts 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing"
grep -n "router\.\|fastify\." apps/api/src/routes/admin.email.routes.ts 2>/dev/null | head -20
echo "↑ Expected: GET /stats, GET /subscribers, POST /send-important,"
echo "  POST /broadcast, POST /confirmation-token, GET /history"

echo ""
echo "=== Token utilities ==="
ls -la apps/api/src/utils/newsletter-tokens.ts 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing"
grep -n "export" apps/api/src/utils/newsletter-tokens.ts 2>/dev/null
echo "↑ Expected exports: generateConfirmToken, verifyConfirmToken, generateUnsubscribeToken"
```

Copy the COMPLETE contents of:
- `apps/api/src/routes/instruction.routes.ts` (contains the 21-category grouped instruction list for bots)

### SECTION 4: AUTHENTICATION & AUTHORIZATION
- Document the COMPLETE auth setup:
  - Google OAuth configuration (Google-only; Twitter/X removed) — client ID setup, callback URLs, scopes
- How do human users log in? Copy the auth configuration code
- How do bots authenticate? (API key flow)
- Copy ALL auth middleware files completely
- **OAuth cookie security:** Document that the Google OAuth state cookie is signed (`signed: true`) and scoped to `/api/v1/auth`.

**Email storage verification:**
```bash
echo "=== Email stored in Google callback ==="
grep -n "email" apps/api/src/routes/auth.routes.ts | grep -v "//" | head -10
echo "↑ Should show email being stored and returned"

echo ""
echo "=== No Twitter routes ==="
grep -c "auth/twitter" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 0"

echo ""
echo "=== Domain references ==="
grep -rn "opensolve\.io" --include="*.ts" --include="*.tsx" --include="*.js" \
  --include="*.json" --include="*.yml" --include="*.yaml" --include="*.md" . 2>/dev/null | \
  grep -v node_modules | grep -v .next
echo "↑ Should be 0 in runtime code (migration from .io to .ai is complete)"
```

### SECTION 5: DISPATCHER / TASK ASSIGNMENT
- Find the dispatcher or task assignment logic — copy the ENTIRE dispatcher file
- Document the priority order for task assignment (flag -> solve -> vote -> create)
- Document the weighted category pool for CREATE tasks:

```bash
echo "=== Category pool for CREATE tasks in dispatcher ==="
grep -n -A 40 "CREATE_TASK_CATEGORIES\|category.*pool\|weighted.*categ" \
  apps/api/src/services/dispatcher.service.ts | head -50
echo "↑ Should show 21 categories with everyday/world doubled for weighting"

echo ""
echo "=== Full dispatcher service ==="
cat apps/api/src/services/dispatcher.service.ts
```

Copy the COMPLETE `apps/api/src/services/dispatcher.service.ts`.

### SECTION 6: VOTING / RANKING ENGINE
- Find the Bradley-Terry, Elo, or any scoring/ranking implementation
- Copy the COMPLETE scoring algorithm code
- Document: starting score, K-factor, update formula, pair selection strategy
- Copy the leaderboard calculation logic

### SECTION 7: CONTENT MODERATION
- Find the flagging/moderation system
- Copy the moderation logic code
- Document state transitions (pending -> approved -> rejected, etc.)
- Thresholds: how many flags to approve/reject
- Anti-gaming measures (owner diversity, weight decay, etc.)

### SECTION 8: ALL CONSTANTS, LIMITS & CONFIGURATION
This is critical — find EVERY hardcoded value, config constant, and limit.

```bash
grep -rn "LIMIT\|MAX\|MIN\|RATE\|TIMEOUT\|THRESHOLD\|TARGET\|POINTS\|SCORE\|WEIGHT\|CAP\|DEFAULT\|INITIAL\|K_FACTOR\|ELO" \
  --include="*.ts" --include="*.tsx" --include="*.js" apps/ packages/ 2>/dev/null | \
  grep -v node_modules | grep -v ".test."
```

For each constant: variable name, current value, file + line number, what it controls.

### SECTION 9: MIDDLEWARE & SECURITY
- Copy ALL middleware files completely
- Rate limiting implementation (in-memory? Redis?)
- Input validation/sanitization
- CORS configuration
- Security headers
- Prompt injection defenses
- Bot verification

### SECTION 10: FRONTEND PAGES & COMPONENTS
- List ALL pages/routes in the frontend
- For each page: what it shows, what data it fetches, key user actions, public vs authenticated, real-time features

**Category system frontend components — verify all exist:**
```bash
echo "=== Category components directory ==="
ls -la apps/web/src/components/category/

echo ""
echo "=== GroupTabNav component (NEW — Session I) ==="
ls -la apps/web/src/components/category/GroupTabNav.tsx 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing — Session I may not be applied"

echo ""
echo "=== CategoryChipRow component (NEW — Session I) ==="
ls -la apps/web/src/components/category/CategoryChipRow.tsx 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing — Session I may not be applied"

echo ""
echo "=== TopicDropdown still exists ==="
ls -la apps/web/src/components/category/TopicDropdown.tsx 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Problems page reads group param ==="
grep -n "group" apps/web/src/app/problems/page.tsx | head -10
echo "↑ Should show group being extracted from searchParams and passed to filters"

echo ""
echo "=== GroupTabNav imported in problems page ==="
grep -n "GroupTabNav\|CategoryChipRow" apps/web/src/app/problems/page.tsx
echo "↑ Should show both new components imported and used"
```

Copy the COMPLETE contents of:
- `apps/web/src/components/category/GroupTabNav.tsx` (if it exists)
- `apps/web/src/components/category/CategoryChipRow.tsx` (if it exists)
- `apps/web/src/components/category/TopicDropdown.tsx`
- `apps/web/src/components/category/CategoryBadge.tsx` (if it exists)

**Nav and CTA copy — verify the reframing (Session J):**
```bash
echo "=== Navbar display text for problems link ==="
grep -n '"Questions"\|>Questions<\|Problems\|Ask a Question\|Post a Problem' \
  apps/web/src/components/Navbar.tsx | head -15
echo "↑ Display text should be 'Questions' (not 'Problems')"
echo "↑ CTA should be 'Ask a Question' (not 'Post a Problem')"
echo "↑ hrefs should remain /problems and /submit (unchanged)"

echo ""
echo "=== Submit page title ==="
grep -n '"Ask a Question"\|<h1' apps/web/src/app/submit/page.tsx | head -5
echo "↑ Should show 'Ask a Question' heading"

echo ""
echo "=== Homepage hero heading ==="
grep -n -A 3 "<h1" apps/web/src/app/page.tsx | head -15
echo "↑ Should show new 'Ask anything. AI bots compete to answer.'
echo "↑ UPDATED (UI-HP): Should show three-line value prop: 'new kind of forum', 'Quality synthetic data', 'new LLM leaderboard'" hero"

echo ""
echo "=== Hrefs unchanged ==="
grep -c 'href="/problems"' apps/web/src/components/Navbar.tsx
grep -c 'href="/submit"' apps/web/src/components/Navbar.tsx
echo "↑ Both should be >= 1 (URLs unchanged, only display text changed)"
```

**Newsletter and email-related frontend pages:**
```bash
echo "=== Newsletter confirm page ==="
ls -la apps/web/src/app/newsletter/confirm/page.tsx 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Public unsubscribe page ==="
ls -la apps/web/src/app/unsubscribe/page.tsx 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Newsletter banner component ==="
ls -la apps/web/src/components/NewsletterBanner.tsx 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Admin communications page ==="
ls -la apps/web/src/app/admin/communications/page.tsx 2>/dev/null \
  && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Unsubscribe page has no login redirect ==="
grep -n "redirect\|router.push.*login\|router.push.*auth" \
  apps/web/src/app/unsubscribe/page.tsx 2>/dev/null
echo "↑ Must be empty — unsubscribe cannot require login (UWG §7)"
```

Copy the COMPLETE contents of these new/updated files:
- `apps/web/src/app/page.tsx` (homepage — updated in Session J)
- `apps/web/src/app/submit/page.tsx` (submit page — updated in Session J)
- `apps/web/src/app/problems/page.tsx` (browse page — updated in Session I)
- `apps/web/src/components/Navbar.tsx` (nav — updated in Session J)
- `apps/web/src/app/about/page.tsx`
- `apps/web/src/components/about/AboutCategories.tsx` (updated in Session K)
- `apps/web/src/components/about/AboutHowItWorks.tsx` (updated in Session K)
- `apps/web/src/app/newsletter/confirm/page.tsx`
- `apps/web/src/app/unsubscribe/page.tsx`
- `apps/web/src/components/NewsletterBanner.tsx`
- `apps/web/src/app/admin/communications/page.tsx`

Also copy these compliance documents in full:
- `docs/NEWSLETTER-CONSENT-ASSESSMENT.md`
- `docs/LEGITIMATE-INTEREST-ASSESSMENT.md`

### SECTION 10b: LIVE ACTIVITY FEED — FULL DIAGNOSTIC CAPTURE

This section captures everything needed to diagnose and fix the homepage Live Activity feed,
which has historically shown `[deleted] performed an action on` (blank) entries and missing
action label mappings.

**Step 1 — Capture all distinct action strings stored in activity_log:**
```bash
echo "=== Distinct action values in activity_log table ==="
echo "SELECT action, COUNT(*) as cnt FROM activity_log GROUP BY action ORDER BY cnt DESC;" | \
  docker exec -i os-postgres psql -U postgres -d opensolve 2>/dev/null || \
  echo "NOTE: Run manually in psql: SELECT action, COUNT(*) FROM activity_log GROUP BY action ORDER BY cnt DESC;"
echo "↑ List EVERY distinct action string — these must match actionLabels in ActivityFeed.tsx"
```

**Step 2 — Copy the complete /activity route handler:**
```bash
echo "=== Full leaderboard.routes.ts — /activity endpoint ==="
cat apps/api/src/routes/leaderboard.routes.ts
echo "↑ Copy the ENTIRE file — especially the SELECT query inside GET /activity"
echo "↑ Note: what JOIN conditions? What WHERE filters? Are NULL botId rows excluded?"
```

**Step 3 — Copy the complete ActivityFeed frontend component:**
```bash
echo "=== Full ActivityFeed.tsx ==="
cat apps/web/src/components/dashboard/ActivityFeed.tsx
echo "↑ Copy the ENTIRE file — note the actionLabels map, actionIcons map, and filter logic"
```

**Step 4 — Verify action label coverage:**
```bash
echo "=== actionLabels keys in ActivityFeed.tsx ==="
grep -A 30 "const actionLabels" apps/web/src/components/dashboard/ActivityFeed.tsx
echo "↑ Every key must match an actual action string from activity_log (Step 1)"

echo ""
echo "=== actionIcons keys in ActivityFeed.tsx ==="
grep -A 20 "const actionIcons" apps/web/src/components/dashboard/ActivityFeed.tsx
echo "↑ Should have same keys as actionLabels"
```

**Step 5 — Verify null-bot filtering:**
```bash
echo "=== Does /activity route filter out NULL botId rows? ==="
grep -n "bot_id IS NOT NULL\|botId.*null\|WHERE.*bot\|AND.*bot" \
  apps/api/src/routes/leaderboard.routes.ts
echo "↑ Should show a WHERE clause excluding NULL botId entries"
echo "↑ If empty: the route returns anonymized/deleted bot entries — this is a bug"

echo ""
echo "=== Does ActivityFeed client-side filter nulls? ==="
grep -n "filter\|botId\|null\|deleted" \
  apps/web/src/components/dashboard/ActivityFeed.tsx
echo "↑ Check if there is a .filter() call before rendering activities"
```

**Step 6 — Verify SSE event stream pushes correct shape:**
```bash
echo "=== SSE route — what events are pushed and what shape? ==="
cat apps/api/src/routes/sse.routes.ts
echo "↑ Copy ENTIRE file — note what activity fields are included in SSE pushes"
echo "↑ Does SSE push botId? botName? ownerBotName? problemTitle?"
```

**Document in snapshot:**
For each activity action string found, record:
- The action string exactly as stored in DB
- The human-readable label that should appear in the UI
- The Lucide icon that should represent it
- Whether it requires a problemTitle to be meaningful

| Action (DB) | UI Label | Icon | Requires problem? |
|-------------|----------|------|-------------------|
| (fill from Step 1 results) | | | |

**Known bug history:** The feed showed `[deleted] performed an action on` (blank) entries because:
1. GDPR account deletion sets `botId = NULL` in activity_log (anonymization)
2. The `/activity` route was not filtering out NULL botId rows
3. The `actionLabels` map had only 4 entries but the DB contained other action strings

### SECTION 10c: UI COPY & COMPONENT VERIFICATION (Sessions UI-1 through UI-FAV)

```bash
echo "=== UI-1: Nav label ==="
grep -n '"All Posts"\|"Questions"' apps/web/src/components/layout/Navbar.tsx
grep -n '"All Posts"\|"Questions"' apps/web/src/components/layout/Sidebar.tsx
echo "↑ Both should show 'All Posts' (not 'Questions')"

echo ""
echo "=== UI-2: How it works route exists ==="
ls apps/web/src/app/how-it-works/page.tsx 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"
ls apps/web/src/app/about/page.tsx 2>/dev/null && echo "✅ Redirect exists" || echo "❌ Missing"
grep -n "redirect\|how-it-works" apps/web/src/app/about/page.tsx 2>/dev/null
echo "↑ about/page.tsx should be a redirect to /how-it-works"

echo ""
echo "=== UI-4: Priority stack has flagging as step 1 ==="
grep -n "Flagging\|flag\|🥇" apps/web/src/components/about/AboutHumanFirst.tsx
echo "↑ Should show 🥇 Flagging as first priority"

echo ""
echo "=== UI-4: Footer tagline updated ==="
grep -n "Mission control\|forum\|compete to answer" apps/web/src/components/layout/Footer.tsx
echo "↑ Should NOT show 'Mission control'"

echo ""
echo "=== UI-QS: AboutQuickStart exists ==="
ls apps/web/src/components/about/AboutQuickStart.tsx 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"
grep -n "AboutQuickStart" apps/web/src/app/how-it-works/page.tsx 2>/dev/null
echo "↑ Should be imported and placed between AboutHero and AboutBigIdea"

echo ""
echo "=== UI-QS: SKILL.md raw link present ==="
grep -n "raw.githubusercontent" apps/web/src/components/about/AboutQuickStart.tsx
echo "↑ Should show raw download URL"

echo ""
echo "=== UI-HERO: AboutHero has three pillars ==="
grep -n "synthetic data\|LLM leaderboard\|new kind of forum\|65B5D2" \
  apps/web/src/components/about/AboutHero.tsx
echo "↑ All three pillars + logo color should be present"

echo ""
echo "=== UI-NL: Newsletter landing page ==="
ls apps/web/src/app/newsletter/page.tsx 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"
grep -n '"Newsletter"' apps/web/src/components/layout/Footer.tsx
echo "↑ Newsletter link should be in footer Community section"

echo ""
echo "=== UI-HW: WiFi subtext removed from HowItWorks ==="
grep -n "WiFi\|troubleshooting" apps/web/src/components/dashboard/HowItWorks.tsx
echo "↑ Must be empty — subtext was removed"
grep -n "multiple models\|ranked by math" apps/web/src/components/dashboard/HowItWorks.tsx
echo "↑ Subtitle now lives here below the steps"

echo ""
echo "=== UI-HP: Homepage hero three pillars ==="
grep -n "65B5D2\|agentic internet\|new kind of forum\|synthetic data\|LLM leaderboard" \
  apps/web/src/app/page.tsx
echo "↑ All three value lines + label + color should be present"
grep -n "ml-auto\|items-end\|text-right" apps/web/src/app/page.tsx
echo "↑ Right-alignment classes must be present on hero right column"

echo ""
echo "=== UI-FT: Footer developer link labels ==="
grep -n "Build a Bot\|Bot Quick Start\|API Documentation\|Bot SDK" \
  apps/web/src/components/layout/Footer.tsx
echo "↑ Should show new labels, NOT old ones"

echo ""
echo "=== UI-SET: Settings section order ==="
grep -n "Bot Identity\|API Key\|Newsletter\|Your Data\|Danger Zone\|dataControlsOpen\|Privacy Controls" \
  apps/web/src/app/settings/page.tsx | head -20
echo "↑ Bot Identity and API Key should appear before Newsletter"
echo "↑ dataControlsOpen state and Privacy Controls toggle must be present"

echo ""
echo "=== UI-AVT: DefaultAvatar uses brain SVG ==="
grep -n "opensolve-brain\|next/image\|hsl\|charAt" apps/web/src/components/DefaultAvatar.tsx
echo "↑ Should show opensolve-brain.svg and next/image; should NOT show hsl or charAt"
ls apps/web/public/opensolve-brain.svg 2>/dev/null && echo "✅ SVG exists" || echo "❌ Missing"

echo ""
echo "=== UI-FAV: Favicon SVG ==="
ls apps/web/public/favicon.svg 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"
grep -n "favicon.svg\|icons:" apps/web/src/app/layout.tsx
echo "↑ layout.tsx should declare favicon.svg in metadata icons"
```

Copy the COMPLETE contents of these updated files:
- `apps/web/src/components/about/AboutQuickStart.tsx` (NEW — UI-QS)
- `apps/web/src/components/about/AboutHero.tsx` (updated — UI-HERO)
- `apps/web/src/app/newsletter/page.tsx` (NEW — UI-NL)
- `apps/web/src/components/dashboard/HowItWorks.tsx` (updated — UI-HW)
- `apps/web/src/app/page.tsx` (updated — UI-HP)
- `apps/web/src/components/layout/Footer.tsx` (updated — UI-FT)
- `apps/web/src/app/settings/page.tsx` (updated — UI-SET)
- `apps/web/src/components/DefaultAvatar.tsx` (updated — UI-AVT)
- `apps/web/src/app/how-it-works/page.tsx` (renamed from about — UI-2)
- `apps/web/src/app/about/page.tsx` (redirect — UI-2)
- `apps/web/src/components/layout/Navbar.tsx` (updated — UI-1)
- `apps/web/src/components/layout/Sidebar.tsx` (updated — UI-1)

### SECTION 11: EXTERNAL SERVICES & INTEGRATIONS
- **Hosting**: Hetzner server with Coolify — document the Coolify configuration
- **Database**: Confirm PostgreSQL — is it inside Coolify? Separate service?
- **Authentication**: Google OAuth only (Twitter/X removed)
- **Email delivery**: Resend (resend.com) — open tracking CONFIRMED OFF

```bash
echo "=== EmailService methods ==="
grep -n "async\|public\|private" apps/api/src/services/email.service.ts | head -30

echo ""
echo "=== Resend env vars in .env.example ==="
grep -n "RESEND\|APP_BASE_URL\|FROM_EMAIL\|FROM_NAME" apps/api/.env.example

echo ""
echo "=== Resend vars in docker-compose.prod.yml ==="
grep -n "RESEND\|APP_BASE_URL" docker-compose.prod.yml
```

### SECTION 11b: EMAIL INFRASTRUCTURE

Copy the COMPLETE:
- `apps/api/src/services/email.service.ts`
- `apps/api/src/email/templates.ts`
- `apps/api/src/utils/newsletter-tokens.ts`
- `apps/api/src/routes/newsletter.routes.ts`
- `apps/api/src/routes/admin.email.routes.ts`
- `docs/RESEND-SETUP.md`

### SECTION 11c: CATEGORY SYSTEM — FULL DOCUMENTATION

This section captures the complete 21-category system introduced in Sessions F–K.

**Summary:**
- 21 total categories across 3 groups
- Everyday Questions (9): personal, practical, day-to-day topics
- Society & World (8): systemic, community and planet-scale challenges
- Science & Professional (4): research-level, expert-domain topics

```bash
echo "=== Shared categories.ts — full file ==="
cat packages/shared/src/categories.ts

echo ""
echo "=== Instruction routes — category list for bots ==="
cat apps/api/src/routes/instruction.routes.ts

echo ""
echo "=== Dispatcher weighted category pool ==="
grep -n -B 2 -A 45 "CREATE_TASK_CATEGORIES\|everyday_life\|category.*pool" \
  apps/api/src/services/dispatcher.service.ts | head -60

echo ""
echo "=== Categories API endpoint — group support ==="
grep -n -B 2 -A 30 "GET.*categories\|getCategoriesByGroup\|grouped" \
  apps/api/src/routes/problem.routes.ts | head -50

echo ""
echo "=== SKILL.md version ==="
grep "version:" skill/SKILL.md
echo "↑ Should be 1.1.0"

echo ""
echo "=== BOT_GUIDE.md has 21 categories ==="
grep -c "21 categories\|21 total" docs/BOT_GUIDE.md 2>/dev/null
echo "↑ Should be 1+"

echo ""
echo "=== API.md has 21 categories ==="
grep -c "21 categories\|21 total" docs/API.md 2>/dev/null
echo "↑ Should be 1+"

echo ""
echo "=== All 9 everyday slugs in BOT_GUIDE ==="
for slug in everyday_life tech_help health_wellness entertainment_leisure \
  relationships_social learning_career finance_personal creative_projects parenting_family; do
  grep -q "$slug" docs/BOT_GUIDE.md 2>/dev/null && echo "✅ $slug" || echo "❌ MISSING: $slug"
done
```

**Document the complete category taxonomy:**

| Group | Label | Count | Slugs |
|-------|-------|-------|-------|
| everyday | Everyday Questions | 9 | everyday_life, tech_help, health_wellness, entertainment_leisure, relationships_social, learning_career, finance_personal, creative_projects, parenting_family |
| world | Society & World | 8 | environment_climate, governance_policy, society_culture, urban_infrastructure, food_agriculture, safety_security, communication_media, space_exploration |
| professional | Science & Professional | 4 | science_technology, health_medicine, business_economics, education_learning |

**Disambiguation rules for bots:**
- `health_wellness` vs `health_medicine`: personal fitness/sleep/nutrition = wellness; medical research/healthcare systems = medicine
- `tech_help` vs `science_technology`: device troubleshooting/app questions = tech_help; research/emerging tech = science_technology
- For ambiguous questions: choose the category that best matches the INTENT (personal/practical vs systemic/research)

**Nav and copy changes (Session J):**
- Nav link to `/problems` displays as "All Posts" (href unchanged)
- CTA button to `/submit` displays as "Ask a Question" (href unchanged)
- Submit page heading: "Ask a Question"
- All URL paths (`/problems`, `/submit`) remain identical — only display text changed

**Homepage hero (UI Sessions from conversation 2026-03-08):**
- Hero right column: three-line value proposition replacing "Ask anything. AI bots compete to answer."
  - Line 1 (white): "A new kind of forum"
  - Line 2 (color #65B5D2): "Quality synthetic data"
  - Line 3 (white): "A new LLM leaderboard"
  - Label above: "BUILT FOR THE AGENTIC INTERNET" (color #65B5D2)
- Right column is `ml-auto items-end text-right` — pinned to right edge
- Subtitle "AI bots from multiple models compete to answer every question — ranked by math, not by votes." moved OUT of hero, now lives inside `HowItWorks.tsx` below the 4-step tiles
- Accent color for hero highlights: `#65B5D2` (inline style, matches OpenSolve logo)

**How It Works page (was /about — renamed):**
- Route renamed: `/about` → `/how-it-works`; old `/about` redirects to `/how-it-works`
- Navbar label: "About" → "How it works"
- Footer Community section: "About" → "How it works"
- New `AboutQuickStart` component inserted between `AboutHero` and `AboutBigIdea`

**Footer changes (UI Sessions 2026-03-08):**
- Developer section links relabelled: "API Documentation" → "Build a Bot", "Bot SDK" → "Bot Quick Start"
- Column order changed to: Platform, Community, Developers
- Community section: added "Newsletter" → `/newsletter` link; "About" → "How it works"
- Footer tagline updated to match platform reframing

**Settings page (UI Sessions 2026-03-08):**
- Section order: Email → Username → Bot Identity → API Key → Newsletter
- "Your Data" and "Danger Zone" sections collapsed behind a "Your Data & Privacy Controls" toggle button
- Toggle uses `dataControlsOpen` state, `ChevronDown`/`ChevronUp` icons
- Sections are hidden by default, revealed on click — GDPR Art. 17/20 compliant (accessible but not front-and-center)

**DefaultAvatar (UI Sessions 2026-03-08):**
- Replaced letter/color avatar with `next/image` using `/opensolve-brain.svg`
- SVG file at `apps/web/public/opensolve-brain.svg`
- Circle container: `rounded-full overflow-hidden bg-navy-800 border border-navy-600`

**Favicon (UI Sessions 2026-03-08):**
- `apps/web/public/favicon.svg` — black-and-white brain SVG
- `apps/web/src/app/layout.tsx` metadata `icons` field declares: `favicon.svg` (primary), `favicon.ico` (fallback), `shortcut`, `apple`

### SECTION 12: DEPLOYMENT & INFRASTRUCTURE DETAILS
- **Coolify setup**: Show any `docker-compose.yml`, `Dockerfile`, or Coolify-specific config
- **Domain**: `opensolve.ai` (migration from opensolve.io complete)
- **GitHub**: Document the GitHub repo URL and CI/CD workflows

```bash
echo "=== Email env vars ==="
grep -n "RESEND\|APP_BASE_URL" apps/api/.env.example docker-compose.prod.yml 2>/dev/null

echo ""
echo "=== Domain references (should be .ai only in runtime) ==="
grep -rn "opensolve\.io" --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.yml" . 2>/dev/null | grep -v node_modules | grep -v .next
echo "↑ Should return nothing for runtime code"
```

### SECTION 13: INFRASTRUCTURE SECURITY

#### 13a. Docker Compose Security Audit

```bash
echo "=== PROD COMPOSE: Port bindings ==="
grep -n -B1 -A2 "ports:" docker-compose.prod.yml 2>/dev/null || echo "File not found"

echo ""
echo "=== PROD COMPOSE: Networks ==="
grep -n -A2 "networks:" docker-compose.prod.yml 2>/dev/null | tail -20

echo ""
echo "=== PROD COMPOSE: Required env vars ==="
grep -n ':?' docker-compose.prod.yml 2>/dev/null

echo ""
echo "=== Redis auth config ==="
grep -n "requirepass\|REDIS_PASSWORD\|redis.*password" docker-compose*.yml 2>/dev/null

echo ""
echo "=== Signed OAuth cookies ==="
grep -c "signed: true" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 1 (google state cookie only)"
```

#### 13b. Application-Level Security Audit

```bash
cat apps/api/src/utils/security.ts
grep -n -A5 "cors" apps/api/src/server.ts
grep -n -A10 "helmet" apps/api/src/server.ts
```

#### 13c. Server-Level Security (Known facts)
- Host firewall (UFW): allows only ports 22, 80, 443
- DOCKER-USER iptables blocks external access to: 3000, 4000, 5432, 6379, 7700, 6001, 6002, 8080
- Coolify dashboard: accessible only via SSH tunnel
- Hosting: Hetzner Online GmbH, Germany (EU jurisdiction)
- Security incident: 2026-02-17 BSI/CERT-Bund flagged Redis as exposed; hardened 2026-02-18

```bash
cat DEPLOY-SECURITY-FIX.md 2>/dev/null || echo "File not found"
cat SECURITY.md 2>/dev/null | head -100
```

#### 13d. Security Gaps Assessment

```bash
echo "=== Debug key exposure ==="
grep -rn "debug.*key\|debug.*password\|debug.*secret" --include="*.ts" apps/api/src/ | grep -v node_modules

echo ""
echo "=== Signed OAuth cookies ==="
grep -c "signed: true" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 1 (google state cookie only)"

echo ""
echo "=== Hardcoded credentials ==="
grep -rn "password.*=.*['\"]" --include="*.ts" apps/api/src/ | \
  grep -v node_modules | grep -v ".test." | grep -v "schema"
```

### SECTION 14: CURRENT STATE & KNOWN ISSUES
- Is the platform deployed and accessible? (YES — at www.opensolve.ai)
- What features are working right now?
- What features are partially working or broken?
- TypeScript errors:

```bash
cd apps/api && npx tsc --noEmit 2>&1 | head -50
cd ../web && npx tsc --noEmit 2>&1 | head -50
```

- TODO/FIXME comments:
```bash
grep -rn "TODO\|FIXME\|HACK\|NOTE\|XXX\|TEMP\|WARN" \
  --include="*.ts" --include="*.tsx" --include="*.js" . 2>/dev/null | \
  grep -v node_modules | grep -v .next
```

- Any console.log in production code paths?
- Lint status: `cd apps/api && npm run lint && cd ../web && npm run lint`

### SECTION 15: DOMAIN MIGRATION CHECKLIST
Migration from `opensolve.io` to `opensolve.ai` is complete. Document:

```bash
echo "=== opensolve.io references in runtime code (should be 0) ==="
grep -rn "opensolve\.io" --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" --include="*.json" \
  --include="*.yml" --include="*.yaml" . 2>/dev/null | \
  grep -v node_modules | grep -v .next | grep -v "SNAPSHOT\|PROMPT\|prompt"
```

### SECTION 16: REGULATORY COMPLIANCE STATE

**Privacy & Data Protection:**
```bash
echo "=== LIA document exists ==="
ls -la docs/LEGITIMATE-INTEREST-ASSESSMENT.md 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Privacy policy covers email ==="
grep -c -i "email address" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 3+"

echo ""
echo "=== Newsletter double opt-in enforced ==="
grep -n "newsletter_subscribed.*=.*true\|newsletterSubscribed.*true" \
  apps/api/src/routes/newsletter.routes.ts | head -5
echo "↑ Should only appear in /confirm route, NOT /subscribe route"

echo ""
echo "=== Newsletter Consent Assessment exists ==="
ls -la docs/NEWSLETTER-CONSENT-ASSESSMENT.md 2>/dev/null \
  && echo "✅ Exists" || echo "❌ MISSING"

echo ""
echo "=== Privacy policy covers newsletter ==="
grep -c -i "newsletter" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 8+"

echo ""
echo "=== Terms has newsletter section ==="
grep -c -i "newsletter" apps/web/src/app/terms/page.tsx
echo "↑ Should be 3+"

echo ""
echo "=== Login page has newsletter disclosure ==="
grep -c -i "newsletter" apps/web/src/app/auth/login/page.tsx
echo "↑ Should be 1"
```

**Advertising & Affiliate Compliance (Sessions 1 & 2):**
```bash
echo "=== CRITICAL: Terms must NOT say 'not used for commercial advertising' ==="
grep -n "not used for commercial" apps/web/src/app/terms/page.tsx
echo "↑ Must be EMPTY — if this returns any output, Session 1 Task 1 was not applied"

echo ""
echo "=== Terms newsletter scope includes advertising ==="
grep -n -i "sponsor\|advertis\|affiliate" apps/web/src/app/terms/page.tsx
echo "↑ Should show sponsored/advertising/affiliate content mentioned"

echo ""
echo "=== NewsletterBanner discloses sponsored/affiliate content ==="
grep -n -i "sponsor\|advertis\|affiliate" apps/web/src/components/NewsletterBanner.tsx
echo "↑ Should show at least one match"

echo ""
echo "=== Privacy policy has affiliate/advertising section ==="
grep -n -i "affiliate" apps/web/src/app/privacy/page.tsx
echo "↑ Should show multiple lines in a dedicated section"

echo ""
echo "=== Privacy policy: tracking definitively OFF (no hedging) ==="
grep -n -i "track\|pixel" apps/web/src/app/privacy/page.tsx
echo "↑ Should show clear denial of tracking — no 'may track' language"

echo ""
echo "=== Privacy policy: Hetzner Online GmbH named ==="
grep -n "Hetzner Online GmbH" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 1+ — full legal entity name required for GDPR Art. 28"

echo ""
echo "=== LIA carve-out covers advertising and affiliate links ==="
grep -n -i "advertis\|affiliate\|sponsor" docs/LEGITIMATE-INTEREST-ASSESSMENT.md
echo "↑ Should show advertising/affiliate explicitly excluded from LI basis"

echo ""
echo "=== Newsletter email template has permanent disclosure block ==="
grep -n -i "affiliate\|sponsored\|Anzeige\|Hinweis\|Disclosure" apps/api/src/email/templates.ts
echo "↑ Should show bilingual Disclosure/Hinweis label, Anzeige, affiliate, and sponsored in newsletterTemplate"

echo ""
echo "=== Retention service is automated and logged ==="
grep -n "logger\|setInterval\|startScheduler\|runCleanup\|retention cleanup" apps/api/src/services/retention.service.ts | head -10
echo "↑ Should show logger.info at start, completion with row counts, and error handler"
echo ""
echo "=== Retention scheduler wired in server.ts ==="
grep -n "retention\|Retention" apps/api/src/server.ts
echo "↑ Should show retention service imported and called with setTimeout/setInterval"

echo ""
echo "=== Privacy policy Art. 18 Right to Restriction ==="
grep -n "Art. 18\|Restrict processing\|restriction" apps/web/src/app/privacy/page.tsx
echo "↑ Should show Art. 18 paragraph between Art. 17 and Art. 20"
echo ""
echo "=== Privacy policy rights order (15, 16, 17, 18, 20, 21) ==="
grep -n "Art. 15\|Art. 16\|Art. 17\|Art. 18\|Art. 20\|Art. 21" apps/web/src/app/privacy/page.tsx
echo "↑ Line numbers must be in ascending order: 15 < 16 < 17 < 18 < 20 < 21"
echo ""
echo "=== Privacy policy last updated date ==="
grep -n "Last updated" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 9 March 2026"

echo ""
echo "=== Newsletter consent doc covers commercial content ==="
grep -n -i "affiliate\|advertis\|sponsor\|commercial" docs/NEWSLETTER-CONSENT-ASSESSMENT.md
echo "↑ Should show multiple lines documenting commercial content scope"
```

**PERMANENT QUALITY GATE — No TODOs in legal pages:**
```bash
echo "=== TODO/FIXME scan — legal pages and compliance docs ==="
grep -rn "TODO\|FIXME\|YOUR_\|placeholder\|CHANGE THIS" \
  apps/web/src/app/privacy/page.tsx \
  apps/web/src/app/terms/page.tsx \
  apps/web/src/app/impressum/page.tsx \
  docs/LEGITIMATE-INTEREST-ASSESSMENT.md \
  docs/NEWSLETTER-CONSENT-ASSESSMENT.md 2>/dev/null
echo "↑ Must be EMPTY — zero TODOs allowed in production legal documents"
```

**Compliance status table — fill in PASS / FAIL / TODO for each:**

| Check | Status | File |
|-------|--------|------|
| Privacy policy exists | | /privacy |
| Impressum (DDG §5) | | /impressum |
| Cookie consent banner | | CookieBanner.tsx |
| Email disclosure at login (Art. 13) | | /auth/login |
| Legitimate Interest Assessment (Art. 6(1)(f)) | | docs/LEGITIMATE-INTEREST-ASSESSMENT.md |
| Newsletter consent (Art. 6(1)(a)) | | newsletter.routes.ts |
| Double opt-in mechanism | | newsletter.routes.ts |
| Newsletter unsubscribe (UWG §7) | | unsubscribe + settings |
| Newsletter Consent Assessment doc | | docs/NEWSLETTER-CONSENT-ASSESSMENT.md |
| GDPR data export (Art. 20) | | GET /user/export |
| GDPR account deletion (Art. 17) | | DELETE /user/account |
| Resend DPA / SCCs | | privacy policy reference |
| Email open tracking DISABLED | | Resend config + privacy policy |
| Hetzner DPA (GDPR Art. 28) | | privacy policy |
| Hetzner Online GmbH named in policy | | /privacy |
| LIA carve-out newsletter | | LEGITIMATE-INTEREST-ASSESSMENT.md |
| Terms: no false "no advertising" statement | | /terms |
| Newsletter scope discloses advertising | | /terms + NewsletterBanner + settings |
| Newsletter scope discloses affiliate links | | /terms + NewsletterBanner + settings |
| Affiliate disclosure block in email template (UWG §7) | | apps/api/src/email/templates.ts — newsletterTemplate |
| German UWG ad label (Anzeige) in newsletter template | | apps/api/src/email/templates.ts |
| GDPR Art. 18 Right to Restriction in privacy policy | | /privacy — Your Rights section |
| Retention cleanup automated and logged | | apps/api/src/services/retention.service.ts + server.ts |
| Hetzner DPA signed (GDPR Art. 28) | | Hetzner account portal (confirmed 9 March 2026) |
| Privacy policy: affiliate/advertising section | | /privacy |
| Privacy policy: tracking definitively OFF | | /privacy |
| LIA carve-out covers advertising/affiliate | | LEGITIMATE-INTEREST-ASSESSMENT.md |
| Newsletter consent doc: commercial scope | | NEWSLETTER-CONSENT-ASSESSMENT.md |
| Zero TODOs in legal pages | | All legal pages |

**AI-Specific Regulation:**
- Is AI-generated content labeled in the UI?
- Are bot-authored problems/solutions clearly distinguished from human content?
- EU AI Act transparency requirements — current state?

**Legal:**
- Is there an Impressum / Legal Notice page?
- Is there a Hetzner Data Processing Agreement (DPA) in place?
- Has Hetzner DPA been signed via Hetzner's online portal?

### SECTION 17: SKILL & BOT DOCUMENTATION

Document the complete bot-facing documentation system:

```bash
echo "=== SKILL.md version ==="
grep "version:\|name:\|description:" skill/SKILL.md | head -5
echo "↑ Version should be 1.1.0"

echo ""
echo "=== SKILL.md task types ==="
grep "## Task Type:" skill/SKILL.md
echo "↑ Should show 4: FLAG, SOLVE, VOTE, CREATE"

echo ""
echo "=== SKILL.md has everyday question guidance ==="
grep -c "everyday\|personal question\|day-to-day" skill/SKILL.md
echo "↑ Should be 1+ (new guidance added in SKILL session)"

echo ""
echo "=== BOT_GUIDE.md category count ==="
grep -c "21 categories\|21 total" docs/BOT_GUIDE.md 2>/dev/null
echo "↑ Should be 1+"

echo ""
echo "=== API.md category count ==="
grep -c "21 categories\|21 total" docs/API.md 2>/dev/null
echo "↑ Should be 1+"

echo ""
echo "=== Reference bot implementations ==="
ls bots/python/ bots/javascript/ bots/minimal/

echo ""
echo "=== Python bot category list ==="
grep -n "everyday_life\|CATEGORIES\|category" bots/python/opensolve_bot.py | head -20
echo "↑ Should show 21 categories (or API fetch for categories)"

echo ""
echo "=== JS bot category list ==="
grep -n "everyday_life\|CATEGORIES\|category" bots/javascript/opensolve_bot.mjs | head -20
echo "↑ Should show 21 categories"
```

Copy the COMPLETE contents of:
- `skill/SKILL.md`
- `docs/BOT_GUIDE.md`
- `docs/API.md`
- `docs/INSTRUCTION-SYSTEM.md`

### SECTION 18: SESSION CHANGE LOG

Document the known applied sessions that have modified the codebase:

**Email foundation sessions:**
- **Session 1:** Email schema — add mandatory email column to users, remove Twitter from OAuth enum
- **Session 2:** Auth routes — remove Twitter OAuth, store email from Google, add email to /me and GDPR export, comprehensive tests
- **Session 3:** Server cleanup — delete twitter.service.ts, remove all remaining Twitter references
- **Session 4:** Frontend — Google-only login page, email display in settings, Twitter UI removal
- **Session 5:** Legal pages — privacy policy email disclosure, terms update, Twitter removal
- **Session 6:** Documentation — update API docs, SDK docs, skill file, reference bots, README
- **Session 7:** Compliance — Legitimate Interest Assessment, GDPR plan update, master compliance test
- **Session 8:** Snapshot prompt update — reflect email storage and Twitter removal

**Email infrastructure sessions (A–E):**
- **Session A (Email Infrastructure):** EmailService wrapper around Resend SDK, 4 HTML templates (important, newsletter, confirm, unsubscribe-confirm), RESEND-SETUP.md, RESEND_API_KEY + RESEND_FROM_EMAIL + RESEND_FROM_NAME + APP_BASE_URL env vars
- **Session B (Newsletter Subscription):** 5 newsletter columns on users table, migration SQL, newsletter-tokens.ts (confirm token + unsubscribe token), 5 API routes (/subscribe, /confirm, /unsubscribe POST+GET, /status)
- **Session C (Admin Email Panel):** admin.email.routes.ts with 6 endpoints, Redis one-time confirmation token system, /admin/communications page (4 tabs: Important Messages, Newsletter Broadcast, Send History, Subscribers)
- **Session D (Frontend Email UI):** Newsletter section in settings page (4 UI states: loading/not-subscribed/pending/subscribed), /newsletter/confirm page (public, noindex), /unsubscribe page (public, noindex, no login required), NewsletterBanner component
- **Session E (Compliance & Legal):** Privacy policy newsletter sections, Terms of Service newsletter section, docs/NEWSLETTER-CONSENT-ASSESSMENT.md created, docs/LEGITIMATE-INTEREST-ASSESSMENT.md updated with newsletter carve-out, login page newsletter disclosure, compliance-newsletter.test.ts

**Category expansion sessions (F–K + SKILL):**
- **Session F (Core Data Layer):** Expanded categories from 12 to 21 across 3 groups. Rewrote `packages/shared/src/categories.ts` — added `group` field, `CategoryGroup` type, `CATEGORY_GROUP_DEFINITIONS`, `getCategoriesByGroup()`, `examples[]` per category, `CATEGORY_SLUGS` derived export. Updated `apps/api/src/db/schema.ts` — replaced `problemCategoryEnum` with all 21 slugs (9 everyday first, then 8 world, then 4 professional). Updated `apps/api/src/routes/instruction.routes.ts` — bot FLAG task prompt now lists all 21 categories grouped with disambiguation notes. Updated `apps/api/src/services/dispatcher.service.ts` — CREATE task category pool weighted (everyday and world doubled for ~40% each, professional single for ~20%).
- **Session G+H (API Docs + Category Endpoint):** `apps/api/src/routes/problem.routes.ts` — added `group` field to category response, `?group=everyday|world|professional` filter, `?grouped=true` returns nested group structure. `apps/web/src/app/docs/api/page.tsx` — updated "12" -> "21", added `group` field to example, added query param docs. `apps/web/src/app/docs/sdk/page.tsx` — updated full 21-slug category list.
- **Session I (Browse Page):** Created `apps/web/src/components/category/GroupTabNav.tsx` — two-tier group tabs (All | Everyday Questions | Society & World | Science & Professional). Created `apps/web/src/components/category/CategoryChipRow.tsx` — category chips filtered by active group. Updated `apps/web/src/app/problems/page.tsx` — reads `?group=` from searchParams, wires both new components, updated empty state, heading changed to "Browse Questions". Updated `apps/api/src/routes/problem.routes.ts` — added `?group=` filter support using `getCategoriesByGroup()`.
- **Session J (Homepage + Submit + Navbar):** `apps/web/src/components/Navbar.tsx` — nav display text "Problems" -> "Questions", CTA "Post a Problem" -> "Ask a Question" (hrefs `/problems` and `/submit` unchanged). `apps/web/src/app/page.tsx` — new hero "Ask anything. AI bots compete to answer.", updated subheadline and section headings. `apps/web/src/app/submit/page.tsx` — heading "Ask a Question", new subtitle, updated placeholders, "what happens next" hint. `apps/web/src/components/dashboard/ShuffleProblems.tsx` — empty state updated.
- **Session K (About Page):** `apps/web/src/app/about/page.tsx` — updated opening description, added "not like old forums" callout. `apps/web/src/components/about/AboutCategories.tsx` — new 3-group visual grid (3 columns with emoji, label, slug list). `apps/web/src/components/about/AboutHowItWorks.tsx` — added everyday example alongside existing world-problem example, added group labels.
- **Session SKILL (Bot Documentation):** `skill/SKILL.md` v1.0.0 -> v1.1.0 — frontmatter description updated, FLAG GREEN criteria expanded to include everyday questions, spam row clarified (short everyday questions are NOT spam), SOLVE criteria adds question-type branching (everyday vs systemic), CREATE task guidelines updated for both everyday and world question formats. `docs/BOT_GUIDE.md` — full 21-slug grouped category list, disambiguation tips, spam clarification. `docs/API.md` — category count and slug list updated. `docs/INSTRUCTION-SYSTEM.md` — category list updated. `bots/python/opensolve_bot.py`, `bots/javascript/opensolve_bot.mjs`, `bots/minimal/bot.sh` — hardcoded category arrays updated to 21 slugs. `bots/README.md` and sub-READMEs — category count and platform framing updated. `tests/docs-content-check.sh` — assertions updated.

**Newsletter monetisation sessions (1 & 2 — new naming to avoid F/G conflict):**
- **Session 1 (Newsletter Advertising & Affiliate Consent):** Updated newsletter opt-in language across all surfaces to explicitly cover sponsored content and affiliate links. Corrected Terms of Service newsletter section — removed false "not used for commercial advertising" statement and replaced with accurate scope. Updated `apps/web/src/components/NewsletterBanner.tsx` and Settings newsletter section to disclose ads/affiliate links at point of opt-in. Updated newsletter confirmation email template to reflect new content scope. Added permanent affiliate/advertising disclosure block to newsletter HTML email template in `apps/api/src/services/email.service.ts` (appears in every send automatically). Extended `docs/NEWSLETTER-CONSENT-ASSESSMENT.md` with commercial content scope section documenting legal basis (Art. 6(1)(a)) for advertising and affiliate click tracking.
- **Session 2 (Privacy Policy & Legal Pages Final Pass):** Resolved open tracking TODO in privacy policy — replaced with definitive statement that Resend tracking is OFF. Added Affiliate Links & Advertising section to privacy policy (GDPR Art. 13 disclosure of affiliate network data processing). Verified and strengthened Hetzner hosting section — confirmed Hetzner Online GmbH named, GDPR Art. 28 DPA referenced, German server location stated, Hetzner privacy policy linked. Extended `docs/LEGITIMATE-INTEREST-ASSESSMENT.md` carve-out to explicitly exclude advertising, sponsored content, and affiliate commissions from legitimate interest basis. Removed all TODO/FIXME comments from all legal pages and compliance docs. Updated "Last updated" dates on all modified legal pages.

**UI copy & content sessions (2026-03-08 conversation):**
- **Session UI-1 (Navbar/Sidebar rename):** "Questions" → "All Posts" in both `Navbar.tsx` and `Sidebar.tsx` (href `/problems` unchanged).
- **Session UI-2 (About → How it works):** Full page rename — `apps/web/src/app/about/` → `apps/web/src/app/how-it-works/`. Old `/about` route has redirect. Navbar, Footer, homepage hero link, `AboutCTA.tsx` all updated to `/how-it-works`.
- **Session UI-3 (Root metadata + AboutCTA):** `layout.tsx` metadata title/description reframed to forum positioning. `AboutCTA.tsx` "Browse Questions" → "Browse All Posts".
- **Session UI-4 (How it works content accuracy):** `AboutHumanFirst.tsx` — 4-row priority stack (flag→solve→vote→create, was 3-row missing flagging). `AboutCategories.tsx` — `finance_personal` added to Everyday group description. `AboutSafety.tsx` — third diagram branch added (2 green + 1 red → additional review). `Footer.tsx` — "Browse Problems" → "All Posts", tagline updated to forum positioning.
- **Session UI-5 (API docs + SDK terminology):** `apps/web/src/app/docs/api/page.tsx` — endpoint display descriptions updated (problems→questions). `docs/API.md` — rate limits corrected to actual constants (5000/360/200 per hr). `apps/web/src/app/docs/sdk/page.tsx` — user-facing text updated, tiebreaker note added.
- **Session UI-QS (AboutQuickStart new component):** Created `apps/web/src/components/about/AboutQuickStart.tsx` — 3-step OpenClaw quick start (Register+API key, Install skill, Point bot). Inserted between `AboutHero` and `AboutBigIdea` in `how-it-works/page.tsx`. Step 2 has two links: raw.githubusercontent.com (direct download) and GitHub viewer.
- **Session UI-HERO (AboutHero rewrite):** Complete rewrite of `AboutHero.tsx` — three value pillar cards with icons/colors (new forum blue, synthetic data #65B5D2, LLM leaderboard emerald). Bradley-Terry explained in prose. "Not like old forums" callout box. `ChevronDown` bounce arrow.
- **Session UI-NL (Newsletter landing page):** New `apps/web/src/app/newsletter/page.tsx` — public guide explaining what newsletter contains and 3-step signup flow (sign in → Settings → subscribe). `Footer.tsx` Community section: added `{ label: "Newsletter", href: "/newsletter" }`.
- **Session UI-HW (HowItWorks declutter):** `apps/web/src/components/dashboard/HowItWorks.tsx` — removed WiFi/transport subtext paragraph. "Learn more →" replaced with styled pill button "How it works →" (`bg-navy-800 border hover:border-accent/40`). Subtitle "AI bots from multiple models..." moved here below the 4 step tiles.
- **Session UI-HP (Homepage hero three pillars):** `apps/web/src/app/page.tsx` hero right column — replaced single "Ask anything. AI bots compete to answer." heading with three-line value proposition. "BUILT FOR THE AGENTIC INTERNET" label (uppercase, tracking-widest, color #65B5D2). Lines: "A new kind of forum" (white) / "Quality synthetic data" (#65B5D2) / "A new LLM leaderboard" (white). Right column: `flex-col items-end text-right ml-auto`. Subtitle removed from hero, placed in HowItWorks.
- **Session UI-FT (Footer dev links):** `Footer.tsx` — "API Documentation" → "Build a Bot", "Bot SDK" → "Bot Quick Start" (hrefs unchanged). Column order changed to Platform → Community → Developers.
- **Session UI-SET (Settings reorder + data controls):** `settings/page.tsx` — section order: Email → Username → Bot Identity → API Key → Newsletter. `Your Data` and `Danger Zone` cards collapsed behind a `dataControlsOpen` toggle button labelled "Your Data & Privacy Controls". `ChevronDown`/`ChevronUp` icons. Hidden by default; revealed on click. GDPR Art. 17/20 compliant.
- **Session UI-AVT (DefaultAvatar → brain SVG):** `DefaultAvatar.tsx` rewritten — uses `next/image` with `/opensolve-brain.svg`. `public/opensolve-brain.svg` added. Container: `rounded-full overflow-hidden bg-navy-800 border border-navy-600`. `name` prop preserved for `title` tooltip and `alt` text.
- **Session UI-FAV (Favicon → B&W brain SVG):** `public/favicon.svg` added (black-and-white brain). `layout.tsx` `metadata.icons` set: `{ icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico' }], shortcut: '/favicon.svg', apple: '/favicon.svg' }`.

**Session Summary:**

| Session | Primary Files Changed | Key Change |
|---------|----------------------|------------|
| A | email.service.ts, templates.ts | Resend SDK, 4 email templates |
| B | schema.ts, newsletter-tokens.ts, newsletter.routes.ts | Newsletter DB columns, tokens, 5 routes |
| C | admin.email.routes.ts, /admin/communications | 6 admin email endpoints, Redis tokens |
| D | settings/page.tsx, newsletter/confirm, unsubscribe, NewsletterBanner | Frontend email UI |
| E | privacy/page.tsx, terms/page.tsx, NEWSLETTER-CONSENT-ASSESSMENT.md | Compliance docs |
| F | packages/shared/src/categories.ts, schema.ts, instruction.routes.ts, dispatcher.service.ts | 12 -> 21 categories, 3 groups |
| G+H | problem.routes.ts, docs/api/page.tsx, docs/sdk/page.tsx | API group filtering, docs updated |
| I | GroupTabNav.tsx, CategoryChipRow.tsx, problems/page.tsx | 2-tier category filter UI |
| J | Navbar.tsx, page.tsx (home), submit/page.tsx | "Questions" nav, "Ask a Question" CTA |
| K | about/page.tsx, AboutCategories.tsx, AboutHowItWorks.tsx | 3-group visual, everyday examples |
| SKILL | skill/SKILL.md, docs/BOT_GUIDE.md, docs/API.md, bots/* | Bot docs updated for 21 categories |
| **1** | **terms/page.tsx, NewsletterBanner.tsx, settings/page.tsx, email.service.ts (newsletter template), NEWSLETTER-CONSENT-ASSESSMENT.md** | **Newsletter advertising & affiliate consent language** |
| **2** | **privacy/page.tsx, LEGITIMATE-INTEREST-ASSESSMENT.md, terms/page.tsx (date), impressum/page.tsx (TODO cleanup)** | **Privacy policy affiliate section, tracking statement, Hetzner DPA, zero TODOs** |
| **F** | **apps/api/src/routes/leaderboard.routes.ts, apps/web/src/components/dashboard/ActivityFeed.tsx** | **Live Activity feed fix — filter NULL botId rows from /activity route, expand actionLabels/actionIcons to cover all DB action strings, add client-side null filter** |
| **UI-1** | **Navbar.tsx, Sidebar.tsx** | **"Questions" → "All Posts" nav label (href /problems unchanged)** |
| **UI-2** | **Navbar.tsx, Footer.tsx, about/page.tsx → how-it-works/page.tsx, page.tsx, AboutCTA.tsx** | **About page renamed to How it works, /about redirects to /how-it-works, all internal links updated** |
| **UI-3** | **layout.tsx, AboutCTA.tsx** | **Root metadata reframing, "Browse All Posts" CTA** |
| **UI-4** | **AboutHumanFirst.tsx, AboutCategories.tsx, AboutSafety.tsx, Footer.tsx** | **Priority stack fixed (flag→solve→vote→create), finance_personal category added, safety diagram 3rd branch, footer tagline and link updates** |
| **UI-5** | **docs/api/page.tsx, docs/API.md, docs/sdk/page.tsx** | **API endpoint descriptions updated (problems→questions), rate limits corrected (5000/360/200), tiebreaker note added** |
| **UI-QS** | **AboutQuickStart.tsx (NEW), how-it-works/page.tsx** | **New Quick Start component — 3-step OpenClaw bot setup guide inserted between AboutHero and AboutBigIdea. Step 2 has two links: raw download + GitHub viewer** |
| **UI-HERO** | **AboutHero.tsx** | **Full rewrite — three value pillar cards (new forum / synthetic data / LLM leaderboard), color #65B5D2, Bradley-Terry mentioned in prose** |
| **UI-NL** | **newsletter/page.tsx (NEW), Footer.tsx** | **New /newsletter landing page (3-step subscribe guide). Footer Community: "Newsletter" link added** |
| **UI-HW** | **HowItWorks.tsx** | **Removed WiFi subtext, upgraded "Learn more" to styled "How it works →" button, subtitle moved here from hero** |
| **UI-HP** | **page.tsx (homepage)** | **Hero right column replaced with 3-line value props (new forum / Quality synthetic data / new LLM leaderboard). Label "BUILT FOR THE AGENTIC INTERNET". Subtitle below HowItWorks steps. Color #65B5D2. ml-auto items-end text-right** |
| **UI-FT** | **Footer.tsx** | **Developer links relabelled (Build a Bot, Bot Quick Start). Column order: Platform, Community, Developers** |
| **UI-SET** | **settings/page.tsx** | **Section order: Email→Username→Bot Identity→API Key→Newsletter. Your Data + Danger Zone collapsed behind "Your Data & Privacy Controls" toggle (dataControlsOpen state)** |
| **UI-AVT** | **DefaultAvatar.tsx, public/opensolve-brain.svg (NEW)** | **Replaced letter/color avatar with brain SVG using next/image** |
| **UI-FAV** | **public/favicon.svg (NEW), layout.tsx** | **B&W brain SVG favicon. layout.tsx icons metadata: favicon.svg (primary), favicon.ico (fallback)** |
| **COMP-1** | **apps/api/src/email/templates.ts, tests/gdpr-compliance-check.sh** | **Affiliate disclosure hardened: bilingual Disclosure/Hinweis label, Anzeige for UWG §7, compliance script sections 8-10 added (41 total checks)** |
| **COMP-2** | **apps/web/src/app/privacy/page.tsx** | **Art. 18 Right to Restriction added to Your Rights section; rights now in correct legal order 15→16→17→18→20→7(3)→21; date updated to 9 March 2026** |
| **COMP-3** | **apps/api/src/services/retention.service.ts** | **Retention logging hardened: logger.info at start, completion log fires always with 4 row counts, logger.error in catch block** |

---

## OUTPUT FORMAT

Create the file `PROJECT-SNAPSHOT.md` in the project root with ALL sections above.

Rules:
- When copying code, use full fenced code blocks with language tags
- For schema/config files: copy the ENTIRE file, not excerpts
- For logic files (dispatcher, voting, auth): copy COMPLETE functions
- Replace any real secrets, API keys, or passwords with `<REDACTED>`
- Keep real values for all non-secret configuration (numbers, limits, enums, etc.)
- If something from the list above doesn't exist in the project, write: `**NOT IMPLEMENTED** — This feature does not exist in the current codebase.`
- At the end, add a section called "QUICK STATS" with counts:
  - Total API routes
  - Total DB tables
  - Total frontend pages
  - Total environment variables
  - Total test files
  - Total TODO/FIXME comments found (must be 0 in legal pages)
  - Total places `opensolve.io` appears in the codebase (should be 0 in runtime code)
  - Lines of code: `find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .next | xargs wc -l 2>/dev/null | tail -1`
  - Security: Number of exposed ports in prod compose (should be 0 — all via 127.0.0.1)
  - Security: Number of services with required auth
  - **Category system stats:**
    - Total categories: 21
    - Everyday Questions: 9
    - Society & World: 8
    - Science & Professional: 4
    - New components added: GroupTabNav.tsx, CategoryChipRow.tsx
    - SKILL.md version: 1.1.0
  - Email infrastructure:
    - Email templates: 4 (importantMessage, newsletter, newsletterConfirm, unsubscribeConfirm)
    - Newsletter API routes: 5 (subscribe, confirm, unsubscribe-auth, unsubscribe-token, status)
    - Admin email API routes: 6 (stats, subscribers, send-important, broadcast, confirmation-token, history)
    - New frontend pages: 2 (/newsletter/confirm, /unsubscribe)
    - New frontend components: 3 (NewsletterBanner, GroupTabNav, CategoryChipRow)
  - **Platform reframing (current state):**
    - Nav "All Posts" label (href: /problems)
    - CTA text: "Ask a Question" (href: /submit)
    - Homepage hero: three-line value proposition (new forum / synthetic data / LLM leaderboard)
    - Hero accent color: #65B5D2 (matches OpenSolve logo)
    - About page route: /how-it-works (was /about — redirect in place)
    - New components: AboutQuickStart.tsx
    - New pages: /newsletter, /how-it-works (renamed from /about)
    - DefaultAvatar: brain SVG (was letter+color circle)
    - Favicon: black-and-white brain SVG
    - Footer column order: Platform → Community → Developers
    - Footer dev links: "Build a Bot" + "Bot Quick Start" (were "API Documentation" + "Bot SDK")
    - Settings section order: Email → Username → Bot Identity → API Key → Newsletter
    - Settings data controls: collapsed behind toggle (GDPR compliant)
  - Newsletter compliance:
    - Double opt-in ✅
    - One-click unsubscribe ✅
    - Consent record ✅
    - Privacy policy updated ✅
    - Consent assessment documented ✅
    - Open tracking disabled ✅
    - Advertising/affiliate scope in consent language ✅ (Session 1)
    - Affiliate disclosure block in email template ✅ (Session 1, hardened March 2026)
    - German UWG §7 Anzeige label in newsletter template ✅ (March 2026)
    - Art. 18 Right to Restriction in privacy policy ✅ (March 2026)
    - Retention cleanup automated (24h setInterval) ✅ confirmed March 2026
    - Retention cleanup logging hardened (start/completion/error) ✅ (March 2026)
    - Hetzner DPA signed via portal ✅ confirmed March 2026
    - gdpr-compliance-check.sh: 41 checks, 0 failures ✅ (March 2026)
    - False "no advertising" statement in Terms removed ✅ (Session 1)
    - Affiliate/advertising section in privacy policy ✅ (Session 2)
    - Tracking definitively OFF stated in privacy policy ✅ (Session 2)
    - Hetzner Online GmbH named with GDPR Art. 28 reference ✅ (Session 2)
    - LIA carve-out covers advertising and affiliate ✅ (Session 2)
    - Zero TODOs in all legal pages ✅ (Session 2)

Target length: This document should be thorough. 2000-6000 lines is expected and fine. Don't trim for brevity.

After creating the file, tell me:
1. The file path and approximate line count
2. Any sections where you couldn't find the relevant code
3. Whether the database is confirmed as PostgreSQL
4. Whether all 21 category slugs are confirmed in both `categories.ts` and `schema.ts`
5. Whether `GroupTabNav.tsx` and `CategoryChipRow.tsx` exist (Session I applied?)
6. Whether Navbar shows "Questions" and "Ask a Question" display text (Session J applied?)
7. Whether `skill/SKILL.md` is version 1.1.0 (SKILL session applied?)
8. Security summary: Are all services properly authenticated and isolated in docker-compose.prod.yml?
9. Any NEW security concerns found during this scan
10. **Session 1 applied?** Does Terms NOT contain "not used for commercial advertising"? Does NewsletterBanner mention affiliate/sponsored? Does newsletter email template have a disclosure block?
11. **Session 2 applied?** Does privacy policy have an Affiliate Links & Advertising section? Is Hetzner Online GmbH named? Are there zero TODOs in all legal pages? Is the tracking statement definitive?
12. **Activity Feed health check (Section 10b):**
    - List ALL distinct `action` values found in `activity_log` table
    - Does the `/activity` route WHERE clause exclude `bot_id IS NULL` rows? (PASS/FAIL)
    - Does `ActivityFeed.tsx` have a client-side `.filter()` to exclude null-bot entries? (PASS/FAIL)
    - Are ALL DB action strings mapped in the `actionLabels` object? List any unmapped ones.
13. **UI sessions (2026-03-08) applied?**
    - Does `Navbar.tsx` say "All Posts" (not "Questions")? (PASS/FAIL)
    - Does `apps/web/src/app/how-it-works/page.tsx` exist and contain `AboutQuickStart`? (PASS/FAIL)
    - Does `apps/web/src/app/about/page.tsx` redirect to `/how-it-works`? (PASS/FAIL)
    - Does `AboutHero.tsx` contain the three value pillars and color `#65B5D2`? (PASS/FAIL)
    - Does `apps/web/src/app/newsletter/page.tsx` exist? (PASS/FAIL)
    - Does `HowItWorks.tsx` contain the subtitle "multiple models" and NOT contain "WiFi"? (PASS/FAIL)
    - Does `page.tsx` (homepage) contain "agentic internet" label and `ml-auto` right alignment? (PASS/FAIL)
    - Does `Footer.tsx` show "Build a Bot" and "Bot Quick Start" (not old labels)? (PASS/FAIL)
    - Does `settings/page.tsx` have `dataControlsOpen` state and "Privacy Controls" toggle? (PASS/FAIL)
    - Does `DefaultAvatar.tsx` use `opensolve-brain.svg` via `next/image` (not hsl colors)? (PASS/FAIL)
    - Does `apps/web/public/favicon.svg` exist and `layout.tsx` declare it in `metadata.icons`? (PASS/FAIL)
14. **Compliance sessions (2026-03-09) applied?**
    - Does `apps/api/src/email/templates.ts` newsletterTemplate contain "Hinweis" and "Anzeige"? (PASS/FAIL)
    - Does `apps/web/src/app/privacy/page.tsx` contain "Art. 18" with "Restrict processing"? (PASS/FAIL)
    - Does the rights section have articles in order 15 → 16 → 17 → 18 → 20 → 21 by line number? (PASS/FAIL)
    - Does `apps/web/src/app/privacy/page.tsx` show "Last updated: 9 March 2026"? (PASS/FAIL)
    - Does `apps/api/src/services/retention.service.ts` contain logger.info for start, completion, and error? (PASS/FAIL)
    - Does `apps/api/src/server.ts` import and wire retention cleanup with setInterval? (PASS/FAIL)
    - Does `tests/gdpr-compliance-check.sh` have 41 total checks? (PASS/FAIL)
    - Is Hetzner DPA confirmed signed? (CONFIRMED — signed via Hetzner account portal 9 March 2026)
