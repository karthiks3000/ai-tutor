/**
 * Progress and gamification state store
 */
import { create } from 'zustand';
import { Achievement } from '../types';
import { LEVEL_XP_THRESHOLDS, LEVEL_TITLES } from '../types/constants';

interface ProgressStore {
  totalXP: number;
  currentLevel: number;
  currentStreakDays: number;
  totalLessonsCompleted: number;
  totalQuizzesCompleted: number;
  totalWordsLearned: number;
  badges: Achievement[];
  recentAchievement: Achievement | null;
  
  addXP: (amount: number) => void;
  incrementLessons: () => void;
  incrementQuizzes: () => void;
  incrementWords: (count: number) => void;
  updateStreak: (days: number) => void;
  addAchievement: (achievement: Achievement) => void;
  clearRecentAchievement: () => void;
  getLevelTitle: () => string;
  getXPToNextLevel: () => number;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  totalXP: 0,
  currentLevel: 1,
  currentStreakDays: 0,
  totalLessonsCompleted: 0,
  totalQuizzesCompleted: 0,
  totalWordsLearned: 0,
  badges: [],
  recentAchievement: null,

  addXP: (amount) => {
    const { totalXP, currentLevel } = get();
    const newXP = totalXP + amount;
    
    // Check for level up
    let newLevel = currentLevel;
    for (let level = currentLevel + 1; level <= 30; level++) {
      if (newXP >= LEVEL_XP_THRESHOLDS[level]) {
        newLevel = level;
      } else {
        break;
      }
    }
    
    set({ totalXP: newXP, currentLevel: newLevel });
    
    // If leveled up, show celebration (can trigger from components)
    if (newLevel > currentLevel) {
      console.log(`🎉 Level up! Now level ${newLevel}`);
    }
  },

  incrementLessons: () => set((state) => ({
    totalLessonsCompleted: state.totalLessonsCompleted + 1
  })),

  incrementQuizzes: () => set((state) => ({
    totalQuizzesCompleted: state.totalQuizzesCompleted + 1
  })),

  incrementWords: (count) => set((state) => ({
    totalWordsLearned: state.totalWordsLearned + count
  })),

  updateStreak: (days) => set({ currentStreakDays: days }),

  addAchievement: (achievement) => set((state) => ({
    badges: [...state.badges, achievement],
    recentAchievement: achievement,
  })),

  clearRecentAchievement: () => set({ recentAchievement: null }),

  getLevelTitle: () => {
    const { currentLevel } = get();
    // Find the highest milestone reached
    const milestones = [30, 25, 20, 15, 10, 5, 1];
    for (const milestone of milestones) {
      if (currentLevel >= milestone) {
        return LEVEL_TITLES[milestone] || 'Beginner';
      }
    }
    return 'Beginner';
  },

  getXPToNextLevel: () => {
    const { totalXP, currentLevel } = get();
    const nextLevel = Math.min(currentLevel + 1, 30);
    return LEVEL_XP_THRESHOLDS[nextLevel] - totalXP;
  },
}));
