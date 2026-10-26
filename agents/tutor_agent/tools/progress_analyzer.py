"""
Learning progress analysis tool
Analyzes student performance and provides recommendations
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from models.student_models import ProgressAnalysis
from models.constants import FocusArea


def analyze_learning_progress(
    student_id: str,
    recent_lessons: List[Dict[str, Any]],
    recent_quizzes: List[Dict[str, Any]],
    timeframe_days: int = 7
) -> ProgressAnalysis:
    """
    Analyze student's learning progress and patterns.
    
    Examines recent performance to identify:
    - Trends (improving/declining)
    - Mastered vs struggling topics
    - Learning velocity
    - Recommendations for next steps
    
    Args:
        student_id: Student identifier
        recent_lessons: Recent lesson progress records
        recent_quizzes: Recent quiz results
        timeframe_days: Analysis window (default 7 days)
    
    Returns:
        ProgressAnalysis with insights and recommendations
    """
    
    # Calculate score trend
    if len(recent_quizzes) >= 3:
        recent_scores = [q.get("score_percentage", 0) for q in recent_quizzes[-3:]]
        first_avg = sum(recent_scores[:2]) / 2
        last_score = recent_scores[-1]
        
        if last_score > first_avg + 10:
            score_trend = "improving"
        elif last_score < first_avg - 10:
            score_trend = "declining"
        else:
            score_trend = "stable"
    else:
        score_trend = "insufficient_data"
    
    # Analyze learning velocity
    if recent_lessons:
        avg_time = sum(l.get("time_spent_seconds", 0) for l in recent_lessons) / len(recent_lessons)
        if avg_time < 240:  # Less than 4 minutes per lesson
            learning_velocity = "fast"
        elif avg_time > 600:  # More than 10 minutes
            learning_velocity = "slow"
        else:
            learning_velocity = "moderate"
    else:
        learning_velocity = "unknown"
    
    # Identify mastered topics
    topics_mastered = []
    topics_struggling = []
    
    for quiz in recent_quizzes:
        if quiz.get("score_percentage", 0) >= 90:
            topics_mastered.append(quiz.get("topic", ""))
        elif quiz.get("score_percentage", 0) < 70:
            topics_struggling.append(quiz.get("topic", ""))
    
    # Remove duplicates
    topics_mastered = list(set(topics_mastered))
    topics_struggling = list(set(topics_struggling))
    
    # Determine next recommended topic
    if topics_struggling:
        next_recommended_topic = topics_struggling[0]  # Focus on struggling area
        difficulty_adjustment = "maintain"  # Review at current level
    elif topics_mastered and len(topics_mastered) >= 3:
        next_recommended_topic = "New advanced topic"
        difficulty_adjustment = "increase"
    else:
        next_recommended_topic = "Continue current curriculum"
        difficulty_adjustment = "maintain"
    
    # Identify strengths and areas for improvement
    strengths_identified = []
    areas_for_improvement = []
    
    # Analyze by focus area
    vocab_scores = [q.get("score_percentage", 0) for q in recent_quizzes if "vocabulary" in q.get("topic", "").lower()]
    grammar_scores = [q.get("score_percentage", 0) for q in recent_quizzes if "grammar" in q.get("topic", "").lower()]
    
    if vocab_scores and sum(vocab_scores) / len(vocab_scores) >= 80:
        strengths_identified.append(FocusArea.VOCABULARY.value)
    elif vocab_scores:
        areas_for_improvement.append(FocusArea.VOCABULARY.value)
    
    if grammar_scores and sum(grammar_scores) / len(grammar_scores) >= 80:
        strengths_identified.append(FocusArea.GRAMMAR.value)
    elif grammar_scores:
        areas_for_improvement.append(FocusArea.GRAMMAR.value)
    
    # Calculate completion rate
    if recent_lessons:
        completed = sum(1 for l in recent_lessons if l.get("completion_percentage", 0) == 100)
        completion_rate = (completed / len(recent_lessons)) * 100
    else:
        completion_rate = 0.0
    
    # Average time per lesson
    if recent_lessons:
        total_time = sum(l.get("time_spent_seconds", 0) for l in recent_lessons)
        avg_time_minutes = (total_time / len(recent_lessons)) / 60
    else:
        avg_time_minutes = 0.0
    
    # Estimate grade-level readiness (simple heuristic)
    if recent_quizzes:
        avg_quiz_score = sum(q.get("score_percentage", 0) for q in recent_quizzes) / len(recent_quizzes)
        estimated_readiness = min(100, avg_quiz_score)
    else:
        estimated_readiness = 50.0  # Default
    
    return ProgressAnalysis(
        student_id=student_id,
        analysis_date=datetime.now(),
        score_trend=score_trend,
        learning_velocity=learning_velocity,
        topics_mastered=topics_mastered,
        topics_struggling=topics_struggling,
        next_recommended_topic=next_recommended_topic,
        difficulty_adjustment=difficulty_adjustment,
        topics_to_review=topics_struggling,
        strengths_identified=strengths_identified,
        areas_for_improvement=areas_for_improvement,
        estimated_grade_level_readiness=estimated_readiness,
        best_time_of_day=None,  # Could analyze timestamps
        avg_time_per_lesson_minutes=avg_time_minutes,
        completion_rate=completion_rate
    )
