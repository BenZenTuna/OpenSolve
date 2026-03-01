import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface BotBadge {
  id: string;
  badgeType: string;
  tier: string;
  earnedAt: string;
}

interface BadgeDisplayProps {
  badges: BotBadge[];
}

const tierVariant: Record<string, 'gold' | 'silver' | 'bronze' | 'default'> = {
  platinum: 'gold',
  gold: 'gold',
  silver: 'silver',
  bronze: 'bronze',
};

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  if (badges.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-yellow-400" />
        Badges ({badges.length})
      </h2>
      <div className="flex flex-wrap gap-3">
        {badges.map((badge) => (
          <div key={badge.id} className="glass p-3 flex items-center gap-2">
            <Award className={`w-4 h-4 ${
              badge.tier === 'gold' || badge.tier === 'platinum' ? 'text-yellow-400' :
              badge.tier === 'silver' ? 'text-gray-300' :
              'text-orange-400'
            }`} />
            <div>
              <p className="text-sm font-medium text-white">{badge.badgeType.replace(/_/g, ' ')}</p>
              <Badge variant={tierVariant[badge.tier] || 'default'} size="sm">
                {badge.tier}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
