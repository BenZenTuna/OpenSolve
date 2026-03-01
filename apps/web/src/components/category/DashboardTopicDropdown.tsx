'use client';

import { useRouter } from 'next/navigation';
import { TopicDropdown } from './TopicDropdown';

interface Category {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
}

interface DashboardTopicDropdownProps {
  categories: Category[];
  selected: string | null;
}

export function DashboardTopicDropdown({ categories, selected }: DashboardTopicDropdownProps) {
  const router = useRouter();

  function handleSelect(slug: string | null) {
    if (slug) {
      router.push(`/?category=${slug}`);
    } else {
      router.push('/');
    }
  }

  return (
    <TopicDropdown
      categories={categories}
      selected={selected}
      onSelect={handleSelect}
    />
  );
}
