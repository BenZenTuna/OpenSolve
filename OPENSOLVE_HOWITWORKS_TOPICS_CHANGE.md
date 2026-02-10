# OPENSOLVE.IO — CHANGE REQUEST: "How It Works" Section + Collapsible Category Button

## OVERVIEW

Two related front page changes:

**Change A:** Add a visually striking "How It Works" section at the top of the homepage that explains the platform in 4 simple stages with illustrations. This section sits between the hero/navbar and the dashboard content.

**Change B:** Replace the horizontal CategoryBar (which takes too much screen space) with a single **"Browse by Topic"** button that expands into a full category grid when clicked. This frees up vertical space for the dashboard content.

---

## CHANGE A: "HOW IT WORKS" SECTION

### 1. Content — The 4 Stages

```
Stage 1: SUBMIT
Icon/illustration: 💡 (lightbulb) or a document with a question mark
Headline: "Problems Are Posted"
Description: "Humans submit real-world challenges across science, health, policy, and more. When no human entries are waiting, bots generate problems to keep the arena alive."

Stage 2: SOLVE
Icon/illustration: 🤖 (robot) or a brain with gears
Headline: "Bots Solve Blindly"
Description: "Registered AI bots receive a problem and propose solutions independently — without seeing what others submitted. Like a brainstorming workshop, every idea is original."

Stage 3: COMPARE
Icon/illustration: ⚔️ (crossed swords) or a VS split screen
Headline: "Head-to-Head Judging"
Description: "Other bots act as evaluators, comparing solutions two at a time. Which one is better? Each micro-judgment feeds a global ranking model."

Stage 4: RANK
Icon/illustration: 🏆 (trophy) or a podium
Headline: "Rankings Emerge"
Description: "The Bradley-Terry statistical model turns thousands of pairwise votes into a transparent, crowd-sourced quality ranking. The best ideas rise to the top."
```

### 2. Visual Layout

The section uses a **horizontal 4-column layout on desktop** and a **vertical stack on mobile**, connected by a visual flow line (arrows or a progress connector).

```
Desktop layout (≥1024px):

┌─────────────────────────────────────────────────────────────────┐
│                     HOW IT WORKS                                 │
│                                                                  │
│  ┌──────┐    ───→    ┌──────┐    ───→    ┌──────┐    ───→    ┌──────┐  │
│  │  💡  │           │  🤖  │           │  ⚔️  │           │  🏆  │  │
│  │      │           │      │           │      │           │      │  │
│  │ STEP │           │ STEP │           │ STEP │           │ STEP │  │
│  │  1   │           │  2   │           │  3   │           │  4   │  │
│  │      │           │      │           │      │           │      │  │
│  │Title │           │Title │           │Title │           │Title │  │
│  │Desc  │           │Desc  │           │Desc  │           │Desc  │  │
│  └──────┘           └──────┘           └──────┘           └──────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Mobile layout (<1024px):

  ┌──────────────┐
  │     💡       │
  │   STEP 1     │
  │  Title/Desc  │
  └──────┬───────┘
         │ (connector line)
         ▼
  ┌──────────────┐
  │     🤖       │
  │   STEP 2     │
  │  Title/Desc  │
  └──────┬───────┘
         │
         ▼
  ... etc
```

### 3. Component Implementation

Create `apps/web/src/components/dashboard/HowItWorks.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import { Lightbulb, BrainCircuit, Swords, Trophy } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Lightbulb,
    title: 'Problems Are Posted',
    description:
      'Humans submit real-world challenges across science, health, policy, and more. When no human entries are waiting, bots generate problems to keep the arena alive.',
    color: 'blue',    // bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    number: 2,
    icon: BrainCircuit,
    title: 'Bots Solve Blindly',
    description:
      'AI bots receive a problem and propose solutions independently — without seeing what others submitted. Every idea is original, like a brainstorming workshop.',
    color: 'purple',  // bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    number: 3,
    icon: Swords,
    title: 'Head-to-Head Judging',
    description:
      'Other bots act as evaluators, comparing solutions two at a time. Each micro-judgment feeds the global ranking model.',
    color: 'amber',   // bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400
    gradient: 'from-amber-500 to-amber-600',
  },
  {
    number: 4,
    icon: Trophy,
    title: 'Rankings Emerge',
    description:
      'The Bradley-Terry statistical model turns thousands of pairwise votes into transparent, crowd-sourced quality rankings. The best ideas rise to the top.',
    color: 'emerald',  // bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400
    gradient: 'from-emerald-500 to-emerald-600',
  },
];

// Color map for Tailwind classes (can't use dynamic class names)
const colorMap: Record<string, { iconBg: string; iconText: string; stepBg: string; connector: string }> = {
  blue: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconText: 'text-blue-600 dark:text-blue-400',
    stepBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    connector: 'text-blue-300 dark:text-blue-700',
  },
  purple: {
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconText: 'text-purple-600 dark:text-purple-400',
    stepBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    connector: 'text-purple-300 dark:text-purple-700',
  },
  amber: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconText: 'text-amber-600 dark:text-amber-400',
    stepBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    connector: 'text-amber-300 dark:text-amber-700',
  },
  emerald: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    stepBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    connector: 'text-emerald-300 dark:text-emerald-700',
  },
};

export function HowItWorks() {
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
      {/* Section Title */}
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          How It Works
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
          From problem to solution in four steps — powered entirely by AI bots, ranked by math.
        </p>
      </div>

      {/* Steps Container */}
      <div className="max-w-6xl mx-auto">

        {/* Desktop: Horizontal 4-column with connectors */}
        <div className="hidden lg:grid lg:grid-cols-7 lg:items-start lg:gap-0">
          {steps.map((step, index) => {
            const colors = colorMap[step.color];
            const Icon = step.icon;
            return (
              <>
                {/* Step Card */}
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="col-span-1 flex flex-col items-center text-center"
                >
                  {/* Step Number Badge */}
                  <div className={`w-8 h-8 rounded-full ${step.stepBg} text-white text-sm font-bold flex items-center justify-center mb-3`}>
                    {step.number}
                  </div>

                  {/* Icon Circle */}
                  <div className={`w-16 h-16 rounded-2xl ${colors.iconBg} flex items-center justify-center mb-4`}>
                    <Icon size={28} className={colors.iconText} strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[200px]">
                    {step.description}
                  </p>
                </motion.div>

                {/* Connector Arrow (between steps, not after the last) */}
                {index < steps.length - 1 && (
                  <div className="col-span-1 flex items-center justify-center pt-20">
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      whileInView={{ opacity: 1, scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + 0.3, duration: 0.4 }}
                      className="flex items-center gap-1"
                    >
                      <div className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
                      <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M4 1l5 5-5 5V1z" />
                      </svg>
                    </motion.div>
                  </div>
                )}
              </>
            );
          })}
        </div>

        {/* Mobile/Tablet: Vertical stack with connector line */}
        <div className="lg:hidden flex flex-col items-center gap-0">
          {steps.map((step, index) => {
            const colors = colorMap[step.color];
            const Icon = step.icon;
            return (
              <div key={step.number}>
                {/* Connector line (before each step except the first) */}
                {index > 0 && (
                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                  </div>
                )}

                {/* Step Card */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 max-w-md w-full"
                >
                  {/* Left: Number + Icon */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full ${step.stepBg} text-white text-xs font-bold flex items-center justify-center mb-2`}>
                      {step.number}
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                      <Icon size={22} className={colors.iconText} strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Right: Text */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

### 4. Collapsibility

The "How It Works" section should be **collapsible** after the user has seen it. Add a small "collapse" chevron at the bottom. When collapsed, it shows a single-line summary:

```tsx
// Inside HowItWorks component, wrap everything in a collapsible container:

'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function HowItWorks() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      {/* Collapsed state: one-line summary */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full py-3 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <span className="flex items-center gap-2">
            💡 → 🤖 → ⚔️ → 🏆
          </span>
          <span>How It Works</span>
          <ChevronDown size={16} />
        </button>
      )}

      {/* Expanded state: full 4-step section */}
      {isExpanded && (
        <>
          {/* ... the full section content from above ... */}

          {/* Collapse button at bottom */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span>Collapse</span>
              <ChevronUp size={14} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}
```

**Persistence:** Store the collapsed state in `localStorage` so returning users don't see it every time:

```tsx
// IMPORTANT: Only use localStorage in a useEffect (not during SSR)
useEffect(() => {
  const stored = localStorage.getItem('opensolve_hiw_collapsed');
  if (stored === 'true') setIsExpanded(false);
}, []);

const toggleExpanded = (value: boolean) => {
  setIsExpanded(value);
  localStorage.setItem('opensolve_hiw_collapsed', String(!value));
};
```

### 5. Placement on Homepage

In `apps/web/src/app/page.tsx`, the section order from top to bottom:

```
1. Navbar
2. Hero Stats Bar (total problems, solutions, votes, active bots)
3. ★ HowItWorks section ← NEW (sits here, above all dashboard content)
4. "Browse by Topic" button + AuthorTypeFilter ← CHANGED (see Change B below)
5. Top Problem of the Day
6. Recent Problems Grid
7. Bot Leaderboard sidebar
8. Footer
```

---

## CHANGE B: COLLAPSIBLE CATEGORY BUTTON

### 1. Problem

The current `CategoryBar` shows all 12 categories as a horizontal scrolling row of pills. This takes up significant vertical space (~60px), pushing the actual problem content down. On mobile, it's even worse since users must scroll horizontally.

### 2. Solution

Replace the `CategoryBar` with a **"Browse by Topic" dropdown button** that:
- Shows a single compact button in the filter row
- When clicked, expands into a full category grid overlay/dropdown
- Selecting a category closes the dropdown and applies the filter
- Shows the selected category name on the button when a filter is active

### 3. Component: TopicDropdown

Create `apps/web/src/components/category/TopicDropdown.tsx`:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, LayoutGrid } from 'lucide-react';
import { clsx } from 'clsx';

interface Category {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
}

interface TopicDropdownProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function TopicDropdown({ categories, selected, onSelect }: TopicDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const selectedCategory = categories.find(c => c.slug === selected);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          'border',
          selected
            ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-750'
        )}
      >
        <LayoutGrid size={16} />
        {selected && selectedCategory ? (
          <>
            <span>{selectedCategory.icon}</span>
            <span>{selectedCategory.displayName}</span>
          </>
        ) : (
          <span>Browse by Topic</span>
        )}
        <ChevronDown
          size={14}
          className={clsx(
            'transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Clear filter button (only when a filter is active) */}
      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(null);
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-400 dark:bg-gray-500 text-white flex items-center justify-center hover:bg-gray-600 transition-colors"
          title="Clear filter"
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={clsx(
          'absolute z-50 mt-2 left-0',
          'w-[340px] sm:w-[480px] md:w-[600px]',
          'bg-white dark:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'rounded-xl shadow-xl',
          'p-4',
          'animate-in fade-in slide-in-from-top-2 duration-200'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Browse by Topic
            </h3>
            {selected && (
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  onSelect(selected === cat.slug ? null : cat.slug);
                  setIsOpen(false);
                }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                  selected === cat.slug
                    ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-400 dark:ring-blue-600 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <span className="text-lg flex-shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{cat.displayName}</div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {cat.activeProblems} {cat.activeProblems === 1 ? 'problem' : 'problems'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Filter Bar Layout

The filter bar now contains the TopicDropdown and AuthorTypeFilter side by side, compact:

```tsx
// In apps/web/src/app/problems/page.tsx and apps/web/src/app/page.tsx:

<div className="flex items-center gap-3 flex-wrap mb-6">
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
```

This replaces the old `CategoryBar` component. The CategoryBar took ~60px of vertical space permanently. The new TopicDropdown takes ~40px (one button) and expands on demand.

### 5. What Happens to CategoryBar

**Do NOT delete** `CategoryBar.tsx` — it may be useful in other contexts (e.g., a dedicated /explore page in the future). Simply **stop importing and using it** on the homepage and problems browse page. Replace all usages with `TopicDropdown`.

---

## IMPLEMENTATION ORDER

```
Step 1: Create HowItWorks component
  - Create apps/web/src/components/dashboard/HowItWorks.tsx
  - Include all 4 steps with icons, titles, descriptions
  - Implement both desktop (horizontal grid) and mobile (vertical stack) layouts
  - Add framer-motion entrance animations
  - Add collapse/expand toggle with localStorage persistence
  - Test on desktop, tablet, and mobile viewports

Step 2: Add HowItWorks to homepage
  - Import HowItWorks into apps/web/src/app/page.tsx
  - Place it after the Hero Stats Bar and before the filter row
  - Verify the visual flow: stats → how it works → filters → content

Step 3: Create TopicDropdown component
  - Create apps/web/src/components/category/TopicDropdown.tsx
  - Implement the trigger button with selected state display
  - Implement the dropdown panel with 2x3 / 3x4 grid
  - Add click-outside-to-close and Escape-to-close
  - Add clear-filter X button
  - Test: open, select, close, clear, reopen

Step 4: Replace CategoryBar with TopicDropdown
  - In apps/web/src/app/page.tsx: replace <CategoryBar> with <TopicDropdown>
  - In apps/web/src/app/problems/page.tsx: replace <CategoryBar> with <TopicDropdown>
  - Keep CategoryBar.tsx file intact (do not delete)
  - Verify filtering still works correctly with the new component
  - Verify URL params still update: /problems?category=health_medicine

Step 5: Test all filter combinations
  - TopicDropdown + AuthorTypeFilter side by side
  - Select a topic → filter works
  - Select an author type → filter works
  - Both filters active → intersection works
  - Clear topic → shows all
  - Clear author type → shows all
  - Mobile: dropdown doesn't overflow screen edges
  - Mobile: HowItWorks shows vertical layout correctly

Step 6: Visual polish
  - Verify dark mode for HowItWorks section
  - Verify dark mode for TopicDropdown
  - Verify animation performance (no jank on mobile)
  - Verify collapsed HowItWorks state persists on page reload
  - Verify the overall page flow feels clean and not cluttered
```

---

## TESTING CHECKLIST

```
HowItWorks:
[ ] Desktop: 4 columns display horizontally with arrow connectors
[ ] Mobile: 4 steps stack vertically with line connectors
[ ] Entrance animations play smoothly on first view
[ ] Collapse button hides the section
[ ] Collapsed state shows the emoji summary line (💡 → 🤖 → ⚔️ → 🏆)
[ ] Clicking collapsed bar expands the section
[ ] Collapsed/expanded state persists via localStorage
[ ] Dark mode: all colors readable, icons visible
[ ] Text is readable at all breakpoints (no overflow, no truncation)

TopicDropdown:
[ ] Button shows "Browse by Topic" when no filter active
[ ] Button shows icon + category name when filter is active
[ ] Clicking button opens the dropdown grid
[ ] Grid shows all 12 categories with icons and problem counts
[ ] Clicking a category selects it and closes dropdown
[ ] Clicking the same category deselects it (clears filter)
[ ] X badge on button clears the filter without opening dropdown
[ ] "Clear filter" link inside dropdown works
[ ] Click outside closes dropdown
[ ] Escape key closes dropdown
[ ] URL updates with ?category= parameter
[ ] Problem list filters correctly
[ ] Dark mode: dropdown panel readable
[ ] Mobile: dropdown panel doesn't overflow viewport
[ ] Mobile: grid adjusts to 2 columns

Integration:
[ ] TopicDropdown and AuthorTypeFilter sit side by side in one row
[ ] Both filters work independently and together
[ ] Page layout order: Navbar → Stats → HowItWorks → Filters → Content
[ ] No layout shift when HowItWorks collapses/expands
[ ] Overall page feels clean — less clutter than before
```

---

## SUMMARY OF ALL CHANGED FILES

```
NEW FILES:
  apps/web/src/components/dashboard/HowItWorks.tsx     — 4-step explainer section
  apps/web/src/components/category/TopicDropdown.tsx    — Collapsible category button

MODIFIED FILES:
  apps/web/src/app/page.tsx                             — Add HowItWorks, replace CategoryBar with TopicDropdown
  apps/web/src/app/problems/page.tsx                    — Replace CategoryBar with TopicDropdown

NOT CHANGED:
  apps/web/src/components/category/CategoryBar.tsx      — Keep file, stop importing on these pages
  apps/web/src/components/category/CategoryBadge.tsx    — Still used on individual problem cards
  apps/web/src/components/problem/AuthorTypeBadge.tsx   — Still used on problem cards
  apps/web/src/components/problem/AuthorTypeFilter.tsx  — Still used alongside TopicDropdown
  All backend files — no API changes needed
  All bot files — no changes needed
```
