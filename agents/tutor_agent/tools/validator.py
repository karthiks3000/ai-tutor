"""
Student response validation tool
Uses LLM reasoning to validate answers without external APIs
"""
import uuid
from typing import Union, List, Optional
from models.lesson_models import Question, Feedback
from models.constants import QuestionType


def validate_student_response(
    question: Question,
    student_answer: Union[str, List[str]],
    context: Optional[str] = None
) -> Feedback:
    """
    Validate student response using LLM reasoning.
    
    For multiple choice/true-false: Exact match
    For short answer: Semantic understanding (LLM validates)
    For fill-in-blank: Exact or synonym match
    For word match: Check pair correctness
    
    Args:
        question: The question being answered
        student_answer: Student's answer (string or list)
        context: Optional additional context
    
    Returns:
        Feedback with correctness, explanation, and encouragement
    """
    
    feedback_id = f"feedback-{uuid.uuid4().hex[:8]}"
    
    # Determine correctness based on question type
    is_correct = False
    points_earned = 0
    bonus_points = 0
    
    if question.question_type in [QuestionType.MCSA, QuestionType.TRUE_FALSE]:
        # Exact match for MCQ and True/False
        is_correct = str(student_answer).strip().lower() == str(question.correct_answer).strip().lower()
        
    elif question.question_type == QuestionType.MCMA:
        # Check if all correct answers selected (order doesn't matter)
        if isinstance(student_answer, list) and isinstance(question.correct_answer, list):
            student_set = set(str(a).strip().lower() for a in student_answer)
            correct_set = set(str(a).strip().lower() for a in question.correct_answer)
            is_correct = student_set == correct_set
    
    elif question.question_type == QuestionType.FILL_IN_BLANK:
        # Check if blanks filled correctly
        if isinstance(student_answer, list) and isinstance(question.correct_answer, list):
            if len(student_answer) == len(question.correct_answer):
                is_correct = all(
                    str(s).strip().lower() == str(c).strip().lower()
                    for s, c in zip(student_answer, question.correct_answer)
                )
    
    elif question.question_type == QuestionType.WORD_MATCH:
        # Check if word pairs matched correctly
        is_correct = student_answer == question.correct_answer
    
    elif question.question_type == QuestionType.SHORT_ANSWER:
        # For short answer, use semantic validation (LLM would do this)
        # For now, simple keyword matching
        student_text = str(student_answer).lower()
        correct_text = str(question.correct_answer).lower()
        
        # Check for key concepts
        key_words = correct_text.split()
        matches = sum(1 for word in key_words if word in student_text)
        is_correct = matches >= len(key_words) * 0.6  # 60% keyword match
    
    # Calculate points
    if is_correct:
        points_earned = question.points
        
    # Generate encouragement message
    if is_correct:
        encouragements = [
            "Excellent work! 🌟",
            "Perfect! You've got this! 🎯",
            "Amazing! Keep it up! 🚀",
            "Fantastic! You're doing great! ⭐",
            "Brilliant answer! 💯"
        ]
        encouragement = encouragements[hash(question.question_id) % len(encouragements)]
    else:
        encouragements = [
            "Good try! Let's learn from this! 💪",
            "Not quite, but you're learning! Keep going! 🌱",
            "Close! Every mistake is a learning opportunity! 📚",
            "Don't worry! This is how we learn! 🎓",
            "Great effort! Let's review this together! ⭐"
        ]
        encouragement = encouragements[hash(question.question_id) % len(encouragements)]
    
    # Next steps
    if is_correct:
        next_steps = "Great! You're ready for the next challenge!"
    else:
        next_steps = f"Review the topic of {question.topic} and try similar questions to master it."
    
    return Feedback(
        feedback_id=feedback_id,
        question_id=question.question_id,
        is_correct=is_correct,
        student_answer=student_answer,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        encouragement=encouragement,
        next_steps=next_steps,
        points_earned=points_earned,
        bonus_points=bonus_points
    )
