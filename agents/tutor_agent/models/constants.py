"""
Shared constants and enums for AI Tutor application.
These must match the TypeScript constants in frontend/src/types/constants.ts
"""
from enum import Enum
from typing import Dict, Any, Tuple


class QuestionType(str, Enum):
    """All possible quiz question formats (5 types - all client-evaluable)"""
    MCSA = "mcsa"                    # Multiple Choice Single Answer
    MCMA = "mcma"                    # Multiple Choice Multiple Answer
    TRUE_FALSE = "true_false"        # True or False
    FILL_IN_BLANK = "fill_in_blank"  # Fill in the blank with word bank
    WORD_MATCH = "word_match"        # Match words to definitions


class QuizType(str, Enum):
    """Different contexts for administering quizzes"""
    DIAGNOSTIC = "diagnostic"              # Initial assessment (15-20 questions)
    POP_QUIZ = "pop_quiz"                  # Quick check during lesson (3-5 questions)
    PROGRESS_CHECK = "progress_check"      # Comprehensive review (10-15 questions)
    FINAL_ASSESSMENT = "final_assessment"  # End-of-unit test (20+ questions)


class DifficultyLevel(str, Enum):
    """Content difficulty progression"""
    BEGINNER = "beginner"          # Grade 6 level, basic concepts
    INTERMEDIATE = "intermediate"  # Grade 7 level, moderate complexity
    ADVANCED = "advanced"          # Grade 8 level, challenging content


class StudentInterest(str, Enum):
    """Predefined interests for content personalization"""
    # STEM
    SCIENCE = "science"
    TECHNOLOGY = "technology"
    MATH = "math"
    SPACE = "space"
    ANIMALS = "animals"
    NATURE = "nature"
    
    # Arts & Entertainment
    MUSIC = "music"
    ART = "art"
    MOVIES = "movies"
    BOOKS = "books"
    THEATER = "theater"
    
    # Activities
    SPORTS = "sports"
    GAMING = "gaming"
    COOKING = "cooking"
    TRAVEL = "travel"
    
    # Social Studies
    HISTORY = "history"
    GEOGRAPHY = "geography"
    CULTURE = "culture"
    FASHION = "fashion"


class FocusArea(str, Enum):
    """Core English language learning domains"""
    VOCABULARY = "vocabulary"             # Word learning, definitions
    GRAMMAR = "grammar"                   # Sentence structure, tenses
    READING_COMPREHENSION = "reading"     # Understanding passages
    WRITING = "writing"                   # Composition, essays
    SPELLING = "spelling"                 # Correct spelling
    PUNCTUATION = "punctuation"           # Commas, periods, etc.
    SPEAKING = "speaking"                 # Oral communication (future)
    LISTENING = "listening"               # Audio comprehension (future)


class ActionType(str, Enum):
    """Types of responses the tutor_agent can return"""
    PRESENT_LESSON = "present_lesson"          # Show lesson content
    PRESENT_QUIZ = "present_quiz"              # Show quiz
    SHOW_FEEDBACK = "show_feedback"            # Show answer feedback
    AWARD_ACHIEVEMENT = "award_achievement"    # Unlock badge
    SHOW_PROGRESS = "show_progress"            # Display progress stats
    CONVERSATION = "conversation"              # Ask clarifying questions


class AchievementType(str, Enum):
    """All unlockable achievements"""
    # Vocabulary Achievements
    WORD_SPROUT = "word_sprout_10"
    WORD_COLLECTOR = "word_collector_50"
    WORD_WIZARD = "word_wizard_100"
    WORD_EXPERT = "word_expert_250"
    VOCABULARY_MASTER = "vocabulary_master_500"
    
    # Grammar Achievements
    GRAMMAR_ROOKIE = "grammar_rookie_first"
    GRAMMAR_GURU = "grammar_guru_5"
    GRAMMAR_EXPERT = "grammar_expert_10"
    GRAMMAR_MASTER = "grammar_master_20"
    
    # Reading Achievements
    FIRST_LESSON = "first_lesson"
    BOOKWORM = "bookworm_10"
    AVID_READER = "avid_reader_25"
    LIBRARY_CARD = "library_card_50"
    LITERATURE_LOVER = "literature_lover_100"
    READING_CHAMPION = "reading_champion_250"
    
    # Streak Achievements
    HOT_STREAK = "hot_streak_3"
    DEDICATED_LEARNER = "dedicated_learner_7"
    WEEK_WARRIOR = "week_warrior_14"
    UNSTOPPABLE = "unstoppable_30"
    PERSISTENT_LEGEND = "persistent_legend_100"
    
    # Speed Achievements
    QUICK_DRAW = "quick_draw"
    SPEED_DEMON = "speed_demon_10"
    LIGHTNING_FAST = "lightning_fast_50"
    TIME_MASTER = "time_master_100"
    
    # Accuracy Achievements
    SHARPSHOOTER = "sharpshooter_90"
    ACE_STUDENT = "ace_student_5"
    PERFECTIONIST = "perfectionist_100"
    CHAMPION = "champion_5"
    FLAWLESS = "flawless_20"
    
    # Level Achievements
    LEVEL_5 = "level_5"
    LEVEL_10 = "level_10"
    LEVEL_15 = "level_15"
    LEVEL_20 = "level_20"
    LEVEL_30 = "level_30"
    
    # Special Achievements
    EARLY_BIRD = "early_bird"
    NIGHT_OWL = "night_owl"
    WEEKEND_WARRIOR = "weekend_warrior_4"
    COMEBACK_KID = "comeback_kid"
    HELPING_HAND = "helping_hand"


class BadgeRarity(str, Enum):
    """Visual and reward differentiation for achievements"""
    COMMON = "common"          # Gray, easy to earn
    UNCOMMON = "uncommon"      # Green, moderate effort
    RARE = "rare"              # Blue, significant achievement
    EPIC = "epic"              # Purple, major milestone
    LEGENDARY = "legendary"    # Gold, exceptional accomplishment


class Subject(str, Enum):
    """Available learning subjects"""
    ENGLISH = "english"
    MATH = "math"
    SCIENCE = "science"
    HISTORY = "history"


class GradeLevel(int, Enum):
    """Middle school grade levels"""
    GRADE_6 = 6
    GRADE_7 = 7
    GRADE_8 = 8


class LessonContentType(str, Enum):
    """Different formats of educational content"""
    READING_PASSAGE = "reading_passage"      # Main content type
    VOCABULARY_DRILL = "vocabulary_drill"    # Word focus
    GRAMMAR_EXERCISE = "grammar_exercise"    # Grammar focus
    WRITING_PROMPT = "writing_prompt"        # Creative writing
    COMPREHENSION = "comprehension"          # Q&A about text


class ResponseStatus(str, Enum):
    """Response status codes"""
    SUCCESS = "success"
    PARTIAL_SUCCESS = "partial_success"
    VALIDATION_ERROR = "validation_error"
    NOT_FOUND = "not_found"
    UNAUTHORIZED = "unauthorized"
    TOOL_ERROR = "tool_error"
    SYSTEM_ERROR = "system_error"


# ==================== Configuration Constants ====================

# XP Rewards
class XPReward:
    """XP rewards for various actions"""
    LESSON_COMPLETION = 50
    QUIZ_COMPLETION = 25
    PERFECT_QUIZ = 100
    CORRECT_ANSWER = 10
    FAST_ANSWER_BONUS = 5        # Answer in <5 seconds
    STREAK_DAILY = 25             # Per day in streak
    FIRST_TRY_BONUS = 15          # Get it right first try
    QUIZ_90_PLUS = 50             # Score 90% or higher
    COMEBACK_BONUS = 30           # Return after 7+ day break


# Level progression
def calculate_xp_for_level(level: int) -> int:
    """Calculate total XP needed to reach a level"""
    return int(100 * (1.5 ** (level - 1)))


# Precomputed level thresholds
LEVEL_XP_THRESHOLDS = {
    1: 0, 2: 100, 3: 250, 4: 475, 5: 813,
    6: 1319, 7: 2079, 8: 3219, 9: 4928, 10: 7493,
    11: 11339, 12: 17109, 13: 25763, 14: 38745, 15: 58217,
    16: 87426, 17: 131239, 18: 196959, 19: 295538, 20: 443407,
    21: 665211, 22: 997916, 23: 1496974, 24: 2245561, 25: 3368442,
    26: 5052763, 27: 7579245, 28: 11368967, 29: 17053551, 30: 25580426
}

# Level titles
LEVEL_TITLES = {
    1: "Beginner",
    5: "Apprentice",
    10: "Scholar",
    15: "Expert",
    20: "Master",
    25: "Grandmaster",
    30: "Legend"
}

# Rarity XP multipliers
RARITY_XP_MULTIPLIERS = {
    BadgeRarity.COMMON: 1.0,
    BadgeRarity.UNCOMMON: 1.5,
    BadgeRarity.RARE: 2.0,
    BadgeRarity.EPIC: 3.0,
    BadgeRarity.LEGENDARY: 5.0
}

# Rarity colors (Tailwind-compatible)
RARITY_COLORS = {
    BadgeRarity.COMMON: "#9ca3af",
    BadgeRarity.UNCOMMON: "#10b981",
    BadgeRarity.RARE: "#3b82f6",
    BadgeRarity.EPIC: "#a855f7",
    BadgeRarity.LEGENDARY: "#f59e0b"
}

# Grade vocabulary ranges (Lexile-style)
GRADE_VOCABULARY_RANGES: Dict[GradeLevel, Tuple[int, int]] = {
    GradeLevel.GRADE_6: (400, 700),
    GradeLevel.GRADE_7: (650, 850),
    GradeLevel.GRADE_8: (800, 1000)
}

# Expected reading speed (words per minute)
GRADE_READING_SPEEDS: Dict[GradeLevel, Tuple[int, int]] = {
    GradeLevel.GRADE_6: (150, 200),
    GradeLevel.GRADE_7: (180, 240),
    GradeLevel.GRADE_8: (200, 260)
}

# Difficulty vocabulary ranges
DIFFICULTY_VOCABULARY_RANGES = {
    DifficultyLevel.BEGINNER: (400, 700),
    DifficultyLevel.INTERMEDIATE: (650, 850),
    DifficultyLevel.ADVANCED: (800, 1000)
}

# Subject-specific skill areas (replaces hard-coded FocusArea for multi-subject support)
SUBJECT_SKILL_AREAS: Dict[Subject, list] = {
    Subject.ENGLISH: [
        "vocabulary",
        "grammar",
        "reading_comprehension",
        "writing",
        "spelling",
        "punctuation",
        "literary_analysis"
    ],
    Subject.MATH: [
        "arithmetic",
        "algebra",
        "geometry",
        "fractions_decimals",
        "word_problems",
        "mental_math",
        "problem_solving",
        "measurement"
    ],
    Subject.SCIENCE: [
        "scientific_method",
        "biology",
        "chemistry",
        "physics",
        "earth_science",
        "observation",
        "lab_skills",
        "data_analysis"
    ],
    Subject.HISTORY: [
        "chronological_thinking",
        "cause_effect",
        "primary_sources",
        "historical_analysis",
        "geography",
        "cultural_understanding",
        "civics"
    ]
}

# Subject metadata for AI context and UI display
SUBJECT_METADATA: Dict[Subject, Dict[str, Any]] = {
    Subject.ENGLISH: {
        "display_name": "English Language Arts",
        "description": "Master reading, writing, and language skills",
        "icon": "📚",
        "color": "#3b82f6",
        "diagnostic_focuses": ["vocabulary", "grammar", "reading_comprehension"]
    },
    Subject.MATH: {
        "display_name": "Mathematics",
        "description": "Develop problem-solving and numerical reasoning",
        "icon": "🔢",
        "color": "#10b981",
        "diagnostic_focuses": ["arithmetic", "algebra", "geometry"]
    },
    Subject.SCIENCE: {
        "display_name": "Science",
        "description": "Explore scientific concepts and inquiry",
        "icon": "🔬",
        "color": "#8b5cf6",
        "diagnostic_focuses": ["scientific_method", "biology", "chemistry", "physics"]
    },
    Subject.HISTORY: {
        "display_name": "History & Social Studies",
        "description": "Understand past events and their significance",
        "icon": "📜",
        "color": "#f59e0b",
        "diagnostic_focuses": ["chronological_thinking", "cause_effect", "primary_sources"]
    }
}

# Interest display information
INTEREST_DISPLAY_INFO = {
    StudentInterest.SCIENCE: {
        "icon": "🔬",
        "label": "Science",
        "color": "#10b981",
        "description": "Experiments, discoveries, and how things work"
    },
    StudentInterest.TECHNOLOGY: {
        "icon": "💻",
        "label": "Technology",
        "color": "#3b82f6",
        "description": "Computers, coding, and innovation"
    },
    StudentInterest.SPACE: {
        "icon": "🚀",
        "label": "Space",
        "color": "#8b5cf6",
        "description": "Planets, stars, and space exploration"
    },
    StudentInterest.ANIMALS: {
        "icon": "🐾",
        "label": "Animals",
        "color": "#f59e0b",
        "description": "Wildlife, pets, and animal behavior"
    },
    StudentInterest.NATURE: {
        "icon": "🌿",
        "label": "Nature",
        "color": "#059669",
        "description": "Plants, ecosystems, and the environment"
    },
    StudentInterest.MUSIC: {
        "icon": "🎵",
        "label": "Music",
        "color": "#ec4899",
        "description": "Songs, instruments, and musical creativity"
    },
    StudentInterest.ART: {
        "icon": "🎨",
        "label": "Art",
        "color": "#ef4444",
        "description": "Drawing, painting, and creative expression"
    },
    StudentInterest.MOVIES: {
        "icon": "🎬",
        "label": "Movies",
        "color": "#f97316",
        "description": "Films, cinema, and storytelling"
    },
    StudentInterest.BOOKS: {
        "icon": "📚",
        "label": "Books",
        "color": "#d97706",
        "description": "Reading, literature, and stories"
    },
    StudentInterest.THEATER: {
        "icon": "🎭",
        "label": "Theater",
        "color": "#dc2626",
        "description": "Drama, plays, and performance"
    },
    StudentInterest.SPORTS: {
        "icon": "⚽",
        "label": "Sports",
        "color": "#06b6d4",
        "description": "Athletics, games, and competition"
    },
    StudentInterest.GAMING: {
        "icon": "🎮",
        "label": "Gaming",
        "color": "#a855f7",
        "description": "Video games, esports, and strategy"
    },
    StudentInterest.COOKING: {
        "icon": "🍳",
        "label": "Cooking",
        "color": "#ea580c",
        "description": "Food, recipes, and culinary arts"
    },
    StudentInterest.TRAVEL: {
        "icon": "✈️",
        "label": "Travel",
        "color": "#0891b2",
        "description": "Exploring places and cultures"
    },
    StudentInterest.HISTORY: {
        "icon": "📜",
        "label": "History",
        "color": "#92400e",
        "description": "Past events, civilizations, and heritage"
    },
    StudentInterest.GEOGRAPHY: {
        "icon": "🗺️",
        "label": "Geography",
        "color": "#047857",
        "description": "Maps, countries, and world exploration"
    },
    StudentInterest.CULTURE: {
        "icon": "🌍",
        "label": "Culture",
        "color": "#7c2d12",
        "description": "Traditions, customs, and diversity"
    },
    StudentInterest.FASHION: {
        "icon": "👗",
        "label": "Fashion",
        "color": "#be185d",
        "description": "Style, design, and self-expression"
    }
}
