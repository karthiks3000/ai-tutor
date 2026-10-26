"""
Achievement checking and awarding tool
Handles all gamification logic for badge unlocks and XP rewards
"""
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from models.lesson_models import Achievement
from models.achievement_definitions import ACHIEVEMENT_DEFINITIONS, get_achievement_definition
from models.constants import AchievementType, BadgeRarity


def check_and_award_achievements(
    student_id: str,
    trigger_event: str,
    current_progress: Dict[str, Any],
    already_earned_badges: List[str]
) -> List[Achievement]:
    """
    Check if any achievements should be unlocked and create them.
    
    Args:
        student_id: Student identifier
        trigger_event: What triggered the check (e.g., "lesson_completed", "quiz_perfect")
        current_progress: Current student progress stats
        already_earned_badges: List of already earned achievement types
    
    Returns:
        List of newly unlocked achievements (may be empty)
    """
    
    newly_unlocked: List[Achievement] = []
    current_timestamp = int(datetime.now().timestamp())
    
    # Extract progress metrics
    words_learned = current_progress.get("total_words_learned", 0)
    lessons_completed = current_progress.get("total_lessons_completed", 0)
    consecutive_days = current_progress.get("current_streak_days", 0)
    perfect_quizzes = current_progress.get("perfect_quiz_count", 0)
    high_score_quizzes = current_progress.get("high_score_quiz_count", 0)
    fast_answers = current_progress.get("fast_answer_count", 0)
    current_level = current_progress.get("current_level", 1)
    
    # Check each achievement type
    achievements_to_check = []
    
    # Vocabulary achievements
    if trigger_event in ["lesson_completed", "quiz_completed"]:
        if words_learned >= 10 and AchievementType.WORD_SPROUT.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.WORD_SPROUT)
        if words_learned >= 50 and AchievementType.WORD_COLLECTOR.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.WORD_COLLECTOR)
        if words_learned >= 100 and AchievementType.WORD_WIZARD.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.WORD_WIZARD)
        if words_learned >= 250 and AchievementType.WORD_EXPERT.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.WORD_EXPERT)
        if words_learned >= 500 and AchievementType.VOCABULARY_MASTER.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.VOCABULARY_MASTER)
    
    # Reading achievements
    if trigger_event == "lesson_completed":
        if lessons_completed >= 1 and AchievementType.FIRST_LESSON.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.FIRST_LESSON)
        if lessons_completed >= 10 and AchievementType.BOOKWORM.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.BOOKWORM)
        if lessons_completed >= 25 and AchievementType.AVID_READER.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.AVID_READER)
        if lessons_completed >= 50 and AchievementType.LIBRARY_CARD.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.LIBRARY_CARD)
        if lessons_completed >= 100 and AchievementType.LITERATURE_LOVER.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.LITERATURE_LOVER)
        if lessons_completed >= 250 and AchievementType.READING_CHAMPION.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.READING_CHAMPION)
    
    # Grammar achievements
    if trigger_event == "quiz_perfect" and current_progress.get("quiz_topic", "").lower().find("grammar") >= 0:
        if perfect_quizzes >= 1 and AchievementType.GRAMMAR_ROOKIE.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.GRAMMAR_ROOKIE)
        if perfect_quizzes >= 5 and AchievementType.GRAMMAR_GURU.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.GRAMMAR_GURU)
        if perfect_quizzes >= 10 and AchievementType.GRAMMAR_EXPERT.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.GRAMMAR_EXPERT)
        if perfect_quizzes >= 20 and AchievementType.GRAMMAR_MASTER.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.GRAMMAR_MASTER)
    
    # Streak achievements
    if trigger_event == "daily_streak_updated":
        if consecutive_days >= 3 and AchievementType.HOT_STREAK.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.HOT_STREAK)
        if consecutive_days >= 7 and AchievementType.DEDICATED_LEARNER.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.DEDICATED_LEARNER)
        if consecutive_days >= 14 and AchievementType.WEEK_WARRIOR.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.WEEK_WARRIOR)
        if consecutive_days >= 30 and AchievementType.UNSTOPPABLE.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.UNSTOPPABLE)
        if consecutive_days >= 100 and AchievementType.PERSISTENT_LEGEND.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.PERSISTENT_LEGEND)
    
    # Speed achievements
    if trigger_event == "fast_answer":
        if fast_answers >= 1 and AchievementType.QUICK_DRAW.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.QUICK_DRAW)
        if fast_answers >= 10 and AchievementType.SPEED_DEMON.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.SPEED_DEMON)
        if fast_answers >= 50 and AchievementType.LIGHTNING_FAST.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.LIGHTNING_FAST)
        if fast_answers >= 100 and AchievementType.TIME_MASTER.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.TIME_MASTER)
    
    # Accuracy achievements
    if trigger_event == "quiz_completed":
        quiz_score = current_progress.get("last_quiz_score", 0)
        if quiz_score >= 90 and high_score_quizzes >= 1 and AchievementType.SHARPSHOOTER.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.SHARPSHOOTER)
        if high_score_quizzes >= 5 and AchievementType.ACE_STUDENT.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.ACE_STUDENT)
        if quiz_score == 100 and AchievementType.PERFECTIONIST.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.PERFECTIONIST)
        if perfect_quizzes >= 5 and AchievementType.CHAMPION.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.CHAMPION)
        if perfect_quizzes >= 20 and AchievementType.FLAWLESS.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.FLAWLESS)
    
    # Level achievements
    if trigger_event == "level_up":
        if current_level >= 5 and AchievementType.LEVEL_5.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.LEVEL_5)
        if current_level >= 10 and AchievementType.LEVEL_10.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.LEVEL_10)
        if current_level >= 15 and AchievementType.LEVEL_15.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.LEVEL_15)
        if current_level >= 20 and AchievementType.LEVEL_20.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.LEVEL_20)
        if current_level >= 30 and AchievementType.LEVEL_30.value not in already_earned_badges:
            achievements_to_check.append(AchievementType.LEVEL_30)
    
    # Create achievement objects for newly unlocked
    for achievement_type in achievements_to_check:
        definition = get_achievement_definition(achievement_type)
        
        if definition:
            # Calculate progress towards next achievement
            progress_to_next = _calculate_progress_to_next(
                achievement_type,
                current_progress,
                already_earned_badges
            )
            
            achievement = Achievement(
                achievement_id=f"ach-{uuid.uuid4().hex[:8]}",
                student_id=student_id,
                achievement_type=achievement_type.value,
                title=definition["title"],
                description=definition["description"],
                badge_icon=definition["icon"],
                badge_color=definition["color"],
                xp_awarded=definition["xp_reward"],
                rarity=definition["rarity"].value,
                category=definition["category"],
                unlocked_at=current_timestamp,
                progress_towards_next=progress_to_next
            )
            
            newly_unlocked.append(achievement)
    
    return newly_unlocked


def _calculate_progress_to_next(
    current_achievement: AchievementType,
    progress: Dict[str, Any],
    earned_badges: List[str]
) -> Optional[Dict[str, Any]]:
    """Calculate progress towards next achievement in same category"""
    
    # Map achievement to next in sequence
    vocabulary_sequence = [
        AchievementType.WORD_SPROUT,
        AchievementType.WORD_COLLECTOR,
        AchievementType.WORD_WIZARD,
        AchievementType.WORD_EXPERT,
        AchievementType.VOCABULARY_MASTER
    ]
    
    reading_sequence = [
        AchievementType.FIRST_LESSON,
        AchievementType.BOOKWORM,
        AchievementType.AVID_READER,
        AchievementType.LIBRARY_CARD,
        AchievementType.LITERATURE_LOVER,
        AchievementType.READING_CHAMPION
    ]
    
    # Find current in sequence
    if current_achievement in vocabulary_sequence:
        current_idx = vocabulary_sequence.index(current_achievement)
        if current_idx < len(vocabulary_sequence) - 1:
            next_achievement = vocabulary_sequence[current_idx + 1]
            next_def = get_achievement_definition(next_achievement)
            current_words = progress.get("total_words_learned", 0)
            target_words = next_def["criteria"]["words_learned"]
            
            return {
                "next_achievement": next_achievement.value,
                "current": current_words,
                "target": target_words,
                "percentage": min(100, int((current_words / target_words) * 100))
            }
    
    elif current_achievement in reading_sequence:
        current_idx = reading_sequence.index(current_achievement)
        if current_idx < len(reading_sequence) - 1:
            next_achievement = reading_sequence[current_idx + 1]
            next_def = get_achievement_definition(next_achievement)
            current_lessons = progress.get("total_lessons_completed", 0)
            target_lessons = next_def["criteria"]["lessons_completed"]
            
            return {
                "next_achievement": next_achievement.value,
                "current": current_lessons,
                "target": target_lessons,
                "percentage": min(100, int((current_lessons / target_lessons) * 100))
            }
    
    return None
