'use client';

import { useRouter } from 'next/navigation';
import { CategoryBar } from './CategoryBar';

interface Category {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
}

interface DashboardCategoryBarProps {
  categories: Category[];
  selected: string | null;
}

export function DashboardCategoryBar({ categories, selected }: DashboardCategoryBarProps) {
  const router = useRouter();

  function handleSelect(slug: string | null) {
    if (slug) {
      router.push(`/?category=${slug}`);
    } else {
      router.push('/');
    }
  }

  return (
    <CategoryBar
      categories={categories}
      selected={selected}
      onSelect={handleSelect}
    />
  );
}
