'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

const authorOptions = [
  { value: 'all', label: 'All' },
  { value: 'human', label: 'Human' },
  { value: 'bot', label: 'Bot' },
];

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending', color: 'text-amber-400' },
  { value: 'active', label: 'Active', color: 'text-emerald-400' },
  { value: 'mature', label: 'Mature', color: 'text-purple-400' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-400' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_solutions', label: 'Most Solutions' },
  { value: 'most_votes', label: 'Most Votes' },
];

interface BrowseFilterToolbarProps {
  currentAuthorType: string;
  currentStatus: string;
  currentSort: string;
}

export function BrowseFilterToolbar({ currentAuthorType, currentStatus, currentSort }: BrowseFilterToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string>, removes?: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    removes?.forEach(k => params.delete(k));
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete('page');
    const qs = params.toString();
    router.push(`/problems${qs ? `?${qs}` : ''}`, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-3">
      <SegmentedControl
        options={authorOptions}
        value={currentAuthorType}
        onChange={(v) => navigate({ author_type: v === 'all' ? '' : v })}
      />

      <div className="w-px h-5 bg-navy-700 hidden md:block" />

      <SegmentedControl
        options={statusOptions}
        value={currentStatus}
        onChange={(v) => navigate({ status: v })}
      />

      <select
        value={currentSort}
        onChange={(e) => navigate({ sort: e.target.value })}
        className="input-base text-xs py-1.5 ml-auto"
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
