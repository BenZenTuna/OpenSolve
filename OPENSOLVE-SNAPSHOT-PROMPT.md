# CLAUDE CODE PROMPT â€” OpenSolve Full Project Snapshot
# Paste this entire prompt into Claude Code while in your OpenSolve project directory

---

I need you to scan my entire OpenSolve project and generate a single comprehensive Markdown document called `PROJECT-SNAPSHOT.md` that I can share with an external AI assistant for help. This document must contain everything someone would need to understand the current state of the platform WITHOUT access to the repo.

Do NOT skip anything. Do NOT summarize with "and more..." â€” be exhaustive.

---

## What to include in PROJECT-SNAPSHOT.md:

### SECTION 0: PROJECT OVERVIEW & PRODUCT LOGIC

**Big Picture:**
- What is OpenSolve? Write a clear one-paragraph description a non-technical person could understand.
- OpenSolve.io is an "AI Arena for Problem Solving" â€” humans post real-world problems, AI bots compete to solve them, solutions are judged head-to-head, and rankings emerge via mathematical scoring.
- It is inspired by the OpenClaw / Moltbook ecosystem â€” the same kind of autonomous AI bots that operate on Moltbook can be pointed at OpenSolve to do useful problem-solving work instead of just social posting.
- Confirm or correct the above description based on what the codebase actually does.

**Who are the users? Describe EACH role:**
- Human users — registration is via Google OAuth only (email stored as mandatory field). What can they do? post problems? vote? view?
- AI bots/agents (how do they register? how do they receive tasks? what do they submit?)
- Admins (what controls exist?)
- Any other roles found in the code

**Core Workflow â€” walk through the full lifecycle:**
- What happens when a human user first arrives at the site?
- How does someone post a problem?
- How does an AI bot discover and claim a problem to solve?
- How does a bot submit a solution?
- How are solutions evaluated? (head-to-head, voting, scoring?)
- How do rankings/leaderboards get updated?
- What is the "end state" â€” when is a problem considered solved?

**User Journeys â€” step by step for each user type:**
- Human user: Google OAuth signup (email captured) â†’ onboarding (username) â†’ what they see â†’ what actions they take â†’ what outcome they get
- AI bot/agent: registration â†’ authentication â†’ receiving tasks â†’ submitting work â†’ getting scored
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
- Problem, Solution, Task, Vote, Flag, Dispatch, Bot, Agent, Arena, Round, Match, Comparison, Score, Rating, etc.
- How do these concepts relate to each other? (e.g., "A Problem has many Solutions, Solutions are compared in Votes, Votes update Scores")

**Key Business Rules:**
Document rules that govern how the platform behaves. Look for things like:
- Can a bot submit multiple solutions to the same problem?
- How many comparisons happen before a score is considered stable?
- Are there cooldown periods between submissions?
- Who can create problems? Who can vote?
- Any rules about bot behavior, rate limits, fair play?
- Anything that isn't obvious from the code alone

---

### SECTION 1: PROJECT STRUCTURE
- Run `tree -L 4 -I 'node_modules|.next|.git|dist|build'` showing the full directory structure
- List the main folders and explain what each contains
- Show the COMPLETE contents of `package.json` (dependencies, scripts, etc.)
- Show `.env.example` or `.env.local` structure (variable NAMES only, not values â€” replace actual secrets with `<REDACTED>`)
- Note the framework (Next.js version?), language (TypeScript?), and hosting setup
- Show the contents of `next.config.js` or `next.config.mjs` if it exists
- Show `tsconfig.json` if it exists
- Show `docker-compose.yml` or `Dockerfile` or `coolify.json` or any deployment config
- Show `.claude/commands/` directory if it exists â€” especially look for a `save.md` file or any custom slash commands (I use `/save` to commit and push to GitHub â€” document exactly what that command does)

### SECTION 2: DATABASE SCHEMA
- Find and copy the COMPLETE database schema
- Check for: Prisma schema (`schema.prisma`), Drizzle schema, SQL migrations, Supabase schema, raw SQL files
- Include EVERY table, EVERY column, EVERY type, EVERY enum, EVERY relation
- If using Prisma, copy the entire `schema.prisma` file content
- If using raw SQL or migrations, copy ALL migration files
- If using Supabase, check for any RLS policies and include them
- **CONFIRM: Is the database PostgreSQL?** Check docker-compose, .env, connection strings, or ORM config
- Document the database connection setup (where is the DB hosted? inside Coolify? external?)
- List any seed data or initial data scripts
- **Verify the `users` table has an `email` column** (varchar 255, NOT NULL, unique index `users_email_idx`)
  - **Verify newsletter subscription columns exist on `users` table:**
```bash
    echo "=== Newsletter columns in schema ==="
    grep -n "newsletter" apps/api/src/db/schema.ts
    echo "↑ Should show: newsletterSubscribed (bool), newsletterSubscribedAt (timestamptz),"
    echo "  newsletterConsentIp (varchar 45), newsletterConsentMethod (varchar 50),"
    echo "  newsletterUnsubscribeToken (varchar 128, unique)"

    echo ""
    echo "=== Newsletter migration SQL exists ==="
    ls -la apps/api/drizzle/migrations/newsletter_subscription.sql 2>/dev/null \
      && echo "✅ Exists" || echo "❌ Missing"
```
- **Verify the `oauth_provider` enum is `['google']` only** (Twitter removed)

### SECTION 3: API ROUTES â€” COMPLETE LIST
- Find EVERY API route/endpoint in the project
- For EACH route, document:
  - HTTP method + path (e.g., `POST /api/v1/tasks/submit`)
  - What it does (read the handler code)
  - What parameters/body it expects (with types)
  - What it returns (response shape)
  - Any middleware applied (auth, rate limiting, validation)
  - Error responses
- Check these locations: `/app/api/`, `/pages/api/`, `/src/routes/`, `/routes/`, `/server/`, `/api/`
- Group them logically (Auth routes, Bot routes, Problem routes, Voting routes,
    Admin routes, Newsletter routes, Admin Email routes, etc.)

```bash
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

### SECTION 4: AUTHENTICATION & AUTHORIZATION
- Document the COMPLETE auth setup:
  - Google OAuth configuration (Google-only; Twitter/X removed) — client ID setup, callback URLs, scopes
  - Any other auth providers
- How do human users log in? Copy the auth configuration code (NextAuth config, Supabase auth, custom JWT, etc.)
- How do bots authenticate? (API key flow, OAuth, tokens?)
- Copy the ENTIRE auth configuration file(s)
- How are API keys generated and validated? Copy the code
- Session/token expiry settings
- Any admin role checking logic
- Copy ALL auth middleware files completely
- **OAuth cookie security:** Document that the Google OAuth state cookie is signed (`signed: true`) and scoped to `/api/v1/auth`. Twitter OAuth has been removed.

**Email storage verification:**
```bash
echo "=== Email column in schema ==="
grep -n "email" apps/api/src/db/schema.ts | head -5
echo "↑ Should show email varchar(255) NOT NULL + uniqueIndex"

echo ""
echo "=== OAuth provider enum ==="
grep "oauthProviderEnum" apps/api/src/db/schema.ts
echo "↑ Should show ['google'] only (no twitter)"

echo ""
echo "=== Email stored in Google callback ==="
grep -n "email" apps/api/src/routes/auth.routes.ts | grep -v "//" | head -10
echo "↑ Should show email being stored and returned"

echo ""
echo "=== Email in /auth/me response ==="
grep -A15 "auth/me" apps/api/src/routes/auth.routes.ts | grep "email"
echo "↑ Should show email in response object"

echo ""
echo "=== No Twitter routes ==="
grep -c "auth/twitter" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 0"
```

- **IMPORTANT**: The platform currently uses `opensolve.io` as the domain in auth callbacks and all code. Document EVERY place where `opensolve.io` appears in the codebase (file + line number) because we will need to migrate to `opensolve.ai`
  - Run: `grep -rn "opensolve\.io" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.env*" --include="*.yml" --include="*.yaml" --include="*.toml" --include="*.md" .`
  - List every match with file path and line number

### SECTION 5: DISPATCHER / TASK ASSIGNMENT
- Find the dispatcher or task assignment logic (how bots get assigned problems to solve)
- Copy the ENTIRE dispatcher function/file â€” do not summarize
- Document the priority order for task assignment
- Find any queue system (BullMQ, database-based queue, etc.)
- Find load balancing rules, traffic caps, priority weights
- How does a bot request a new task? What endpoint? What does it receive?
- If this doesn't exist, note: **NOT IMPLEMENTED**

### SECTION 6: VOTING / RANKING ENGINE
- Find the Bradley-Terry, Elo, or any scoring/ranking implementation
- Copy the COMPLETE scoring algorithm code
- Document: starting score, K-factor, update formula, pair selection strategy
- Find convergence checks or confidence interval calculations
- What payload do voting bots receive when asked to compare solutions?
- How are head-to-head matchups selected? Random? Swiss-system? Other?
- Copy the leaderboard calculation logic
- If this doesn't exist or is partial, note what IS implemented vs what's missing

### SECTION 7: CONTENT MODERATION
- Find the flagging/moderation system
- Copy the moderation logic code
- Document state transitions (pending â†’ approved â†’ rejected, etc.)
- Thresholds: how many flags to approve/reject
- Anti-gaming measures (owner diversity, weight decay, etc.)
- If this doesn't exist, note: **NOT IMPLEMENTED**

### SECTION 8: ALL CONSTANTS, LIMITS & CONFIGURATION
This is critical â€” find EVERY hardcoded value, config constant, and limit. Search for:
- Rate limits (API calls per hour/minute)
- Character/length limits (solution text, problem title, etc.)
- Token budgets
- Timeout values
- Point values (gamification)
- Threshold values (flag counts, comparison targets, etc.)
- Traffic caps and percentages
- Scoring constants (starting Elo, K-factor, etc.)
- Pagination defaults
- Any numbers that control platform behavior

For each one, document:
- The variable name
- The current value
- Which file it's defined in (with line number)
- What it controls

Run these searches to find them:
```bash
grep -rn "const.*=.*[0-9]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" src/ app/ lib/ 2>/dev/null
grep -rn "LIMIT\|MAX\|MIN\|RATE\|TIMEOUT\|THRESHOLD\|TARGET\|POINTS\|SCORE\|WEIGHT\|CAP\|DEFAULT\|INITIAL\|K_FACTOR\|ELO" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.env*" . 2>/dev/null
```

### SECTION 9: MIDDLEWARE & SECURITY
- Copy ALL middleware files completely
- Rate limiting implementation (how is it done? In-memory? Redis? Database?)
- Input validation/sanitization
- CORS configuration
- Any security headers or protections
- Prompt injection defenses (important for a platform where bots submit content!)
- Bot verification (how do we know a bot is who it claims to be?)

### SECTION 10: FRONTEND PAGES & COMPONENTS
- List ALL pages/routes in the frontend (file-based routing structure)
- **Newsletter and email-related frontend pages added in Session D:**
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

    echo ""
    echo "=== Confirm and unsubscribe pages are noindex ==="
    grep -c "noindex" apps/web/src/app/newsletter/confirm/page.tsx 2>/dev/null
    grep -c "noindex" apps/web/src/app/unsubscribe/page.tsx 2>/dev/null
    echo "↑ Both should be 1"
```

    Copy the COMPLETE contents of:
    - apps/web/src/app/newsletter/confirm/page.tsx
    - apps/web/src/app/unsubscribe/page.tsx
    - apps/web/src/components/NewsletterBanner.tsx
    - apps/web/src/app/admin/communications/page.tsx

    Also copy these compliance documents in full:
    - docs/NEWSLETTER-CONSENT-ASSESSMENT.md
    - docs/LEGITIMATE-INTEREST-ASSESSMENT.md (to capture the carve-out addition)

    Also document the newsletter section added to the settings page:
```bash
    echo "=== Newsletter section in settings ==="
    grep -n "newsletter\|Newsletter" apps/web/src/app/settings/page.tsx | head -20
    echo "↑ Should show: status fetch, subscribe/unsubscribe handlers, 4 UI states"
```
- For each page, describe: what it shows, what data it fetches, key user actions
- Note which pages are public vs authenticated
- Note any real-time features (WebSocket, SSE, polling)
- List key reusable components and what they do
- What CSS/styling framework is used? (Tailwind? CSS Modules? styled-components?)
- Any state management? (Zustand, Redux, React Context, etc.)

### SECTION 11: EXTERNAL SERVICES & INTEGRATIONS
- What external services are used?
  - **Hosting**: Hetzner server with Coolify â€” document the Coolify configuration
  - **Database**: Confirm PostgreSQL â€” is it inside Coolify? Separate service?
  - **Authentication**: Google OAuth only (Twitter/X removed) â€” document provider setup
  - **Resend domain verification**: Document whether opensolve.ai domain is verified
    in Resend for sending from noreply@mail.opensolve.ai
    - Check: does docs/RESEND-SETUP.md exist?
    - Run: ls -la docs/RESEND-SETUP.md 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"
  - **Email delivery**: Resend (resend.com) — document the email service setup
    - Is apps/api/src/services/email.service.ts present?
    - Is apps/api/src/email/templates.ts present?
    - What methods does EmailService expose? (sendImportantMessage, sendNewsletterBroadcast,
      sendNewsletterConfirm, sendUnsubscribeConfirm)
    - What templates exist? (importantMessageTemplate, newsletterTemplate,
      newsletterConfirmTemplate, unsubscribeConfirmTemplate)
    - What from-address is configured? (RESEND_FROM_EMAIL env var)
    - Run: grep -n "RESEND\|resend" apps/api/src/services/email.service.ts | head -20
  - **Any others**: Redis (rate limiting + admin confirmation tokens), CDN, etc.
- GitHub integration â€” document how the repo is connected to deployment
  - Does Coolify auto-deploy on push? What branch?
  - Show the git remote configuration
- Any background job processing (cron jobs, scheduled tasks)
- Any third-party APIs integrated

### SECTION 11b: EMAIL INFRASTRUCTURE

Document the complete email sending infrastructure added in Sessions A–D.

**EmailService (apps/api/src/services/email.service.ts):**
```bash
echo "=== EmailService methods ==="
grep -n "async\|public\|private" apps/api/src/services/email.service.ts | head -30

echo ""
echo "=== Resend SDK import ==="
grep -n "resend\|Resend" apps/api/src/services/email.service.ts | head -5

echo ""
echo "=== Error handling pattern ==="
grep -n "catch\|try\|error" apps/api/src/services/email.service.ts | head -10

echo ""
echo "=== Rate limit between sends (50ms delay) ==="
grep -n "sleep\|delay\|setTimeout\|50" apps/api/src/services/email.service.ts | head -5
```

Copy the COMPLETE apps/api/src/services/email.service.ts file.

**Email Templates (apps/api/src/email/templates.ts):**
```bash
echo "=== Template exports ==="
grep -n "export function\|export const" apps/api/src/email/templates.ts
echo "↑ Expected: importantMessageTemplate, newsletterTemplate,"
echo "  newsletterConfirmTemplate, unsubscribeConfirmTemplate"
```

Copy the COMPLETE apps/api/src/email/templates.ts file.

**Newsletter Token Utilities (apps/api/src/utils/newsletter-tokens.ts):**
Copy the COMPLETE apps/api/src/utils/newsletter-tokens.ts file.

**Newsletter Routes (apps/api/src/routes/newsletter.routes.ts):**
Copy the COMPLETE apps/api/src/routes/newsletter.routes.ts file.

**Admin Email Routes (apps/api/src/routes/admin.email.routes.ts):**
Copy the COMPLETE apps/api/src/routes/admin.email.routes.ts file.

**Redis usage for admin confirmation tokens:**
```bash
echo "=== Admin token Redis keys ==="
grep -n "admin:email:confirm" apps/api/src/routes/admin.email.routes.ts
echo "↑ Should show Redis set/get/del for one-time confirmation tokens"

echo ""
echo "=== Token TTL ==="
grep -n "600\|EX\|expire\|ttl" apps/api/src/routes/admin.email.routes.ts | head -5
echo "↑ Should show 600 second (10 minute) TTL"
```

**RESEND-SETUP.md:**
Copy the COMPLETE docs/RESEND-SETUP.md file.

---

### SECTION 12: DEPLOYMENT & INFRASTRUCTURE DETAILS
- **Coolify setup**: What does the Coolify deployment configuration look like?
  - Show any `docker-compose.yml`, `Dockerfile`, or Coolify-specific config files
  - Environment variables set in Coolify (names only, values as `<REDACTED>`)
  - **Email-related environment variables added in Sessions A–D:**
```bash
    echo "=== Resend env vars in .env.example ==="
    grep -n "RESEND\|APP_BASE_URL\|FROM_EMAIL\|FROM_NAME" apps/api/.env.example

    echo ""
    echo "=== Resend vars in docker-compose.prod.yml ==="
    grep -n "RESEND\|APP_BASE_URL" docker-compose.prod.yml
```
    Variables that must be present:
    - RESEND_API_KEY — Resend API key (sending access only), stored as Coolify secret
    - RESEND_FROM_EMAIL — noreply@mail.opensolve.ai
    - RESEND_FROM_NAME — OpenSolve
    - APP_BASE_URL — https://www.opensolve.ai (used to build confirm/unsubscribe URLs)
  - Build commands and start commands
  - Resource limits, health checks
- **Domain configuration**:
  - Current domain: `opensolve.io`
  - Future domain: `opensolve.ai`
  - Document ALL places the domain appears (see Section 4 grep command)
  - SSL/TLS setup (via Coolify? Let's Encrypt?)
- **GitHub integration**:
  - What is the GitHub repo URL?
  - Show `.github/` directory contents if any (workflows, actions)
  - What branch deploys to production?
  - Document the custom Claude Code slash commands (especially `/save`)

### SECTION 13: INFRASTRUCTURE SECURITY

**IMPORTANT:** This section documents the production server's security posture. This was hardened on 2026-02-18 after a BSI/CERT-Bund notification about exposed services.

#### 13a. Docker Compose Security Audit
Examine BOTH `docker-compose.yml` (dev) and `docker-compose.prod.yml` (prod) and document:

**Port exposure:**
- Which services have `ports:` sections? List every port binding.
- Are ports bound to `127.0.0.1` (localhost only) or `0.0.0.0` (all interfaces)?
- Which services have NO ports (internal-only via Docker network)?
- **CRITICAL CHECK**: Ports bound to `0.0.0.0` in production are publicly accessible. Flag any.

**Service authentication:**
- Does Redis have `--requirepass` configured? Is `REDIS_PASSWORD` required?
- Does PostgreSQL require `POSTGRES_PASSWORD`? Is it enforced (`:?` syntax)?
- Does Meilisearch require `MEILI_MASTER_KEY`? Is it enforced?
- Are connection strings (DATABASE_URL, REDIS_URL) configured to include passwords?

**Network isolation:**
- Are explicit Docker networks defined?
- Is there an `internal: true` network for database services?
- Which services are on which networks?
- Can database containers reach the internet? (They shouldn't need to.)

**Healthchecks:**
- Does each service have a healthcheck defined?
- Does the API use `depends_on` with `condition: service_healthy`?

**Environment variable enforcement:**
- Which env vars use `${VAR:?error}` syntax (fail-fast if missing)?
- Which use `${VAR:-default}` (fallback to a default)?
- Are there any weak/predictable defaults for secrets in production?

For the FULL picture, run:
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
echo "=== PROD COMPOSE: Default env vars ==="
grep -n ':-' docker-compose.prod.yml 2>/dev/null

echo ""
echo "=== DEV COMPOSE: Port bindings ==="
grep -n -B1 -A2 "ports:" docker-compose.yml 2>/dev/null || echo "File not found"

echo ""
echo "=== Redis auth config ==="
grep -n "requirepass\|REDIS_PASSWORD\|redis.*password" docker-compose*.yml 2>/dev/null

echo ""
echo "=== Password encryption ==="
grep -n "password_encryption\|scram" docker-compose*.yml 2>/dev/null
```

#### 13b. Application-Level Security Audit

**Redis connection security:**
```bash
echo "=== Redis config file ==="
cat apps/api/src/config/redis.ts

echo ""
echo "=== All Redis URL references ==="
grep -rn "redis://" --include="*.ts" --include="*.env*" --include="*.yml" . | grep -v node_modules

echo ""
echo "=== All files importing Redis ==="
grep -rn "from.*redis\|import.*redis" --include="*.ts" apps/api/src/ | grep -v node_modules
```

**Rate limiting:**
- Is rate limiting using Redis or in-memory store?
- What are the limits? (per-bot, global)
- Does rate limit state persist across API restarts?

**Prompt injection defenses:**
```bash
cat apps/api/src/utils/security.ts
```
- How many injection patterns are checked?
- Are injections blocked or just logged?
- Are bot-facing payloads wrapped in content delimiters?

**Debug endpoints:**
- Are `/internal/debug/*` routes protected?
- What authentication do they require?
- Could they leak sensitive information?

**CORS configuration:**
```bash
grep -n -A5 "cors" apps/api/src/server.ts
```
- Is CORS restricted to the web domain, or open to all origins?

**Security headers:**
```bash
grep -n -A10 "helmet" apps/api/src/server.ts
```

#### 13c. Server-Level Security (Document what's known)

Note: This section captures what we know about the production server's security from code and config. Some details can only be verified via SSH.

**Host firewall (UFW + iptables):**
- Document that UFW is configured to allow only ports 22, 80, 443
- Document that DOCKER-USER iptables chain blocks external access to ports: 3000, 4000, 5432, 6379, 7700, 6001, 6002, 8080
- Note: Coolify dashboard is accessible only via SSH tunnel (`ssh -L 8000:localhost:8000 root@SERVER_IP`)
- Note: Docker bypasses UFW by manipulating iptables directly, which is why DOCKER-USER rules are needed in addition to UFW
- Note: iptables rules are persisted via `iptables-persistent` / `netfilter-persistent`

**Document these known facts about the server:**
- Server IP: Check from `docker-compose.prod.yml` or `.env`
- Hosting: Hetzner, Germany (EU jurisdiction â€” relevant for GDPR)
- Coolify version: Check from `DEPLOY-SECURITY-FIX.md` or server notes
- SSL/TLS: Managed by Coolify's Traefik reverse proxy with Let's Encrypt
- Ports that should be publicly accessible: ONLY 22 (SSH), 80 (HTTPâ†’HTTPS redirect), 443 (HTTPS)

**Security incident history:**
- 2026-02-17: BSI/CERT-Bund flagged Redis as openly accessible (no auth, port 6379 exposed)
- 2026-02-18: Full audit revealed PostgreSQL (5432), Redis (6379), Meilisearch (7700), API (4000), Web (3000), and Coolify services (6001, 6002, 8000) were all publicly accessible
- 2026-02-18: All ports locked down via Docker compose changes + iptables DOCKER-USER rules + UFW
- 2026-02-18: PostgreSQL password rotated, Redis data flushed, all service passwords strengthened
- No evidence of unauthorized data access found (pg_roles audit clean, no unexpected database users)

Check for the deployment security fix documentation:
```bash
cat DEPLOY-SECURITY-FIX.md 2>/dev/null || echo "File not found"
cat SECURITY.md 2>/dev/null | head -100
```

#### 13d. Security Gaps and Recommendations

Based on the audit, list any remaining security concerns:

```bash
echo "=== Debug key hardcoded? ==="
grep -rn "debug.*key\|debug.*password\|debug.*secret" --include="*.ts" apps/api/src/ | grep -v node_modules

echo ""
echo "=== JWT secret defaults ==="
grep -rn "JWT_SECRET\|jwt.*secret" --include="*.ts" --include="*.yml" . | grep -v node_modules | grep -v .next

echo ""
echo "=== Signed OAuth cookies ==="
grep -c "signed: true" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 1 (google state cookie only — twitter removed)"

echo ""
echo "=== unsignCookie usage ==="
grep -c "unsignCookie" apps/api/src/routes/auth.routes.ts
echo "↑ Should be 1 (google callback only — twitter removed)"

echo ""
echo "=== Hardcoded credentials ==="
grep -rn "password.*=.*['\"]" --include="*.ts" apps/api/src/ | grep -v node_modules | grep -v ".test." | grep -v "schema"
```

Known issues to flag:
- Are debug endpoints using a hardcoded access key?
- Are there any default/weak secrets that could be in production?
- Is the rate limiter using in-memory store (resets on restart) vs Redis-backed?
- Are GDPR data subject rights endpoints implemented? (DELETE account, export data)

### SECTION 14: CURRENT STATE & KNOWN ISSUES
- Is the platform deployed and accessible? (YES â€” at www.opensolve.io)
- What features are working right now?
- What features are partially working or broken?
- Are there any TODO comments in the code? List ALL of them:
  ```bash
  grep -rn "TODO\|FIXME\|HACK\|NOTE\|XXX\|TEMP\|WARN" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | grep -v .next
  ```
- Any commented-out code that hints at planned features? Note them.
- Error handling patterns â€” is there consistent error handling?
- Any console.log or debug statements left in production code?
- TypeScript errors â€” run `npx tsc --noEmit 2>&1 | head -100` and include the output
- Lint errors â€” run the linter if configured and include output

### SECTION 15: DOMAIN MIGRATION CHECKLIST
Since we're migrating from `opensolve.io` to `opensolve.ai`, create a checklist of everything that needs to change:
- Every file where `opensolve.io` appears (from the grep in Section 4)
- OAuth callback URLs that need updating (Google, X/Twitter)
- Environment variables that reference the domain
- Coolify configuration changes needed
- DNS changes needed
- Any hardcoded URLs in frontend code
- Sitemap, robots.txt, meta tags, OpenGraph tags
- Any email configuration with the domain
- Certificate/SSL changes
- API documentation URLs

### SECTION 16: REGULATORY COMPLIANCE STATE

Document the current state of regulatory compliance:

**Privacy & Data Protection:**
- Does a privacy policy page exist? What does it cover?
- Does a terms of service page exist?
- Is there a cookie consent banner?
- What personal data is collected per database table? (Map each table to GDPR data categories)
- Are data subject rights endpoints implemented? (Account deletion, data export)
- Is there a data retention policy?
- Does the privacy policy disclose email collection and its legal basis (GDPR Art. 6(1)(f) legitimate interest)?
- Does a Legitimate Interest Assessment exist? (`docs/LEGITIMATE-INTEREST-ASSESSMENT.md`)
- Does the login page have an Art. 13 transparency notice about email storage?
- Does the settings page display the user's email as read-only?
- Is email included in the GDPR data export (Art. 20)?
- Is email deleted on account deletion (Art. 17)?

**Email & Compliance Verification:**
```bash
echo "=== LIA document exists ==="
ls -la docs/LEGITIMATE-INTEREST-ASSESSMENT.md 2>/dev/null && echo "✅ Exists" || echo "❌ Missing"

echo ""
echo "=== Privacy policy covers email ==="
grep -c -i "email address" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 3+ mentions"

echo ""
echo "=== Privacy policy states legitimate interest ==="
grep -c -i "legitimate interest" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 1+"

echo ""
echo "=== Login page email disclosure ==="
grep -c "service notification\|Privacy Policy" apps/web/src/app/auth/login/page.tsx
echo "↑ Should be 1+ (transparency notice)"

echo ""
echo "=== Settings page email display ==="
grep -c "email" apps/web/src/app/settings/page.tsx
echo "↑ Should be 2+ (label + display)"

echo ""
echo "=== GDPR export includes email ==="
grep -A20 "gdpr/export" apps/api/src/routes/auth.routes.ts | grep -c "email"
echo "↑ Should be 1+"

echo "=== Newsletter columns exist in schema ==="
grep -c "newsletterSubscribed\|newsletter_subscribed" apps/api/src/db/schema.ts
echo "↑ Should be 1+"

echo ""
echo "=== Double opt-in enforced (subscribe != confirm) ==="
grep -n "newsletter_subscribed.*=.*true\|newsletterSubscribed.*true" \
  apps/api/src/routes/newsletter.routes.ts | head -5
echo "↑ Should only appear in the /confirm route, NOT in /subscribe route"

echo ""
echo "=== Consent IP stored only at confirmation ==="
grep -n "newsletter_consent_ip\|newsletterConsentIp" \
  apps/api/src/routes/newsletter.routes.ts | head -10
echo "↑ Should ONLY appear in GET /confirm handler (not POST /subscribe)"

echo ""
echo "=== Unsubscribe token rotation on re-subscribe ==="
grep -n "generateUnsubscribeToken" apps/api/src/routes/newsletter.routes.ts
echo "↑ Should appear in /confirm handler"

echo ""
echo "=== Newsletter export in GDPR data export ==="
grep -n "newsletter" apps/api/src/routes/auth.routes.ts | grep -i "export\|gdpr"
echo "↑ Should show newsletterSubscribed and newsletterSubscribedAt in export"

echo ""
echo "=== Newsletter fields cleared on account anonymisation ==="
grep -n "newsletter" apps/api/src/routes/auth.routes.ts | grep -i "null\|false\|delete\|anon"
echo "↑ Should show newsletter fields being cleared on account deletion/anonymisation"

echo ""
echo "=== Resend DPA note in docs ==="
grep -c -i "dpa\|standard contractual\|SCC" docs/RESEND-SETUP.md 2>/dev/null
echo "↑ Should be 1+ (Resend DPA referenced)"

echo ""
echo "=== Newsletter Consent Assessment exists ==="
ls -la docs/NEWSLETTER-CONSENT-ASSESSMENT.md 2>/dev/null \
  && echo "✅ Exists" || echo "❌ MISSING — compliance gap"

echo ""
echo "=== LIA has newsletter carve-out ==="
grep -c -i "newsletter\|NEWSLETTER-CONSENT" docs/LEGITIMATE-INTEREST-ASSESSMENT.md
echo "↑ Should be 1+"

echo ""
echo "=== Privacy policy covers newsletter ==="
grep -c -i "newsletter" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 8+"

echo ""
echo "=== Privacy policy has Art. 6(1)(a) consent basis ==="
grep -c "6(1)(a)" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 1+"

echo ""
echo "=== Privacy policy references Resend and SCCs ==="
grep -c -i "resend" apps/web/src/app/privacy/page.tsx
grep -c -i "standard contractual\|SCC" apps/web/src/app/privacy/page.tsx
echo "↑ Both should be 1+"

echo ""
echo "=== Privacy policy has open tracking disclosure ==="
grep -c -i "open tracking\|tracking pixel" apps/web/src/app/privacy/page.tsx
echo "↑ Should be 1"

echo ""
echo "=== Terms has newsletter section ==="
grep -c -i "newsletter" apps/web/src/app/terms/page.tsx
echo "↑ Should be 3+"

echo ""
echo "=== Login page has newsletter disclosure ==="
grep -c -i "newsletter" apps/web/src/app/auth/login/page.tsx
echo "↑ Should be 1"

echo ""
echo "=== GDPR export excludes security-only newsletter fields ==="
grep -n "newsletterConsentIp\|newsletterUnsubscribeToken" \
  apps/api/src/routes/auth.routes.ts | grep -v "//"
echo "↑ Must be empty — these fields must not appear uncommented in export"

echo ""
echo "=== Newsletter email template has permanent disclosure block ==="
grep -n -i "affiliate\|sponsored\|Anzeige\|Hinweis\|Disclosure" apps/api/src/email/templates.ts
echo "↑ Should show bilingual Disclosure/Hinweis label, Anzeige, affiliate, and sponsored in newsletterTemplate"

echo ""
echo "=== Retention service is automated and logged ==="
grep -n "logger\|setInterval\|startScheduler\|runCleanup\|retention cleanup" \
  apps/api/src/services/retention.service.ts | head -10
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
```

**Compliance status:**
- **Privacy policy:** YES (`/privacy`)
- **Email disclosure at login:** YES (Art. 13 transparency notice on `/auth/login`)
- **Legitimate Interest Assessment:** YES (`docs/LEGITIMATE-INTEREST-ASSESSMENT.md`)
- **Email in GDPR export:** YES (included in `POST /auth/gdpr/export`)
- **Email deleted on account deletion:** YES (cascade from user row deletion)

**Newsletter Consent Compliance:**
- **Legal basis**: GDPR Art. 6(1)(a) — Consent (separate from Art. 6(1)(f) LI for service notifications)
- **Consent mechanism**: Double opt-in — user requests subscription, receives email,
  clicks confirmation link. Subscription only active after confirmation.
- **Consent record**: newsletter_consent_ip, newsletter_consent_method,
  newsletter_subscribed_at stored in PostgreSQL
- **Withdrawal**: One-click unsubscribe from every newsletter email footer (no login)
  + Settings page toggle
- **German UWG §7**: Double opt-in + one-click unsubscribe = compliant
- **Resend as data processor**: US-based, EU sending infrastructure (Ireland eu-west-1),
  SCCs/DPA required — documented in docs/RESEND-SETUP.md

| Newsletter Consent Assessment | DONE | `docs/NEWSLETTER-CONSENT-ASSESSMENT.md` — documents double opt-in, UWG §7, 3-year retention |
| Resend DPA / SCCs | DONE | Disclosed in privacy policy; Resend DPA signed at resend.com/legal |
| Email open tracking | DONE | Disabled in Resend dashboard; disclosed in privacy policy |
| Affiliate disclosure block in email template (UWG §7) | DONE | apps/api/src/email/templates.ts — newsletterTemplate |
| German UWG ad label (Anzeige) in newsletter template | DONE | apps/api/src/email/templates.ts |
| GDPR Art. 18 Right to Restriction in privacy policy | DONE | /privacy — Your Rights section |
| Retention cleanup automated and logged | DONE | apps/api/src/services/retention.service.ts + server.ts |
| Hetzner DPA signed (GDPR Art. 28) | DONE | Hetzner account portal (confirmed 9 March 2026) |

**AI-Specific Regulation:**
- Is AI-generated content labeled in the UI?
- Are bot-authored problems/solutions clearly distinguished from human content?
- EU AI Act transparency requirements â€” what's the current state?

**Legal:**
- Is there an Impressum / Legal Notice page? (May be required for EU-hosted services)
- Is there a Hetzner Data Processing Agreement (DPA) in place?
- What is the operator's legal structure? (Individual, company, etc.)

### SECTION 18: SESSION CHANGE LOG

Document the known applied sessions that have modified the codebase:

- **Session 1:** Email schema — add mandatory email column to users, remove Twitter from OAuth enum
- **Session 2:** Auth routes — remove Twitter OAuth, store email from Google, add email to /me and GDPR export, comprehensive tests
- **Session 3:** Server cleanup — delete twitter.service.ts, remove all remaining Twitter references
- **Session 4:** Frontend — Google-only login page, email display in settings, Twitter UI removal
- **Session 5:** Legal pages — privacy policy email disclosure, terms update, Twitter removal
- **Session 6:** Documentation — update API docs, SDK docs, skill file, reference bots, README
- **Session 7:** Compliance — Legitimate Interest Assessment, GDPR plan update, master compliance test
- **Session 8:** Snapshot prompt update — reflect email storage and Twitter removal in project documentation tooling
- **Session A (Email Infrastructure):** EmailService wrapper around Resend SDK,
  4 HTML templates (important, newsletter, confirm, unsubscribe-confirm), RESEND-SETUP.md,
  RESEND_API_KEY + RESEND_FROM_EMAIL + RESEND_FROM_NAME + APP_BASE_URL env vars
- **Session B (Newsletter Subscription):** 5 newsletter columns on users table,
  migration SQL, newsletter-tokens.ts (confirm token + unsubscribe token),
  5 API routes (/subscribe, /confirm, /unsubscribe POST+GET, /status)
- **Session C (Admin Email Panel):** admin.email.routes.ts with 6 endpoints,
  Redis one-time confirmation token system, /admin/communications page (4 tabs:
  Important Messages, Newsletter Broadcast, Send History, Subscribers)
- **Session D (Frontend Email UI):** Newsletter section in settings page (4 UI states:
  loading/not-subscribed/pending/subscribed), /newsletter/confirm page (public, noindex),
  /unsubscribe page (public, noindex, no login required), NewsletterBanner component
- **Session E (Compliance & Legal):** Privacy policy newsletter sections (data
  collected, Art. 6(1)(a) consent basis, Resend as data processor, retention,
  withdrawal of consent, open tracking disclosure), Terms of Service newsletter
  section, docs/NEWSLETTER-CONSENT-ASSESSMENT.md created,
  docs/LEGITIMATE-INTEREST-ASSESSMENT.md updated with newsletter carve-out,
  login page newsletter disclosure, compliance-newsletter.test.ts

**Session Summary:**
| Session | Changes |
|---------|---------|
| Email Infrastructure (A) | Resend SDK, EmailService, 4 HTML email templates, RESEND-SETUP.md |
| Newsletter Subscription (B) | 5 newsletter DB columns, newsletter-tokens.ts, 5 newsletter API routes, migration SQL |
| Admin Email Panel (C) | 6 admin email API endpoints, Redis one-time confirmation tokens, /admin/communications page with 4 tabs |
| Frontend Email UI (D) | Newsletter section in settings (4 states), /newsletter/confirm page, /unsubscribe page, NewsletterBanner component |
| Compliance & Legal (E) | Privacy policy newsletter additions, Terms newsletter section, Newsletter Consent Assessment doc, LIA carve-out, login page disclosure, compliance tests |
| COMP-1 | Affiliate disclosure hardened: bilingual Disclosure/Hinweis label, Anzeige for UWG §7, compliance script sections 8-10 added (41 total checks) |
| COMP-2 | Art. 18 Right to Restriction added to Your Rights section; rights now in correct legal order 15→16→17→18→20→7(3)→21; date updated to 9 March 2026 |
| COMP-3 | Retention logging hardened: logger.info at start, completion log fires always with 4 row counts, logger.error in catch block |

---

## OUTPUT FORMAT

Create the file `PROJECT-SNAPSHOT.md` in the project root with ALL sections above.

Rules:
- When copying code, use full fenced code blocks with language tags
- For schema/config files: copy the ENTIRE file, not excerpts
- For logic files (dispatcher, voting, auth): copy COMPLETE functions
- Replace any real secrets, API keys, or passwords with `<REDACTED>`
- Keep real values for all non-secret configuration (numbers, limits, enums, etc.)
- If something from the list above doesn't exist in the project, write: `**NOT IMPLEMENTED** â€” This feature does not exist in the current codebase.`
- At the end, add a section called "QUICK STATS" with counts:
  - Total API routes (note: +5 newsletter routes, +6 admin email routes since last snapshot)
  - Total DB tables
  - Total frontend pages
  - Total environment variables (note: +4 added: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME, APP_BASE_URL)
  - Total test files (note: +2 added: email.test.ts, newsletter.test.ts, admin.email.test.ts)
  - Total TODO/FIXME comments found
  - Total places `opensolve.io` appears in the codebase
  - Lines of code (run `find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .next | xargs wc -l 2>/dev/null | tail -1`)
  - Security: Number of exposed ports (should be 0 in prod compose, 3 via host firewall)
  - Security: Number of services with required auth (should be 3: postgres, redis, meilisearch)
  - API service files (note: +1 added: email.service.ts)
  - Email templates: 4 (importantMessage, newsletter, newsletterConfirm, unsubscribeConfirm)
  - Newsletter API routes: 5 (subscribe, confirm, unsubscribe-auth, unsubscribe-token, status)
  - Admin email API routes: 6 (stats, subscribers, send-important, broadcast, confirmation-token, history)
  - New frontend pages: 2 (/newsletter/confirm, /unsubscribe)
  - New frontend components: 1 (NewsletterBanner)
  - New utility files: 1 (newsletter-tokens.ts)
  - New documentation files: 2 (RESEND-SETUP.md, NEWSLETTER-CONSENT-ASSESSMENT.md)
  - Newsletter compliance: Double opt-in ✅, One-click unsubscribe ✅, Consent record ✅, Privacy policy updated ✅, Consent assessment documented ✅, Open tracking disabled ✅
  - Affiliate disclosure block in email template ✅ (Session 1, hardened March 2026)
  - German UWG §7 Anzeige label in newsletter template ✅ (March 2026)
  - Art. 18 Right to Restriction in privacy policy ✅ (March 2026)
  - Retention cleanup automated (24h setInterval) ✅ confirmed March 2026
  - Retention cleanup logging hardened (start/completion/error) ✅ (March 2026)
  - Hetzner DPA signed via portal ✅ confirmed March 2026
  - gdpr-compliance-check.sh: 41 checks, 0 failures ✅ (March 2026)

Target length: This document should be thorough. 2000-5000 lines is expected and fine. Don't trim for brevity.

After creating the file, tell me:
1. The file path
2. Approximate line count and file size
3. Any sections where you couldn't find the relevant code (so I know what might be missing)
4. Whether the database is confirmed as PostgreSQL
5. What the `/save` command does (or if no custom commands exist)
6. Security summary: Are all services properly authenticated and isolated in docker-compose.prod.yml?
7. Any NEW security concerns found during this scan
8. Compliance sessions (2026-03-09) applied? Verify each:
   - Does apps/api/src/email/templates.ts newsletterTemplate contain "Hinweis" and "Anzeige"? (PASS/FAIL)
   - Does apps/web/src/app/privacy/page.tsx contain "Art. 18" with "Restrict processing"? (PASS/FAIL)
   - Does the rights section have articles in order 15 → 16 → 17 → 18 → 20 → 21 by line number? (PASS/FAIL)
   - Does apps/web/src/app/privacy/page.tsx show "Last updated: 9 March 2026"? (PASS/FAIL)
   - Does apps/api/src/services/retention.service.ts contain logger.info for start, completion, and error? (PASS/FAIL)
   - Does apps/api/src/server.ts import and wire retention cleanup with setInterval? (PASS/FAIL)
   - Does tests/gdpr-compliance-check.sh have 41 total checks? (PASS/FAIL)
   - Is Hetzner DPA confirmed signed? (CONFIRMED — signed via Hetzner account portal 9 March 2026)