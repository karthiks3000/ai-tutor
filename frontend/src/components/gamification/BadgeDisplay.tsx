/**
 * Badge Display Component - Shows earned achievements
 */
import { Achievement } from '../../types';
import { RARITY_COLORS } from '../../types/constants';

interface BadgeDisplayProps {
  badges: Achievement[];
  onBadgeClick?: (badge: Achievement) => void;
}

export default function BadgeDisplay({ badges, onBadgeClick }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p className="text-4xl mb-2">🏆</p>
        <p>No badges yet. Keep learning to unlock achievements!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
      {badges.map((badge) => {
        const rarityColor = RARITY_COLORS[badge.rarity];
        return (
          <button
            key={badge.achievement_id}
            onClick={() => onBadgeClick?.(badge)}
            className="card-3d p-4 text-center hover:scale-110 transition-all"
            style={{
              boxShadow: `0 0 15px ${rarityColor}40`,
            }}
          >
            <div className="text-4xl mb-2">{badge.badge_icon}</div>
            <div className="text-xs font-semibold truncate">{badge.title}</div>
            <div
              className="text-xs mt-1 px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: rarityColor }}
            >
              {badge.rarity}
            </div>
          </button>
        );
      })}
    </div>
  );
}
