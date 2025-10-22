"""
AI-Powered Lesson content generation tool
Uses Bedrock (Amazon Nova Pro) to create engaging, personalized reading passages
"""
import uuid
import logging
from typing import List, Dict, Any, Union
from models.constants import DifficultyLevel, StudentInterest, FocusArea, LessonContentType
from models.lesson_models import LessonContent, VocabularyWord
from tools.bedrock_client import BedrockClient

logger = logging.getLogger("lesson-generator")


def generate_lesson_content(
    topic: str,
    difficulty_level: DifficultyLevel,
    student_interests: List[StudentInterest],
    focus_areas: Union[List[FocusArea], List[str]],
    grade_level: int = 7,
    word_count: int = 300,
    region: str = "us-east-1"
) -> Dict[str, Any]:
    """
    Generate engaging lesson content using Bedrock AI.
    
    Args:
        topic: Main topic (e.g., "animal vocabulary", "present tense verbs")
        difficulty_level: Beginner, Intermediate, or Advanced
        student_interests: List of student's interests for content alignment
        focus_areas: Learning areas to emphasize (vocabulary, grammar, etc.)
        grade_level: 6, 7, or 8
        word_count: Target word count (200-500 recommended)
        region: AWS region for Bedrock
    
    Returns:
        Dict with 'lesson' (LessonContent) and 'tutor_message' (str)
    """
    
    # Generate unique lesson ID
    lesson_id = f"lesson-{topic.replace(' ', '-').lower()}-{difficulty_level.value}-{uuid.uuid4().hex[:8]}"
    
    # Build AI prompt for lesson generation
    interests_str = ', '.join([i.value for i in student_interests[:3]]) if student_interests else 'general learning'
    
    # Handle both FocusArea enums and string skill areas
    if focus_areas:
        if isinstance(focus_areas[0], str):
            focus_str = ', '.join(focus_areas)  # type: ignore
        else:
            focus_str = ', '.join([f.value for f in focus_areas])  # type: ignore
    else:
        focus_str = "general"
    
    prompt = f"""You are an expert middle school English teacher creating an engaging lesson.

STUDENT PROFILE:
- Grade: {grade_level}
- Difficulty Level: {difficulty_level.value}
- Interests: {interests_str}
- Focus Areas: {focus_str}

TASK:
Create a {word_count}-word lesson on "{topic}" that:
1. Is age-appropriate for grade {grade_level}
2. Incorporates student interests ({interests_str})
3. Uses clear, engaging language
4. Includes examples and explanations
5. Focuses on {focus_str}
6. Uses proper HTML formatting (p, strong, ul, li tags)

OUTPUT FORMAT - Return ONLY valid JSON matching this EXACT structure:
{{
  "title": "Engaging lesson title",
  "content": "<p>HTML-formatted lesson content with <strong>emphasis</strong> and <ul><li>lists</li></ul> where appropriate. Multiple paragraphs as needed.</p>",
  "key_vocabulary": [
    {{
      "word": "vocabulary word",
      "definition": "clear definition",
      "example_sentence": "Sentence using the word in context.",
      "difficulty": "{difficulty_level.value}",
      "part_of_speech": "noun"
    }}
  ],
  "learning_objectives": [
    "Clear learning objective 1",
    "Clear learning objective 2",
    "Clear learning objective 3"
  ],
  "tutor_message": "Short, friendly message (2-3 sentences max) to introduce this lesson. Be encouraging, use emojis, and make it feel personal. Mention something specific about the topic or student's interests."
}}

Example tutor_message:
"Hey there! 🌟 I noticed you love {interests_str.split(',')[0] if interests_str else 'learning'}, so I created this lesson about {topic} just for you! Let's discover some fascinating facts together - I think you'll really enjoy this one!"

CRITICAL REQUIREMENTS:
- Use "content" not "content_html"
- Use "example_sentence" not "example"
- HTML must be valid and safe (no scripts)
- Include 3-5 vocabulary words
- Include 3 learning objectives
- tutor_message must be warm and personal

Respond with ONLY valid JSON, no markdown code blocks, no additional text."""

    # Use BedrockClient for API calls
    try:
        bedrock_client = BedrockClient(region=region)
        lesson_data = bedrock_client.generate_json(
            prompt=prompt,
            max_tokens=3000,
            temperature=0.8  # More creative for content generation
        )
        
        # Convert vocabulary to VocabularyWord objects
        key_vocabulary = []
        for v in lesson_data.get('key_vocabulary', []):
            key_vocabulary.append(VocabularyWord(
                word=v['word'],
                definition=v['definition'],
                example_sentence=v['example_sentence'],
                difficulty=difficulty_level,
                part_of_speech=v.get('part_of_speech', 'noun')
            ))
        
        # Calculate reading time
        wpm = {6: 175, 7: 210, 8: 230}.get(grade_level, 200)
        estimated_time = max(1, int(word_count / wpm))
        
        # Create LessonContent object
        lesson = LessonContent(
            lesson_id=lesson_id,
            topic=topic,
            title=lesson_data['title'],
            content=lesson_data['content'],
            difficulty_level=difficulty_level,
            grade_level=grade_level,
            estimated_reading_time_minutes=estimated_time,
            word_count=word_count,
            key_vocabulary=key_vocabulary,
            learning_objectives=lesson_data.get('learning_objectives', []),
            student_interest_alignment=[i.value for i in student_interests],
            focus_areas=[],  # Legacy field, not used for subject-agnostic
            content_type=LessonContentType.READING_PASSAGE
        )
        
        # Extract tutor_message (will be used in OrchestratorResponse)
        tutor_message = lesson_data.get('tutor_message', 
            f"Let's explore {topic}! 📚 I think you're going to find this really interesting.")
        
        # Return dict with both lesson and tutor_message
        return {
            'lesson': lesson,
            'tutor_message': tutor_message
        }
        
    except Exception as e:
        # No fallback - let errors surface for debugging
        logger.error(f"❌ Lesson generation failed for topic '{topic}': {str(e)}")
        logger.error(f"   Difficulty: {difficulty_level.value}, Grade: {grade_level}")
        logger.error(f"   Student interests: {[i.value for i in student_interests]}")
        focus_values = focus_areas if (focus_areas and isinstance(focus_areas[0], str)) else [f.value for f in focus_areas] if focus_areas else []  # type: ignore
        logger.error(f"   Focus areas: {focus_values}")
        raise RuntimeError(f"Lesson generation failed: {str(e)}") from e
