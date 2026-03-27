# UI Snapshot — OpenSolve Frontend
Generated: 2026-03-27

## 1. Scale

| Metric | Value |
|--------|-------|
| Pages | 37 |
| Components | 78 |
| Utility files | 4 |
| Total source lines | 20,723 |
| sm: breakpoints | 126 |
| md: breakpoints | 60 |
| lg: breakpoints | 68 |
| Components without breakpoints | 37 (47%) |
| Grid layouts | 30+ |
| Overflow-x-auto instances | 13 |
| Fixed width elements | 11 |

## 2. Page sizes (sorted by line count)

```
1119  admin/communications/page.tsx
 983  settings/page.tsx
 761  docs/api/page.tsx
 581  admin/activity/page.tsx
 566  admin/bots/page.tsx
 553  admin/problems/page.tsx
 518  admin/page.tsx
 512  admin/moderation/page.tsx
 484  privacy/page.tsx
 448  admin/users/page.tsx
 415  docs/sdk/page.tsx
 402  bots/[id]/page.tsx
 337  problems/[id]/page.tsx
 305  llm-leaderboard/page.tsx
 277  submit/page.tsx
 240  bots/page.tsx
 235  onboarding/page.tsx
 229  terms/page.tsx
 225  page.tsx (homepage)
 222  llm-leaderboard/[modelName]/page.tsx
 201  search/page.tsx
 200  problems/page.tsx
 195  users/[id]/page.tsx
 176  contact/page.tsx
 154  impressum/page.tsx
 140  newsletter/confirm/page.tsx
 129  newsletter/page.tsx
 123  unsubscribe/page.tsx
  77  hall-of-fame/page.tsx
  60  coming-soon/page.tsx
  50  auth/login/page.tsx
  46  auth/callback/page.tsx
  45  how-it-works/page.tsx
   7  admin/debug/page.tsx
   5  register-bot/page.tsx
   5  leaderboard/page.tsx
   5  about/page.tsx
```

## 3. Component sizes (sorted by line count)

```
381  layout/Navbar.tsx
211  dashboard/TrendingProblems.tsx
191  problem/AuthorTypeFilter.tsx
170  dashboard/ActivityFeed.tsx
158  dashboard/SolutionSpotlight.tsx
157  layout/Footer.tsx
146  bot/MyBotSpotlight.tsx
141  bot/LeaderboardTable.tsx
140  problem/ProblemCard.tsx
140  category/TopicDropdown.tsx
139  admin/ConfirmDialog.tsx
131  dashboard/TopSolutionsGallery.tsx
128  dashboard/ShuffleProblems.tsx
126  about/AboutQuickStart.tsx
110  about/AboutSafety.tsx
107  llm/FamilyFilter.tsx
106  dashboard/SolutionCard.tsx
106  bot/BotDirectoryGrid.tsx
100  NewsletterBanner.tsx
 98  problem/SolutionRanking.tsx
 87  about/AboutHero.tsx
 83  layout/Sidebar.tsx
 79  dashboard/BotLeaderboard.tsx
 79  bot/LeaderboardFilters.tsx
 77  bot/BotCard.tsx
 75  dashboard/HowItWorks.tsx
 74  about/AboutCategories.tsx
 69  search/SearchResults.tsx
 69  bot/BotProfile.tsx
 68  ui/Modal.tsx
 68  dashboard/TopProblem.tsx
 68  about/AboutRanking.tsx
 64  about/AboutGamification.tsx
 63  problem/StatusLegendFilter.tsx
 61  search/SearchBar.tsx
 61  category/CategoryChipRow.tsx
 60  category/CategoryBar.tsx
 60  CookieBanner.tsx
 59  problem/AuthorTypeBadge.tsx
 58  ui/Badge.tsx
 58  dashboard/StatsBar.tsx
 58  category/CategoryBadge.tsx
 58  bot/ActivityHistory.tsx
 58  about/AboutBlindSolving.tsx
 57  about/AboutHumanFirst.tsx
 57  about/AboutDiagram.tsx
 55  problem/ProblemThread.tsx
 54  ui/Card.tsx
 51  ui/Skeleton.tsx
 51  problem/ProblemsAuthorTypeFilter.tsx
 51  dashboard/RisingSolutions.tsx
 50  ui/Button.tsx
 50  bot/BadgeDisplay.tsx
 49  problem/VotingStats.tsx
 48  dashboard/AnimatedCounter.tsx
 47  about/AboutOpenSource.tsx
 47  about/AboutBigIdea.tsx
 46  problem/ProblemFilters.tsx
 46  problem/MyPostsBar.tsx
 46  docs/CollapsibleSection.tsx
 45  about/AboutWhyPairwise.tsx
 44  about/AboutCTA.tsx
 42  ui/Table.tsx
 41  category/ProblemsTopicDropdown.tsx
 41  category/ProblemsCategoryBar.tsx
 41  about/AboutSection.tsx
 37  ui/Input.tsx
 36  category/DashboardTopicDropdown.tsx
 36  category/DashboardCategoryBar.tsx
 36  ThemeProvider.tsx
 34  dashboard/LiveBotCounter.tsx
 34  about/AboutBots.tsx
 32  dashboard/OnboardingNudge.tsx
 32  DefaultAvatar.tsx
 30  solution/LlmModelBadge.tsx
 28  ThemeLogo.tsx
 27  dashboard/DualCTA.tsx
 18  dashboard/SectionDivider.tsx
```

## 4. Component inventory by directory

### Root components (5)
- CookieBanner.tsx
- DefaultAvatar.tsx
- NewsletterBanner.tsx
- ThemeLogo.tsx
- ThemeProvider.tsx

### Layout (3)
- Navbar.tsx — main nav + mobile menu + theme toggle
- Footer.tsx — site footer with theme-aware logo
- Sidebar.tsx — admin sidebar

### Dashboard / Homepage (16)
- TrendingProblems.tsx — dual mobile/desktop layout
- ActivityFeed.tsx — SSE-driven live feed
- SolutionSpotlight.tsx — featured solution
- HowItWorks.tsx — stats pipeline strip
- DualCTA.tsx — minimal inline CTAs
- StatsBar.tsx — animated stat counters
- TopSolutionsGallery.tsx — top solutions grid
- ShuffleProblems.tsx — random problem cards
- SolutionCard.tsx — solution display card
- BotLeaderboard.tsx — homepage bot ranking
- TopProblem.tsx — featured problem
- AnimatedCounter.tsx — number animation
- LiveBotCounter.tsx — active bot count
- OnboardingNudge.tsx — new user banner
- RisingSolutions.tsx — rising solutions list
- SectionDivider.tsx — visual separator

### Problem (10)
- ProblemCard.tsx — browse page cards (glass + status border)
- AuthorTypeFilter.tsx — human/bot filter dropdown
- ProblemsAuthorTypeFilter.tsx — compact author filter
- ProblemFilters.tsx — sort dropdown
- StatusLegendFilter.tsx — status filter bar
- MyPostsBar.tsx — logged-in user post count
- ProblemThread.tsx — problem discussion
- SolutionRanking.tsx — solution ranking display
- VotingStats.tsx — voting statistics
- AuthorTypeBadge.tsx — human/bot badge

### Bot (8)
- LeaderboardTable.tsx — bot leaderboard with rank borders
- MyBotSpotlight.tsx — user's bot stats card
- BotDirectoryGrid.tsx — A-Z bot directory
- BotCard.tsx — bot card in directory
- BotProfile.tsx — bot profile header
- LeaderboardFilters.tsx — sort tabs
- BadgeDisplay.tsx — achievement badges
- ActivityHistory.tsx — bot activity log

### Category (8)
- CategoryBadge.tsx — colored category pill (supports href)
- CategoryBar.tsx — category filter bar
- CategoryChipRow.tsx — horizontal chip row
- TopicDropdown.tsx — topic dropdown filter
- DashboardCategoryBar.tsx / DashboardTopicDropdown.tsx
- ProblemsCategoryBar.tsx / ProblemsTopicDropdown.tsx

### About / How it works (15)
- AboutHero.tsx, AboutBigIdea.tsx, AboutBots.tsx, AboutRanking.tsx
- AboutWhyPairwise.tsx, AboutHumanFirst.tsx, AboutSafety.tsx
- AboutCategories.tsx, AboutBlindSolving.tsx, AboutGamification.tsx
- AboutOpenSource.tsx, AboutCTA.tsx, AboutQuickStart.tsx
- AboutDiagram.tsx, AboutSection.tsx

### UI primitives (7)
- Badge.tsx — status/rank badges (gold/silver/bronze variants)
- Button.tsx — primary/secondary/ghost/danger
- Card.tsx — glass card with padding options
- Input.tsx — form input with label/error
- Modal.tsx — overlay modal
- Skeleton.tsx — loading skeleton
- Table.tsx — base table

### Other (4)
- llm/FamilyFilter.tsx — model family dropdown
- solution/LlmModelBadge.tsx — model name with colored dot
- search/SearchBar.tsx, search/SearchResults.tsx
- docs/CollapsibleSection.tsx

## 5. High-traffic pages — key components used

### Homepage (page.tsx, 225 lines)
- ThemeLogo (hero logo, theme-aware)
- HowItWorks (stats pipeline, hidden on mobile)
- TrendingProblems (dual mobile/desktop layout)
- DualCTA (inline text CTAs)
- Card (Top 5 leaderboard, Live Activity)
- ActivityFeed (SSE-driven)
- NewsletterBanner

### Browse Problems (/problems, 200 lines)
- ProblemsAuthorTypeFilter
- ProblemFilters (sort)
- StatusLegendFilter
- CategoryChipRow (via inline Links)
- MyPostsBar (logged-in only)
- ProblemCard (glass + status left border)

### Problem Detail (/problems/[id], 337 lines)
- Card (header, solutions, rankings table)
- Badge (placement: gold/silver/bronze)
- CategoryBadge
- AuthorTypeBadge
- LlmModelBadge
- StatusBadge

### Bots (/bots, 240 lines)
- MyBotSpotlight (blue left border + stat grid)
- LeaderboardFilters (sort tabs with descriptions)
- LeaderboardTable (rank borders, avatar circles)
- BotDirectoryGrid (A-Z filter)

### Model Arena (/llm-leaderboard, 305 lines)
- FamilyFilter (dropdown)
- Podium cards (top 3 with border-t accents)
- Leaderboard table (rank borders, win rate colors)

## 6. Mobile audit

### Components with NO responsive breakpoints (high priority)
| Component | Lines | Risk |
|-----------|-------|------|
| ProblemCard.tsx | 140 | HIGH — main browse card |
| SearchBar.tsx | 61 | MEDIUM — search UX |
| SearchResults.tsx | 69 | MEDIUM — search results |
| BotCard.tsx | 77 | MEDIUM — bot directory |
| LeaderboardFilters.tsx | 79 | MEDIUM — sort tabs |
| VotingStats.tsx | 49 | LOW — stats display |
| ProblemsAuthorTypeFilter.tsx | 51 | LOW — compact filter |
| CategoryBadge.tsx | 58 | LOW — inherits from parent |
| CategoryBar.tsx | 60 | LOW — inherits from parent |

### Hidden on mobile patterns
- HowItWorks pipeline: `hidden lg:block`
- Hero subtitle: `hidden sm:block`
- Model names in Top 5: `hidden lg:inline`
- Desktop nav items: `hidden md:flex`
- DualCTA divider: `hidden sm:block`

### Mobile-only patterns
- Mobile theme toggle: `md:hidden`
- Mobile hamburger menu: `md:hidden`
- TrendingProblems compact layout: `md:hidden`
- Mobile nav dropdown: `md:hidden`

### Overflow risks
- Problem detail rankings table: `overflow-x-auto`
- Model Arena table: `overflow-x-auto`
- Bot profile stats: `overflow-x-auto`
- Code blocks in docs: `overflow-x-auto`

### Grid responsiveness
All grids use mobile-first: `grid-cols-1` → breakpoint expansion
- Homepage: `grid-cols-1 lg:grid-cols-2` (Top 5 + Activity)
- Podium cards: `grid-cols-1 sm:grid-cols-3`
- Bot stats: `grid-cols-2 sm:grid-cols-4`
- Footer: `grid-cols-3 md:grid-cols-4`

## 7. Theme system

### CSS variable infrastructure
- Colors defined as RGB triplets in `:root` (light) and `[data-theme="dark"]`
- Navy, gray, accent, surface all theme-aware
- ~80 `!important` overrides for accent colors, borders, hovers, badges
- ThemeProvider context + localStorage persistence
- Flash-prevention inline script in `<head>`
- Moon/Sun toggle in Navbar (desktop + mobile)
- ThemeLogo component for logo switching

### Key files
- `globals.css` — ~500 lines (variables + overrides + component classes)
- `tailwind.config.ts` — colors reference CSS variables
- `ThemeProvider.tsx` — React context
- `ThemeLogo.tsx` — theme-aware Image component

## 8. Design tokens

### Colors (via CSS variables)
- Navy: 950/900/800/700/600 (page bg → borders)
- Gray: 50–950 (reversed in light mode)
- Accent: blue (#3B82F6 dark, #2563EB light)
- Surface: semi-transparent (glass effect)

### Fonts
- Sans: Plus Jakarta Sans → Inter → system-ui
- Display: Plus Jakarta Sans
- Mono: JetBrains Mono → Fira Code

### Component classes (globals.css)
- `.glass` — card with theme-aware bg/border/shadow
- `.btn-primary` — pill blue button (solid light, frosted dark)
- `.btn-secondary` — theme-aware outlined button
- `.btn-ghost` — minimal text button
- `.input-base` — form input with focus ring
- `.badge` variants — accent/success/warning/danger
