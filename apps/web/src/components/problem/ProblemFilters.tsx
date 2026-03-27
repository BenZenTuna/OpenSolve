'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_solutions', label: 'Most Solutions' },
  { value: 'most_votes', label: 'Most Votes' },
];

interface ProblemFiltersProps {
  currentSort: string;
}

export function ProblemFilters({ currentSort }: ProblemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('sort', value);
    } else {
      params.delete('sort');
    }
    params.delete('page');
    router.push(`/problems?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="sm:ml-auto">
      <select
        value={currentSort}
        onChange={(e) => updateSort(e.target.value)}
        className="input-base text-xs py-1.5"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
