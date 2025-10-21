"""
Student profile and progress data models
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from .constants import (
    GradeLevel,
    StudentInterest,
    FocusArea,
    DifficultyLevel,
)


class LearningProfile(BaseModel):
    """Student's learning profile with skill scores"""
    current_level: DifficultyLevel
    vocabulary_score: int = Field(default=500, ge=0, le=1200)
    grammar_score: int = Field(default=50, ge=0, le=100)
    reading_comprehension_score: int = Field(default=50, ge=0, le=100)
    writing_score: int = Field(default=50, ge=0, le=100)
    diagnostic_completed: bool = False
    diagnostic_date: Optional[datetime] = None


class StudentPreferences(BaseModel):
    """Student UI and learning preferences"""
    font_size: str = "medium"  # small, medium, large
    theme: str = "light"  # light, dark
    audio_enabled: bool = False
    notifications_enabled: bool = True


class StudentProfile(BaseModel):
    """Complete student profile stored in DynamoDB"""
    student_id: str  # Cognito sub
    name: str
    email: str
    grade: GradeLevel
    interests: List[StudentInterest] = Field(default_factory=list)
    learning_profile: LearningProfile
    strengths: List[FocusArea] = Field(default_factory=list)
    focus_areas: List[FocusArea] = Field(default_factory=list)
    preferences: StudentPreferences = Field(default_factory=StudentPreferences)
    
    # Gamification
    total_xp: int = 0
    current_level: int = 1
    current_streak_days: int = 0
    longest_streak_days: int = 0
    last_active_date: Optional[str] = None  # YYYY-MM-DD format
    
    # Progress stats
    total_lessons_completed: int = 0
    total_quizzes_completed: int = 0
    average_quiz_score: float = 0.0
    total_words_learned: int = 0
    badges_earned: List[str] = Field(default_factory=list)
    
    # Timestamps
    created_at: int = Field(default_factory=lambda: int(datetime.now().timestamp()))
    last_active: int = Field(default_factory=lambda: int(datetime.now().timestamp()))
    updated_at: int = Field(default_factory=lambda: int(datetime.now().timestamp()))
    
    # Optional: for data cleanup
    ttl: Optional[int] = None


class ProgressAnalysis(BaseModel):
    """Analysis of student's learning progress"""
    student_id: str
    analysis_date: datetime = Field(default_factory=datetime.now)
    
    # Trends
    score_trend: str  # "improving", "declining", "stable"
    learning_velocity: str  # "fast", "moderate", "slow"
    
    # Mastery
    topics_mastered: List[str] = Field(default_factory=list)
    topics_struggling: List[str] = Field(default_factory=list)
    
    # Recommendations
    next_recommended_topic: str
    difficulty_adjustment: Optional[str] = None  # "increase", "decrease", "maintain"
    topics_to_review: List[str] = Field(default_factory=list)
    
    # Insights
    strengths_identified: List[str] = Field(default_factory=list)
    areas_for_improvement: List[str] = Field(default_factory=list)
    estimated_grade_level_readiness: float = 0.0  # 0-100 percentage
    
    # Patterns
    best_time_of_day: Optional[str] = None
    avg_time_per_lesson_minutes: float = 0.0
    completion_rate: float = 0.0  # Percentage of started lessons completed


class LessonProgress(BaseModel):
    """Progress record for a single lesson"""
    progress_id: str
    student_id: str
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp()))
    
    # Lesson info
    lesson_id: str
    lesson_topic: str
    lesson_difficulty: DifficultyLevel
    lesson_content_type: str
    
    # Performance
    time_spent_seconds: int
    completion_percentage: int = Field(ge=0, le=100)
    quiz_taken: bool = False
    quiz_score: Optional[int] = None
    quiz_id: Optional[str] = None
    
    # Learning outcomes
    concepts_mastered: List[str] = Field(default_factory=list)
    concepts_struggling: List[str] = Field(default_factory=list)
    vocabulary_learned: List[str] = Field(default_factory=list)
    
    # Gamification
    xp_earned: int = 0
    badges_unlocked: List[str] = Field(default_factory=list)
    
    # AI insights
    next_recommended_lesson: Optional[str] = None
    student_feedback: Optional[str] = None
    ai_notes: Optional[str] = None
    
    # Optional: for data cleanup (e.g., 90 days)
    ttl: Optional[int] = None


class QuizResult(BaseModel):
    """Results from a completed quiz"""
    quiz_result_id: str
    student_id: str
    timestamp: int = Field(default_factory=lambda: int(datetime.now().timestamp()))
    
    # Quiz info
    quiz_type: str
    lesson_id: Optional[str] = None
    topic: str
    difficulty_level: DifficultyLevel
    
    # Questions and answers
    questions: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Scores
    total_questions: int
    correct_answers: int
    score_percentage: float = Field(ge=0, le=100)
    points_earned: int
    time_taken_seconds: int
    
    # Analysis
    identified_gaps: List[str] = Field(default_factory=list)
    ai_feedback: str
    next_focus_areas: List[str] = Field(default_factory=list)
    
    # Optional: for data cleanup
    ttl: Optional[int] = None
