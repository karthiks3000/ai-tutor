/**
 * Level Progress Bar Component - Shows level progression
 */
import { useProgressStore } from '../../stores/progressStore';
import { LEVEL_XP_THRESHOLDS } from '../../types/constants';

export default function LevelProgressBar() {
  const { totalXP, currentLevel, getLevelTitle } = useProgressStore();

  const levelTitle = getLevelTitle();
  const currentLevelXP = LEVEL_XP_THRESHOLDS[currentLevel];
  const nextLevelXP = LEVEL_XP_THRESHOLDS[Math.min(currentLevel + 1, 30)];
  const progressInLevel = totalXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.min(100, (progressInLevel / xpNeededForLevel) * 100);

  return (
    <div className="card-3d p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500">Level {currentLevel}</p>
          <p className="text-lg font-bold">{levelTitle}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Next Level</p>
          <p className="text-lg font-bold">{currentLevel + 1}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 transition-all duration-500 relative"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          </div>
        </div>

        {/* XP Label */}
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-gray-600">{totalXP} XP</span>
          <span className="text-gray-600">{xpNeededForLevel - progressInLevel} XP to go</span>
        </div>
      </div>

      {/* Milestone Indicator */}
      {[5, 10, 15, 20, 25, 30].map((milestone) => {
        if (currentLevel === milestone - 1) {
          return (
            <div key={milestone} className="mt-4 p-3 bg-purple-50 rounded-lg text-center">
              <p className="text-sm font-semibold text-purple-900">
                🎯 Almost there! Reach level {milestone} to unlock special rewards!
              </p>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
