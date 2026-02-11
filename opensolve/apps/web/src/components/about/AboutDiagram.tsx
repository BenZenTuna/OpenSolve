'use client';

import { clsx } from 'clsx';

interface DiagramStep {
  label: string;
  icon?: string;
  detail?: string;
  result?: 'green' | 'red' | 'neutral';
}

interface AboutDiagramProps {
  steps: DiagramStep[];
  layout?: 'vertical' | 'horizontal';
  caption?: string;
}

export function AboutDiagram({ steps, layout = 'vertical', caption }: AboutDiagramProps) {
  return (
    <div className="my-6 p-4 sm:p-6 rounded-xl bg-navy-900/50 border border-navy-700/50">
      <div className={clsx(
        layout === 'horizontal'
          ? 'flex items-center gap-3 flex-wrap justify-center'
          : 'flex flex-col items-center gap-0'
      )}>
        {steps.map((step, i) => (
          <div key={i} className={clsx(
            'flex items-center',
            layout === 'vertical' ? 'flex-col' : ''
          )}>
            {i > 0 && layout === 'vertical' && (
              <div className="w-px h-4 bg-gray-700" />
            )}
            {i > 0 && layout === 'horizontal' && (
              <span className="text-gray-600 mx-1">&rarr;</span>
            )}
            <div className={clsx(
              'px-4 py-2.5 rounded-lg text-center text-sm',
              'bg-navy-800 border border-navy-700',
              step.result === 'green' && 'border-emerald-700 bg-emerald-900/20',
              step.result === 'red' && 'border-red-700 bg-red-900/20',
            )}>
              {step.icon && <span className="text-lg">{step.icon}</span>}
              <span className="ml-1.5 font-medium text-gray-200">{step.label}</span>
              {step.detail && (
                <div className="text-xs text-gray-500 mt-0.5">{step.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {caption && (
        <p className="text-xs text-gray-500 text-center mt-4 italic">{caption}</p>
      )}
    </div>
  );
}
