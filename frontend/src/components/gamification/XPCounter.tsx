/**
 * XP Counter Component - Floating display of level, XP, and streak
 */
import { useProgressStore } from '../../stores/progressStore';
import { LEVEL_XP_THRESHOLDS } from '../../types/constants';

export default function XPCounter() {
  const { totalXP, currentLevel, currentStreakDays, getLevelTitle, getXPToNextLevel } = useProgressStore();

  const levelTitle = getLevelTitle();
  const xpToNext = getXPToNextLevel();
  const currentLevelXP = LEVEL_XP_THRESHOLDS[currentLevel];
  const nextLevelXP = LEVEL_XP_THRESHOLDS[Math.min(currentLevel + 1, 30)];
  const progressInLevel = totalXP - currentLevelXP;
  const xpNeededForLevel = nextLevelXP - currentLevelXP;
  const progressPercentage = Math.min(100, (progressInLevel / xpNeededForLevel) * 100);

  return (
    <div className="fixed top-4 right-4 card-3d px-6 py-4 z-50 animate-fade-in">
      <div className="flex items-center gap-4">
        {/* Level Info */}
        <div className="text-right">
          <div className="text-xs text-gray-500">Level {currentLevel}</div>
          <div className="text-sm font-bold">{levelTitle}</div>
        </div>

        {/* XP Progress Bar */}
        <div className="w-32">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {totalXP} / {nextLevelXP} XP
          </div>
        </div>

        {/* Streak */}
        {currentStreakDays > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-bold">{currentStreakDays}</span>
          </div>
        )}
      </div>
    </div>
  );
}
