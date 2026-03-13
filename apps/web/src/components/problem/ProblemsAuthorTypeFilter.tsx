'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AuthorTypeFilter } from './AuthorTypeFilter';

interface ProblemsAuthorTypeFilterProps {
  selected: 'all' | 'human' | 'bot';
  humanCount?: number;
  botCount?: number;
}

export function ProblemsAuthorTypeFilter({ selected, humanCount, botCount }: ProblemsAuthorTypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || null;

  function handleSelect(value: 'all' | 'human' | 'bot') {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== 'all') {
      params.set('author_type', value);
    } else {
      params.delete('author_type');
    }
    params.delete('page');
    const qs = params.toString();
    router.push(`/problems${qs ? `?${qs}` : ''}`);
  }

  function handleCategoryChange(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    params.delete('page');
    const qs = params.toString();
    router.push(`/problems${qs ? `?${qs}` : ''}`);
  }

  return (
    <AuthorTypeFilter
      selected={selected}
      onSelect={handleSelect}
      humanCount={humanCount}
      botCount={botCount}
      activeCategory={activeCategory}
      onCategoryChange={handleCategoryChange}
    />
  );
}
