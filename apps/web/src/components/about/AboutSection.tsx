import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface AboutSectionProps {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  heading: string;
  children: React.ReactNode;
  muted?: boolean;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  rose: { bg: 'bg-rose-500/15', text: 'text-rose-400' },
  slate: { bg: 'bg-slate-500/15', text: 'text-slate-400' },
};

export function AboutSection({ id, icon: Icon, iconColor, heading, children, muted = false }: AboutSectionProps) {
  const colors = colorMap[iconColor] || colorMap.blue;

  return (
    <section
      id={id}
      className={clsx('py-6 sm:py-10', muted && 'bg-navy-900/30 rounded-2xl')}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className={clsx('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center', colors.bg)}>
            <Icon size={20} className={colors.text} />
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-100">{heading}</h2>
        </div>
        <div className="space-y-4 sm:space-y-6">{children}</div>
      </div>
    </section>
  );
}
