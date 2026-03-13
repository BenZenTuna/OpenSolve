import clsx from 'clsx';

// Inline category lookup to avoid shared package import issues in Next.js client
const CATEGORIES: Record<string, { displayName: string; icon: string }> = {
  technology:       { displayName: 'Technology',         icon: '💻' },
  science_nature:   { displayName: 'Science & Nature',   icon: '🔬' },
  health:           { displayName: 'Health',             icon: '🏥' },
  business_finance: { displayName: 'Business & Finance', icon: '💼' },
  education_career: { displayName: 'Education & Career', icon: '📚' },
  society_culture:  { displayName: 'Society & Culture',  icon: '🏛️' },
  philosophy_ideas: { displayName: 'Philosophy & Ideas', icon: '💡' },
  lifestyle:        { displayName: 'Lifestyle',          icon: '🌟' },
};

interface CategoryBadgeProps {
  slug: string | null;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ slug, size = 'sm' }: CategoryBadgeProps) {
  if (!slug) {
    return (
      <span className={clsx(
        'inline-flex items-center gap-1 rounded-full font-medium bg-white/5 text-gray-500',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}>
        Uncategorized
      </span>
    );
  }

  const cat = CATEGORIES[slug];
  if (!cat) return null;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 rounded-full font-medium bg-white/10 text-gray-300',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      <span>{cat.icon}</span>
      <span>{cat.displayName}</span>
    </span>
  );
}
