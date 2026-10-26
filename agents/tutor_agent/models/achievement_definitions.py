"""
Complete achievement definitions with metadata.
Must match TypeScript definitions in frontend/src/types/achievementDefinitions.ts
"""
from typing import Dict, Any
from .constants import AchievementType, BadgeRarity


ACHIEVEMENT_DEFINITIONS: Dict[AchievementType, Dict[str, Any]] = {
    # ==================== Vocabulary Achievements ====================
    AchievementType.WORD_SPROUT: {
        "title": "Word Sprout",
        "description": "Learned your first 10 vocabulary words",
        "icon": "🌱",
        "color": "#10b981",
        "xp_reward": 50,
        "rarity": BadgeRarity.COMMON,
        "category": "vocabulary",
        "criteria": {"words_learned": 10}
    },
    AchievementType.WORD_COLLECTOR: {
        "title": "Word Collector",
        "description": "Mastered 50 vocabulary words",
        "icon": "📚",
        "color": "#059669",
        "xp_reward": 150,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "vocabulary",
        "criteria": {"words_learned": 50}
    },
    AchievementType.WORD_WIZARD: {
        "title": "Word Wizard",
        "description": "Conquered 100 vocabulary words!",
        "icon": "🧙‍♂️",
        "color": "#3b82f6",
        "xp_reward": 300,
        "rarity": BadgeRarity.RARE,
        "category": "vocabulary",
        "criteria": {"words_learned": 100}
    },
    AchievementType.WORD_EXPERT: {
        "title": "Word Expert",
        "description": "Incredible! 250 vocabulary words mastered",
        "icon": "🎯",
        "color": "#8b5cf6",
        "xp_reward": 600,
        "rarity": BadgeRarity.EPIC,
        "category": "vocabulary",
        "criteria": {"words_learned": 250}
    },
    AchievementType.VOCABULARY_MASTER: {
        "title": "Vocabulary Master",
        "description": "Legendary! 500 vocabulary words conquered!",
        "icon": "🎓",
        "color": "#f59e0b",
        "xp_reward": 1000,
        "rarity": BadgeRarity.LEGENDARY,
        "category": "vocabulary",
        "criteria": {"words_learned": 500}
    },
    
    # ==================== Grammar Achievements ====================
    AchievementType.GRAMMAR_ROOKIE: {
        "title": "Grammar Rookie",
        "description": "First perfect grammar quiz!",
        "icon": "✍️",
        "color": "#10b981",
        "xp_reward": 75,
        "rarity": BadgeRarity.COMMON,
        "category": "grammar",
        "criteria": {"perfect_grammar_quizzes": 1}
    },
    AchievementType.GRAMMAR_GURU: {
        "title": "Grammar Guru",
        "description": "5 perfect grammar quizzes",
        "icon": "📝",
        "color": "#3b82f6",
        "xp_reward": 250,
        "rarity": BadgeRarity.RARE,
        "category": "grammar",
        "criteria": {"perfect_grammar_quizzes": 5}
    },
    AchievementType.GRAMMAR_EXPERT: {
        "title": "Grammar Expert",
        "description": "10 perfect grammar quizzes!",
        "icon": "📖",
        "color": "#a855f7",
        "xp_reward": 500,
        "rarity": BadgeRarity.EPIC,
        "category": "grammar",
        "criteria": {"perfect_grammar_quizzes": 10}
    },
    AchievementType.GRAMMAR_MASTER: {
        "title": "Grammar Master",
        "description": "20 perfect grammar quizzes! You're unstoppable!",
        "icon": "🎓",
        "color": "#f59e0b",
        "xp_reward": 1000,
        "rarity": BadgeRarity.LEGENDARY,
        "category": "grammar",
        "criteria": {"perfect_grammar_quizzes": 20}
    },
    
    # ==================== Reading Achievements ====================
    AchievementType.FIRST_LESSON: {
        "title": "Getting Started",
        "description": "Completed your very first lesson!",
        "icon": "🎯",
        "color": "#3b82f6",
        "xp_reward": 25,
        "rarity": BadgeRarity.COMMON,
        "category": "reading",
        "criteria": {"lessons_completed": 1}
    },
    AchievementType.BOOKWORM: {
        "title": "Bookworm",
        "description": "Read 10 lessons",
        "icon": "📖",
        "color": "#10b981",
        "xp_reward": 100,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "reading",
        "criteria": {"lessons_completed": 10}
    },
    AchievementType.AVID_READER: {
        "title": "Avid Reader",
        "description": "Completed 25 lessons!",
        "icon": "📚",
        "color": "#059669",
        "xp_reward": 200,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "reading",
        "criteria": {"lessons_completed": 25}
    },
    AchievementType.LIBRARY_CARD: {
        "title": "Library Card",
        "description": "50 lessons read! Amazing dedication",
        "icon": "🏛️",
        "color": "#3b82f6",
        "xp_reward": 400,
        "rarity": BadgeRarity.RARE,
        "category": "reading",
        "criteria": {"lessons_completed": 50}
    },
    AchievementType.LITERATURE_LOVER: {
        "title": "Literature Lover",
        "description": "100 lessons! You're a reading champion!",
        "icon": "🏆",
        "color": "#a855f7",
        "xp_reward": 800,
        "rarity": BadgeRarity.EPIC,
        "category": "reading",
        "criteria": {"lessons_completed": 100}
    },
    AchievementType.READING_CHAMPION: {
        "title": "Reading Champion",
        "description": "250 lessons! Legendary dedication!",
        "icon": "👑",
        "color": "#f59e0b",
        "xp_reward": 1500,
        "rarity": BadgeRarity.LEGENDARY,
        "category": "reading",
        "criteria": {"lessons_completed": 250}
    },
    
    # ==================== Streak Achievements ====================
    AchievementType.HOT_STREAK: {
        "title": "Hot Streak",
        "description": "Learned 3 days in a row!",
        "icon": "🔥",
        "color": "#f59e0b",
        "xp_reward": 75,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "streak",
        "criteria": {"consecutive_days": 3}
    },
    AchievementType.DEDICATED_LEARNER: {
        "title": "Dedicated Learner",
        "description": "7 day streak! A full week!",
        "icon": "🌟",
        "color": "#3b82f6",
        "xp_reward": 200,
        "rarity": BadgeRarity.RARE,
        "category": "streak",
        "criteria": {"consecutive_days": 7}
    },
    AchievementType.WEEK_WARRIOR: {
        "title": "Week Warrior",
        "description": "2 weeks straight! Incredible commitment!",
        "icon": "💪",
        "color": "#a855f7",
        "xp_reward": 400,
        "rarity": BadgeRarity.EPIC,
        "category": "streak",
        "criteria": {"consecutive_days": 14}
    },
    AchievementType.UNSTOPPABLE: {
        "title": "Unstoppable",
        "description": "30 days! You're a learning machine!",
        "icon": "⚡",
        "color": "#f59e0b",
        "xp_reward": 1000,
        "rarity": BadgeRarity.LEGENDARY,
        "category": "streak",
        "criteria": {"consecutive_days": 30}
    },
    AchievementType.PERSISTENT_LEGEND: {
        "title": "Persistent Legend",
        "description": "100 days! Absolutely legendary!",
        "icon": "👑",
        "color": "#f59e0b",
        "xp_reward": 2500,
        "rarity": BadgeRarity.LEGENDARY,
        "category": "streak",
        "criteria": {"consecutive_days": 100}
    },
    
    # ==================== Speed Achievements ====================
    AchievementType.QUICK_DRAW: {
        "title": "Quick Draw",
        "description": "Answered in under 5 seconds!",
        "icon": "⚡",
        "color": "#f59e0b",
        "xp_reward": 50,
        "rarity": BadgeRarity.COMMON,
        "category": "speed",
        "criteria": {"fast_answers": 1}
    },
    AchievementType.SPEED_DEMON: {
        "title": "Speed Demon",
        "description": "10 lightning-fast answers!",
        "icon": "🚀",
        "color": "#10b981",
        "xp_reward": 150,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "speed",
        "criteria": {"fast_answers": 10}
    },
    AchievementType.LIGHTNING_FAST: {
        "title": "Lightning Fast",
        "description": "50 super-fast answers!",
        "icon": "⚡",
        "color": "#3b82f6",
        "xp_reward": 400,
        "rarity": BadgeRarity.RARE,
        "category": "speed",
        "criteria": {"fast_answers": 50}
    },
    AchievementType.TIME_MASTER: {
        "title": "Time Master",
        "description": "100 rapid-fire answers! Incredible reflexes!",
        "icon": "⏱️",
        "color": "#f59e0b",
        "xp_reward": 800,
        "rarity": BadgeRarity.LEGENDARY,
        "category": "speed",
        "criteria": {"fast_answers": 100}
    },
    
    # ==================== Accuracy Achievements ====================
    AchievementType.SHARPSHOOTER: {
        "title": "Sharpshooter",
        "description": "First quiz with 90% or higher!",
        "icon": "🎯",
        "color": "#10b981",
        "xp_reward": 75,
        "rarity": BadgeRarity.COMMON,
        "category": "accuracy",
        "criteria": {"high_score_quizzes": 1, "threshold": 90}
    },
    AchievementType.ACE_STUDENT: {
        "title": "Ace Student",
        "description": "5 quizzes with 90% or higher!",
        "icon": "🌟",
        "color": "#3b82f6",
        "xp_reward": 250,
        "rarity": BadgeRarity.RARE,
        "category": "accuracy",
        "criteria": {"high_score_quizzes": 5, "threshold": 90}
    },
    AchievementType.PERFECTIONIST: {
        "title": "Perfectionist",
        "description": "Perfect score! 100% on a quiz!",
        "icon": "💯",
        "color": "#a855f7",
        "xp_reward": 200,
        "rarity": BadgeRarity.RARE,
        "category": "accuracy",
        "criteria": {"perfect_quizzes": 1}
    },
    AchievementType.CHAMPION: {
        "title": "Champion",
        "description": "5 perfect quizzes! You're a champion!",
        "icon": "🏅",
        "color": "#a855f7",
        "xp_reward": 600,
        "rarity": BadgeRarity.EPIC,
        "category": "accuracy",
        "criteria": {"perfect_quizzes": 5}
    },
    AchievementType.FLAWLESS: {
        "title": "Flawless",
        "description": "20 perfect quizzes! Absolutely flawless!",
        "icon": "💎",
        "color": "#f59e0b",
        "xp_reward": 1500,
        "rarity": BadgeRarity.LEGENDARY,
        "category": "accuracy",
        "criteria": {"perfect_quizzes": 20}
    },
    
    # ==================== Level Achievements ====================
    AchievementType.LEVEL_5: {
        "title": "Apprentice",
        "description": "Reached Level 5!",
        "icon": "🎖️",
        "color": "#10b981",
        "xp_reward": 100,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "level",
        "criteria": {"level": 5}
    },
    AchievementType.LEVEL_10: {
        "title": "Scholar",
        "description": "Level 10 achieved!",
        "icon": "📚",
        "color": "#3b82f6",
        "xp_reward": 250,
        "rarity": BadgeRarity.RARE,
        "category": "level",
        "criteria": {"level": 10}
    },
    AchievementType.LEVEL_15: {
        "title": "Expert",
        "description": "Level 15! You're an expert now!",
        "icon": "⭐",
        "color": "#8b5cf6",
        "xp_reward": 500,
        "rarity": BadgeRarity.EPIC,
        "category": "level",
        "criteria": {"level": 15}
    },
    AchievementType.LEVEL_20: {
        "title": "Master",
        "description": "Level 20! Master of English!",
        "icon": "🏆",
        "color": "#a855f7",
        "xp_reward": 800,
        "rarity": BadgeRarity.EPIC,
        "category": "level",
        "criteria": {"level": 20}
    },
    AchievementType.LEVEL_30: {
        "title": "Legend",
        "description": "Level 30! You're a LEGEND!",
        "icon": "👑",
        "color": "#f59e0b",
        "xp_reward": 2000,
        "rarity": BadgeRarity.LEGENDARY,
        "category": "level",
        "criteria": {"level": 30}
    },
    
    # ==================== Special Achievements ====================
    AchievementType.EARLY_BIRD: {
        "title": "Early Bird",
        "description": "Completed a lesson before 8 AM!",
        "icon": "🌅",
        "color": "#f59e0b",
        "xp_reward": 50,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "special",
        "criteria": {"morning_lessons": 1}
    },
    AchievementType.NIGHT_OWL: {
        "title": "Night Owl",
        "description": "Learning after 10 PM! Dedication!",
        "icon": "🦉",
        "color": "#6366f1",
        "xp_reward": 50,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "special",
        "criteria": {"night_lessons": 1}
    },
    AchievementType.WEEKEND_WARRIOR: {
        "title": "Weekend Warrior",
        "description": "4 weekend learning sessions!",
        "icon": "🎖️",
        "color": "#10b981",
        "xp_reward": 100,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "special",
        "criteria": {"weekend_sessions": 4}
    },
    AchievementType.COMEBACK_KID: {
        "title": "Comeback Kid",
        "description": "Returned after a break! Welcome back!",
        "icon": "💪",
        "color": "#8b5cf6",
        "xp_reward": 75,
        "rarity": BadgeRarity.UNCOMMON,
        "category": "special",
        "criteria": {"comeback": True}
    },
    AchievementType.HELPING_HAND: {
        "title": "Helping Hand",
        "description": "Shared your achievement!",
        "icon": "🤝",
        "color": "#ec4899",
        "xp_reward": 50,
        "rarity": BadgeRarity.COMMON,
        "category": "special",
        "criteria": {"achievements_shared": 1}
    },
}


def get_achievement_definition(achievement_type: AchievementType) -> Dict[str, Any]:
    """Get achievement definition by type"""
    return ACHIEVEMENT_DEFINITIONS.get(achievement_type, {})


def get_achievements_by_category(category: str) -> Dict[AchievementType, Dict[str, Any]]:
    """Get all achievements for a specific category"""
    return {
        k: v for k, v in ACHIEVEMENT_DEFINITIONS.items()
        if v.get("category") == category
    }


def get_achievements_by_rarity(rarity: BadgeRarity) -> Dict[AchievementType, Dict[str, Any]]:
    """Get all achievements of a specific rarity"""
    return {
        k: v for k, v in ACHIEVEMENT_DEFINITIONS.items()
        if v.get("rarity") == rarity
    }
