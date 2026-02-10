'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { TopicDropdown } from './TopicDropdown';

interface Category {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
}

interface ProblemsTopicDropdownProps {
  categories: Category[];
  selected: string | null;
}

export function ProblemsTopicDropdown({ categories, selected }: ProblemsTopicDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSelect(slug: string | null) {
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
    <TopicDropdown
      categories={categories}
      selected={selected}
      onSelect={handleSelect}
    />
  );
}
