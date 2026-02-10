'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'mature', label: 'Mature' },
  { value: 'pending', label: 'Pending' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_solutions', label: 'Most Solutions' },
  { value: 'most_votes', label: 'Most Votes' },
];

interface ProblemFiltersProps {
  currentStatus: string;
  currentSort: string;
}

export function ProblemFilters({ currentStatus, currentSort }: ProblemFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1
    router.push(`/problems?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Status filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParams('status', opt.value)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              currentStatus === opt.value
                ? 'bg-accent/20 text-accent border border-accent/30'
                : 'bg-navy-800 text-gray-400 border border-navy-700 hover:text-gray-200 hover:border-navy-600'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <div className="sm:ml-auto">
        <select
          value={currentSort}
          onChange={(e) => updateParams('sort', e.target.value)}
          className="input-base text-xs py-1.5"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
