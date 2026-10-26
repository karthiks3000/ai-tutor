"""
Generate personalized 3-section learning plans based on diagnostic results
"""
import uuid
import json
import logging
from typing import Dict, Any
from models.lesson_models import LessonPlan, SectionPlan
from models.student_models import StudentProfile
from models.constants import Subject, SUBJECT_METADATA, SUBJECT_SKILL_AREAS, DifficultyLevel
from tools.bedrock_client import default_client as bedrock_client

logger = logging.getLogger(__name__)

def generate_lesson_plan(
    diagnostic_results: Dict[str, Any],
    student_profile: StudentProfile
) -> LessonPlan:
    """
    Generate AI-powered 3-section learning plan
    
    Args:
        diagnostic_results: Output from analyze_diagnostic_results()
        student_profile: Student profile with interests, grade, subject
        
    Returns:
        LessonPlan object with 3 SectionPlan objects
    """
    subject = student_profile.subject
    subject_meta = SUBJECT_METADATA[subject]
    skill_areas = SUBJECT_SKILL_AREAS[subject]
    
    # Prepare context for AI
    focus_areas = diagnostic_results.get('focus_areas', skill_areas[:3])
    interests_str = ', '.join([i.value if hasattr(i, 'value') else str(i) for i in student_profile.interests])
    
    prompt = f"""Create a 3-section progressive learning plan for a grade {student_profile.grade} student.

SUBJECT: {subject_meta['display_name']}
AVAILABLE SKILL AREAS: {', '.join(skill_areas)}

DIAGNOSTIC RESULTS:
- Overall Score: {diagnostic_results.get('overall_score', 50):.1f}%
- Skill Gaps: {', '.join(diagnostic_results.get('identified_gaps', []))}
- Recommended Difficulty: {diagnostic_results.get('recommended_difficulty', 'intermediate')}
- Focus Areas: {', '.join(focus_areas)}
- Strengths: {', '.join(diagnostic_results.get('strengths', []))}

STUDENT INTERESTS: {interests_str}

REQUIREMENTS:
Create 3 progressive sections that build on each other:

Section 1 - Foundation:
- Address primary skill gap: {focus_areas[0] if focus_areas else skill_areas[0]}
- Difficulty: {diagnostic_results.get('recommended_difficulty', 'beginner')}
- Connect to student interests for engagement

Section 2 - Application:
- Build on Section 1 with practical applications
- Address second skill gap: {focus_areas[1] if len(focus_areas) > 1 else skill_areas[1]}
- Slightly increase difficulty

Section 3 - Synthesis:
- Advanced synthesis and creativity
- Address third area: {focus_areas[2] if len(focus_areas) > 2 else skill_areas[2]}
- Challenge and inspire

For EACH section provide:
- topic: Engaging, interest-aligned title (e.g., "Space Explorers Learn Vocabulary" for a student interested in space)
- difficulty: beginner/intermediate/advanced
- learning_objectives: Array of 3-4 specific, measurable goals
- skill_areas: Array of 1-2 skills from available list
- estimated_time_minutes: 15-20 minutes

Return ONLY a JSON array of 3 sections, no other text:
[
  {{
    "topic": "...",
    "difficulty": "...",
    "learning_objectives": ["...", "...", "..."],
    "skill_areas": ["...", "..."],
    "estimated_time_minutes": 18
  }},
  ...
]"""
    
    try:
        # Call Bedrock for plan generation
        content = bedrock_client.generate(
            prompt=prompt,
            max_tokens=2000,
            temperature=0.7
        )
        
        # Extract JSON from response
        content = content.strip()
        if '```json' in content:
            content = content.split('```json')[1].split('```')[0].strip()
        elif '```' in content:
            content = content.split('```')[1].split('```')[0].strip()
        
        sections_data = json.loads(content)
        
    except Exception as e:
        logger.error(f"Failed to generate plan with AI: {e}")
        # Fallback: Create basic plan from diagnostic results
        sections_data = _create_fallback_plan(focus_areas, skill_areas, diagnostic_results)
    
    # Create SectionPlan objects
    sections = []
    for idx, section_data in enumerate(sections_data[:3]):  # Ensure only 3 sections
        try:
            section = SectionPlan(
                section_number=idx + 1,
                subject=subject,
                topic=section_data.get('topic', f"Section {idx + 1}"),
                difficulty=DifficultyLevel(section_data.get('difficulty', 'intermediate')),
                learning_objectives=section_data.get('learning_objectives', []),
                estimated_time_minutes=section_data.get('estimated_time_minutes', 18),
                skill_areas=section_data.get('skill_areas', focus_areas[idx:idx+1])
            )
            sections.append(section)
        except Exception as e:
            logger.error(f"Error creating section {idx + 1}: {e}")
            # Create fallback section
            section = SectionPlan(
                section_number=idx + 1,
                subject=subject,
                topic=f"{subject_meta['display_name']} - Section {idx + 1}",
                difficulty=DifficultyLevel(diagnostic_results.get('recommended_difficulty', 'intermediate')),
                learning_objectives=[f"Master {focus_areas[idx] if idx < len(focus_areas) else skill_areas[idx]}"],
                estimated_time_minutes=18,
                skill_areas=[focus_areas[idx] if idx < len(focus_areas) else skill_areas[idx]]
            )
            sections.append(section)
    
    # Create LessonPlan
    plan = LessonPlan(
        plan_id=str(uuid.uuid4()),
        student_id=student_profile.student_id,
        subject=subject,
        total_sections=3,
        sections=sections,
        diagnostic_quiz_id=diagnostic_results.get('quiz_id', ''),
        status='active',
        current_section=0
    )
    
    logger.info(f"Generated lesson plan for student {student_profile.student_id}: {plan.plan_id}")
    return plan


def _create_fallback_plan(focus_areas, skill_areas, diagnostic_results):
    """Create a basic fallback plan if AI generation fails"""
    difficulty = diagnostic_results.get('recommended_difficulty', 'intermediate')
    
    return [
        {
            "topic": f"Foundation: {focus_areas[0] if focus_areas else skill_areas[0]}",
            "difficulty": difficulty,
            "learning_objectives": [
                f"Understand key concepts in {focus_areas[0] if focus_areas else skill_areas[0]}",
                "Build foundational knowledge",
                "Practice basic applications"
            ],
            "skill_areas": [focus_areas[0] if focus_areas else skill_areas[0]],
            "estimated_time_minutes": 18
        },
        {
            "topic": f"Application: {focus_areas[1] if len(focus_areas) > 1 else skill_areas[1]}",
            "difficulty": "intermediate" if difficulty == "beginner" else "advanced",
            "learning_objectives": [
                f"Apply {focus_areas[1] if len(focus_areas) > 1 else skill_areas[1]} in context",
                "Solve practical problems",
                "Connect concepts"
            ],
            "skill_areas": [focus_areas[1] if len(focus_areas) > 1 else skill_areas[1]],
            "estimated_time_minutes": 18
        },
        {
            "topic": f"Mastery: {focus_areas[2] if len(focus_areas) > 2 else skill_areas[2]}",
            "difficulty": "advanced" if difficulty != "beginner" else "intermediate",
            "learning_objectives": [
                f"Master {focus_areas[2] if len(focus_areas) > 2 else skill_areas[2]}",
                "Create original work",
                "Demonstrate expertise"
            ],
            "skill_areas": [focus_areas[2] if len(focus_areas) > 2 else skill_areas[2]],
            "estimated_time_minutes": 20
        }
    ]
