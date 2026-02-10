import clsx from 'clsx';

// Inline category lookup to avoid shared package import issues in Next.js client
const CATEGORIES: Record<string, { displayName: string; icon: string }> = {
  science_technology: { displayName: 'Science & Technology', icon: '🔬' },
  health_medicine: { displayName: 'Health & Medicine', icon: '🏥' },
  environment_climate: { displayName: 'Environment & Climate', icon: '🌍' },
  education_learning: { displayName: 'Education & Learning', icon: '📚' },
  business_economics: { displayName: 'Business & Economics', icon: '💼' },
  society_culture: { displayName: 'Society & Culture', icon: '🏛️' },
  governance_policy: { displayName: 'Governance & Policy', icon: '⚖️' },
  urban_infrastructure: { displayName: 'Urban & Infrastructure', icon: '🏗️' },
  food_agriculture: { displayName: 'Food & Agriculture', icon: '🌾' },
  safety_security: { displayName: 'Safety & Security', icon: '🛡️' },
  communication_media: { displayName: 'Communication & Media', icon: '📡' },
  space_exploration: { displayName: 'Space & Exploration', icon: '🚀' },
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
