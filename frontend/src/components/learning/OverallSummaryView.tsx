/**
 * Overall Summary View - Final journey completion screen
 * Shows total progress, achievements, and next steps
 */
import { Achievement } from '../../types';

interface OverallSummaryViewProps {
  totalXP: number;
  totalAchievements: Achievement[];
  sectionsCompleted: number;
  allTopicsLearned: string[];
  overallFeedback: string;
  onFinish: () => void;
}

export default function OverallSummaryView({
  totalXP,
  totalAchievements,
  sectionsCompleted,
  allTopicsLearned,
  overallFeedback,
  onFinish
}: OverallSummaryViewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Celebration Header */}
      <div className="text-center mb-12 animate-in zoom-in duration-700">
        <div className="text-8xl mb-6">🎊</div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
          Learning Journey Complete!
        </h1>
        <p className="text-2xl text-gray-600">
          Congratulations on completing all {sectionsCompleted} sections!
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        {/* Total XP */}
        <div className="card-3d p-8 text-center animate-in slide-in-from-left duration-500">
          <div className="text-5xl mb-3">⭐</div>
          <div className="text-4xl font-bold text-purple-600 mb-2">{totalXP}</div>
          <div className="text-gray-600">Total XP Earned</div>
        </div>

        {/* Sections Completed */}
        <div className="card-3d p-8 text-center animate-in fade-in duration-500 delay-100">
          <div className="text-5xl mb-3">📚</div>
          <div className="text-4xl font-bold text-blue-600 mb-2">{sectionsCompleted}</div>
          <div className="text-gray-600">Sections Completed</div>
        </div>

        {/* Achievements */}
        <div className="card-3d p-8 text-center animate-in slide-in-from-right duration-500 delay-200">
          <div className="text-5xl mb-3">🏅</div>
          <div className="text-4xl font-bold text-green-600 mb-2">{totalAchievements.length}</div>
          <div className="text-gray-600">Achievements Unlocked</div>
        </div>
      </div>

      {/* All Topics Mastered */}
      {allTopicsLearned.length > 0 && (
        <div className="card-3d p-8 mb-8 animate-in fade-in duration-700 delay-300">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span>🎯</span> Your Learning Journey
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {allTopicsLearned.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 text-lg font-semibold text-gray-700">
                  {topic}
                </div>
                <div className="text-green-600 text-2xl">✓</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Achievements */}
      {totalAchievements.length > 0 && (
        <div className="card-3d p-8 mb-8 animate-in fade-in duration-700 delay-400">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span>🏆</span> Achievements Unlocked
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {totalAchievements.map((achievement) => (
              <div
                key={achievement.achievement_id}
                className="flex items-center gap-4 p-4 rounded-lg border-2"
                style={{ borderColor: achievement.badge_color + '40' }}
              >
                <div className="text-4xl">{achievement.badge_icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Tutor Feedback */}
      <div className="card-3d p-8 mb-8 animate-in fade-in duration-700 delay-500">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🤖</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3">Your AI Tutor's Feedback</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {overallFeedback || "You've shown incredible dedication and progress throughout this learning journey! Keep up the excellent work! 🌟"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="text-center space-y-4 animate-in fade-in duration-700 delay-600">
        <button
          onClick={onFinish}
          className="gradient-button text-xl px-12 py-4 w-full max-w-md"
        >
          📚 Choose Another Subject →
        </button>
        
        <p className="text-gray-500 text-sm">
          Your progress has been saved. Explore more subjects to continue learning!
        </p>
      </div>

      {/* Celebration Animation */}
      <div className="text-center mt-12 animate-in fade-in duration-1000 delay-700">
        <div className="text-6xl mb-4">🌟 ✨ 🎆 ⭐ 🌠</div>
        <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          You're a Learning Champion!
        </p>
      </div>
    </div>
  );
}
