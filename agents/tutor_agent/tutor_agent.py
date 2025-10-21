"""
AI Tutor Agent - Main orchestrator for autonomous English tutoring
"""
import os
import json
import logging
from datetime import datetime
from typing import Optional
from queue import Queue

import boto3
from strands import Agent, tool
from strands.models.bedrock import BedrockModel
from bedrock_agentcore import BedrockAgentCoreApp
from bedrock_agentcore.memory import MemoryClient

# Import tools
from tools.lesson_generator import generate_lesson_content
from tools.quiz_generator import generate_adaptive_quiz
from tools.validator import validate_student_response
from tools.progress_analyzer import analyze_learning_progress
from tools.achievement_tool import check_and_award_achievements
from tools.memory_hooks import TutorMemoryHook, generate_session_ids
from tools.streaming_hooks import StreamingProgressHook

# Import models
from models.constants import *
from models.lesson_models import *
from models.student_models import *
from models.orchestrator_models import *

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tutor-agent")


def get_parameter(name: str) -> Optional[str]:
    """Get parameter from AWS Systems Manager Parameter Store"""
    try:
        ssm = boto3.client('ssm')
        response = ssm.get_parameter(Name=name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        logger.warning(f"Failed to retrieve parameter {name}: {str(e)}")
        return None


class TutorAgent(Agent):
    """
    Autonomous AI tutor for middle school English learning.
    
    Decides what to teach, when to assess, and how to adapt to student needs.
    """
    
    def __init__(
        self,
        memory_id: Optional[str] = None,
        session_id: Optional[str] = None,
        student_id: Optional[str] = None,
        region: str = "us-east-1",
        streaming_hook: Optional[StreamingProgressHook] = None
    ):
        """
        Initialize Tutor Agent
        
        Args:
            memory_id: AgentCore Memory resource ID
            session_id: Session identifier
            student_id: Student identifier (from Cognito)
            region: AWS region
            streaming_hook: Optional streaming progress hook
        """
        # Store session info
        self.session_id = session_id
        self.student_id = student_id
        self.region = region
        
        logger.info(f"Initializing Tutor Agent - Session: {session_id}, Student: {student_id}")
        
        # Initialize memory hooks
        memory_hooks = None
        if memory_id:
            try:
                memory_client = MemoryClient(region_name=region)
                memory_hooks = TutorMemoryHook(memory_client, memory_id)
                logger.info(f"✅ Memory integration enabled")
            except Exception as e:
                logger.error(f"Failed to initialize memory: {e}")
        
        # Collect all hooks
        all_hooks = []
        if memory_hooks:
            all_hooks.append(memory_hooks)
        if streaming_hook:
            all_hooks.append(streaming_hook)
            logger.info("✅ Streaming hook added")
        
        # Get current date for system prompt
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        # Configure model
        model_id = os.getenv('BEDROCK_MODEL_ID', 'amazon.nova-pro-v1:0')
        logger.info(f"Using Bedrock model: {model_id}")
        
        model = BedrockModel(
            model_id=model_id,
            max_tokens=8000,
            temperature=0.7,
            cache_prompt="default",
        )
        
        # Initialize tools - only essential actions
        tools = [
            self.present_lesson,
            self.present_quiz,
        ]
        
        # Initialize agent state
        agent_state = {
            "student_id": student_id,
            "session_id": session_id,
            "agent_type": "tutor_agent"
        }
        
        super().__init__(
            model=model,
            tools=tools,
            system_prompt=self._build_system_prompt(current_date),
            hooks=all_hooks,
            state=agent_state
        )
    
    def _build_system_prompt(self, current_date: str) -> str:
        """Build system prompt for autonomous tutoring"""
        return f"""You are an AI Tutor for middle school students (grades 6-8) learning English.
Current Date: {current_date}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 CRITICAL: HOW TOOLS WORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

YOUR TOOLS RETURN COMPLETE JSON RESPONSES - OUTPUT THEM DIRECTLY!

When you call present_lesson or present_quiz:
1. Tool generates complete OrchestratorResponse with all fields
2. Tool returns it to you as a Python object
3. YOU MUST: Output that exact object as JSON - DO NOT MODIFY IT
4. DO NOT: Wrap it, describe it, or put it in a message field

EXAMPLE FLOW:
→ You call: present_lesson(topic="Vocabulary", ...)
→ Tool returns: OrchestratorResponse(action_type="present_lesson", lesson_content={{...}}, ...)
→ YOU OUTPUT: {{"action_type": "present_lesson", "lesson_content": {{...}}, ...}}
  NOT: {{"action_type": "conversation", "message": "Here's the lesson..."}}
  NOT: {{"action_type": "conversation", "message": "{{\\"action_type\\": \\"present_lesson\\", ...}}"}}

The tool's return value IS your final response. Output it directly as JSON.

═══════════════════════════════════════════════════════════════════════════════
🛠️ YOUR ONLY 2 TOOLS
═══════════════════════════════════════════════════════════════════════════════

1. present_lesson(topic, difficulty_level, student_interests, focus_areas)
   → Generates and returns complete lesson response
   → Returns OrchestratorResponse with action_type="present_lesson"

2. present_quiz(quiz_type, topic, num_questions, difficulty)
   → Generates and returns complete quiz response  
   → Returns OrchestratorResponse with action_type="present_quiz"

Both tools return complete, valid OrchestratorResponse objects.
Your job: Decide which tool to call, then output its result directly.

═══════════════════════════════════════════════════════════════════════════════
🎯 YOUR RESPONSIBILITIES
═══════════════════════════════════════════════════════════════════════════════

DECISION MAKING:
- Decide WHAT topic to teach (based on quiz results, interests, previous lessons)
- Decide WHEN to quiz (after lessons)
- Decide difficulty level (based on performance)

EXECUTION:
- Call the appropriate tool with the right parameters
- Output the tool's response directly as JSON
- Let the tool handle response structure and messaging

═══════════════════════════════════════════════════════════════════════════════
📋 WORKFLOW EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

SCENARIO 1: New student starts
→ Student: "Start diagnostic quiz for middle school English"
→ You decide: Need diagnostic quiz
→ You call: present_quiz(quiz_type="diagnostic", topic="English Fundamentals", num_questions=10)
→ Tool returns: {{"action_type": "present_quiz", "quiz_content": {{...}}, ...}}
→ YOU OUTPUT: {{"action_type": "present_quiz", "quiz_content": {{...}}, ...}}

SCENARIO 2: Student completes quiz, needs lesson
→ Student: "I scored 6/10 on the diagnostic quiz"
→ You decide: Student needs lesson on fundamentals
→ You call: present_lesson(topic="English Basics", difficulty_level="beginner")
→ Tool returns: {{"action_type": "present_lesson", "lesson_content": {{...}}, ...}}
→ YOU OUTPUT: {{"action_type": "present_lesson", "lesson_content": {{...}}, ...}}

SCENARIO 3: Student finishes lesson
→ Student: "I finished reading the lesson"
→ You decide: Time for pop quiz on lesson content
→ You call: present_quiz(quiz_type="pop_quiz", topic="English Basics", num_questions=5)
→ Tool returns: {{"action_type": "present_quiz", "quiz_content": {{...}}, ...}}
→ YOU OUTPUT: {{"action_type": "present_quiz", "quiz_content": {{...}}, ...}}

═══════════════════════════════════════════════════════════════════════════════
📄 COMPLETE RESPONSE SCHEMA
═══════════════════════════════════════════════════════════════════════════════
{OrchestratorResponse.model_json_schema()}

Always be encouraging and adapt to student needs autonomously."""

    @tool
    def present_lesson(
        self,
        topic: str,
        difficulty_level: str = "intermediate",
        student_interests: Optional[List[str]] = None,
        focus_areas: Optional[List[str]] = None
    ) -> OrchestratorResponse:
        """
        Present a lesson to the student.
        
        Args:
            topic: Lesson topic
            difficulty_level: beginner, intermediate, or advanced
            student_interests: Student's interests for personalization
            focus_areas: Learning areas to emphasize
        
        Returns:
            Response with lesson content
        """
        logger.info(f"Presenting lesson on {topic}")
        
        # Convert string inputs to enums
        difficulty = DifficultyLevel(difficulty_level)
        interests = [StudentInterest(i) for i in (student_interests or [])]
        areas = [FocusArea(a) for a in (focus_areas or ["vocabulary"])]
        
        # Generate lesson
        lesson_result = generate_lesson_content(
            topic=topic,
            difficulty_level=difficulty,
            student_interests=interests,
            focus_areas=areas,
            grade_level=7,
            word_count=300
        )
        
        return create_lesson_response(
            lesson_content=lesson_result['lesson'],
            tutor_message=lesson_result['tutor_message']
        )
    
    @tool
    def present_quiz(
        self,
        quiz_type: str = "pop_quiz",
        topic: str = "Current Lesson",
        num_questions: int = 5,
        difficulty: str = "intermediate"
    ) -> OrchestratorResponse:
        """
        Present a quiz to the student.
        
        Args:
            quiz_type: Type of quiz (diagnostic, pop_quiz, progress_check)
            topic: Quiz topic
            num_questions: Number of questions
            difficulty: Difficulty level
        
        Returns:
            Response with quiz content
        """
        logger.info(f"Presenting {quiz_type} on {topic}")
        
        # Generate quiz with mix of question types
        quiz_result = generate_adaptive_quiz(
            lesson_content="",
            quiz_type=QuizType(quiz_type),
            question_types=[
                QuestionType.MCSA,
                QuestionType.TRUE_FALSE,
                QuestionType.FILL_IN_BLANK,
                QuestionType.WORD_MATCH
            ],
            num_questions=num_questions,
            difficulty=DifficultyLevel(difficulty),
            focus_areas=[FocusArea.VOCABULARY],
            topic=topic
        )
        
        return create_quiz_response(
            quiz_content=quiz_result['quiz'],
            tutor_message=quiz_result['tutor_message']
        )
    
    @tool
    def check_answer(
        self,
        question_id: str,
        question_text: str,
        question_type: str,
        student_answer: str,
        correct_answer: str,
        explanation: str,
        topic: str = "English",
        points: int = 10
    ) -> OrchestratorResponse:
        """
        Check student's answer and provide feedback.
        
        Args:
            question_id: Question identifier
            question_text: The question text
            question_type: Type of question
            student_answer: Student's answer
            correct_answer: The correct answer
            explanation: Explanation text
            topic: Question topic
            points: Points for the question
        
        Returns:
            Response with feedback
        """
        logger.info(f"Checking answer for question {question_id}")
        
        # Create question object for validation
        question = Question(
            question_id=question_id,
            question_type=QuestionType(question_type),
            question_text=question_text,
            correct_answer=correct_answer,
            difficulty=DifficultyLevel.INTERMEDIATE,
            topic=topic,
            points=points,
            explanation=explanation
        )
        
        # Validate answer
        feedback = validate_student_response(
            question=question,
            student_answer=student_answer
        )
        
        return create_feedback_response(
            feedback=feedback,
            tutor_message="Great effort! 💪 Every question helps us learn something new. Let's keep going!"
        )


# Bedrock AgentCore integration
app = BedrockAgentCoreApp()

# Global memory configuration
MEMORY_ID = None


def initialize_memory(region: str = "us-east-1") -> Optional[str]:
    """Initialize shared memory resource"""
    global MEMORY_ID
    
    if MEMORY_ID:
        return MEMORY_ID
    
    # Check AgentCore-provided environment variable (set automatically when memory is configured)
    memory_id = os.getenv('BEDROCK_AGENTCORE_MEMORY_ID')
    
    if memory_id:
        logger.info(f"✅ Using AgentCore memory: {memory_id}")
        MEMORY_ID = memory_id
        return MEMORY_ID
    
    logger.warning("⚠️  No memory configured - agent will run without memory")
    return None


@app.entrypoint
def tutor_agent_invocation(payload, context=None):
    """Tutor agent entry point for AgentCore Runtime"""
    if "prompt" not in payload:
        return {"error": "Missing 'prompt' in payload"}
    
    try:
        region = payload.get("region", "us-east-1")
        
        # Extract session ID from context or generate new one
        session_id = None
        if context and hasattr(context, 'session_id'):
            session_id = context.session_id
            logger.info(f"✅ Using session ID: {session_id}")
        
        if not session_id:
            session_id = generate_session_ids()
            logger.info(f"🆔 Generated new session ID: {session_id}")
        
        # Extract student ID from JWT context
        student_id = getattr(context, 'sub', 'anonymous') if context else 'anonymous'
        
        logger.info(f'🚀 Starting tutor session - Student: {student_id}, Session: {session_id}')
        
        # Initialize memory
        memory_id = initialize_memory(region=region)
        
        # Create agent instance
        agent = TutorAgent(
            memory_id=memory_id,
            session_id=session_id,
            student_id=student_id,
            region=region
        )
        
        logger.info(f'📝 Processing prompt: {payload["prompt"][:100]}...')
        
        # Get response from agent
        result = agent(payload["prompt"])
        
        logger.info(f'✅ Agent completed processing')
        
        # Parse and return response
        return _parse_agent_response(result)
        
    except Exception as e:
        logger.error(f"Error in tutor agent: {str(e)}")
        return {
            "error": f"Tutor agent failed: {str(e)}",
            "action_type": "conversation",
            "response_status": "system_error",
            "message": "I encountered an internal error. Please try again.",
            "success": False
        }


def _parse_agent_response(result) -> dict:
    """Parse agent response and return clean JSON - with safety net for wrapped responses"""
    try:
        if not hasattr(result, 'message') or not result.message:
            logger.error("No message found in agent result")
            return {
                "action_type": "conversation",
                "response_status": "system_error",
                "message": "I encountered an internal error.",
                "success": False
            }
        
        # Extract content
        content = result.message.get('content')
        
        if isinstance(content, list) and len(content) > 0:
            text_content = content[0].get('text', '') if isinstance(content[0], dict) else str(content[0])
        elif isinstance(content, str):
            text_content = content
        else:
            text_content = str(content)
        
        # Try to parse as JSON
        if text_content.strip().startswith('{') and text_content.strip().endswith('}'):
            try:
                json_response = json.loads(text_content.strip())
                logger.info(f"✅ Successfully parsed response")
                
                # SAFETY NET: Check if agent wrapped the response incorrectly
                # If action_type is "conversation" but message contains JSON, unwrap it
                if (json_response.get('action_type') == 'conversation' and 
                    isinstance(json_response.get('message'), str) and
                    json_response.get('message', '').strip().startswith('{')):
                    
                    logger.warning("⚠️  Agent wrapped response incorrectly, unwrapping...")
                    try:
                        # Parse the inner JSON from message field
                        unwrapped = json.loads(json_response['message'])
                        logger.info(f"✅ Unwrapped to action_type: {unwrapped.get('action_type')}")
                        return unwrapped
                    except json.JSONDecodeError:
                        logger.error("Failed to unwrap inner JSON")
                        # Return original if unwrapping fails
                        return json_response
                
                return json_response
            except json.JSONDecodeError as e:
                logger.error(f"❌ Failed to parse JSON: {e}")
        
        # Fallback: return text as conversation
        return {
            "action_type": "conversation",
            "response_status": "success",
            "message": text_content,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"❌ Error parsing agent response: {e}")
        return {
            "action_type": "conversation",
            "response_status": "system_error",
            "message": "I encountered an error. Please try again.",
            "success": False
        }


if __name__ == "__main__":
    app.run()
