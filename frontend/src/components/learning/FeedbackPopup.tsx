/**
 * Feedback Popup Component - Shows answer feedback
 */
import { Feedback } from '../../types';

interface FeedbackPopupProps {
  feedback: Feedback;
  onNext: () => void;
}

export default function FeedbackPopup({ feedback, onNext }: FeedbackPopupProps) {
  const isCorrect = feedback.is_correct;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Result Header */}
      <div className={`card-3d p-6 text-center ${isCorrect ? 'bg-green-50' : 'bg-amber-50'}`}>
        <div className="text-4xl mb-2">{isCorrect ? '✅' : '💡'}</div>
        <p className="text-2xl font-bold mb-2">
          {isCorrect ? 'Correct!' : 'Not quite!'}
        </p>
        <p className="text-lg">{feedback.encouragement}</p>
        {isCorrect && feedback.points_earned > 0 && (
          <p className="text-xl font-bold text-green-600 mt-2">
            +{feedback.points_earned} XP
          </p>
        )}
      </div>

      {/* Explanation */}
      <div className="card-3d p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 mb-2">Explanation:</p>
            <p className="text-gray-700">{feedback.explanation}</p>
            
            {!isCorrect && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">Correct answer:</p>
                <p className="text-blue-800">{Array.isArray(feedback.correct_answer) ? feedback.correct_answer.join(', ') : feedback.correct_answer}</p>
              </div>
            )}

            {feedback.learning_tip && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-semibold text-purple-900">💡 Pro Tip:</p>
                <p className="text-purple-800">{feedback.learning_tip}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="card-3d p-4 bg-gray-50">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Next: </span>
          {feedback.next_steps}
        </p>
      </div>

      {/* Continue Button */}
      <button
        onClick={onNext}
        className="gradient-button w-full text-lg"
      >
        Continue Learning →
      </button>
    </div>
  );
}
