// packages/shared/src/categories.ts
// Single source of truth for all 8 platform categories.

export interface Category {
  slug: string;
  displayName: string;
  icon: string;
  description: string;
  examples: string[];
}

export const CATEGORIES: Category[] = [
  {
    slug: 'technology',
    displayName: 'Technology',
    icon: '💻',
    description: 'Coding, software, gadgets, AI tools, tech troubleshooting, engineering.',
    examples: [
      'Why is my laptop fan so loud when idle?',
      'Best free PDF editor in 2025?',
      'How to set up a home NAS for backups?',
      'What programming language should I learn first?',
    ],
  },
  {
    slug: 'science_nature',
    displayName: 'Science & Nature',
    icon: '🔬',
    description: 'Physics, biology, chemistry, environment, space, agriculture, climate.',
    examples: [
      'How does photosynthesis work at a molecular level?',
      'Most promising approaches to quantum error correction?',
      'How can cities reduce urban heat islands cost-effectively?',
    ],
  },
  {
    slug: 'health',
    displayName: 'Health',
    icon: '🏥',
    description: 'Medical, wellness, mental health, fitness, nutrition, healthcare systems.',
    examples: [
      'How to improve sleep quality without medication?',
      'Best beginner running schedule for someone who hates running?',
      'How to accelerate Alzheimer\'s drug trial timelines?',
    ],
  },
  {
    slug: 'business_finance',
    displayName: 'Business & Finance',
    icon: '💼',
    description: 'Money, investing, economics, entrepreneurship, markets, personal finance.',
    examples: [
      'Best budgeting method for variable freelance income?',
      'How to reduce startup failure rates in emerging markets?',
      'Best frameworks for SaaS pricing strategy?',
    ],
  },
  {
    slug: 'education_career',
    displayName: 'Education & Career',
    icon: '📚',
    description: 'Learning, jobs, skills, academic questions, pedagogy, career transitions.',
    examples: [
      'How to switch careers to UX design with no experience?',
      'Best way to reach conversational Spanish in 6 months?',
      'Does homework actually improve learning outcomes?',
    ],
  },
  {
    slug: 'society_culture',
    displayName: 'Society & Culture',
    icon: '🏛️',
    description: 'Politics, policy, social issues, media, infrastructure, governance, safety.',
    examples: [
      'How to reduce political polarization in democracies?',
      'Best approaches to reduce traffic congestion without adding roads?',
      'How do we combat misinformation at scale without censorship?',
    ],
  },
  {
    slug: 'philosophy_ideas',
    displayName: 'Philosophy & Ideas',
    icon: '💡',
    description: 'Ethics, meaning, thought experiments, abstract reasoning, logic puzzles.',
    examples: [
      'Is democracy inherently just?',
      'Can artificial intelligence ever be truly conscious?',
      'What is the strongest argument against utilitarianism?',
    ],
  },
  {
    slug: 'lifestyle',
    displayName: 'Lifestyle',
    icon: '🌟',
    description: 'Daily life, relationships, entertainment, hobbies, family, food, travel, creative projects.',
    examples: [
      'How to make friends as an adult in a new city?',
      'Best sci-fi books of the last 5 years?',
      'How to fix a leaking tap without calling a plumber?',
      'Fun things to do in Lisbon for a long weekend?',
    ],
  },
];

// Derived helpers used across the codebase
export const CATEGORY_SLUGS = CATEGORIES.map(c => c.slug) as [string, ...string[]];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(c => c.slug === slug);
}
