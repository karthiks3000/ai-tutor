/**
 * Learning Journey Page - Main learning experience with adaptive content
 * 
 * Displays personalized tutor messages, lessons, and quizzes with instant feedback.
 * Uses new batch quiz submission with client-side evaluation for fast UX.
 */
import { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '../stores/learningStore';
import { useAgentApi } from '../hooks/useAgentApi';
import QuizEngine from '../components/learning/QuizEngine';
import LessonReader from '../components/learning/LessonReader';
import TutorMessageBubble from '../components/learning/TutorMessageBubble';
import XPCounter from '../components/gamification/XPCounter';
import AchievementModal from '../components/gamification/AchievementModal';
import { LessonContent, Achievement } from '../types';

type ViewState = 'loading' | 'lesson' | 'quiz';

export default function LearningJourneyPage() {
  const { currentLesson, currentQuiz, setLesson, setQuiz } = useLearningStore();
  const api = useAgentApi();
  
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [tutorMessage, setTutorMessage] = useState<string>('');
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [nextQuizReady, setNextQuizReady] = useState(false);
  const [preloadedQuiz, setPreloadedQuiz] = useState<any>(null);
  const hasLoadedRef = useRef(false);

  // Load initial content on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadInitialQuiz();
    }
  }, []);

  // Preload quiz when lesson is displayed
  useEffect(() => {
    if (viewState === 'lesson' && currentLesson) {
      preloadQuizInBackground();
    }
  }, [viewState, currentLesson]);

  const preloadQuizInBackground = async () => {
    try {
      setNextQuizReady(false);
      setPreloadedQuiz(null);
      
      console.log('🔄 Preloading quiz in background...');
      
      const response = await api.loadQuiz(
        'pop_quiz',
        currentLesson?.title || 'Current Topic',
        3
      );
      
      if (response.success && response.quiz_content) {
        setPreloadedQuiz(response);
        setNextQuizReady(true);
        console.log('✅ Quiz preloaded and ready!');
      }
    } catch (err: any) {
      console.error('Failed to preload quiz:', err);
      // Don't block user - they can still click button to try loading
      setNextQuizReady(true);
    }
  };

  const loadInitialQuiz = async () => {
    try {
      setViewState('loading');
      
      const response = await api.loadDiagnosticQuiz();
      
      // Set tutor message if present
      if (response.tutor_message) {
        setTutorMessage(response.tutor_message);
      }
      
      // Set content based on action_type
      if (response.action_type === 'present_quiz' && response.quiz_content) {
        setQuiz(response.quiz_content);
        setViewState('quiz');
      } else if (response.action_type === 'present_lesson' && response.lesson_content) {
        setLesson(response.lesson_content);
        setViewState('lesson');
      }
      
      // Check for achievements
      if (response.achievement) {
        setUnlockedAchievement(response.achievement);
      }
    } catch (err: any) {
      console.error('Failed to load initial content:', err);
    }
  };

  // Handle quiz completion - QuizResultsReview will load next lesson in background
  const handleQuizComplete = () => {
    // QuizResultsReview component handles the transition
    // It will load the next lesson and call handleNextLesson when ready
  };

  // Handle transition to next lesson from QuizResultsReview
  const handleNextLesson = (lesson: LessonContent, message: string) => {
    setLesson(lesson);
    setTutorMessage(message);
    setQuiz(null as any);
    setViewState('lesson');
  };

  // Handle continuing after lesson (use preloaded quiz)
  const handleContinueReading = () => {
    // Use preloaded quiz if available for instant transition
    if (preloadedQuiz && preloadedQuiz.quiz_content) {
      setQuiz(preloadedQuiz.quiz_content);
      
      if (preloadedQuiz.tutor_message) {
        setTutorMessage(preloadedQuiz.tutor_message);
      }
      
      setViewState('quiz');
    } else {
      // Fallback: load quiz now if preload failed
      loadQuizNow();
    }
  };

  const loadQuizNow = async () => {
    try {
      setViewState('loading');
      
      const response = await api.loadQuiz(
        'pop_quiz', 
        currentLesson?.title || 'Current Topic', 
        3
      );
      
      if (response.success && response.quiz_content) {
        setQuiz(response.quiz_content);
        
        if (response.tutor_message) {
          setTutorMessage(response.tutor_message);
        }
        
        setViewState('quiz');
      }
    } catch (err: any) {
      console.error('Failed to load quiz:', err);
    }
  };

  // Determine tutor message variant based on view state
  const getTutorMessageVariant = () => {
    if (viewState === 'quiz') return 'quiz';
    if (viewState === 'lesson') return 'default';
    return 'default';
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header with XP Counter */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          🎓 AI Tutor
        </h1>
        <XPCounter />
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto">
        {/* Error Display */}
        {api.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-in fade-in">
            <p className="text-red-700">⚠️ {api.error}</p>
            <button
              onClick={() => {
                api.clearError();
                loadInitialQuiz();
              }}
              className="mt-2 text-red-600 hover:text-red-700 font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Tutor Message - Always visible when available */}
        {tutorMessage && !api.isLoading && viewState !== 'loading' && (
          <TutorMessageBubble 
            message={tutorMessage} 
            variant={getTutorMessageVariant()}
          />
        )}

        {/* Loading State - Only show if truly loading and no content */}
        {viewState === 'loading' && !currentQuiz && !currentLesson && (
          <div className="card-3d p-12 text-center animate-in fade-in">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <p className="text-gray-600 text-lg">Loading your personalized content...</p>
          </div>
        )}

        {/* Lesson View */}
        {viewState === 'lesson' && currentLesson && (
          <div className="card-3d p-8 animate-in slide-in-from-bottom duration-500">
            <LessonReader lesson={currentLesson} />
            <button
              onClick={handleContinueReading}
              disabled={!nextQuizReady}
              className={`w-full mt-6 text-lg py-4 transition-all ${
                nextQuizReady 
                  ? 'gradient-button' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-70'
              }`}
            >
              {nextQuizReady ? (
                <>Continue to Quiz →</>
              ) : (
                <>
                  <span className="animate-pulse">⏳</span> Preparing your quiz...
                </>
              )}
            </button>
          </div>
        )}

        {/* Quiz View - New batch submission flow */}
        {viewState === 'quiz' && currentQuiz && (
          <div className="card-3d p-8 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-2xl font-bold mb-6">
              {currentQuiz.quiz_type === 'diagnostic' ? '📝 Diagnostic Quiz' : '🎯 Quiz Time!'}
            </h2>
            
            <QuizEngine
              quiz={currentQuiz}
              onComplete={handleQuizComplete}
              onNextLesson={handleNextLesson}
            />
          </div>
        )}
      </div>

      {/* Achievement Modal */}
      {unlockedAchievement && (
        <AchievementModal
          achievement={unlockedAchievement}
          onClose={() => setUnlockedAchievement(null)}
        />
      )}
    </div>
  );
}
