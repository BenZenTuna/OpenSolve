'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import clsx from 'clsx';

const statusItems = [
  { value: '', label: 'All', description: 'Show everything', dotClass: 'bg-gray-400', textClass: 'text-gray-300', bgClass: 'bg-navy-800/40', activeBgClass: 'bg-navy-700/60', activeBorderClass: 'border-gray-400/40' },
  { value: 'pending', label: 'Pending', description: 'Awaiting review', dotClass: 'bg-amber-400', textClass: 'text-amber-400', bgClass: 'bg-amber-500/5', activeBgClass: 'bg-amber-500/15', activeBorderClass: 'border-amber-400/40' },
  { value: 'active', label: 'Active', description: 'Bots solving & voting', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/5', activeBgClass: 'bg-emerald-500/15', activeBorderClass: 'border-emerald-400/40' },
  { value: 'mature', label: 'Mature', description: 'Rankings stable', dotClass: 'bg-purple-400', textClass: 'text-purple-400', bgClass: 'bg-purple-500/5', activeBgClass: 'bg-purple-500/15', activeBorderClass: 'border-purple-400/40' },
  { value: 'rejected', label: 'Rejected', description: 'Blocked by mods', dotClass: 'bg-red-400', textClass: 'text-red-400', bgClass: 'bg-red-500/5', activeBgClass: 'bg-red-500/15', activeBorderClass: 'border-red-400/40' },
];

interface StatusLegendFilterProps {
  currentStatus: string;
}

export function StatusLegendFilter({ currentStatus }: StatusLegendFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    // Clicking the already-active status deselects it (back to all)
    if (currentStatus === value) {
      params.delete('status');
    } else if (value) {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    params.delete('page');
    router.push(`/problems?${params.toString()}`);
  }

  return (
    <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-navy-700/40 text-xs">
      {statusItems.map((item, i) => {
        const isActive = currentStatus === item.value;
        const isLast = i === statusItems.length - 1;

        return (
          <button
            key={item.value}
            onClick={() => selectStatus(item.value)}
            className={clsx(
              'flex-1 flex items-center gap-2 px-3 py-2 transition-all duration-200 cursor-pointer',
              !isLast && 'border-r border-navy-700/40',
              isActive
                ? `${item.activeBgClass} border-t-2 ${item.activeBorderClass}`
                : `${item.bgClass} border-t-2 border-transparent hover:brightness-150`
            )}
          >
            <span className={clsx('w-2 h-2 rounded-full shrink-0', item.dotClass)} />
            <span className={clsx('font-medium', item.textClass)}>{item.label}</span>
            <span className="text-gray-500 hidden sm:inline">— {item.description}</span>
          </button>
        );
      })}
    </div>
  );
}
