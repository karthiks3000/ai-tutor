"""
Generate complete section content (lesson + quiz) in one call for efficiency
"""
import logging
from typing import Dict, Any, Optional
from models.lesson_models import LessonPlan, Quiz, QuizType, QuestionType
from models.student_models import StudentProfile
from models.constants import Subject, DifficultyLevel
from tools.lesson_generator import generate_lesson_content
from tools.quiz_generator import generate_adaptive_quiz

logger = logging.getLogger(__name__)

def generate_section_content(
    lesson_plan: LessonPlan,
    section_index: int,
    student_profile: StudentProfile,
    previous_section_performance: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate complete section (lesson + quiz) in single call with adaptive difficulty
    
    This is a key performance optimization - generating both lesson
    and quiz together reduces the total number of AI calls needed.
    
    ADAPTIVE FEATURE: If previous_section_performance is provided, the AI will
    adjust difficulty and focus based on student's actual performance.
    
    Args:
        lesson_plan: Complete lesson plan with all sections
        section_index: Which section to generate (0, 1, or 2)
        student_profile: Student profile with interests
        previous_section_performance: Optional dict with previous section quiz results
            {
                "section_number": int,
                "quiz_score": float,  # 0-100 percentage
                "correct_answers": int,
                "total_questions": int,
                "skill_scores": Dict[str, float],  # Per-skill performance
                "struggles": List[str]  # Skills student struggled with
            }
        
    Returns:
        {
            "lesson": LessonContent object,
            "quiz": Quiz object,
            "tutor_message": str,
            "section_info": {
                "section_number": int,
                "total_sections": int,
                "subject": str,
                "topic": str
            }
        }
    """
    if section_index >= len(lesson_plan.sections):
        raise ValueError(f"Section index {section_index} out of range")
    
    section_plan = lesson_plan.sections[section_index]
    
    # Adaptive difficulty adjustment based on previous performance
    adjusted_difficulty = section_plan.difficulty
    adjusted_skills = section_plan.skill_areas
    
    if previous_section_performance and section_index > 0:
        quiz_score = previous_section_performance.get('quiz_score', 70)
        struggles = previous_section_performance.get('struggles', [])
        
        logger.info(f"Adapting section {section_index + 1} based on previous performance: {quiz_score:.1f}%")
        
        # Adjust difficulty based on performance
        if quiz_score < 50:
            # Student struggling - make it easier
            adjusted_difficulty = DifficultyLevel.BEGINNER
            logger.info(f"→ Reducing difficulty to BEGINNER due to low score")
        elif quiz_score < 70:
            # Student needs support - keep it moderate
            adjusted_difficulty = DifficultyLevel.INTERMEDIATE if section_plan.difficulty == DifficultyLevel.ADVANCED else section_plan.difficulty
            logger.info(f"→ Adjusting difficulty to INTERMEDIATE for support")
        elif quiz_score >= 90:
            # Student excelling - increase challenge
            adjusted_difficulty = DifficultyLevel.ADVANCED if section_plan.difficulty != DifficultyLevel.ADVANCED else section_plan.difficulty
            logger.info(f"→ Increasing difficulty to ADVANCED for challenge")
        
        # Adjust skills to reinforce struggles
        if struggles:
            # Include struggled skills in this section
            adjusted_skills = list(set(section_plan.skill_areas + struggles[:2]))
            logger.info(f"→ Adding struggled skills: {struggles[:2]}")
    
    logger.info(f"Generating content for section {section_index + 1}: {section_plan.topic} (difficulty: {adjusted_difficulty.value})")
    
    # Generate lesson (300-500 words) with adapted difficulty
    try:
        lesson_result = generate_lesson_content(
            topic=section_plan.topic,
            difficulty_level=adjusted_difficulty,
            student_interests=student_profile.interests,
            focus_areas=adjusted_skills,
            grade_level=student_profile.grade,
            word_count=400
        )
        lesson = lesson_result['lesson']
        
    except Exception as e:
        logger.error(f"Failed to generate lesson: {e}")
        # Create fallback lesson
        from models.lesson_models import LessonContent
        import uuid
        lesson = LessonContent(
            lesson_id=str(uuid.uuid4()),
            topic=section_plan.topic,
            title=section_plan.topic,
            content=f"This is a lesson about {section_plan.topic}. We'll explore {', '.join(section_plan.learning_objectives)}.",
            difficulty_level=section_plan.difficulty,
            grade_level=student_profile.grade,
            estimated_reading_time_minutes=5,
            word_count=400,
            key_vocabulary=[],
            learning_objectives=section_plan.learning_objectives,
            student_interest_alignment=[],
            focus_areas=[]  # Legacy field - subject-agnostic uses skill_areas instead
        )
    
    # Generate pop quiz (3 questions) aligned with lesson, using adapted difficulty
    try:
        quiz_result = generate_adaptive_quiz(
            lesson_content=lesson.content,
            quiz_type=QuizType.POP_QUIZ,
            question_types=[
                QuestionType.MCSA,
                QuestionType.TRUE_FALSE,
                QuestionType.FILL_IN_BLANK
            ],
            num_questions=3,
            difficulty=adjusted_difficulty,  # Use adapted difficulty
            focus_areas=adjusted_skills,  # Use adapted skills
            topic=section_plan.topic,
            subject=lesson_plan.subject,  # Pass subject for context
            skill_areas=adjusted_skills  # Pass adapted skill areas for tagging
        )
        quiz = quiz_result['quiz']
        
    except Exception as e:
        logger.error(f"Failed to generate quiz: {e}")
        # Create fallback quiz
        from models.lesson_models import Question
        import uuid
        from datetime import datetime
        
        quiz = Quiz(
            quiz_id=str(uuid.uuid4()),
            quiz_type=QuizType.POP_QUIZ,
            lesson_id=lesson.lesson_id,
            topic=section_plan.topic,
            difficulty_level=section_plan.difficulty,
            questions=[
                Question(
                    question_id=f"q{i}",
                    question_type=QuestionType.TRUE_FALSE,
                    question_text=f"Question {i} about {section_plan.topic}",
                    correct_answer="true",
                    difficulty=section_plan.difficulty,
                    topic=section_plan.topic,
                    points=10,
                    explanation="This is a sample question."
                )
                for i in range(1, 4)
            ],
            total_questions=3,
            passing_score_percentage=70.0,
            created_at=datetime.now(),
            focus_areas=[]  # Legacy field - subject-agnostic uses skill_areas instead
        )
    
    # Prepare section info
    section_info = {
        "section_number": section_index + 1,
        "total_sections": lesson_plan.total_sections,
        "subject": lesson_plan.subject.value if isinstance(lesson_plan.subject, Subject) else str(lesson_plan.subject),
        "topic": section_plan.topic
    }
    
    # Create encouraging tutor message
    tutor_message = _create_tutor_message(section_index, lesson_plan.total_sections, section_plan.topic)
    
    logger.info(f"Successfully generated section {section_index + 1} content")
    
    return {
        "lesson": lesson,
        "quiz": quiz,
        "tutor_message": tutor_message,
        "section_info": section_info
    }


def _create_tutor_message(section_index: int, total_sections: int, topic: str) -> str:
    """Create an encouraging message for the section"""
    section_num = section_index + 1
    
    if section_num == 1:
        return f"Let's start your learning journey with {topic}! This is section {section_num} of {total_sections}. Take your time and enjoy learning! 📚"
    elif section_num == total_sections:
        return f"Great progress! You've made it to the final section: {topic}. This is section {section_num} of {total_sections}. Let's finish strong! 🎯"
    else:
        return f"Excellent work so far! Now let's dive into {topic}. This is section {section_num} of {total_sections}. You're doing great! 💪"
