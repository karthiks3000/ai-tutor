"""
Orchestrator response models for tutor_agent.
These define the structure of agent responses to the frontend.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from .constants import ActionType, ResponseStatus
from .lesson_models import (
    LessonContent,
    Quiz,
    Feedback,
    Achievement,
)
from .student_models import ProgressAnalysis


class ProgressUpdate(BaseModel):
    """Progress update information"""
    total_xp: int
    current_level: int
    xp_to_next_level: int
    current_streak_days: int
    total_lessons_completed: int
    total_quizzes_completed: int
    recent_achievements: List[str] = Field(default_factory=list)
    level_title: str  # "Beginner", "Scholar", "Master", etc.


class OrchestratorResponse(BaseModel):
    """
    Main response structure from tutor_agent.
    This is what gets sent to the frontend.
    """
    # Response type
    action_type: ActionType
    response_status: ResponseStatus = ResponseStatus.SUCCESS
    
    # Content (only one will be populated based on action_type)
    lesson_content: Optional[LessonContent] = None
    quiz_content: Optional[Quiz] = None
    feedback: Optional[Feedback] = None
    achievement: Optional[Achievement] = None
    progress_update: Optional[ProgressUpdate] = None
    
    # Personalized AI tutor message (ALWAYS included - creates personal connection)
    tutor_message: str = Field(
        ...,
        description="Friendly, encouraging message from AI tutor to display in speech bubble"
    )
    
    # Message (for conversation or additional context)
    message: Optional[str] = None
    
    # Control fields
    next_action_delay_seconds: Optional[int] = None  # AI can control pacing
    student_can_proceed: bool = True
    is_final_response: bool = True
    
    # Metadata
    success: bool = True
    error_message: Optional[str] = None
    processing_time_seconds: float = 0.0
    
    # Session info
    session_metadata: Optional[Dict[str, Any]] = None


class ToolProgress(BaseModel):
    """Progress information for a tool execution"""
    tool_name: str
    status: str  # "running", "completed", "failed"
    message: Optional[str] = None
    error_message: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


def create_lesson_response(
    lesson_content: LessonContent,
    tutor_message: str,
    message: Optional[str] = None
) -> OrchestratorResponse:
    """Helper to create a lesson presentation response"""
    return OrchestratorResponse(
        action_type=ActionType.PRESENT_LESSON,
        response_status=ResponseStatus.SUCCESS,
        lesson_content=lesson_content,
        tutor_message=tutor_message,
        message=message or f"Here's your lesson on {lesson_content.topic}!",
        success=True,
        is_final_response=True,
    )


def create_quiz_response(
    quiz_content: Quiz,
    tutor_message: str,
    message: Optional[str] = None
) -> OrchestratorResponse:
    """Helper to create a quiz presentation response"""
    return OrchestratorResponse(
        action_type=ActionType.PRESENT_QUIZ,
        response_status=ResponseStatus.SUCCESS,
        quiz_content=quiz_content,
        tutor_message=tutor_message,
        message=message or "Time for a quiz! Let's see what you've learned!",
        success=True,
        is_final_response=True,
    )


def create_feedback_response(
    feedback: Feedback,
    tutor_message: str,
    message: Optional[str] = None
) -> OrchestratorResponse:
    """Helper to create a feedback response"""
    return OrchestratorResponse(
        action_type=ActionType.SHOW_FEEDBACK,
        response_status=ResponseStatus.SUCCESS,
        feedback=feedback,
        tutor_message=tutor_message,
        message=message,
        success=True,
        is_final_response=True,
    )


def create_achievement_response(
    achievement: Achievement,
    tutor_message: str,
    message: Optional[str] = None
) -> OrchestratorResponse:
    """Helper to create an achievement unlock response"""
    return OrchestratorResponse(
        action_type=ActionType.AWARD_ACHIEVEMENT,
        response_status=ResponseStatus.SUCCESS,
        achievement=achievement,
        tutor_message=tutor_message,
        message=message or f"Achievement unlocked: {achievement.title}!",
        success=True,
        is_final_response=True,
    )


def create_progress_response(
    progress_update: ProgressUpdate,
    tutor_message: str,
    message: Optional[str] = None
) -> OrchestratorResponse:
    """Helper to create a progress update response"""
    return OrchestratorResponse(
        action_type=ActionType.SHOW_PROGRESS,
        response_status=ResponseStatus.SUCCESS,
        progress_update=progress_update,
        tutor_message=tutor_message,
        message=message or "Here's your progress!",
        success=True,
        is_final_response=True,
    )


def create_conversation_response(
    tutor_message: str,
    message: Optional[str] = None,
    is_final: bool = False
) -> OrchestratorResponse:
    """Helper to create a conversation response (questions, clarifications)"""
    return OrchestratorResponse(
        action_type=ActionType.CONVERSATION,
        response_status=ResponseStatus.SUCCESS,
        tutor_message=tutor_message,
        message=message,
        success=True,
        is_final_response=is_final,
        student_can_proceed=False if not is_final else True,
    )


def create_error_response(
    error_message: str,
    response_status: ResponseStatus = ResponseStatus.SYSTEM_ERROR,
    tutor_message: str = "Oops! I ran into a small issue. 😅 Let's try that again together!"
) -> OrchestratorResponse:
    """Helper to create an error response"""
    return OrchestratorResponse(
        action_type=ActionType.CONVERSATION,
        response_status=response_status,
        tutor_message=tutor_message,
        message="I encountered an issue. Let's try again!",
        error_message=error_message,
        success=False,
        is_final_response=True,
    )
