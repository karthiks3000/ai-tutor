"""
DynamoDB service layer for student profiles and lesson plans
"""
import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
import boto3
from botocore.exceptions import ClientError
from models.student_models import StudentProfile
from models.lesson_models import LessonPlan

logger = logging.getLogger(__name__)


class DynamoDBService:
    """Service for interacting with DynamoDB tables"""
    
    def __init__(self, region: str = "us-east-1"):
        """
        Initialize DynamoDB service
        
        Args:
            region: AWS region
        """
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.region = region
        
        # Get table names from environment or SSM
        self.students_table_name = self._get_table_name('students')
        self.lesson_plans_table_name = "tutor-lesson-plans-dev"  # Will be created
        self.quiz_results_table_name = self._get_table_name('quiz-results')
        
        # Initialize table references
        self.students_table = self.dynamodb.Table(self.students_table_name)  # type: ignore[attr-defined]
        self.quiz_results_table = self.dynamodb.Table(self.quiz_results_table_name)  # type: ignore[attr-defined]
        
        logger.info(f"DynamoDB service initialized - Region: {region}")
        logger.info(f"Students table: {self.students_table_name}")
        logger.info(f"Quiz results table: {self.quiz_results_table_name}")
    
    def _get_table_name(self, table_type: str) -> str:
        """Get table name from environment or construct default"""
        env = os.getenv('ENVIRONMENT', 'dev')
        
        # Try environment variable first
        env_var = f"DYNAMODB_{table_type.upper().replace('-', '_')}_TABLE"
        env_value = os.getenv(env_var)
        if env_value:
            return env_value
        
        # Construct default name
        return f"tutor-{table_type}-{env}"
    
    # ==================== Student Profile Operations ====================
    
    def save_student_profile(self, student_id: str, profile_data: Dict[str, Any]) -> bool:
        """
        Save or update student profile
        
        Args:
            student_id: Student ID (Cognito sub)
            profile_data: Profile data dictionary
            
        Returns:
            Success boolean
        """
        try:
            item = {
                'student_id': student_id,
                **profile_data
            }
            
            self.students_table.put_item(Item=item)
            logger.info(f"Saved profile for student: {student_id}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to save student profile: {e}")
            return False
    
    def get_student_profile(self, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Get student profile by ID
        
        Args:
            student_id: Student ID
            
        Returns:
            Profile dictionary or None
        """
        try:
            response = self.students_table.get_item(Key={'student_id': student_id})
            
            if 'Item' in response:
                logger.info(f"Retrieved profile for student: {student_id}")
                return response['Item']
            
            logger.info(f"No profile found for student: {student_id}")
            return None
            
        except ClientError as e:
            logger.error(f"Failed to get student profile: {e}")
            return None
    
    def update_student_profile(self, student_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update specific fields in student profile
        
        Args:
            student_id: Student ID
            updates: Dictionary of fields to update
            
        Returns:
            Success boolean
        """
        try:
            # Build update expression
            update_expr = "SET " + ", ".join([f"{k} = :{k}" for k in updates.keys()])
            expr_values = {f":{k}": v for k, v in updates.items()}
            
            self.students_table.update_item(
                Key={'student_id': student_id},
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values
            )
            
            logger.info(f"Updated profile for student: {student_id}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to update student profile: {e}")
            return False
    
    # ==================== Lesson Plan Operations ====================
    
    def save_lesson_plan(self, plan_id: str, student_id: str, plan_data: Dict[str, Any]) -> bool:
        """
        Save lesson plan as embedded JSON in student profile
        
        Args:
            plan_id: Plan ID
            student_id: Student ID
            plan_data: Plan data dictionary
            
        Returns:
            Success boolean
        """
        try:
            # Store lesson plan as embedded JSON in student profile
            # This avoids composite key issues and keeps data together
            updates = {
                'current_lesson_plan': plan_data,
                'current_lesson_plan_id': plan_id,
                'updated_at': int(datetime.now().timestamp())
            }
            
            success = self.update_student_profile(student_id, updates)
            
            if success:
                logger.info(f"Saved lesson plan: {plan_id} for student: {student_id}")
            
            return success
            
        except ClientError as e:
            logger.error(f"Failed to save lesson plan: {e}")
            return False
    
    def get_lesson_plan(self, plan_id: str, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Get lesson plan by ID from student profile
        
        Args:
            plan_id: Plan ID
            student_id: Student ID
            
        Returns:
            Plan dictionary or None
        """
        try:
            profile = self.get_student_profile(student_id)
            
            if not profile:
                return None
            
            # Get embedded lesson plan
            plan = profile.get('current_lesson_plan')
            
            # Verify it's the right plan
            if plan and plan.get('plan_id') == plan_id:
                logger.info(f"Retrieved lesson plan: {plan_id}")
                return plan
            
            logger.info(f"No lesson plan found: {plan_id}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to get lesson plan: {e}")
            return None
    
    def get_active_lesson_plan(self, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Get active lesson plan for student from embedded JSON
        
        Args:
            student_id: Student ID
            
        Returns:
            Plan dictionary or None
        """
        try:
            profile = self.get_student_profile(student_id)
            
            if not profile:
                return None
            
            # Get embedded lesson plan directly
            plan = profile.get('current_lesson_plan')
            
            if plan:
                logger.info(f"Retrieved active lesson plan for student: {student_id}")
                return plan
            
            logger.info(f"No active lesson plan for student: {student_id}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to get active lesson plan: {e}")
            return None
    
    def update_lesson_plan_progress(self, plan_id: str, student_id: str, section_index: int) -> bool:
        """
        Update current section in embedded lesson plan
        
        Args:
            plan_id: Plan ID
            student_id: Student ID
            section_index: Current section index
            
        Returns:
            Success boolean
        """
        try:
            # Update both the embedded plan and the profile section index
            updates = {
                'current_section_index': section_index,
                'current_lesson_plan.current_section': section_index,
                'updated_at': int(datetime.now().timestamp())
            }
            
            success = self.update_student_profile(student_id, updates)
            
            if success:
                logger.info(f"Updated plan progress to section {section_index}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to update lesson plan progress: {e}")
            return False
    
    def mark_lesson_plan_complete(self, plan_id: str, student_id: str) -> bool:
        """
        Mark embedded lesson plan as completed
        
        Args:
            plan_id: Plan ID
            student_id: Student ID
            
        Returns:
            Success boolean
        """
        try:
            # Update status in embedded plan
            updates = {
                'current_lesson_plan.status': 'completed',
                'current_lesson_plan_id': None,  # Clear active plan
                'updated_at': int(datetime.now().timestamp())
            }
            
            success = self.update_student_profile(student_id, updates)
            
            if success:
                logger.info(f"Marked lesson plan as complete: {plan_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to mark lesson plan complete: {e}")
            return False
    
    # ==================== Quiz Results Operations ====================
    
    def save_quiz_result(self, quiz_result: Dict[str, Any]) -> bool:
        """
        Save quiz result
        
        Args:
            quiz_result: Quiz result dictionary with quiz_result_id and student_id
            
        Returns:
            Success boolean
        """
        try:
            # Add timestamp if not present
            if 'timestamp' not in quiz_result:
                quiz_result['timestamp'] = int(datetime.now().timestamp())
            
            self.quiz_results_table.put_item(Item=quiz_result)
            logger.info(f"Saved quiz result: {quiz_result.get('quiz_result_id')} for student {quiz_result.get('student_id')}")
            return True
            
        except ClientError as e:
            logger.error(f"Failed to save quiz result: {e}")
            return False
    
    def get_quiz_result(self, quiz_result_id: str, student_id: str) -> Optional[Dict[str, Any]]:
        """
        Get quiz result by ID
        
        Args:
            quiz_result_id: Quiz result ID
            student_id: Student ID
            
        Returns:
            Quiz result dictionary or None
        """
        try:
            # Query by quiz_result_id (partition key) and student_id
            response = self.quiz_results_table.get_item(
                Key={
                    'quiz_result_id': quiz_result_id,
                    'student_id': student_id
                }
            )
            
            if 'Item' in response:
                logger.info(f"Retrieved quiz result: {quiz_result_id}")
                return response['Item']
            
            logger.info(f"No quiz result found: {quiz_result_id}")
            return None
            
        except ClientError as e:
            logger.error(f"Failed to get quiz result: {e}")
            return None
    
    def get_latest_quiz_results(self, student_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get most recent quiz results for a student
        
        Args:
            student_id: Student ID
            limit: Maximum number of results
            
        Returns:
            List of quiz result dictionaries
        """
        try:
            response = self.quiz_results_table.query(
                IndexName='StudentIndex',  # Would need GSI
                KeyConditionExpression='student_id = :sid',
                ExpressionAttributeValues={':sid': student_id},
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
            
            return response.get('Items', [])
            
        except ClientError as e:
            logger.error(f"Failed to query quiz results: {e}")
            return []
    
    def get_most_recent_section_quiz(self, student_id: str, section_number: int) -> Optional[Dict[str, Any]]:
        """
        Get the most recent quiz result for a specific section
        
        Args:
            student_id: Student ID
            section_number: Section number (1, 2, or 3)
            
        Returns:
            Quiz result dictionary or None
        """
        try:
            # Scan through quiz results for this student to find section quiz
            # In production, would use a GSI on student_id + timestamp for efficiency
            response = self.quiz_results_table.scan(
                FilterExpression='student_id = :sid',
                ExpressionAttributeValues={':sid': student_id}
            )
            
            items = response.get('Items', [])
            
            # Filter for section quizzes (quiz_id contains 'section')
            # and match the section number
            section_quizzes = [
                item for item in items 
                if f'section_{section_number}' in item.get('quiz_result_id', '').lower()
                or f'section-{section_number}' in item.get('quiz_result_id', '').lower()
            ]
            
            # Sort by timestamp, most recent first
            if section_quizzes:
                section_quizzes.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
                logger.info(f"Found section {section_number} quiz for student {student_id}")
                return section_quizzes[0]
            
            logger.info(f"No section {section_number} quiz found for student {student_id}")
            return None
            
        except ClientError as e:
            logger.error(f"Failed to get section quiz: {e}")
            return None
