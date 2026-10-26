/**
 * Streak Tracker Component - Shows daily learning streak
 */
import { useProgressStore } from '../../stores/progressStore';

export default function StreakTracker() {
  const { currentStreakDays } = useProgressStore();

  if (currentStreakDays === 0) return null;

  return (
    <div className="card-3d px-4 py-2 inline-flex items-center gap-2">
      <span className="text-2xl animate-pulse">🔥</span>
      <div className="text-left">
        <div className="text-xs text-gray-500">Streak</div>
        <div className="text-sm font-bold">{currentStreakDays} days</div>
      </div>
    </div>
  );
}
