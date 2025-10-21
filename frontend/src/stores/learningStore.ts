/**
 * Learning session state store
 */
import { create } from 'zustand';
import { LessonContent, Quiz, Question, Feedback } from '../types';

interface LearningStore {
  currentLesson: LessonContent | null;
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  lastFeedback: Feedback | null;
  isLoading: boolean;
  
  setLesson: (lesson: LessonContent) => void;
  setQuiz: (quiz: Quiz) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setFeedback: (feedback: Feedback) => void;
  setLoading: (loading: boolean) => void;
  nextQuestion: () => void;
  reset: () => void;
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  currentLesson: null,
  currentQuiz: null,
  currentQuestionIndex: 0,
  currentQuestion: null,
  lastFeedback: null,
  isLoading: false,

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
}));
