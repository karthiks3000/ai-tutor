/**
 * Section Summary View - Displayed between sections while next content loads
 * Shows progress, achievements, and loading indicator for next section
 */
import { Achievement } from '../../types';

interface SectionSummaryViewProps {
  sectionNumber: number;
  totalSections: number;
  xpEarned: number;
  achievements: Achievement[];
  topicsLearned: string[];
  quizScore: number;
  totalQuizQuestions: number;
  onContinue: () => void;
  isNextSectionReady: boolean;
}

export default function SectionSummaryView({
  sectionNumber,
  totalSections,
  xpEarned,
  achievements,
  topicsLearned,
  quizScore,
  totalQuizQuestions,
  onContinue,
  isNextSectionReady
}: SectionSummaryViewProps) {
  const scorePercentage = (quizScore / totalQuizQuestions) * 100;
  const isLastSection = sectionNumber >= totalSections;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-8 animate-in zoom-in duration-500">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Section {sectionNumber} Complete!
        </h2>
        <p className="text-xl text-gray-600">
          {isLastSection ? "Amazing work! You've completed all sections!" : `${totalSections - sectionNumber} more section${totalSections - sectionNumber > 1 ? 's' : ''} to go!`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* XP Earned */}
        <div className="card-3d p-6 text-center animate-in slide-in-from-left duration-500">
          <div className="text-4xl mb-2">⭐</div>
          <div className="text-3xl font-bold text-purple-600">{xpEarned}</div>
          <div className="text-sm text-gray-600">XP Earned</div>
        </div>

        {/* Quiz Score */}
        <div className="card-3d p-6 text-center animate-in slide-in-from-right duration-500">
          <div className="text-4xl mb-2">{scorePercentage >= 80 ? '🏆' : scorePercentage >= 60 ? '👍' : '💪'}</div>
          <div className="text-3xl font-bold text-blue-600">
            {quizScore}/{totalQuizQuestions}
          </div>
          <div className="text-sm text-gray-600">Quiz Score ({scorePercentage.toFixed(0)}%)</div>
        </div>
      </div>

      {/* Topics Learned */}
      {topicsLearned.length > 0 && (
        <div className="card-3d p-6 mb-6 animate-in fade-in duration-700">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>📚</span> Topics You Mastered
          </h3>
          <ul className="space-y-2">
            {topicsLearned.map((topic, idx) => (
              <li key={idx} className="flex items-center gap-3 text-gray-700">
                <span className="text-green-500">✓</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card-3d p-6 mb-6 animate-in fade-in duration-700 delay-200">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🏅</span> New Achievements Unlocked!
          </h3>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.achievement_id}
                className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50"
              >
                <div className="text-3xl">{achievement.badge_icon}</div>
                <div className="flex-1">
                  <div className="font-bold">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
                <div className="text-purple-600 font-bold">+{achievement.xp_awarded} XP</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Indicator or Continue Button */}
      <div className="text-center animate-in fade-in duration-700 delay-400">
        {!isLastSection && (
          <>
            {!isNextSectionReady ? (
              <div className="card-3d p-8 mb-6">
                <div className="animate-spin text-5xl mb-4">⏳</div>
                <p className="text-xl text-gray-700">Preparing Section {sectionNumber + 1}...</p>
                <p className="text-sm text-gray-500 mt-2">Creating your personalized content</p>
              </div>
            ) : (
              <div className="card-3d p-6 mb-6 bg-gradient-to-r from-green-50 to-blue-50">
                <div className="text-4xl mb-2">✨</div>
                <p className="text-lg font-semibold text-gray-700">
                  Section {sectionNumber + 1} is ready!
                </p>
              </div>
            )}
            
            <button
              onClick={onContinue}
              disabled={!isNextSectionReady}
              className={`text-xl px-12 py-4 transition-all ${
                isNextSectionReady
                  ? 'gradient-button'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isNextSectionReady ? `Continue to Section ${sectionNumber + 1} →` : 'Loading...'}
            </button>
          </>
        )}

        {isLastSection && (
          <button
            onClick={onContinue}
            className="gradient-button text-xl px-12 py-4"
          >
            View Your Learning Summary →
          </button>
        )}
      </div>

      {/* Encouragement Message */}
      <div className="text-center mt-8 animate-in fade-in duration-1000">
        <p className="text-lg text-gray-600 italic">
          {isLastSection 
            ? "You've completed all sections! Amazing dedication! 🌟" 
            : "Take a break if you need one - your progress is saved! ☕"}
        </p>
      </div>
    </div>
  );
}
