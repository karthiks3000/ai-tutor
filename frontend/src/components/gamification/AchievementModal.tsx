/**
 * Achievement Modal - Celebrates badge unlocks with animations
 */
import { Achievement } from '../../types';
import { RARITY_COLORS } from '../../types/constants';
import { SparklesCore } from '../ui/sparkles';

interface AchievementModalProps {
  achievement: Achievement;
  onClose: () => void;
}

export default function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  const rarityColor = RARITY_COLORS[achievement.rarity];
  
  // Determine sparkle intensity based on rarity
  const getSparkleConfig = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return { particleCount: 200, minSize: 1.5, maxSize: 3 };
      case 'epic':
        return { particleCount: 150, minSize: 1.2, maxSize: 2.5 };
      case 'rare':
        return { particleCount: 100, minSize: 1, maxSize: 2 };
      case 'uncommon':
        return { particleCount: 75, minSize: 0.8, maxSize: 1.5 };
      default:
        return { particleCount: 50, minSize: 0.6, maxSize: 1 };
    }
  };

  const sparkleConfig = getSparkleConfig();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative card-3d p-8 max-w-md w-full text-center animate-slide-up overflow-hidden">
        {/* Sparkles Background */}
        <div className="absolute inset-0 w-full h-full">
          <SparklesCore
            id={`achievement-sparkles-${achievement.achievement_id}`}
            background="transparent"
            minSize={sparkleConfig.minSize}
            maxSize={sparkleConfig.maxSize}
            particleDensity={sparkleConfig.particleCount}
            className="w-full h-full"
            particleColor={rarityColor}
          />
        </div>
        {/* Badge Icon with Glow */}
        <div className="relative inline-block mb-6 z-10">
          <div
            className="text-8xl animate-bounce-slow"
            style={{
              filter: `drop-shadow(0 0 20px ${rarityColor}) drop-shadow(0 0 40px ${rarityColor})`,
            }}
          >
            {achievement.badge_icon}
          </div>
        </div>

        {/* Achievement Title */}
        <div className="mb-6 relative z-10">
          <p className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Achievement Unlocked!
          </p>
          <h3 className="text-3xl font-bold mb-2 animate-pulse" style={{ color: rarityColor }}>
            ✨ {achievement.title} ✨
          </h3>
          <p className="text-gray-700">{achievement.description}</p>
        </div>

        {/* XP Reward */}
        <div className="card-3d p-4 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 relative z-10 animate-glow">
          <p className="text-2xl font-bold text-purple-600">
            +{achievement.xp_awarded} XP Earned!
          </p>
        </div>

        {/* Progress to Next */}
        {achievement.progress_towards_next && (
          <div className="mb-6 text-sm text-gray-600 relative z-10">
            <p className="mb-2">Progress to next achievement:</p>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${achievement.progress_towards_next.percentage}%` }}
              />
            </div>
            <p className="mt-1">
              {achievement.progress_towards_next.current} / {achievement.progress_towards_next.target}
            </p>
          </div>
        )}

        {/* Rarity Badge */}
        <div className="mb-6 relative z-10">
          <span
            className="inline-block px-4 py-1 rounded-full text-white text-sm font-semibold uppercase shadow-lg"
            style={{ 
              backgroundColor: rarityColor,
              boxShadow: `0 0 20px ${rarityColor}40`
            }}
          >
            {achievement.rarity}
          </span>
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="gradient-button w-full relative z-10"
        >
          Continue Learning →
        </button>
      </div>

      {/* Enhanced Confetti Effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10px',
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
