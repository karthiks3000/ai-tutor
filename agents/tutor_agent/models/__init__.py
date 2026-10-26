"""
AI Tutor Agent Models
"""
from .constants import (
    QuestionType,
    QuizType,
    DifficultyLevel,
    StudentInterest,
    FocusArea,
    ActionType,
    AchievementType,
    BadgeRarity,
    GradeLevel,
    LessonContentType,
    ResponseStatus,
    XPReward,
    calculate_xp_for_level,
    LEVEL_XP_THRESHOLDS,
    LEVEL_TITLES,
    RARITY_XP_MULTIPLIERS,
    RARITY_COLORS,
    GRADE_VOCABULARY_RANGES,
    GRADE_READING_SPEEDS,
    DIFFICULTY_VOCABULARY_RANGES,
    INTEREST_DISPLAY_INFO,
)

from .achievement_definitions import (
    ACHIEVEMENT_DEFINITIONS,
    get_achievement_definition,
    get_achievements_by_category,
    get_achievements_by_rarity,
)

__all__ = [
    # Enums
    "QuestionType",
    "QuizType",
    "DifficultyLevel",
    "StudentInterest",
    "FocusArea",
    "ActionType",
    "AchievementType",
    "BadgeRarity",
    "GradeLevel",
    "LessonContentType",
    "ResponseStatus",
    # Constants
    "XPReward",
    "calculate_xp_for_level",
    "LEVEL_XP_THRESHOLDS",
    "LEVEL_TITLES",
    "RARITY_XP_MULTIPLIERS",
    "RARITY_COLORS",
    "GRADE_VOCABULARY_RANGES",
    "GRADE_READING_SPEEDS",
    "DIFFICULTY_VOCABULARY_RANGES",
    "INTEREST_DISPLAY_INFO",
    # Achievement functions
    "ACHIEVEMENT_DEFINITIONS",
    "get_achievement_definition",
    "get_achievements_by_category",
    "get_achievements_by_rarity",
]
