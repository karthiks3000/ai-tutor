"""
Generate overall learning journey summary based on student performance
"""
from typing import Dict, Any, List
from ..models.student_models import StudentProfile
from ..models.lesson_models import LessonPlan


def generate_overall_summary(
    student_profile: StudentProfile,
    lesson_plan: LessonPlan,
    all_section_performances: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate personalized overall summary analyzing student's
    complete learning journey across all 3 sections.
    
    Args:
        student_profile: Student profile with interests, grade
        lesson_plan: The completed lesson plan
        all_section_performances: List of section quiz results
            [
                {
                    'section_number': 1,
                    'quiz_score': 80.0,
                    'correct_answers': 4,
                    'total_questions': 5
                },
                ...
            ]
    
    Returns:
        Dict with summary data:
        - overall_feedback: Personalized tutor message
        - strengths: List of identified strengths
        - areas_to_improve: List of areas for improvement
        - recommended_next_subjects: List of subjects to try next
        - average_score: Average quiz score across all sections
        - total_correct: Total correct answers
        - total_questions: Total questions answered
        - performance_level: overall performance category
    """
    
    if not all_section_performances:
        # Fallback if no performance data
        return {
            "overall_feedback": "Congratulations on completing your learning journey! 🎉",
            "strengths": [],
            "areas_to_improve": [],
            "recommended_next_subjects": ["Math", "Science", "History"],
            "average_score": 0.0,
            "total_correct": 0,
            "total_questions": 0,
            "performance_level": "developing"
        }
    
    # Calculate overall metrics
    avg_score = sum(p['quiz_score'] for p in all_section_performances) / len(all_section_performances)
    total_correct = sum(p['correct_answers'] for p in all_section_performances)
    total_questions = sum(p['total_questions'] for p in all_section_performances)
    
    # Determine performance level
    if avg_score >= 85:
        performance_level = "excellent"
        encouragement = "Outstanding work! You've mastered this subject! 🌟"
    elif avg_score >= 70:
        performance_level = "good"
        encouragement = "Great job! You've shown strong understanding! 💪"
    else:
        performance_level = "developing"
        encouragement = "Good effort! Keep practicing and you'll improve! 📚"
    
    # Identify strengths from section topics where score >= 80%
    strengths = []
    areas_to_improve = []
    
    for i, perf in enumerate(all_section_performances):
        if i < len(lesson_plan.sections):
            topic = lesson_plan.sections[i].topic
            if perf['quiz_score'] >= 80:
                strengths.append(topic)
            elif perf['quiz_score'] < 70:
                areas_to_improve.append(topic)
    
    # Generate personalized feedback
    strengths_text = ""
    if strengths:
        strengths_text = f"\n\n💪 Your Strengths:\n" + "\n".join(f"  • {s}" for s in strengths)
    
    improvement_text = ""
    if areas_to_improve:
        improvement_text = f"\n\n📚 Keep Practicing:\n" + "\n".join(f"  • {a}" for a in areas_to_improve)
    
    overall_feedback = f"""🎉 Congratulations on completing your {lesson_plan.subject} learning journey!

{encouragement}

📊 Your Journey Stats:
• Overall Score: {avg_score:.0f}%
• Questions Answered: {total_correct}/{total_questions} correct
• Sections Completed: 3/3{strengths_text}{improvement_text}

Keep up the great work! Learning is a journey, and you're making excellent progress! 🚀"""
    
    # Recommend next subjects based on interests and performance
    recommended_next = _recommend_next_subjects(
        [str(i.value) if hasattr(i, 'value') else str(i) for i in student_profile.interests],
        lesson_plan.subject,
        performance_level
    )
    
    return {
        "overall_feedback": overall_feedback,
        "strengths": strengths,
        "areas_to_improve": areas_to_improve,
        "recommended_next_subjects": recommended_next,
        "average_score": avg_score,
        "total_correct": total_correct,
        "total_questions": total_questions,
        "performance_level": performance_level
    }


def _recommend_next_subjects(
    interests: List[str],
    completed_subject: str,
    performance_level: str
) -> List[str]:
    """Recommend next subjects based on interests and performance"""
    
    # Logic to suggest subjects based on completed subject
    if completed_subject == "english":
        if performance_level == "excellent":
            return ["Advanced English", "Creative Writing", "Literature"]
        else:
            return ["English Review", "Grammar Fundamentals", "Vocabulary Building"]
    elif completed_subject == "math":
        if performance_level == "excellent":
            return ["Advanced Math", "Algebra", "Geometry"]
        else:
            return ["Math Review", "Basic Arithmetic", "Problem Solving"]
    elif completed_subject == "science":
        if performance_level == "excellent":
            return ["Advanced Science", "Physics", "Chemistry"]
        else:
            return ["Science Review", "Basic Concepts", "Scientific Method"]
    
    # Default recommendations
    return ["Math", "Science", "History"]
