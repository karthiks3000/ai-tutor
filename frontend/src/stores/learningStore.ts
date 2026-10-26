/**
 * Learning session state store
 */
import { create } from 'zustand';
import { LessonContent, Quiz, Question, Feedback } from '../types';

interface LessonPlan {
  plan_id: string;
  student_id: string;
  subject: string;
  total_sections: number;
  sections: any[];
  status: string;
  current_section: number;
}

interface SectionContent {
  lesson: LessonContent;
  quiz: Quiz;
}

interface LearningStore {
  // Legacy fields
  currentLesson: LessonContent | null;
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  lastFeedback: Feedback | null;
  isLoading: boolean;
  
  // Section-based journey fields
  currentSubject: string | null; // NEW - current session subject
  lessonPlan: LessonPlan | null;
  currentSectionIndex: number;
  sectionContent: Map<number, SectionContent>;
  showSectionSummary: boolean;
  showOverallSummary: boolean;
  completedSections: number[];
  preloadedNextSection: SectionContent | null;
  
  // Legacy actions
  setLesson: (lesson: LessonContent) => void;
  setQuiz: (quiz: Quiz | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setFeedback: (feedback: Feedback) => void;
  setLoading: (loading: boolean) => void;
  nextQuestion: () => void;
  reset: () => void;
  
  // Section-based actions
  setCurrentSubject: (subject: string) => void; // NEW
  setLessonPlan: (plan: LessonPlan) => void;
  setSectionContent: (index: number, content: SectionContent) => void;
  setPreloadedNextSection: (content: SectionContent | null) => void;
  markSectionComplete: (index: number) => void;
  advanceToNextSection: () => void;
  setShowSectionSummary: (show: boolean) => void;
  setShowOverallSummary: (show: boolean) => void;
  resetJourney: () => void;
  resetForNewSubject: () => void; // NEW - clear state when switching subjects
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  // Legacy state
  currentLesson: null,
  currentQuiz: null,
  currentQuestionIndex: 0,
  currentQuestion: null,
  lastFeedback: null,
  isLoading: false,

  // Section-based state
  currentSubject: null, // NEW
  lessonPlan: null,
  currentSectionIndex: 0,
  sectionContent: new Map(),
  showSectionSummary: false,
  showOverallSummary: false,
  completedSections: [],
  preloadedNextSection: null,

  // Legacy actions
  setLesson: (lesson) => set({ currentLesson: lesson }),
  
  setQuiz: (quiz) => set({
    currentQuiz: quiz,
    currentQuestionIndex: 0,
    currentQuestion: quiz?.questions[0] || null,
  }),
  
  setCurrentQuestionIndex: (index) => {
    const { currentQuiz } = get();
    set({
      currentQuestionIndex: index,
      currentQuestion: currentQuiz?.questions[index] || null,
    });
  },
  
  setFeedback: (feedback) => set({ lastFeedback: feedback }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  nextQuestion: () => {
    const { currentQuiz, currentQuestionIndex } = get();
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      set({
        currentQuestionIndex: nextIndex,
        currentQuestion: currentQuiz.questions[nextIndex],
        lastFeedback: null,
      });
    }
  },
  
  reset: () => set({
    currentLesson: null,
    currentQuiz: null,
    currentQuestionIndex: 0,
    currentQuestion: null,
    lastFeedback: null,
    isLoading: false,
  }),
  
  // Section-based actions
  setCurrentSubject: (subject) => set({ currentSubject: subject }), // NEW
  
  setLessonPlan: (plan) => set({ lessonPlan: plan }),
  
  setSectionContent: (index, content) => {
    const { sectionContent } = get();
    const newContent = new Map(sectionContent);
    newContent.set(index, content);
    set({ sectionContent: newContent });
  },
  
  setPreloadedNextSection: (content) => set({ preloadedNextSection: content }),
  
  markSectionComplete: (index) => {
    const { completedSections } = get();
    if (!completedSections.includes(index)) {
      set({ completedSections: [...completedSections, index] });
    }
  },
  
  advanceToNextSection: () => {
    const { currentSectionIndex, preloadedNextSection } = get();
    const nextIndex = currentSectionIndex + 1;
    
    set({
      currentSectionIndex: nextIndex,
      currentLesson: preloadedNextSection?.lesson || null,
      currentQuiz: null,
      preloadedNextSection: null,
      showSectionSummary: false
    });
  },
  
  setShowSectionSummary: (show) => set({ showSectionSummary: show }),
  setShowOverallSummary: (show) => set({ showOverallSummary: show }),
  
  resetJourney: () => set({
    lessonPlan: null,
    currentSectionIndex: 0,
    sectionContent: new Map(),
    showSectionSummary: false,
    showOverallSummary: false,
    completedSections: [],
    preloadedNextSection: null,
    currentLesson: null,
    currentQuiz: null,
    currentQuestionIndex: 0,
    currentQuestion: null,
    lastFeedback: null,
  }),
  
  resetForNewSubject: () => set({ // NEW - reset everything when switching subjects
    currentSubject: null,
    lessonPlan: null,
    currentSectionIndex: 0,
    sectionContent: new Map(),
    showSectionSummary: false,
    showOverallSummary: false,
    completedSections: [],
    preloadedNextSection: null,
    currentLesson: null,
    currentQuiz: null,
    currentQuestionIndex: 0,
    currentQuestion: null,
    lastFeedback: null,
  }),
}));
