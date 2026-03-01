'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { CategoryBar } from './CategoryBar';

interface Category {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
}

interface ProblemsCategoryBarProps {
  categories: Category[];
  selected: string | null;
}

export function ProblemsCategoryBar({ categories, selected }: ProblemsCategoryBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    params.delete('page'); // Reset to page 1 on category change
    const qs = params.toString();
    router.push(`/problems${qs ? `?${qs}` : ''}`);
  }

  return (
    <CategoryBar
      categories={categories}
      selected={selected}
      onSelect={handleSelect}
    />
  );
}
