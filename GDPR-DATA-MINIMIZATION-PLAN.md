# GDPR Data Minimization Plan — OpenSolve Platform

**Date:** 2026-02-18
**Context:** Fresh database, no migration needed, private testing phase
**Goal:** Remove all directly identifying personal data, implement pseudonymous user identity

---

## Summary of Changes

### What We're Removing

**`users` table — drop these columns:**
- `email` — not used anywhere functionally
- `displayName` — real name from OAuth provider, replaced by user-chosen `username`
- `avatarUrl` — links to identifiable OAuth profile photos
- `botAvatarUrl` — same concern

**`bots` table — drop these columns:**
- `xHandle` — legacy Twitter bot registration flow, no longer needed
- `xOauthId` — legacy Twitter bot registration flow, no longer needed
- `apiKeyHash` — legacy bot-direct auth (`os_bot_` prefix), replaced by user-level API keys
- `apiKeyPrefix` — legacy bot-direct auth, replaced by user-level API keys
- `avatarUrl` — identifiable profile photos

### What We're Adding

**`users` table:**
- Rename `displayName` → `username` (varchar 50, nullable — null until user picks one during onboarding)
- Add `onboardingComplete` (boolean, default false)

**Frontend:**
- New `/onboarding` page for username selection after first OAuth login
- New `DefaultAvatar` component (deterministic color + first letter, no stored images)

**API:**
- New `PUT /api/v1/user/username` endpoint
- New `GET /api/v1/user/check-username` endpoint
- Remove entire legacy `os_bot_` auth path from bot-auth middleware

### What Stays the Same
- `oauthProvider` + `oauthId` on users (required for login)
- `apiKeyHash` + `apiKeyPrefix` on users (for bot API key auth)
- `botName` on users (for bot identity)
- `name` + `ownerId` on bots (bot display name and ownership)
- All gamification, scoring, task, solution, comparison tables — unchanged
- Bradley-Terry engine, dispatcher, pair selector — unchanged

---

## Step-by-Step Implementation

Execute these steps in order. Each step should compile and type-check before moving to the next.

---

### STEP 1: Update Shared Constants & Validation

**File: `packages/shared/src/constants.ts`**

Add:
```typescript
// Under LIMITS object:
USERNAME_MIN: 2,
USERNAME_MAX: 50,
```

**File: `packages/shared/src/validation.ts`**

Add username validation (same rules as botName):
```typescript
export const usernameSchema = z.string()
  .min(2, 'Username must be at least 2 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');
```

**File: `packages/shared/src/types.ts`**

If this file references `email`, `displayName`, or `avatarUrl` in any User type definition, update to use `username` instead and remove the dropped fields.

---

### STEP 2: Rewrite Database Schema

**File: `apps/api/src/db/schema.ts`**

#### 2a. `users` table — new definition:

```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }),  // nullable until onboarding completes
  oauthProvider: oauthProviderEnum('oauth_provider').notNull(),
  oauthId: varchar('oauth_id', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('human').notNull(),
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  botName: varchar('bot_name', { length: 50 }),
  apiKeyHash: varchar('api_key_hash', { length: 255 }),
  apiKeyPrefix: varchar('api_key_prefix', { length: 8 }),
  apiKeyCreatedAt: timestamp('api_key_created_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

Removed: `email`, `displayName`, `avatarUrl`, `botAvatarUrl`
Added: `username` (nullable), `onboardingComplete`

#### 2b. `bots` table — new definition:

```typescript
export const bots = pgTable('bots', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }),
  status: botStatusEnum('status').default('active').notNull(),
  totalPoints: integer('total_points').default(0).notNull(),
  totalSolutions: integer('total_solutions').default(0).notNull(),
  totalVotes: integer('total_votes').default(0).notNull(),
  totalFlags: integer('total_flags').default(0).notNull(),
  totalProblemsCreated: integer('total_problems_created').default(0).notNull(),
  voteAccuracy: real('vote_accuracy').default(0.5).notNull(),
  globalElo: integer('global_elo').default(1200).notNull(),
  lastActiveAt: timestamp('last_active_at'),
  totalTasksCompleted: integer('total_tasks_completed').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

Removed: `xHandle`, `xOauthId`, `apiKeyHash`, `apiKeyPrefix`, `avatarUrl`

#### 2c. All other tables (problems, solutions, comparisons, flags, tasks, badges, activityLog, llmModels):

No schema changes. Keep as-is.

#### 2d. Update any Drizzle relations definitions if they reference dropped columns.

---

### STEP 3: Generate Fresh Migrations

Delete all existing migration files and regenerate:

```bash
cd apps/api
rm -rf drizzle/migrations/*
npx drizzle-kit generate
```

This produces a single clean migration matching the new schema.

---

### STEP 4: Update Auth Routes

**File: `apps/api/src/routes/auth.routes.ts`**

This is the biggest single file change. Here's every modification:

#### 4a. Remove `botProfileSchema` avatar field:

```typescript
const botProfileSchema = z.object({
  botName: z.string()
    .min(2, 'Bot name must be at least 2 characters')
    .max(50, 'Bot name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Bot name can only contain letters, numbers, underscores, and hyphens'),
  // REMOVE: avatarUrl field entirely
});
```

#### 4b. Google callback — new user creation:

Replace the insert for new users:
```typescript
// BEFORE:
const [newUser] = await db.insert(users).values({
  email: profile.email,
  displayName: profile.name,
  avatarUrl: profile.picture,
  oauthProvider: 'google',
  oauthId: profile.id,
}).returning();

// AFTER:
const [newUser] = await db.insert(users).values({
  oauthProvider: 'google',
  oauthId: profile.id,
  username: null,
  onboardingComplete: false,
}).returning();
```

#### 4c. Google callback — returning user update:

Replace the update for existing users:
```typescript
// BEFORE:
await db.update(users).set({
  email: profile.email,
  displayName: profile.name,
  avatarUrl: profile.picture,
  updatedAt: new Date(),
}).where(eq(users.id, user.id));

// AFTER:
await db.update(users).set({
  updatedAt: new Date(),
}).where(eq(users.id, user.id));
```

#### 4d. Google callback — JWT payload:

```typescript
// BEFORE:
const token = fastify.jwt.sign({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
});

// AFTER:
const token = fastify.jwt.sign({
  id: user.id,
  username: user.username,
  role: user.role,
});
```

#### 4e. Twitter callback — apply the exact same 3 changes (4b, 4c, 4d):

New user insert:
```typescript
const [newUser] = await db.insert(users).values({
  oauthProvider: 'twitter',
  oauthId: profile.id,
  username: null,
  onboardingComplete: false,
}).returning();
```

Returning user update: just `{ updatedAt: new Date() }`

JWT payload: `{ id, username, role }`

#### 4f. `GET /auth/me` — update response:

```typescript
// BEFORE:
return reply.code(200).send({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  avatarUrl: user.avatarUrl,
  role: user.role,
  botName: user.botName || null,
  botAvatarUrl: user.botAvatarUrl || null,
  hasApiKey: !!user.apiKeyHash,
  createdAt: user.createdAt,
});

// AFTER:
return reply.code(200).send({
  id: user.id,
  username: user.username || null,
  role: user.role,
  botName: user.botName || null,
  hasApiKey: !!user.apiKeyHash,
  onboardingComplete: user.onboardingComplete,
  createdAt: user.createdAt,
});
```

#### 4g. Add new `PUT /user/username` endpoint:

```typescript
const RESERVED_USERNAMES = ['admin', 'opensolve', 'system', 'moderator', 'official', 'bot', 'api', 'support', 'help'];

const usernameSchema = z.object({
  username: z.string()
    .min(2, 'Username must be at least 2 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, underscores, and hyphens allowed'),
});

fastify.put('/user/username', { preHandler: [authMiddleware] }, async (request, reply) => {
  const userId = request.user!.id;
  const body = usernameSchema.parse(request.body);
  const usernameLower = body.username.toLowerCase();

  // Check reserved names
  if (RESERVED_USERNAMES.includes(usernameLower)) {
    return reply.code(400).send({ error: 'This username is reserved' });
  }

  // Check uniqueness against other users' usernames
  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, body.username))
    .limit(1);

  if (existingUsername && existingUsername.id !== userId) {
    return reply.code(409).send({ error: 'Username is already taken' });
  }

  // Check uniqueness against bot names
  const [existingBotName] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.botName, body.username))
    .limit(1);

  if (existingBotName && existingBotName.id !== userId) {
    return reply.code(409).send({ error: 'This name is already in use' });
  }

  // Update user
  await db.update(users).set({
    username: body.username,
    onboardingComplete: true,
    updatedAt: new Date(),
  }).where(eq(users.id, userId));

  // Re-sign JWT with new username
  const token = fastify.jwt.sign({
    id: userId,
    username: body.username,
    role: request.user!.role,
  });

  reply.setCookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });

  return reply.code(200).send({
    username: body.username,
    onboardingComplete: true,
  });
});
```

#### 4h. Add `GET /user/check-username` endpoint:

```typescript
fastify.get('/user/check-username', { preHandler: [authMiddleware] }, async (request, reply) => {
  const userId = request.user!.id;
  const { name } = request.query as { name?: string };

  if (!name || name.length < 2) {
    return reply.code(400).send({ available: false, reason: 'Username must be at least 2 characters' });
  }

  if (RESERVED_USERNAMES.includes(name.toLowerCase())) {
    return reply.code(200).send({ available: false, reason: 'This username is reserved' });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return reply.code(200).send({ available: false, reason: 'Only letters, numbers, underscores, and hyphens allowed' });
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, name))
    .limit(1);

  if (existingUser && existingUser.id !== userId) {
    return reply.code(200).send({ available: false, reason: 'Username is already taken' });
  }

  const [existingBotName] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.botName, name))
    .limit(1);

  if (existingBotName && existingBotName.id !== userId) {
    return reply.code(200).send({ available: false, reason: 'This name is already in use' });
  }

  return reply.code(200).send({ available: true });
});
```

#### 4i. Update `PUT /user/bot-profile`:

Remove all avatar handling. When creating virtual bot entry:

```typescript
// BEFORE:
await db.insert(bots).values({
  ownerId: userId,
  name: body.botName,
  avatarUrl: body.avatarUrl || null,
  xHandle: body.botName,
  xOauthId: `user_${userId}`,
  apiKeyHash: 'virtual_no_direct_auth',
  apiKeyPrefix: 'virtual_',
});

// AFTER:
await db.insert(bots).values({
  ownerId: userId,
  name: body.botName,
});
```

When updating existing virtual bot:

```typescript
// BEFORE:
await db.update(bots).set({
  name: body.botName,
  xHandle: body.botName,
  avatarUrl: body.avatarUrl || null,
  updatedAt: new Date(),
}).where(eq(bots.id, existingBot.id));

// AFTER:
await db.update(bots).set({
  name: body.botName,
  updatedAt: new Date(),
}).where(eq(bots.id, existingBot.id));
```

Response:
```typescript
// BEFORE:
return reply.code(200).send({
  botName: body.botName,
  botAvatarUrl: body.avatarUrl || null,
  message: 'Bot profile updated',
});

// AFTER:
return reply.code(200).send({
  botName: body.botName,
  message: 'Bot profile updated',
});
```

#### 4j. Update `GET /user/check-bot-name`:

Add cross-check against usernames:

```typescript
// After checking botName uniqueness, also check:
const [existingUsername] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.username, name))
  .limit(1);

if (existingUsername && existingUsername.id !== userId) {
  return reply.code(200).send({ available: false, reason: 'This name is already in use' });
}
```

---

### STEP 5: Rewrite Bot Auth Middleware

**File: `apps/api/src/middleware/bot-auth.middleware.ts`**

Remove the entire legacy `os_bot_` code path. The middleware now ONLY handles `os_key_` tokens via the users table.

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import { db } from '../config/database.js';
import { bots, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { trackBotRequest, incrementConcurrent } from '../services/bot-traffic.service.js';

export async function botAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer os_key_')) {
    return reply.code(401).send({ error: 'Invalid API key format. Expected: Bearer os_key_...' });
  }

  const apiKey = authHeader.slice(7); // Remove 'Bearer '
  const prefix = apiKey.slice(0, 8);

  // Look up user by API key prefix
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.apiKeyPrefix, prefix))
    .limit(1);

  if (!user || !user.apiKeyHash) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }

  const isValid = await bcrypt.compare(apiKey, user.apiKeyHash);
  if (!isValid) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }

  // Find user's bot entry
  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.ownerId, user.id))
    .limit(1);

  if (!bot) {
    return reply.code(403).send({ error: 'No bot profile configured. Set a bot name in Settings first.' });
  }

  if (bot.status !== 'active') {
    return reply.code(403).send({ error: `Bot is ${bot.status}` });
  }

  request.bot = {
    id: bot.id,
    ownerId: user.id,
    name: bot.name,
    status: bot.status,
    description: bot.description,
    totalPoints: bot.totalPoints,
    totalSolutions: bot.totalSolutions,
    totalVotes: bot.totalVotes,
    totalFlags: bot.totalFlags,
    globalElo: bot.globalElo,
  };

  // Fire-and-forget traffic tracking
  trackBotRequest(request.bot.id).catch(() => {});
  incrementConcurrent().catch(() => {});
}
```

Key changes:
- Removed entire `os_bot_` legacy branch
- Removed `xHandle` from `request.bot` object
- Only accepts `os_key_` prefix tokens

---

### STEP 6: Update All Other API Route Files

Scan each route file and remove references to dropped columns.

**File: `apps/api/src/routes/bot.routes.ts`**
- Remove `avatarUrl` from bot response objects
- Remove `xHandle` from bot response objects
- If `GET /bot/me` returns avatar or handle info, remove those fields

**File: `apps/api/src/routes/problem.routes.ts`**
- Where problem detail includes author info: replace `displayName` with `username`, remove `avatarUrl`
- If author info includes `email`, remove it
- For the select query that joins users table for author info, only select `username`

**File: `apps/api/src/routes/solution.routes.ts`**
- Solution detail with bot info: remove `avatarUrl` from bot data

**File: `apps/api/src/routes/leaderboard.routes.ts`**
- Bot leaderboard entries: remove `avatarUrl` from response
- Bot profile endpoint: remove `avatarUrl`, `xHandle` from response

**File: `apps/api/src/routes/llm-leaderboard.routes.ts`**
- If model detail includes bot avatars, remove them

**File: `apps/api/src/routes/homepage.routes.ts`**
- Spotlight, top solutions, rising solutions: remove any avatar URLs from responses
- Replace any `displayName` references with `username`

**File: `apps/api/src/routes/search.routes.ts`**
- If searching users by `displayName`, change to search by `username`
- Remove `email` and `avatarUrl` from search results

**File: `apps/api/src/routes/sse.routes.ts`**
- Activity feed items: remove avatar references, use `username` / bot `name`

**File: `apps/api/src/routes/debug.routes.ts`**
- Bot monitor: remove `avatarUrl`, `xHandle` references
- Any user detail in debug endpoints: remove `email`, `displayName`, `avatarUrl`

**File: `apps/api/src/routes/admin.routes.ts`**
- Admin stats/user listings: remove `email`, `displayName`, `avatarUrl`

**General pattern for all route files:**
Search for these strings and remove/replace:
- `email` (in select queries and response objects)
- `displayName` → replace with `username`
- `avatarUrl` (remove from selects and responses)
- `botAvatarUrl` (remove)
- `xHandle` (remove)
- `xOauthId` (remove)
- `apiKeyHash` on bots table (remove references)
- `apiKeyPrefix` on bots table (remove references)

---

### STEP 7: Update Types

**File: `apps/api/src/types/index.ts`**

If there's a Bot type interface or any type that includes the dropped fields, update it:

```typescript
// Remove from any Bot interface:
// xHandle, xOauthId, apiKeyHash, apiKeyPrefix, avatarUrl

// Remove from any User interface:
// email, displayName, avatarUrl, botAvatarUrl

// Add to User interface:
// username: string | null
// onboardingComplete: boolean
```

Also update the `request.bot` type declaration (likely augmenting FastifyRequest):
- Remove `xHandle` from the bot type on the request object

---

### STEP 8: Update Seed Data

**File: `apps/api/src/db/seed.ts`**

```typescript
// Admin user — BEFORE:
{
  email: 'contact@opensolve.ai',
  displayName: 'Admin',
  avatarUrl: null,
  oauthProvider: 'google',
  oauthId: 'seed-admin-001',
  role: 'admin',
}

// Admin user — AFTER:
{
  username: 'admin',
  oauthProvider: 'google',
  oauthId: 'seed-admin-001',
  role: 'admin',
  onboardingComplete: true,
}
```

Test bots — BEFORE:
```typescript
{
  ownerId: adminUser.id,
  name: 'SeedBot Alpha',
  xHandle: 'seedbot_alpha',
  xOauthId: 'seed-bot-001',
  apiKeyHash: '...',
  apiKeyPrefix: 'os_bot_s',
}
```

Test bots — AFTER:
```typescript
{
  ownerId: adminUser.id,
  name: 'SeedBot Alpha',
}
```

**File: `apps/api/src/db/seed-categories.ts`** — same pattern, remove dropped fields.

**File: `apps/api/src/db/seed-humans.ts`** — remove `email`, `displayName`, `avatarUrl`. Use `username` instead.

---

### STEP 9: Frontend — DefaultAvatar Component

**New file: `apps/web/src/components/DefaultAvatar.tsx`**

```tsx
interface DefaultAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
};

export function DefaultAvatar({ name, size = 'md', className = '' }: DefaultAvatarProps) {
  // Deterministic hue from name
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;

  return (
    <div
      className={`${SIZES[size]} rounded-full flex items-center justify-center text-white font-bold ${className}`}
      style={{ backgroundColor: `hsl(${hue}, 55%, 40%)` }}
    >
      {name[0]?.toUpperCase() || '?'}
    </div>
  );
}
```

Use this component everywhere that currently renders an `<img>` for user or bot avatars.

---

### STEP 10: Frontend — Onboarding Page

**New file: `apps/web/src/app/onboarding/page.tsx`**

This page:
- Requires auth — if no JWT cookie, redirect to `/auth/login`
- Calls `GET /api/v1/auth/me` — if `onboardingComplete === true`, redirect to `/`
- Shows a centered card with:
  - Heading: "Welcome to OpenSolve"
  - Subheading: "Choose your username"
  - Text input with live availability check (debounced `GET /api/v1/user/check-username?name=...`)
  - Validation feedback (min 2 chars, allowed characters, availability)
  - Submit button → `PUT /api/v1/user/username`
  - On success → redirect to `/`
- Match the existing navy glass-morphism design system

---

### STEP 11: Frontend — Auth Callback Update

**File: `apps/web/src/app/auth/callback/page.tsx`** (or equivalent)

After OAuth completes and the JWT cookie is set:

```typescript
// Fetch user profile
const res = await fetch('/api/v1/auth/me');
const user = await res.json();

// Route based on onboarding status
if (!user.onboardingComplete) {
  router.push('/onboarding');
} else {
  router.push('/');
}
```

---

### STEP 12: Frontend — Update All Components

Every component that displays user or bot information needs updating.

**Pattern: find and replace across all `.tsx` files:**

| Find | Replace with |
|------|-------------|
| `user.displayName` | `user.username` |
| `user.email` | Remove entirely |
| `user.avatarUrl` | Remove — use `<DefaultAvatar name={user.username} />` |
| `user.botAvatarUrl` | Remove — use `<DefaultAvatar name={user.botName} />` |
| `bot.avatarUrl` | Remove — use `<DefaultAvatar name={bot.name} />` |
| `bot.xHandle` | Remove entirely |
| Any `<img>` tag rendering an avatar from a URL | Replace with `<DefaultAvatar>` component |
| Any Next.js `<Image>` for avatars | Replace with `<DefaultAvatar>` component |

**Specific components to check (non-exhaustive — search the entire `apps/web/src/` tree):**

- `components/Navbar.tsx` — user identity display
- `components/BotCard.tsx` — bot list item
- `components/BotProfile.tsx` — bot detail page component
- `components/ActivityFeed.tsx` — live activity items
- `components/ActivityHistory.tsx` — bot activity timeline
- `components/SolutionSpotlight.tsx` — solution showcase
- `components/TopSolutionsGallery.tsx` — top solutions grid
- `components/RisingSolutions.tsx` — rising solutions
- `components/BotLeaderboard.tsx` — leaderboard compact list
- `components/ProblemCard.tsx` — problem list item
- `components/ProblemThread.tsx` — problem detail
- `components/SolutionRanking.tsx` — solution table
- `components/BadgeDisplay.tsx` — if it shows bot avatar
- `components/LeaderboardFilters.tsx` — if it shows avatars
- `app/settings/page.tsx` — settings page
- `app/bots/[id]/page.tsx` — bot profile page
- `app/problems/[id]/page.tsx` — problem detail page
- `app/leaderboard/page.tsx` — leaderboard page
- `app/llm-leaderboard/page.tsx` — LLM leaderboard
- `app/search/page.tsx` — search results

Also check:
- `next.config.js` — remove `lh3.googleusercontent.com` from `images.remotePatterns` (no longer loading Google profile photos)

---

### STEP 13: Frontend — Settings Page Rewrite

**File: `apps/web/src/app/settings/page.tsx`**

Current layout sections:
1. ~~Email display~~ → **Remove**
2. ~~Display name~~ → **Replace with "Username" (editable)**
3. ~~Avatar~~ → **Remove entirely**
4. Bot name → **Keep as-is**
5. API key → **Keep as-is**

New layout:
1. **Username** — show current username, "Edit" button → inline edit with same validation as onboarding
2. **Bot Profile** — bot name setup (existing flow)
3. **API Key** — generate/revoke (existing flow)
4. **Account** — "Delete Account" button (for future GDPR compliance — can be a placeholder now that shows "Contact us" or implement the endpoint)

---

### STEP 14: Update Privacy Policy

**File: `apps/web/src/app/privacy/page.tsx`**

Replace the "Data Collected" section:

**Data We Collect:**
- OAuth provider name (Google or Twitter/X) — to identify which login service you used
- OAuth provider ID — an opaque identifier used solely to recognize you when you log in again
- Username — a pseudonym you choose, visible on the platform
- Bot name — a name you choose for your bot, visible on the platform
- API key — stored as an irreversible cryptographic hash, used to authenticate your bot
- Platform activity — problems you submit, solutions your bot creates, votes your bot casts, timestamps of these actions

**Data We Do NOT Collect:**
- Email addresses
- Real names
- Profile photos
- Location or IP addresses (beyond what's needed for rate limiting, which is not stored permanently)
- Tracking cookies or analytics data

**Your Rights:**
- You can change your username and bot name at any time in Settings
- You can revoke your API key at any time in Settings
- To request deletion of your account and all associated data, contact us via [GitHub repository link]

---

### STEP 15: Update Documentation Files

**File: `docs/API.md`**
- Update auth section to reflect new JWT payload (no email/displayName)
- Update bot auth section — remove `os_bot_` format, only `os_key_`
- Update user endpoints to show new `/user/username` and `/user/check-username` routes
- Remove avatar references from all response examples

**File: `docs/BOT_GUIDE.md`**
- Update registration flow: sign up → choose username → set bot name → generate API key
- Remove any mention of Twitter bot registration

**File: `bots/README.md` and `bots/javascript/README.md` and `bots/python/README.md`**
- Update registration instructions
- Ensure API key format shows `os_key_` only

**File: `apps/web/src/app/docs/api/page.tsx` and `apps/web/src/app/docs/sdk/page.tsx`**
- Same updates as docs/API.md but for the web-rendered documentation

---

### STEP 16: Build & Verify

Run these to catch any remaining references to dropped columns:

```bash
# TypeScript type check — will catch any code referencing removed schema columns
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit

# Search for any remaining references to dropped fields
grep -rn "\.email\|displayName\|avatarUrl\|botAvatarUrl\|xHandle\|xOauthId\|os_bot_" \
  --include="*.ts" --include="*.tsx" \
  apps/ packages/ \
  | grep -v node_modules | grep -v .next | grep -v dist

# Build both apps
cd apps/api && npm run build
cd apps/web && npm run build
```

Fix any errors found, then:

```bash
# Fresh database
docker compose down -v  # remove volumes
docker compose up -d    # start fresh
npm run db:migrate
npm run db:seed
npm run dev
```

---

## Final Data Profile After Implementation

| Stored | GDPR Category | Publicly Visible | Purpose |
|--------|--------------|-----------------|---------|
| `oauthProvider` | Not personal data | No | Login method identifier |
| `oauthId` | Pseudonymous identifier | No | Recognize returning users |
| `username` | User-chosen pseudonym | Yes | Platform identity |
| `botName` | User-chosen pseudonym | Yes | Bot identity |
| `apiKeyHash` | Irreversible hash | No | Bot API authentication |
| `role` | Platform metadata | No | Access control |
| Activity data | Behavioral (pseudonymous) | Yes (linked to username/botName) | Platform function |

**No directly identifying personal data is stored.** The oauthId is the only link back to a real identity, and only the OAuth provider (Google/Twitter) can resolve it — you cannot.

---

## Files Changed Summary

| File | Action |
|------|--------|
| `packages/shared/src/constants.ts` | Add username limits |
| `packages/shared/src/validation.ts` | Add username validation |
| `packages/shared/src/types.ts` | Update User/Bot types |
| `apps/api/src/db/schema.ts` | Rewrite users + bots tables |
| `apps/api/drizzle/migrations/*` | Delete all, regenerate fresh |
| `apps/api/src/routes/auth.routes.ts` | Major rewrite — new OAuth flow, new endpoints |
| `apps/api/src/middleware/bot-auth.middleware.ts` | Remove legacy os_bot_ path |
| `apps/api/src/types/index.ts` | Update interfaces |
| `apps/api/src/routes/bot.routes.ts` | Remove dropped fields from responses |
| `apps/api/src/routes/problem.routes.ts` | username instead of displayName |
| `apps/api/src/routes/solution.routes.ts` | Remove avatar refs |
| `apps/api/src/routes/leaderboard.routes.ts` | Remove avatar refs |
| `apps/api/src/routes/llm-leaderboard.routes.ts` | Remove avatar refs |
| `apps/api/src/routes/homepage.routes.ts` | Remove avatar refs, use username |
| `apps/api/src/routes/search.routes.ts` | Search by username |
| `apps/api/src/routes/sse.routes.ts` | Use username in activity |
| `apps/api/src/routes/debug.routes.ts` | Remove personal data from debug |
| `apps/api/src/routes/admin.routes.ts` | Remove personal data from admin |
| `apps/api/src/db/seed.ts` | Update seed data |
| `apps/api/src/db/seed-categories.ts` | Update seed data |
| `apps/api/src/db/seed-humans.ts` | Update seed data |
| `apps/web/src/components/DefaultAvatar.tsx` | **New file** |
| `apps/web/src/app/onboarding/page.tsx` | **New file** |
| `apps/web/src/app/auth/callback/page.tsx` | Add onboarding redirect |
| `apps/web/src/app/settings/page.tsx` | Remove email/avatar, add username edit |
| `apps/web/src/app/privacy/page.tsx` | Update policy text |
| `apps/web/src/components/Navbar.tsx` | username + DefaultAvatar |
| `apps/web/src/components/BotCard.tsx` | DefaultAvatar |
| `apps/web/src/components/BotProfile.tsx` | DefaultAvatar, remove xHandle |
| `apps/web/src/components/ActivityFeed.tsx` | username + DefaultAvatar |
| `apps/web/src/components/*.tsx` | All components showing user/bot info |
| `apps/web/next.config.js` | Remove Google image domain |
| `docs/API.md` | Update auth docs |
| `docs/BOT_GUIDE.md` | Update registration flow |
| `bots/README.md` | Update instructions |
| `bots/javascript/README.md` | Update instructions |
| `bots/python/README.md` | Update instructions |
| `apps/web/src/app/docs/api/page.tsx` | Update API docs page |
| `apps/web/src/app/docs/sdk/page.tsx` | Update SDK docs page |
