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
from tools.dynamodb_service import DynamoDBService
from tools.quiz_analyzer import analyze_diagnostic_results
from tools.plan_generator import generate_lesson_plan
from tools.section_generator import generate_section_content

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
        
        # Initialize DynamoDB service
        self.dynamodb = DynamoDBService(region=region)
        
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
            self.save_onboarding_data,
            self.save_quiz_results,
            self.generate_and_save_lesson_plan,
            self.present_next_section,
            self.present_section_quiz,
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
        return f"""You are an AI Tutor for middle school students (grades 6-8).
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
🛠️ YOUR TOOLS
═══════════════════════════════════════════════════════════════════════════════

1. save_onboarding_data(interests, grade, subject)
   → Saves student survey data from onboarding
   → Call this when student completes onboarding survey
   → Returns success confirmation

2. present_lesson(topic, difficulty_level, student_interests, focus_areas)
   → Generates and returns complete lesson response
   → Returns OrchestratorResponse with action_type="present_lesson"

3. generate_and_save_lesson_plan(quiz_result_id)
   → Analyzes diagnostic quiz and creates personalized 3-section plan
   → Saves plan to database
   → Call this after student completes diagnostic quiz

4. present_next_section()
   → Presents the next section lesson based on lesson plan
   → Returns lesson content

5. present_section_quiz()
   → Presents quiz for current section
   → Returns quiz content

6. present_lesson(topic, difficulty_level, student_interests, focus_areas)
   → Generates and returns complete lesson response (legacy)
   → Returns OrchestratorResponse with action_type="present_lesson"

7. present_quiz(quiz_type, topic, num_questions, difficulty)
   → Generates and returns complete quiz response (legacy)
   → Returns OrchestratorResponse with action_type="present_quiz"

All tools return complete, valid OrchestratorResponse objects.
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
    def save_onboarding_data(
        self,
        interests: List[str],
        grade: int
    ) -> OrchestratorResponse:
        """
        Save student onboarding survey data (grade + interests only).
        Subject is chosen per session, not during onboarding.
        
        Args:
            interests: List of student interests
            grade: Grade level (6, 7, or 8)
        
        Returns:
            Success response
        """
        logger.info(f"Saving onboarding data for student: {self.student_id}")
        
        if not self.student_id:
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="Authentication error. Please log in again.",
                message="No student ID",
                student_can_proceed=False,
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
        
        try:
            # Convert to enums
            grade_enum = GradeLevel(grade)
            interest_enums = [StudentInterest(i) for i in interests]
            
            # Create profile data
            profile_data = {
                'name': self.student_id,  # Will be updated from Cognito
                'email': f"{self.student_id}@temp.com",  # Will be updated
                'grade': grade,
                'subject': 'english',  # Default, will be set per session
                'interests': interests,
                'survey_completed': True,
                'survey_interests': interests,
                'survey_grade': grade,
                'learning_profile': {
                    'current_level': 'intermediate',
                    'diagnostic_completed': False
                },
                'strengths': [],
                'focus_areas': [],
                'preferences': {
                    'font_size': 'medium',
                    'theme': 'light',
                    'audio_enabled': False,
                    'notifications_enabled': True
                },
                'total_xp': 0,
                'current_level': 1,
                'current_streak_days': 0,
                'longest_streak_days': 0,
                'total_lessons_completed': 0,
                'total_quizzes_completed': 0,
                'average_quiz_score': 0.0,
                'total_words_learned': 0,
                'badges_earned': [],
                'created_at': int(datetime.now().timestamp()),
                'last_active': int(datetime.now().timestamp()),
                'updated_at': int(datetime.now().timestamp())
            }
            
            # Save to DynamoDB
            success = self.dynamodb.save_student_profile(
                student_id=self.student_id,
                profile_data=profile_data
            )
            
            if success:
                logger.info(f"✅ Onboarding data saved for {self.student_id}")
                
                return OrchestratorResponse(
                    action_type=ActionType.CONVERSATION,
                    response_status=ResponseStatus.SUCCESS,
                    tutor_message=f"Perfect! I've saved your profile. You're in grade {grade} and interested in {', '.join(interests)}. Now you can choose which subject you'd like to explore!",
                    message="Onboarding complete",
                    student_can_proceed=True,
                    is_final_response=True,
                    success=True,
                    processing_time_seconds=0.5
                )
            else:
                raise Exception("Failed to save to database")
                
        except Exception as e:
            logger.error(f"Failed to save onboarding data: {e}")
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="I had trouble saving your information. Please try again.",
                message="Database error",
                student_can_proceed=False,
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
    
    @tool
    def save_quiz_results(
        self,
        quiz_id: str,
        questions: List[Dict[str, Any]],
        score: int,
        total_questions: int
    ) -> OrchestratorResponse:
        """
        Save quiz results to DynamoDB for analysis
        
        Args:
            quiz_id: Quiz identifier
            questions: List of questions with answers and skill_areas
            score: Number of correct answers
            total_questions: Total number of questions
            
        Returns:
            Success response
        """
        logger.info(f"Saving quiz results for quiz {quiz_id}")
        
        if not self.student_id:
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="Authentication error.",
                message="No student ID",
                student_can_proceed=False,
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
        
        try:
            quiz_result = {
                'quiz_result_id': quiz_id,
                'student_id': self.student_id,
                'questions': questions,
                'score_percentage': (score / total_questions) * 100,
                'total_questions': total_questions,
                'correct_answers': score,
                'timestamp': int(datetime.now().timestamp())
            }
            
            success = self.dynamodb.save_quiz_result(quiz_result)
            
            if success:
                logger.info(f"✅ Saved quiz results for {quiz_id}")
                return OrchestratorResponse(
                    action_type=ActionType.CONVERSATION,
                    response_status=ResponseStatus.SUCCESS,
                    tutor_message="Great job completing the quiz!",
                    message="Quiz results saved",
                    student_can_proceed=True,
                    is_final_response=True,
                    success=True,
                    processing_time_seconds=0.2
                )
            else:
                raise Exception("Failed to save to database")
                
        except Exception as e:
            logger.error(f"Failed to save quiz results: {e}")
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="I had trouble saving your quiz results, but let's continue!",
                message="Failed to save quiz results",
                student_can_proceed=True,  # Don't block progress
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
    
    @tool
    def generate_and_save_lesson_plan(self, quiz_result_id: str) -> OrchestratorResponse:
        """
        Generate personalized lesson plan from diagnostic quiz results
        
        Args:
            quiz_result_id: ID of completed diagnostic quiz
            
        Returns:
            Confirmation message with plan details
        """
        logger.info(f"Generating lesson plan from quiz {quiz_result_id}")
        
        if not self.student_id:
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="Authentication error. Please log in again.",
                message="No student ID",
                student_can_proceed=False,
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
        
        try:
            # Get student profile
            profile_data = self.dynamodb.get_student_profile(self.student_id)
            if not profile_data:
                raise Exception("Student profile not found")
            
            profile = StudentProfile(**profile_data)  # type: ignore
            
            # Get real quiz results from DynamoDB
            quiz_result = self.dynamodb.get_quiz_result(quiz_result_id, self.student_id)
            
            if not quiz_result:
                # Fallback to basic results if not found
                logger.warning(f"Quiz result {quiz_result_id} not found, using fallback")
                diagnostic_results = {
                    "quiz_id": quiz_result_id,
                    "overall_score": 65.0,
                    "skill_scores": {},
                    "identified_gaps": [],
                    "recommended_difficulty": "intermediate",
                    "focus_areas": [],
                    "strengths": [],
                    "total_questions": 5,
                    "correct_answers": 3
                }
            else:
                # Analyze real quiz results using AI-driven analyzer
                diagnostic_results = analyze_diagnostic_results(quiz_result, profile.subject)
                diagnostic_results["quiz_id"] = quiz_result_id
            
            logger.info(f"Diagnostic analysis complete: {diagnostic_results['overall_score']:.1f}% overall, {len(diagnostic_results['identified_gaps'])} gaps identified")
            
            # Generate lesson plan from real analysis
            plan = generate_lesson_plan(diagnostic_results, profile)
            
            # Save to DynamoDB
            self.dynamodb.save_lesson_plan(
                plan_id=plan.plan_id,
                student_id=self.student_id,
                plan_data=plan.dict()
            )
            
            # Update student profile with plan_id
            self.dynamodb.update_student_profile(self.student_id, {
                'current_lesson_plan_id': plan.plan_id,
                'current_section_index': 0
            })
            
            # Store in agent memory
            self.state['lesson_plan'] = plan  # type: ignore[index]
            
            logger.info(f"✅ Created lesson plan {plan.plan_id}")
            
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SUCCESS,
                tutor_message=f"Excellent work on the diagnostic! I've created a personalized 3-section learning plan just for you:\n\n1️⃣ {plan.sections[0].topic}\n2️⃣ {plan.sections[1].topic}\n3️⃣ {plan.sections[2].topic}\n\nLet's begin with section 1! 🚀",
                message="Lesson plan created",
                student_can_proceed=True,
                is_final_response=True,
                success=True,
                processing_time_seconds=1.0
            )
            
        except Exception as e:
            logger.error(f"Failed to generate lesson plan: {e}")
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="I had trouble creating your lesson plan. Let's try that again!",
                message="Plan generation error",
                student_can_proceed=False,
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
    
    @tool
    def present_next_section(self) -> OrchestratorResponse:
        """
        Present next section lesson based on student's lesson plan
        
        Returns:
            Lesson content response
        """
        logger.info("Presenting next section")
        
        if not self.student_id:
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="Authentication error. Please log in again.",
                message="No student ID",
                student_can_proceed=False,
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
        
        try:
            # Get student profile
            profile_data = self.dynamodb.get_student_profile(self.student_id)
            if not profile_data:
                raise Exception("Student profile not found")
            
            profile = StudentProfile(**profile_data)  # type: ignore
            
            # Get lesson plan
            plan_data = self.dynamodb.get_active_lesson_plan(self.student_id)
            if not plan_data:
                raise Exception("No active lesson plan found")
            
            plan = LessonPlan(**plan_data)  # type: ignore
            
            # Get previous section performance if not first section
            previous_performance = None
            if profile.current_section_index > 0:
                # Query DynamoDB for most recent section quiz result
                recent_quiz = self.dynamodb.get_most_recent_section_quiz(
                    student_id=self.student_id,
                    section_number=profile.current_section_index  # just completed section
                )
                
                if recent_quiz:
                    previous_performance = {
                        'section_number': profile.current_section_index,
                        'quiz_score': recent_quiz['score_percentage'],
                        'correct_answers': recent_quiz['correct_answers'],
                        'total_questions': recent_quiz['total_questions']
                    }
                    logger.info(f"Using previous section {profile.current_section_index} performance for adaptation: {previous_performance['quiz_score']}%")
                else:
                    logger.warning(f"No previous quiz found for section {profile.current_section_index}, using default difficulty")
            
            # Generate section content with adaptive difficulty
            section_content = generate_section_content(
                lesson_plan=plan,
                section_index=profile.current_section_index,
                student_profile=profile,
                previous_section_performance=previous_performance
            )
            
            logger.info(f"✅ Presenting section {profile.current_section_index + 1}")
            
            # Return both lesson AND quiz together
            return OrchestratorResponse(
                action_type=ActionType.PRESENT_LESSON,
                response_status=ResponseStatus.SUCCESS,
                lesson_content=section_content['lesson'],
                quiz_content=section_content['quiz'],  # Include quiz!
                tutor_message=section_content['tutor_message'],
                message=f"Section {profile.current_section_index + 1} ready",
                success=True,
                is_final_response=True,
                processing_time_seconds=1.0
            )
            
        except Exception as e:
            logger.error(f"Failed to present section: {e}")
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="I had trouble loading the next section. Please try again!",
                message="Section load error",
                student_can_proceed=False,
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
    
    @tool
    def present_section_quiz(self) -> OrchestratorResponse:
        """
        Present quiz for current section
        
        Returns:
            Quiz content response
        """
        logger.info("Presenting section quiz")
        
        try:
            # Retrieve stored quiz from state
            quiz = self.state.get('pending_quiz', None)  # type: ignore[call-overload]
            section_info = self.state.get('current_section_info', {})  # type: ignore[call-overload]
            
            if not quiz:
                raise Exception("No quiz available")
            
            logger.info(f"✅ Presenting quiz for section {section_info.get('section_number', '?')}")
            
            return create_quiz_response(
                quiz_content=quiz,
                tutor_message=f"Time to test your understanding! Let's see how well you learned {section_info.get('topic', 'this content')}. 🎯"
            )
            
        except Exception as e:
            logger.error(f"Failed to present quiz: {e}")
            return OrchestratorResponse(
                action_type=ActionType.CONVERSATION,
                response_status=ResponseStatus.SYSTEM_ERROR,
                tutor_message="I had trouble loading the quiz. Please try again!",
                message="Quiz load error",
                student_can_proceed=False,
                is_final_response=True,
                success=False,
                processing_time_seconds=0.1
            )
    
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
        difficulty: str = "intermediate",
        subject: str = "english"
    ) -> OrchestratorResponse:
        """
        Present a quiz to the student.
        
        Args:
            quiz_type: Type of quiz (diagnostic, pop_quiz, progress_check)
            topic: Quiz topic
            num_questions: Number of questions
            difficulty: Difficulty level
            subject: Subject to quiz on
        
        Returns:
            Response with quiz content
        """
        logger.info(f"Presenting {quiz_type} on {topic} for subject {subject}")
        
        # Get subject enum and skill areas
        subject_enum = Subject(subject)
        skill_areas = SUBJECT_SKILL_AREAS[subject_enum]
        
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
            focus_areas=skill_areas,
            topic=topic,
            subject=subject_enum,
            skill_areas=skill_areas
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


def handle_save_onboarding(student_id: str, data: dict, dynamodb: DynamoDBService) -> dict:
    """Handle onboarding data save - pure data operation"""
    try:
        grade = data.get('grade')
        interests = data.get('interests', [])
        
        profile_data = {
            'name': student_id,
            'email': f"{student_id}@temp.com",
            'grade': grade,
            'subject': 'english',
            'interests': interests,
            'survey_completed': True,
            'survey_interests': interests,
            'survey_grade': grade,
            'learning_profile': {'current_level': 'intermediate', 'diagnostic_completed': False},
            'strengths': [],
            'focus_areas': [],
            'preferences': {'font_size': 'medium', 'theme': 'light'},
            'total_xp': 0,
            'current_level': 1,
            'created_at': int(datetime.now().timestamp()),
            'last_active': int(datetime.now().timestamp()),
            'updated_at': int(datetime.now().timestamp())
        }
        
        success = dynamodb.save_student_profile(student_id, profile_data)
        
        return {
            "action_type": "conversation",
            "success": success,
            "tutor_message": f"Profile saved! Ready to learn.",
            "message": "Onboarding complete"
        }
    except Exception as e:
        logger.error(f"Failed to save onboarding: {e}")
        return {"error": str(e), "success": False}


def handle_diagnostic_complete(student_id: str, data: dict, dynamodb: DynamoDBService) -> dict:
    """Handle diagnostic completion - save, analyze, generate plan"""
    try:
        quiz_id = data.get('quiz_id')
        if not quiz_id:
            raise Exception("Missing quiz_id")
            
        subject_str = data.get('subject', 'english')
        questions = data.get('questions', [])
        evaluation = data.get('evaluation', {})
        
        # Save quiz results
        quiz_result = {
            'quiz_result_id': quiz_id,
            'student_id': student_id,
            'questions': questions,
            'score_percentage': int(evaluation.get('scorePercentage', 0)),  # Convert to int
            'total_questions': evaluation.get('totalQuestions', 5),
            'correct_answers': evaluation.get('correctCount', 0),
            'timestamp': int(datetime.now().timestamp())
        }
        dynamodb.save_quiz_result(quiz_result)
        
        # Get profile and analyze
        profile_data = dynamodb.get_student_profile(student_id)
        if not profile_data:
            raise Exception("Profile not found")
        
        profile = StudentProfile(**profile_data)  # type: ignore
        subject = Subject(subject_str)
        
        # Analyze diagnostic results
        saved_quiz = dynamodb.get_quiz_result(quiz_id, student_id)
        if saved_quiz:
            analysis = analyze_diagnostic_results(saved_quiz, subject)
            analysis["quiz_id"] = quiz_id
        else:
            analysis = {"quiz_id": quiz_id, "overall_score": 50.0, "focus_areas": []}
        
        # Generate plan
        plan = generate_lesson_plan(analysis, profile)
        
        # Save plan
        dynamodb.save_lesson_plan(plan.plan_id, student_id, plan.dict())
        dynamodb.update_student_profile(student_id, {
            'current_lesson_plan_id': plan.plan_id,
            'current_section_index': 0
        })
        
        logger.info(f"✅ Diagnostic complete: plan created {plan.plan_id}")
        
        return {
            "action_type": "plan_created",
            "lesson_plan": plan.dict(),
            "tutor_message": f"Created your personalized 3-section plan!\n\n1️⃣ {plan.sections[0].topic}\n2️⃣ {plan.sections[1].topic}\n3️⃣ {plan.sections[2].topic}",
            "success": True
        }
    except Exception as e:
        logger.error(f"Failed diagnostic complete: {e}")
        return {"error": str(e), "success": False}


def handle_section_complete(student_id: str, data: dict, dynamodb: DynamoDBService) -> dict:
    """Handle section completion - save results, store performance, increment section index"""
    try:
        section_num = data.get('section_number')
        quiz_id = data.get('quiz_id')
        questions = data.get('questions', [])
        evaluation = data.get('evaluation', {})
        
        # Save quiz results
        quiz_result = {
            'quiz_result_id': quiz_id,
            'student_id': student_id,
            'questions': questions,
            'score_percentage': int(evaluation.get('scorePercentage', 0)),  # Convert to int
            'total_questions': evaluation.get('totalQuestions', 3),
            'correct_answers': evaluation.get('correctCount', 0),
            'timestamp': int(datetime.now().timestamp())
        }
        dynamodb.save_quiz_result(quiz_result)
        
        # CRITICAL: Increment section index for next request
        # section_num is 1-indexed (1, 2, 3), current_section_index is 0-indexed (0, 1, 2)
        # After completing section 1, set index to 1 (for section 2)
        dynamodb.update_student_profile(student_id, {
            'current_section_index': section_num  # This moves to next section
        })
        logger.info(f"✅ Updated current_section_index to {section_num} for next request")
        
        # Store performance for next section
        performance = {
            'section_number': section_num,
            'quiz_score': int(evaluation.get('scorePercentage', 0)),  # Convert to int
            'correct_answers': evaluation.get('correctCount', 0),
            'total_questions': evaluation.get('totalQuestions', 3)
        }
        
        logger.info(f"✅ Section {section_num} complete: {performance['quiz_score']}%")
        
        return {
            "action_type": "section_summary",
            "summary": {
                "xp_earned": 50 + (evaluation.get('correctCount', 0) * 10),
                "performance": performance
            },
            "tutor_message": f"Great work on section {section_num}!",
            "success": True
        }
    except Exception as e:
        logger.error(f"Failed section complete: {e}")
        return {"error": str(e), "success": False}


def handle_lesson_complete(student_id: str, data: dict, dynamodb: DynamoDBService) -> dict:
    """Generate overall summary after all sections complete"""
    try:
        subject = data.get('subject', 'english')
        
        # Get student profile
        profile_data = dynamodb.get_student_profile(student_id)
        if not profile_data:
            raise Exception("Student profile not found")
        
        profile = StudentProfile(**profile_data)  # type: ignore
        
        # Get lesson plan
        plan_data = dynamodb.get_active_lesson_plan(student_id)
        if not plan_data:
            raise Exception("Lesson plan not found")
        
        plan = LessonPlan(**plan_data)  # type: ignore
        
        # Get all 3 section performances
        section_performances = []
        for section_num in [1, 2, 3]:
            quiz = dynamodb.get_most_recent_section_quiz(student_id, section_num)
            if quiz:
                section_performances.append({
                    'section_number': section_num,
                    'quiz_score': float(quiz['score_percentage']),
                    'correct_answers': quiz['correct_answers'],
                    'total_questions': quiz['total_questions']
                })
        
        # Generate summary
        from tools.summary_generator import generate_overall_summary
        summary = generate_overall_summary(profile, plan, section_performances)
        
        logger.info(f"✅ Generated overall summary: {summary['average_score']:.1f}% avg")
        
        return {
            "action_type": "overall_summary",
            "summary_data": summary,
            "tutor_message": summary['overall_feedback'],
            "success": True
        }
    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        return {"error": str(e), "success": False}


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
    """Tutor agent entry point with action-based routing"""
    
    # Extract common context
    region = payload.get("region", "us-east-1")
    
    # Get student_id from payload first, then JWT context
    student_id = payload.get("student_id")
    if not student_id:
        student_id = getattr(context, 'sub', 'anonymous') if context else 'anonymous'
    
    # Get or generate session ID
    session_id = None
    if context and hasattr(context, 'session_id'):
        session_id = context.session_id
    else:
        session_id = generate_session_ids()
    
    logger.info(f'🚀 Tutor session - Student: {student_id}, Session: {session_id}')
    
    # Initialize DynamoDB service for routing layer
    dynamodb = DynamoDBService(region=region)
    
    try:
        # ACTION-BASED ROUTING
        action = payload.get('action')
        data = payload.get('data', {})
        
        # DATA OPERATIONS (No agent needed - direct execution)
        if action == 'save_onboarding':
            return handle_save_onboarding(student_id, data, dynamodb)
        
        if action == 'diagnostic_complete':
            return handle_diagnostic_complete(student_id, data, dynamodb)
        
        if action == 'section_complete':
            return handle_section_complete(student_id, data, dynamodb)
        
        if action == 'complete_lesson':
            return handle_lesson_complete(student_id, data, dynamodb)
        
        # AGENT INVOCATIONS (Need AI for content generation)
        if action or 'prompt' in payload:
            # Initialize agent
            memory_id = initialize_memory(region=region)
            
            agent = TutorAgent(
                memory_id=memory_id,
                session_id=session_id,
                student_id=student_id,
                region=region
            )
            
            # Route to agent
            if action == 'request_diagnostic':
                subject = data.get('subject', 'english')
                prompt = f"Generate diagnostic quiz for {subject}"
            elif action == 'request_section':
                prompt = "Present next section"
            elif action == 'request_section_quiz':
                prompt = "Present section quiz"
            else:
                # Legacy prompt support
                prompt = payload.get('prompt', '')
            
            logger.info(f'📝 Agent prompt: {prompt[:100]}...')
            result = agent(prompt)
            logger.info(f'✅ Agent completed')
            
            return _parse_agent_response(result)
        
        return {"error": "Invalid payload: missing 'action' or 'prompt'"}
        
    except Exception as e:
        logger.error(f"Error in tutor invocation: {str(e)}")
        return {
            "error": f"Tutor agent failed: {str(e)}",
            "action_type": "conversation",
            "response_status": "system_error",
            "message": "I encountered an internal error.",
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
