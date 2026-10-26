/**
 * Learning Journey Page - Section-based learning experience
 * 
 * Flow: Subject Selection → Diagnostic → Plan Generation → 
 *       Section 1 (Lesson → Quiz → Summary) → 
 *       Section 2 (Lesson → Quiz → Summary) → 
 *       Section 3 (Lesson → Quiz → Summary) → 
 *       Overall Summary → Back to Subject Selection
 */
import { useState, useRef } from 'react';
import { useLearningStore } from '../stores/learningStore';
import { useAgentApi } from '../hooks/useAgentApi';
import QuizEngine from '../components/learning/QuizEngine';
import LessonReader from '../components/learning/LessonReader';
import TutorMessageBubble from '../components/learning/TutorMessageBubble';
import SectionSummaryView from '../components/learning/SectionSummaryView';
import OverallSummaryView from '../components/learning/OverallSummaryView';
import JourneyProgressBar from '../components/learning/JourneyProgressBar';
import SubjectSelectionView from '../components/learning/SubjectSelectionView';
import DiagnosticResultsView from '../components/learning/DiagnosticResultsView';
import DiagnosticLoadingAnimation from '../components/learning/DiagnosticLoadingAnimation';
import XPCounter from '../components/gamification/XPCounter';
import AchievementModal from '../components/gamification/AchievementModal';
import { LessonContent, Achievement, Subject } from '../types';
import { useProgressStore } from '../stores/progressStore';
import { SUBJECT_DISPLAY_INFO } from '../types/constants';

type JourneyState = 
  | 'subject_selection'
  | 'diagnostic'
  | 'diagnostic_results'
  | 'planning'
  | 'section_lesson'
  | 'section_quiz'
  | 'section_summary'
  | 'overall_summary';

export default function LearningJourneyPage() {
  // Store state
  const {
    currentLesson,
    currentQuiz,
    lessonPlan,
    currentSectionIndex,
    completedSections,
    showSectionSummary,
    showOverallSummary,
    currentSubject,
    setCurrentSubject,
    setLesson,
    setQuiz,
    markSectionComplete,
    advanceToNextSection,
    setShowSectionSummary,
    setShowOverallSummary,
    setPreloadedNextSection,
    resetForNewSubject
  } = useLearningStore();
  
  // Hooks
  const api = useAgentApi();
  const { totalXP } = useProgressStore();
  
  // Local state
  const [journeyState, setJourneyState] = useState<JourneyState>('subject_selection');
  const [tutorMessage, setTutorMessage] = useState<string>('');
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [isNextSectionReady, setIsNextSectionReady] = useState(false);
  const [sectionXP, setSectionXP] = useState(0);
  const [sectionAchievements, setSectionAchievements] = useState<Achievement[]>([]);
  const [allTopicsLearned, setAllTopicsLearned] = useState<string[]>([]);
  const [sectionPerformance, setSectionPerformance] = useState<Record<number, any>>({});
  const [diagnosticEvaluation, setDiagnosticEvaluation] = useState<any>(null);
  const [isPlanReady, setIsPlanReady] = useState(false);
  const [pendingQuiz, setPendingQuiz] = useState<any>(null);
  const [overallSummaryData, setOverallSummaryData] = useState<any>(null);
  
  // Refs
  const diagnosticQuizIdRef = useRef<string | null>(null);

  // ==================== Event Handlers ====================

  const handleSubjectSelect = async (subject: Subject) => {
    setCurrentSubject(subject);
    setQuiz(null); // Clear any previous quiz to show loading animation
    setJourneyState('diagnostic');
    await loadDiagnosticQuiz(subject);
  };

  const loadDiagnosticQuiz = async (subject: Subject) => {
    try {
      setJourneyState('diagnostic');
      const response = await api.loadDiagnosticQuiz(subject);
      
      if (response.tutor_message) {
        setTutorMessage(response.tutor_message);
      }
      
      if (response.action_type === 'present_quiz' && response.quiz_content) {
        setQuiz(response.quiz_content);
        diagnosticQuizIdRef.current = response.quiz_content.quiz_id;
      }
      
      if (response.achievement) {
        setUnlockedAchievement(response.achievement);
      }
    } catch (err: any) {
      console.error('Failed to load diagnostic:', err);
    }
  };

  const handleDiagnosticComplete = async (evaluation: any) => {
    // Show results immediately
    setDiagnosticEvaluation(evaluation);
    setJourneyState('diagnostic_results');
    setIsPlanReady(false);
    
    // Background: Generate plan AND preload section 1
    try {
      if (evaluation && diagnosticQuizIdRef.current && currentQuiz && currentSubject) {
        const questionsWithAnswers = currentQuiz.questions.map((q, idx) => ({
          ...q,
          student_answer: evaluation.feedback[idx]?.studentAnswer,
          is_correct: evaluation.feedback[idx]?.isCorrect
        }));
        
        // Complete diagnostic and generate plan
        const response = await api.completeDiagnostic(
          diagnosticQuizIdRef.current,
          currentSubject,
          questionsWithAnswers,
          evaluation
        );
        
        if (response.tutor_message) {
          setTutorMessage(response.tutor_message);
        }
        
        // Preload Section 1
        const sectionResponse = await api.loadNextSection();
        if (sectionResponse.lesson_content) {
          setLesson(sectionResponse.lesson_content);
          setAllTopicsLearned([sectionResponse.lesson_content.title]);
          
          if (sectionResponse.quiz_content) {
            setPendingQuiz(sectionResponse.quiz_content);
          }
          
          // Plan and section 1 ready!
          setIsPlanReady(true);
          console.log('✅ Section 1 preloaded after diagnostic');
        }
      }
    } catch (err: any) {
      console.error('Failed to complete diagnostic:', err);
      setTutorMessage('Had trouble creating your plan. Let me try again!');
    }
  };

  const handleContinueFromDiagnostic = () => {
    // Section 1 is already preloaded in handleDiagnosticComplete
    // Just transition to display it
    setJourneyState('section_lesson');
  };

  const loadSection = async (_sectionIndex: number) => {
    try {
      setJourneyState('section_lesson');
      const response = await api.loadNextSection();
      
      if (response.tutor_message) {
        setTutorMessage(response.tutor_message);
      }
      
      if (response.action_type === 'present_lesson' && response.lesson_content) {
        setLesson(response.lesson_content);
        setAllTopicsLearned(prev => [...prev, response.lesson_content!.title]);
        
        // Store quiz for later (returned with lesson)
        if (response.quiz_content) {
          setPendingQuiz(response.quiz_content);
        }
      }
      
      if (response.achievement) {
        setUnlockedAchievement(response.achievement);
      }
    } catch (err: any) {
      console.error('Failed to load section:', err);
    }
  };

  const handleLessonComplete = () => {
    // Use stored quiz - no API call needed!
    if (pendingQuiz) {
      setQuiz(pendingQuiz);
      setJourneyState('section_quiz');
    } else {
      console.error('No pending quiz available');
    }
  };

  const handleSectionQuizComplete = async (evaluation: any) => {
    // Reset button state - should only be enabled after next section preloads
    setIsNextSectionReady(false);
    
    const sectionNum = currentSectionIndex + 1;
    const score = evaluation.correctCount;
    const totalQuestions = evaluation.totalQuestions;
    const quizScore = (score / totalQuestions) * 100;
    
    // Store performance locally for adaptation
    const performance = {
      section_number: sectionNum,
      quiz_score: quizScore,
      correct_answers: score,
      total_questions: totalQuestions,
      skill_scores: {},
      struggles: []
    };
    
    setSectionPerformance(prev => ({
      ...prev,
      [sectionNum]: performance
    }));
    
    // Background: Save quiz results + preload next section
    if (currentQuiz) {
      const questionsWithAnswers = currentQuiz.questions.map((q, idx) => ({
        ...q,
        student_answer: evaluation.feedback[idx]?.studentAnswer,
        is_correct: evaluation.feedback[idx]?.isCorrect
      }));
      
      // Save section completion (separate try/catch - don't block on failure)
      try {
        await api.completeSection(
          sectionNum,
          currentQuiz.quiz_id,
          questionsWithAnswers,
          evaluation
        );
        console.log(`✅ Section ${sectionNum} saved to backend`);
      } catch (err) {
        console.error('Failed to save section completion:', err);
        // Don't block - saving can fail without breaking the flow
      }
      
      // Preload next section if not last (separate try/catch - only enable button on success)
      if (sectionNum < 3) {
        try {
          const response = await api.loadNextSection();
          if (response.success && response.lesson_content) {
            setPreloadedNextSection({
              lesson: response.lesson_content,
              quiz: response.quiz_content || currentQuiz
            });
            setIsNextSectionReady(true);
            console.log(`✅ Section ${sectionNum + 1} preloaded`);
          } else {
            console.error('Section preload failed: no lesson content in response');
          }
        } catch (err) {
          console.error('Failed to preload next section:', err);
          // Don't set isNextSectionReady - keep button disabled until content is ready
        }
      } else {
        // Last section, no preload needed
        setIsNextSectionReady(true);
      }
    }
    
    // Mark complete and show results (QuizEngine will show results)
    markSectionComplete(sectionNum);
    setSectionXP(50 + (score * 10));
    setSectionAchievements([]);
  };

  const handleContinueFromQuizResults = () => {
    // After viewing quiz results, go to section summary
    setJourneyState('section_summary');
    setShowSectionSummary(true);
  };

  const handleContinueToNextSection = () => {
    const sectionNum = currentSectionIndex + 1;
    
    if (sectionNum >= 3) {
      setJourneyState('overall_summary');
      setShowOverallSummary(true);
    } else {
      const { preloadedNextSection } = useLearningStore.getState();
      
      // Set pending quiz from preloaded data
      if (preloadedNextSection?.quiz) {
        setPendingQuiz(preloadedNextSection.quiz);
      }
      
      advanceToNextSection();
      setJourneyState('section_lesson');
    }
  };

  const handleJourneyComplete = () => {
    resetForNewSubject();
    setJourneyState('subject_selection');
  };

  // ==================== Render ====================

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          🎓 AI Tutor
        </h1>
        <XPCounter />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Subject Indicator */}
        {currentSubject && journeyState !== 'subject_selection' && (
          <div className="flex items-center justify-between mb-6 p-4 card-3d animate-in fade-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{SUBJECT_DISPLAY_INFO[currentSubject as Subject]?.icon}</span>
              <div>
                <div className="text-sm text-gray-500">Current Subject</div>
                <div className="text-lg font-bold">{SUBJECT_DISPLAY_INFO[currentSubject as Subject]?.displayName}</div>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Switch subjects? Your current progress will be saved.')) {
                  resetForNewSubject();
                  setJourneyState('subject_selection');
                }
              }}
              className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
            >
              Switch Subject
            </button>
          </div>
        )}

        {/* Error Display */}
        {api.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 animate-in fade-in">
            <p className="text-red-700">⚠️ {api.error}</p>
            <button
              onClick={() => {
                api.clearError();
                if (currentSubject) {
                  loadDiagnosticQuiz(currentSubject as Subject);
                } else {
                  setJourneyState('subject_selection');
                }
              }}
              className="mt-2 text-red-600 hover:text-red-700 font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {(journeyState === 'section_lesson' || journeyState === 'section_quiz' || journeyState === 'section_summary') && lessonPlan && (
          <JourneyProgressBar
            currentSection={currentSectionIndex + 1}
            totalSections={3}
            completedSections={completedSections}
          />
        )}

        {/* Tutor Message */}
        {tutorMessage && !api.isLoading && journeyState !== 'section_summary' && journeyState !== 'overall_summary' && journeyState !== 'subject_selection' && (
          <TutorMessageBubble 
            message={tutorMessage} 
            variant={journeyState === 'section_quiz' || journeyState === 'diagnostic' ? 'quiz' : 'default'}
          />
        )}

        {/* SUBJECT SELECTION */}
        {journeyState === 'subject_selection' && (
          <SubjectSelectionView onSubjectSelect={handleSubjectSelect} />
        )}

        {/* DIAGNOSTIC QUIZ */}
        {journeyState === 'diagnostic' && !currentQuiz && api.isLoading && (
          <DiagnosticLoadingAnimation 
            subjectName={SUBJECT_DISPLAY_INFO[currentSubject as Subject]?.displayName || 'your subject'}
          />
        )}

        {journeyState === 'diagnostic' && currentQuiz && (
          <div className="card-3d p-8 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-2xl font-bold mb-6">📝 Diagnostic Assessment</h2>
            <QuizEngine
              quiz={currentQuiz}
              onComplete={handleDiagnosticComplete}
            />
          </div>
        )}

        {/* DIAGNOSTIC RESULTS */}
        {journeyState === 'diagnostic_results' && diagnosticEvaluation && currentQuiz && (
          <DiagnosticResultsView
            evaluation={diagnosticEvaluation}
            questions={currentQuiz.questions}
            isPlanReady={isPlanReady}
            onContinue={handleContinueFromDiagnostic}
          />
        )}

        {/* PLANNING */}
        {journeyState === 'planning' && (
          <div className="card-3d p-12 text-center animate-in fade-in">
            <div className="animate-spin text-6xl mb-6">🎯</div>
            <p className="text-2xl font-bold text-gray-800 mb-3">Loading Your First Section</p>
            <p className="text-gray-600">Getting everything ready for your learning journey...</p>
          </div>
        )}

        {/* SECTION LESSON */}
        {journeyState === 'section_lesson' && currentLesson && (
          <div className="card-3d p-8 animate-in slide-in-from-bottom duration-500">
            <LessonReader lesson={currentLesson} />
            <button
              onClick={handleLessonComplete}
              className="w-full mt-6 text-lg py-4 gradient-button"
            >
              Continue to Quiz →
            </button>
          </div>
        )}

        {/* SECTION QUIZ */}
        {journeyState === 'section_quiz' && currentQuiz && (
          <div className="card-3d p-8 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-2xl font-bold mb-6">🎯 Section Quiz</h2>
            <QuizEngine
              quiz={currentQuiz}
              onComplete={handleSectionQuizComplete}
              onContinueFromResults={handleContinueFromQuizResults}
              sectionNum={currentSectionIndex + 1}
              isNextReady={isNextSectionReady}
            />
          </div>
        )}

        {/* SECTION SUMMARY */}
        {journeyState === 'section_summary' && showSectionSummary && (
          <SectionSummaryView
            sectionNumber={currentSectionIndex + 1}
            totalSections={3}
            xpEarned={sectionXP}
            achievements={sectionAchievements}
            topicsLearned={[currentLesson?.title || 'Current Topic']}
            quizScore={sectionXP}
            totalQuizQuestions={currentQuiz?.total_questions || 3}
            onContinue={handleContinueToNextSection}
            isNextSectionReady={isNextSectionReady}
          />
        )}

        {/* OVERALL SUMMARY */}
        {journeyState === 'overall_summary' && showOverallSummary && (
          <OverallSummaryView
            totalXP={totalXP}
            totalAchievements={sectionAchievements}
            sectionsCompleted={3}
            allTopicsLearned={allTopicsLearned}
            overallFeedback="Congratulations on completing your learning journey! You've shown great dedication and made excellent progress. Keep up the amazing work! 🌟"
            onFinish={handleJourneyComplete}
          />
        )}

        {/* Loading State - Only show for non-diagnostic loading */}
        {!currentQuiz && !currentLesson && !showSectionSummary && !showOverallSummary && api.isLoading && journeyState !== 'diagnostic' && (
          <div className="card-3d p-12 text-center animate-in fade-in">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <p className="text-gray-600 text-lg">Loading your personalized content...</p>
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
