/**
 * QuizResultsReview - Display section quiz results
 * 
 * Shows immediate feedback on quiz performance.
 * Parent component (LearningJourneyPage) handles all API calls.
 */

import { useEffect } from 'react';
import { Question } from '../../types/learning';
import { QuizEvaluation } from '../../utils/quizEvaluator';
import { useProgressStore } from '../../stores/progressStore';

interface QuizResultsReviewProps {
  quizId: string;
  quizType: string;
  topic: string;
  questions: Question[];
  studentAnswers: (string | string[])[];
  evaluation: QuizEvaluation;
  sectionNum: number;
  isNextReady: boolean;
  onContinue: () => void;
}

export function QuizResultsReview({
  quizId,
  quizType,
  topic,
  questions,
  studentAnswers,
  evaluation,
  sectionNum,
  isNextReady,
  onContinue
}: QuizResultsReviewProps) {
  const { addXP } = useProgressStore();

  // Award XP immediately
  useEffect(() => {
    addXP(evaluation.xpEarned);
  }, [evaluation.xpEarned, addXP]);

  const getScoreMessage = () => {
    const score = evaluation.scorePercentage;
    if (score >= 90) return { text: 'Excellent work!', color: 'text-green-600' };
    if (score >= 80) return { text: 'Great job!', color: 'text-blue-600' };
    if (score >= 70) return { text: 'Good effort!', color: 'text-yellow-600' };
    return { text: 'Keep practicing!', color: 'text-orange-600' };
  };

  const scoreMessage = getScoreMessage();

  return (
    <div className="card-3d p-8 max-w-4xl mx-auto">
      {/* Score Summary */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Quiz Complete! 🎉</h2>
        
        <div className={`text-6xl font-bold ${scoreMessage.color} mb-2`}>
          {Math.round(evaluation.scorePercentage)}%
        </div>
        
        <p className="text-lg text-gray-600 mb-4">
          {evaluation.correctCount} out of {evaluation.totalQuestions} correct
        </p>
        
        <div className={`text-2xl font-bold ${scoreMessage.color}`}>
          {scoreMessage.text}
        </div>
        
        <div className="mt-6 inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full shadow-lg">
          <span className="text-2xl font-bold">+{evaluation.xpEarned} XP</span> earned!
        </div>
      </div>

      {/* Question-by-Question Results */}
      <div className="space-y-4 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Review Your Answers:</h3>
        
        {evaluation.feedback.map((fb, idx) => {
          const question = questions[idx];
          
          return (
            <div
              key={fb.questionId}
              className={`p-4 rounded-lg border-2 ${
                fb.isCorrect 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
              } transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className="text-3xl">
                    {fb.isCorrect ? '✅' : '❌'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 mb-2">
                    Question {idx + 1}: {question.question_text}
                  </p>
                  
                  <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Your answer:</span>
                      <span className={`font-semibold ${fb.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {Array.isArray(fb.studentAnswer) 
                          ? fb.studentAnswer.join(', ') 
                          : fb.studentAnswer}
                      </span>
                    </p>
                    
                    {!fb.isCorrect && (
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Correct answer:</span>
                        <span className="font-semibold text-green-700">
                          {Array.isArray(fb.correctAnswer) 
                            ? fb.correctAnswer.join(', ') 
                            : fb.correctAnswer}
                        </span>
                      </p>
                    )}
                    
                    <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                      <p className="text-gray-700">
                        <span className="font-medium">💡 Explanation:</span> {fb.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <button
          onClick={onContinue}
          disabled={!isNextReady}
          className="gradient-button w-full py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isNextReady ? (
            <span className="flex items-center justify-center gap-2">
              <span>{sectionNum < 3 ? 'Continue to Next Section' : 'View Summary'}</span>
              <span>→</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <span className="animate-spin text-2xl">⏳</span>
              <span>{sectionNum < 3 ? 'Preparing next section...' : 'Preparing summary...'}</span>
            </span>
          )}
        </button>
        
        {isNextReady && (
          <p className="mt-3 text-sm text-green-600 font-medium animate-pulse">
            ✨ Ready to continue!
          </p>
        )}
      </div>
    </div>
  );
}

export default QuizResultsReview;
