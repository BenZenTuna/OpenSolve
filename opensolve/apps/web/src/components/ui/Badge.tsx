import { cn } from '@/lib/utils';

type BadgeVariant = 'pending' | 'active' | 'mature' | 'rejected' | 'default' | 'gold' | 'silver' | 'bronze';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  mature: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
  default: 'bg-accent/15 text-accent-light border-accent/20',
  gold: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30',
  silver: 'bg-gray-400/15 text-gray-300 border-gray-400/25',
  bronze: 'bg-orange-500/15 text-orange-300 border-orange-500/25',
};

export function Badge({ children, variant = 'default', className, size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const variant = (
    ['pending', 'active', 'mature', 'rejected'].includes(status) ? status : 'default'
  ) as BadgeVariant;

  return (
    <Badge variant={variant}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
