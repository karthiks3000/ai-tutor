/**
 * Shared constants and enums - Must match Python constants
 * See: agents/tutor_agent/models/constants.py
 */

export enum QuestionType {
  MCSA = "mcsa",
  MCMA = "mcma",
  TRUE_FALSE = "true_false",
  SHORT_ANSWER = "short_answer",
  FILL_IN_BLANK = "fill_in_blank",
  WORD_MATCH = "word_match"
}

export enum QuizType {
  DIAGNOSTIC = "diagnostic",
  POP_QUIZ = "pop_quiz",
  PROGRESS_CHECK = "progress_check",
  FINAL_ASSESSMENT = "final_assessment"
}

export enum DifficultyLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}

export enum StudentInterest {
  SCIENCE = "science",
  TECHNOLOGY = "technology",
  MATH = "math",
  SPACE = "space",
  ANIMALS = "animals",
  NATURE = "nature",
  MUSIC = "music",
  ART = "art",
  MOVIES = "movies",
  BOOKS = "books",
  THEATER = "theater",
  SPORTS = "sports",
  GAMING = "gaming",
  COOKING = "cooking",
  TRAVEL = "travel",
  HISTORY = "history",
  GEOGRAPHY = "geography",
  CULTURE = "culture",
  FASHION = "fashion"
}

export enum FocusArea {
  VOCABULARY = "vocabulary",
  GRAMMAR = "grammar",
  READING_COMPREHENSION = "reading",
  WRITING = "writing",
  SPELLING = "spelling",
  PUNCTUATION = "punctuation",
  SPEAKING = "speaking",
  LISTENING = "listening"
}

export enum ActionType {
  PRESENT_LESSON = "present_lesson",
  PRESENT_QUIZ = "present_quiz",
  SHOW_FEEDBACK = "show_feedback",
  AWARD_ACHIEVEMENT = "award_achievement",
  SHOW_PROGRESS = "show_progress",
  CONVERSATION = "conversation"
}

export enum AchievementType {
  // Vocabulary
  WORD_SPROUT = "word_sprout_10",
  WORD_COLLECTOR = "word_collector_50",
  WORD_WIZARD = "word_wizard_100",
  WORD_EXPERT = "word_expert_250",
  VOCABULARY_MASTER = "vocabulary_master_500",
  // Grammar
  GRAMMAR_ROOKIE = "grammar_rookie_first",
  GRAMMAR_GURU = "grammar_guru_5",
  GRAMMAR_EXPERT = "grammar_expert_10",
  GRAMMAR_MASTER = "grammar_master_20",
  // Reading
  FIRST_LESSON = "first_lesson",
  BOOKWORM = "bookworm_10",
  AVID_READER = "avid_reader_25",
  LIBRARY_CARD = "library_card_50",
  LITERATURE_LOVER = "literature_lover_100",
  READING_CHAMPION = "reading_champion_250",
  // Streaks
  HOT_STREAK = "hot_streak_3",
  DEDICATED_LEARNER = "dedicated_learner_7",
  WEEK_WARRIOR = "week_warrior_14",
  UNSTOPPABLE = "unstoppable_30",
  PERSISTENT_LEGEND = "persistent_legend_100",
  // Speed
  QUICK_DRAW = "quick_draw",
  SPEED_DEMON = "speed_demon_10",
  LIGHTNING_FAST = "lightning_fast_50",
  TIME_MASTER = "time_master_100",
  // Accuracy
  SHARPSHOOTER = "sharpshooter_90",
  ACE_STUDENT = "ace_student_5",
  PERFECTIONIST = "perfectionist_100",
  CHAMPION = "champion_5",
  FLAWLESS = "flawless_20",
  // Levels
  LEVEL_5 = "level_5",
  LEVEL_10 = "level_10",
  LEVEL_15 = "level_15",
  LEVEL_20 = "level_20",
  LEVEL_30 = "level_30",
  // Special
  EARLY_BIRD = "early_bird",
  NIGHT_OWL = "night_owl",
  WEEKEND_WARRIOR = "weekend_warrior_4",
  COMEBACK_KID = "comeback_kid",
  HELPING_HAND = "helping_hand"
}

export enum BadgeRarity {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  EPIC = "epic",
  LEGENDARY = "legendary"
}

export enum GradeLevel {
  GRADE_6 = 6,
  GRADE_7 = 7,
  GRADE_8 = 8
}

export enum ResponseStatus {
  SUCCESS = "success",
  PARTIAL_SUCCESS = "partial_success",
  VALIDATION_ERROR = "validation_error",
  NOT_FOUND = "not_found",
  UNAUTHORIZED = "unauthorized",
  TOOL_ERROR = "tool_error",
  SYSTEM_ERROR = "system_error"
}

// XP Rewards
export const XP_REWARDS = {
  LESSON_COMPLETION: 50,
  QUIZ_COMPLETION: 25,
  PERFECT_QUIZ: 100,
  CORRECT_ANSWER: 10,
  FAST_ANSWER_BONUS: 5,
  STREAK_DAILY: 25,
  FIRST_TRY_BONUS: 15,
  QUIZ_90_PLUS: 50,
  COMEBACK_BONUS: 30
} as const;

// Level thresholds
export const LEVEL_XP_THRESHOLDS: Record<number, number> = {
  1: 0, 2: 100, 3: 250, 4: 475, 5: 813,
  6: 1319, 7: 2079, 8: 3219, 9: 4928, 10: 7493,
  11: 11339, 12: 17109, 13: 25763, 14: 38745, 15: 58217,
  16: 87426, 17: 131239, 18: 196959, 19: 295538, 20: 443407,
  21: 665211, 22: 997916, 23: 1496974, 24: 2245561, 25: 3368442,
  26: 5052763, 27: 7579245, 28: 11368967, 29: 17053551, 30: 25580426
};

export const LEVEL_TITLES: Record<number, string> = {
  1: "Beginner", 5: "Apprentice", 10: "Scholar",
  15: "Expert", 20: "Master", 25: "Grandmaster", 30: "Legend"
};

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  [BadgeRarity.COMMON]: "#9ca3af",
  [BadgeRarity.UNCOMMON]: "#10b981",
  [BadgeRarity.RARE]: "#3b82f6",
  [BadgeRarity.EPIC]: "#a855f7",
  [BadgeRarity.LEGENDARY]: "#f59e0b"
};

// Interest display info
export interface InterestDisplayInfo {
  icon: string;
  label: string;
  color: string;
  description: string;
}

export const INTEREST_DISPLAY_INFO: Record<StudentInterest, InterestDisplayInfo> = {
  [StudentInterest.SCIENCE]: { icon: "🔬", label: "Science", color: "#10b981", description: "Experiments and discoveries" },
  [StudentInterest.TECHNOLOGY]: { icon: "💻", label: "Technology", color: "#3b82f6", description: "Computers and coding" },
  [StudentInterest.SPACE]: { icon: "🚀", label: "Space", color: "#8b5cf6", description: "Planets and stars" },
  [StudentInterest.ANIMALS]: { icon: "🐾", label: "Animals", color: "#f59e0b", description: "Wildlife and pets" },
  [StudentInterest.NATURE]: { icon: "🌿", label: "Nature", color: "#059669", description: "Plants and ecosystems" },
  [StudentInterest.MUSIC]: { icon: "🎵", label: "Music", color: "#ec4899", description: "Songs and instruments" },
  [StudentInterest.ART]: { icon: "🎨", label: "Art", color: "#ef4444", description: "Drawing and painting" },
  [StudentInterest.MOVIES]: { icon: "🎬", label: "Movies", color: "#f97316", description: "Films and cinema" },
  [StudentInterest.BOOKS]: { icon: "📚", label: "Books", color: "#d97706", description: "Reading and stories" },
  [StudentInterest.THEATER]: { icon: "🎭", label: "Theater", color: "#dc2626", description: "Drama and plays" },
  [StudentInterest.SPORTS]: { icon: "⚽", label: "Sports", color: "#06b6d4", description: "Athletics and games" },
  [StudentInterest.GAMING]: { icon: "🎮", label: "Gaming", color: "#a855f7", description: "Video games" },
  [StudentInterest.COOKING]: { icon: "🍳", label: "Cooking", color: "#ea580c", description: "Food and recipes" },
  [StudentInterest.TRAVEL]: { icon: "✈️", label: "Travel", color: "#0891b2", description: "Exploring places" },
  [StudentInterest.HISTORY]: { icon: "📜", label: "History", color: "#92400e", description: "Past events" },
  [StudentInterest.GEOGRAPHY]: { icon: "🗺️", label: "Geography", color: "#047857", description: "Maps and countries" },
  [StudentInterest.CULTURE]: { icon: "🌍", label: "Culture", color: "#7c2d12", description: "Traditions and customs" },
  [StudentInterest.FASHION]: { icon: "👗", label: "Fashion", color: "#be185d", description: "Style and design" },
  [StudentInterest.MATH]: { icon: "🔢", label: "Math", color: "#0369a1", description: "Numbers and logic" }
};

export function calculateXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
