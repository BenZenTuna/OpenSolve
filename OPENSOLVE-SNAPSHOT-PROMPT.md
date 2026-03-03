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
- Human users (what can they do? post problems? vote? view?)
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
- Human user: signup â†’ what they see â†’ what actions they take â†’ what outcome they get
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
- Group them logically (Auth routes, Bot routes, Problem routes, Voting routes, Admin routes, etc.)

### SECTION 4: AUTHENTICATION & AUTHORIZATION
- Document the COMPLETE auth setup:
  - Google OAuth configuration (client ID setup, callback URLs, scopes)
  - X (Twitter) OAuth configuration (same details)
  - Any other auth providers
- How do human users log in? Copy the auth configuration code (NextAuth config, Supabase auth, custom JWT, etc.)
- How do bots authenticate? (API key flow, OAuth, tokens?)
- Copy the ENTIRE auth configuration file(s)
- How are API keys generated and validated? Copy the code
- Session/token expiry settings
- Any admin role checking logic
- Copy ALL auth middleware files completely
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
  - **Authentication**: Google OAuth, X (Twitter) OAuth â€” document provider setup
  - **Any others**: Redis, Elasticsearch, email service, CDN, etc.
- GitHub integration â€” document how the repo is connected to deployment
  - Does Coolify auto-deploy on push? What branch?
  - Show the git remote configuration
- Any background job processing (cron jobs, scheduled tasks)
- Any third-party APIs integrated

### SECTION 12: DEPLOYMENT & INFRASTRUCTURE DETAILS
- **Coolify setup**: What does the Coolify deployment configuration look like?
  - Show any `docker-compose.yml`, `Dockerfile`, or Coolify-specific config files
  - Environment variables set in Coolify (names only, values as `<REDACTED>`)
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
echo "=== OAuth PKCE security ==="
grep -rn "code_challenge\|code_verifier" --include="*.ts" apps/api/src/

echo ""
echo "=== Hardcoded credentials ==="
grep -rn "password.*=.*['\"]" --include="*.ts" apps/api/src/ | grep -v node_modules | grep -v ".test." | grep -v "schema"
```

Known issues to flag:
- Is the OAuth PKCE implementation using a hardcoded challenge value instead of a random one?
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

**AI-Specific Regulation:**
- Is AI-generated content labeled in the UI?
- Are bot-authored problems/solutions clearly distinguished from human content?
- EU AI Act transparency requirements â€” what's the current state?

**Legal:**
- Is there an Impressum / Legal Notice page? (May be required for EU-hosted services)
- Is there a Hetzner Data Processing Agreement (DPA) in place?
- What is the operator's legal structure? (Individual, company, etc.)

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
  - Total API routes
  - Total DB tables
  - Total frontend pages
  - Total environment variables
  - Total TODO/FIXME comments found
  - Total places `opensolve.io` appears in the codebase
  - Lines of code (run `find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v node_modules | grep -v .next | xargs wc -l 2>/dev/null | tail -1`)
  - Security: Number of exposed ports (should be 0 in prod compose, 3 via host firewall)
  - Security: Number of services with required auth (should be 3: postgres, redis, meilisearch)

Target length: This document should be thorough. 2000-5000 lines is expected and fine. Don't trim for brevity.

After creating the file, tell me:
1. The file path
2. Approximate line count and file size
3. Any sections where you couldn't find the relevant code (so I know what might be missing)
4. Whether the database is confirmed as PostgreSQL
5. What the `/save` command does (or if no custom commands exist)
6. Security summary: Are all services properly authenticated and isolated in docker-compose.prod.yml?
7. Any NEW security concerns found during this scan