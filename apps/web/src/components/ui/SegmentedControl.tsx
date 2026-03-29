'use client';

import clsx from 'clsx';

export interface SegmentOption {
  value: string;
  label: string;
  color?: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
}

export function SegmentedControl({ options, value, onChange, size = 'sm' }: SegmentedControlProps) {
  return (
    <div className="inline-flex items-stretch rounded-lg border border-navy-700 overflow-x-auto scrollbar-hide">
      {options.map((opt, i) => {
        const isActive = value === opt.value;
        const isLast = i === options.length - 1;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={clsx(
              'whitespace-nowrap text-xs font-medium transition-colors duration-150 cursor-pointer',
              size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2',
              !isLast && 'border-r border-navy-700',
              isActive
                ? 'bg-navy-700 text-gray-100'
                : 'bg-navy-800/60 text-gray-500 hover:text-gray-300 hover:bg-navy-800',
              opt.color && isActive && opt.color
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
