"""
AI-Powered adaptive quiz generation tool
Uses Bedrock (Amazon Nova Pro) to generate varied question types with appropriate difficulty
"""
import uuid
import logging
from typing import List, Dict, Any, Optional, Union
from models.constants import QuestionType, QuizType, DifficultyLevel, FocusArea, Subject, SUBJECT_METADATA, SUBJECT_SKILL_AREAS
from models.lesson_models import Quiz, Question, WordPair
from tools.bedrock_client import BedrockClient

logger = logging.getLogger("quiz-generator")


def generate_adaptive_quiz(
    lesson_content: str,
    quiz_type: QuizType,
    num_questions: int,
    difficulty: DifficultyLevel,
    focus_areas: Union[List[FocusArea], List[str]],
    topic: str,
    question_types: Optional[List[QuestionType]] = None,
    student_performance_history: Optional[Dict[str, Any]] = None,
    subject: Optional[Subject] = None,
    skill_areas: Optional[List[str]] = None,
    region: str = "us-east-1"
) -> Dict[str, Any]:
    """
    Generate adaptive quiz with mix of question types using Bedrock AI.
    
    Args:
        lesson_content: The lesson text to base questions on
        quiz_type: diagnostic, pop_quiz, progress_check, or final_assessment
        num_questions: Number of questions to generate
        difficulty: Current student level
        focus_areas: Areas to focus on
        topic: Quiz topic
        question_types: Allowed question types (default: all 5 types)
        student_performance_history: Past performance data
        region: AWS region for Bedrock
    
    Returns:
        Dict with 'quiz' (Quiz object) and 'tutor_message' (str)
    """
    
    quiz_id = f"quiz-{quiz_type.value}-{uuid.uuid4().hex[:8]}"
    
    # Default to all question types if not specified
    if question_types is None:
        question_types = [
            QuestionType.MCSA,
            QuestionType.MCMA,
            QuestionType.TRUE_FALSE,
            QuestionType.FILL_IN_BLANK,
            QuestionType.WORD_MATCH
        ]
    
    # Build AI prompt for quiz generation
    question_types_str = ', '.join([f'"{qt.value}"' for qt in question_types])
    
    # Get subject context
    subject_context = ""
    if subject:
        subject_meta = SUBJECT_METADATA.get(subject, {})
        subject_context = f"\nSUBJECT: {subject_meta.get('display_name', subject.value)}"
        if not skill_areas:
            skill_areas = SUBJECT_SKILL_AREAS.get(subject, [])
    
    # Handle both FocusArea enums and string skill areas
    focus_str = "general"
    if focus_areas:
        if isinstance(focus_areas[0], str):
            focus_str = ', '.join(focus_areas)  # type: ignore
        else:
            # FocusArea enums
            focus_str = ', '.join([f.value for f in focus_areas])  # type: ignore
    
    # Use skill_areas if provided, otherwise extract from focus_areas
    available_skills: List[str] = []
    if skill_areas:
        available_skills = skill_areas
    elif focus_areas:
        if isinstance(focus_areas[0], str):
            available_skills = focus_areas  # type: ignore
        else:
            # FocusArea enums - extract values
            available_skills = [f.value for f in focus_areas]  # type: ignore
    
    skills_str = ', '.join(available_skills) if available_skills else focus_str
    
    # Build lesson context
    lesson_context = lesson_content[:1000] if lesson_content else f"General {topic} assessment"
    
    prompt = f"""You are an expert quiz creator for middle school students.{subject_context}

LESSON CONTENT:
{lesson_context}

QUIZ PARAMETERS:
- Type: {quiz_type.value}
- Topic: {topic}
- Difficulty: {difficulty.value}
- Number of Questions: {num_questions}
- Focus Areas: {focus_str}
- Available Skill Areas: {skills_str}

QUESTION TYPES TO USE (distribute evenly):
1. "mcsa" - Multiple choice with ONE correct answer
2. "mcma" - Multiple choice with MULTIPLE correct answers (select all that apply)
3. "true_false" - True or False questions
4. "fill_in_blank" - Fill-in-blank with word bank for drag & drop
5. "word_match" - Match words to definitions

TASK:
Create exactly {num_questions} questions that:
1. Test understanding of {topic}
2. Are age-appropriate for middle school
3. Mix different question types from the list above
4. Include detailed explanations for learning
5. Are engaging and clear
6. **CRITICAL: Tag each question with skill_areas** from the available list

OUTPUT FORMAT - Return ONLY valid JSON matching this EXACT structure:
{{
  "questions": [
    {{
      "question_type": "mcsa",
      "question_text": "Clear question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "difficulty": "{difficulty.value}",
      "topic": "{topic}",
      "points": 10,
      "explanation": "Detailed explanation of why this is correct and what it teaches.",
      "skill_areas": ["skill1", "skill2"]
    }},
    {{
      "question_type": "mcma",
      "question_text": "Which are examples? (Select all that apply)",
      "options": ["A", "B", "C", "D"],
      "correct_answer": ["A", "C"],
      "difficulty": "{difficulty.value}",
      "topic": "{topic}",
      "points": 15,
      "explanation": "Explanation here."
    }},
    {{
      "question_type": "true_false",
      "question_text": "Statement to evaluate.",
      "options": ["True", "False"],
      "correct_answer": "False",
      "difficulty": "{difficulty.value}",
      "topic": "{topic}",
      "points": 10,
      "explanation": "Explanation here."
    }},
    {{
      "question_type": "fill_in_blank",
      "question_text": "Complete: The ___ is ___.",
      "options": ["word1", "word2", "word3", "word4"],
      "correct_answer": ["word1", "word2"],
      "sentence_template": "Complete: The {{blank}} is {{blank}}.",
      "blank_positions": [0, 1],
      "difficulty": "{difficulty.value}",
      "topic": "{topic}",
      "points": 15,
      "explanation": "Explanation here."
    }},
    {{
      "question_type": "word_match",
      "question_text": "Match each word to its definition:",
      "word_pairs": [
        {{"word": "term1", "definition": "definition of term1"}},
        {{"word": "term2", "definition": "definition of term2"}},
        {{"word": "term3", "definition": "definition of term3"}}
      ],
      "correct_answer": ["term1-0", "term2-1", "term3-2"],
      "difficulty": "{difficulty.value}",
      "topic": "{topic}",
      "points": 15,
      "explanation": "Explanation here."
    }}
  ],
  "tutor_message": "Short, motivating message (2-3 sentences max) before the quiz. Build confidence, be upbeat, use emojis. Make it personal and exciting."
}}

CRITICAL REQUIREMENTS:
- Use question_type values: "mcsa", "mcma", "true_false", "fill_in_blank", "word_match"
- correct_answer is STRING for mcsa/true_false, ARRAY for mcma/fill_in_blank/word_match
- For fill_in_blank: use {{blank}} markers in sentence_template, provide blank_positions array
- For word_match: correct_answer format is ["word1-0", "word2-1", ...] where number is the index
- difficulty must be: "beginner", "intermediate", or "advanced"
- **skill_areas: REQUIRED array with 1-2 skills from available list: [{skills_str}]**
- All fields are required except hint (optional)
- Include {num_questions} questions total, mixing the question types

Example tutor_message:
"Alright, time to show what you've learned! 🎯 Don't worry if you don't know everything - quizzes help us learn! Take your time and do your best. I'm here to help you succeed!"

Respond with ONLY valid JSON, no markdown code blocks, no additional text."""

    # Use BedrockClient for API calls
    try:
        bedrock_client = BedrockClient(region=region)
        quiz_data = bedrock_client.generate_json(
            prompt=prompt,
            max_tokens=4000,
            temperature=0.7
        )
        
        # Convert to Question objects
        questions = []
        for q_data in quiz_data.get('questions', [])[:num_questions]:
            # Handle word_pairs for word_match questions
            word_pairs = None
            if q_data.get('word_pairs'):
                word_pairs = [WordPair(**wp) for wp in q_data['word_pairs']]
            
            question = Question(
                question_id=f"q-{uuid.uuid4().hex[:8]}",
                question_type=QuestionType(q_data['question_type']),
                question_text=q_data['question_text'],
                options=q_data.get('options'),
                correct_answer=q_data['correct_answer'],
                word_pairs=word_pairs,
                difficulty=difficulty,
                topic=q_data.get('topic', topic),
                points=q_data.get('points', 10),
                hint=q_data.get('hint'),
                explanation=q_data['explanation'],
                sentence_template=q_data.get('sentence_template'),
                blank_positions=q_data.get('blank_positions')
            )
            questions.append(question)
        
        # Create Quiz object
        quiz = Quiz(
            quiz_id=quiz_id,
            quiz_type=quiz_type,
            topic=topic,
            difficulty_level=difficulty,
            questions=questions,
            total_questions=len(questions),
            time_limit_seconds=None if quiz_type == QuizType.DIAGNOSTIC else 300,
            passing_score_percentage=70.0,
            focus_areas=[]  # Not used for subject-agnostic - removed
        )
        
        # Extract tutor_message
        tutor_message = quiz_data.get('tutor_message',
            f"Alright, quiz time! 🎯 Don't stress - this helps us learn together. Take your time and do your best!")
        
        return {
            'quiz': quiz,
            'tutor_message': tutor_message
        }
        
    except Exception as e:
        # No fallback - let errors surface for debugging
        logger.error(f"❌ Quiz generation failed for topic '{topic}': {str(e)}")
        logger.error(f"   Quiz type: {quiz_type.value}, Difficulty: {difficulty.value}")
        logger.error(f"   Number of questions: {num_questions}")
        focus_values = focus_areas if (focus_areas and isinstance(focus_areas[0], str)) else [f.value for f in focus_areas] if focus_areas else []  # type: ignore
        logger.error(f"   Focus areas: {focus_values}")
        logger.error(f"   Lesson context length: {len(lesson_context)} chars")
        raise RuntimeError(f"Quiz generation failed: {str(e)}") from e
