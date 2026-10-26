/**
 * Learning session types and interfaces
 */
import {
  QuestionType,
  QuizType,
  DifficultyLevel,
  FocusArea,
  ActionType,
  ResponseStatus,
  BadgeRarity,
} from './constants';

export interface VocabularyWord {
  word: string;
  definition: string;
  example_sentence: string;
  difficulty: DifficultyLevel;
  part_of_speech?: string;
}

export interface LessonContent {
  lesson_id: string;
  topic: string;
  title: string;
  content: string;
  difficulty_level: DifficultyLevel;
  grade_level: number;
  estimated_reading_time_minutes: number;
  word_count: number;
  key_vocabulary: VocabularyWord[];
  learning_objectives: string[];
  student_interest_alignment: string[];
  focus_areas: FocusArea[];
  content_type: string;
}

export interface WordPair {
  word: string;
  definition: string;
}

export interface Question {
  question_id: string;
  question_type: QuestionType;
  question_text: string;
  options?: string[];
  correct_answer: string | string[];
  word_pairs?: WordPair[];
  difficulty: DifficultyLevel;
  topic: string;
  points: number;
  hint?: string;
  explanation: string;
  sentence_template?: string;
  blank_positions?: number[];
}

export interface Quiz {
  quiz_id: string;
  quiz_type: QuizType;
  lesson_id?: string;
  topic: string;
  difficulty_level: DifficultyLevel;
  questions: Question[];
  total_questions: number;
  time_limit_seconds?: number;
  passing_score_percentage: number;
  focus_areas: FocusArea[];
}

export interface Feedback {
  feedback_id: string;
  question_id: string;
  is_correct: boolean;
  student_answer: string | string[];
  correct_answer: string | string[];
  explanation: string;
  encouragement: string;
  next_steps: string;
  points_earned: number;
  bonus_points: number;
  common_mistake?: string;
  learning_tip?: string;
}

export interface Achievement {
  achievement_id: string;
  student_id: string;
  achievement_type: string;
  title: string;
  description: string;
  badge_icon: string;
  badge_color: string;
  xp_awarded: number;
  rarity: BadgeRarity;
  category: string;
  unlocked_at: number;
  progress_towards_next?: {
    next_achievement: string;
    current: number;
    target: number;
    percentage: number;
  };
}

export interface ProgressUpdate {
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  current_streak_days: number;
  total_lessons_completed: number;
  total_quizzes_completed: number;
  recent_achievements: string[];
  level_title: string;
}

export interface OrchestratorResponse {
  action_type: ActionType;
  response_status: ResponseStatus;
  lesson_content?: LessonContent;
  quiz_content?: Quiz;
  feedback?: Feedback;
  achievement?: Achievement;
  progress_update?: ProgressUpdate;
  tutor_message: string; // NEW: Always present - personalized AI tutor message
  message?: string;
  next_action_delay_seconds?: number;
  student_can_proceed: boolean;
  is_final_response: boolean;
  success: boolean;
  error_message?: string;
  processing_time_seconds: number;
  session_metadata?: Record<string, any>;
}
