/**
 * QuizResultsReview - Display quiz results and prepare next lesson
 * 
 * Shows immediate feedback on quiz performance while background loading
 * the next adaptive lesson based on student's results.
 */

import { useState, useEffect, useRef } from 'react';
import { Question, LessonContent } from '../../types/learning';
import { QuizEvaluation } from '../../utils/quizEvaluator';
import { useAgentApi } from '../../hooks/useAgentApi';
import { useProgressStore } from '../../stores/progressStore';

interface QuizResultsReviewProps {
  quizId: string;
  quizType: string;
  topic: string;
  questions: Question[];
  studentAnswers: (string | string[])[];
  evaluation: QuizEvaluation;
  onNextLesson: (lesson: LessonContent, tutorMessage: string) => void;
}

export function QuizResultsReview({
  quizId,
  quizType,
  topic,
  questions,
  studentAnswers,
  evaluation,
  onNextLesson
}: QuizResultsReviewProps) {
  const api = useAgentApi();
  const { addXP } = useProgressStore();
  const [nextLesson, setNextLesson] = useState<LessonContent | null>(null);
  const [tutorMessage, setTutorMessage] = useState<string>('');
  const [isLoadingNext, setIsLoadingNext] = useState(true);
  const hasLoadedRef = useRef(false); // Prevent duplicate API calls

  // Award XP immediately when component mounts
  useEffect(() => {
    addXP(evaluation.xpEarned);
  }, [evaluation.xpEarned, addXP]);

  // Background API call to get next adaptive lesson (ONCE only)
  useEffect(() => {
    if (hasLoadedRef.current) return; // Prevent duplicate calls
    hasLoadedRef.current = true;
    
    const loadNextLesson = async () => {
      try {
        setIsLoadingNext(true);
        
        // Call backend with quiz results
        // Backend will analyze performance and generate targeted lesson
        const response = await api.invoke(
          `Process quiz results: quiz_id=${quizId}, type=${quizType}, topic=${topic}, ` +
          `score=${evaluation.scorePercentage.toFixed(1)}%, correct=${evaluation.correctCount}/${evaluation.totalQuestions}. ` +
          `Student struggled with: ${evaluation.feedback
            .filter(f => !f.isCorrect)
            .map(f => questions.find(q => q.question_id === f.questionId)?.topic || 'unknown')
            .join(', ')}. ` +
          `Generate next lesson targeting weak areas.`
        );
        
        // Check for lesson content and set state
        if (response.lesson_content) {
          setNextLesson(response.lesson_content);
          setTutorMessage(response.tutor_message || 'Ready for your next lesson!');
        }
      } catch (err) {
        console.error('Failed to load next lesson:', err);
      } finally {
        setIsLoadingNext(false);
      }
    };
    
    loadNextLesson();
  }, []); // Empty deps - run once only on mount

  // Determine score message and color
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
        
        {/* Score Display */}
        <div className={`text-6xl font-bold ${scoreMessage.color} mb-2`}>
          {Math.round(evaluation.scorePercentage)}%
        </div>
        
        <p className="text-lg text-gray-600 mb-4">
          {evaluation.correctCount} out of {evaluation.totalQuestions} correct
        </p>
        
        <div className={`text-2xl font-bold ${scoreMessage.color}`}>
          {scoreMessage.text}
        </div>
        
        {/* XP Earned */}
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
                {/* Icon */}
                <div className="flex-shrink-0">
                  <span className="text-3xl">
                    {fb.isCorrect ? '✅' : '❌'}
                  </span>
                </div>
                
                {/* Question and Answer Details */}
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
                    
                    {/* Explanation */}
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

      {/* Next Lesson Button */}
      <div className="text-center">
        <button
          onClick={() => {
            if (nextLesson) {
              onNextLesson(nextLesson, tutorMessage);
            }
          }}
          disabled={isLoadingNext || !nextLesson}
          className="gradient-button w-full py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoadingNext ? (
            <span className="flex items-center justify-center gap-3">
              <span className="animate-spin text-2xl">⏳</span>
              <span>Preparing your personalized lesson...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Continue to Next Lesson</span>
              <span>→</span>
            </span>
          )}
        </button>
        
        {!isLoadingNext && nextLesson && (
          <p className="mt-3 text-sm text-green-600 font-medium animate-pulse">
            ✨ Your personalized lesson is ready!
          </p>
        )}
      </div>
    </div>
  );
}

export default QuizResultsReview;
