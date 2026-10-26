"""
Streaming progress hooks for real-time tool execution updates
Adapted for AI Tutor agent
"""
import logging
import json
from typing import Dict, Any, Optional
from queue import Queue

from strands.hooks import HookProvider, HookRegistry
from strands.hooks.events import BeforeToolCallEvent, AfterToolCallEvent

logger = logging.getLogger("tutor-agent-streaming")


class StreamingProgressHook(HookProvider):
    """
    Hook that emits SSE events during tool execution for real-time progress tracking
    """
    
    def __init__(self, event_queue: Queue):
        """
        Initialize streaming progress hook
        
        Args:
            event_queue: Thread-safe queue for emitting SSE events
        """
        self.event_queue = event_queue
        
        # Map tool names to user-friendly display names
        self.tool_display_mapping = {
            "generate_lesson_content": "Creating your personalized lesson",
            "generate_adaptive_quiz": "Generating quiz questions",
            "validate_student_response": "Checking your answer",
            "analyze_learning_progress": "Analyzing your progress",
            "check_and_award_achievements": "Checking for achievements",
        }
        
        logger.info("✅ Initialized StreamingProgressHook")
    
    def register_hooks(self, registry: HookRegistry) -> None:
        """Register tool execution hooks with the agent"""
        registry.add_callback(BeforeToolCallEvent, self.on_tool_start)
        registry.add_callback(AfterToolCallEvent, self.on_tool_complete)
        logger.info("✅ Registered streaming hooks")
    
    def on_tool_start(self, event: BeforeToolCallEvent) -> None:
        """Handle tool start event - emit SSE progress update"""
        try:
            # Extract tool name
            tool_name = self._extract_tool_name(event.selected_tool)
            
            # Get display information
            display_name = self.tool_display_mapping.get(tool_name, self._humanize_tool_name(tool_name))
            description = self._get_tool_description(tool_name, event.tool_use)
            
            # Emit SSE event
            sse_event = {
                "event": "tool_start",
                "data": {
                    "tool_id": tool_name,
                    "display_name": display_name,
                    "description": description,
                    "status": "active"
                }
            }
            
            self.event_queue.put(sse_event)
            logger.info(f"🔄 Tool started: {display_name}")
            
        except Exception as e:
            logger.error(f"Error in on_tool_start: {e}", exc_info=True)
    
    def on_tool_complete(self, event: AfterToolCallEvent) -> None:
        """Handle tool completion event - emit SSE progress update"""
        try:
            # Extract tool name
            tool_name = self._extract_tool_name(event.selected_tool)
            
            # Determine success/failure status
            status = "failed" if event.exception else "completed"
            
            # Get result preview
            preview = None
            error_message = None
            
            if event.exception:
                error_message = str(event.exception)
                logger.warning(f"❌ Tool failed: {tool_name} - {error_message}")
            else:
                preview = self._get_result_preview(tool_name, event.result)
                logger.info(f"✅ Tool completed: {tool_name}")
            
            # Emit SSE event
            sse_event = {
                "event": "tool_complete",
                "data": {
                    "tool_id": tool_name,
                    "status": status,
                    "preview": preview,
                    "error_message": error_message
                }
            }
            
            self.event_queue.put(sse_event)
            
        except Exception as e:
            logger.error(f"Error in on_tool_complete: {e}", exc_info=True)
    
    def _extract_tool_name(self, tool_obj: Any) -> str:
        """Extract tool name from tool object with multiple fallback strategies"""
        if not tool_obj:
            return "unknown_tool"
        
        # Try various attributes
        for attr in ['name', 'tool_name', '_name']:
            if hasattr(tool_obj, attr):
                return getattr(tool_obj, attr)
        
        # Try function name
        if hasattr(tool_obj, 'func') and hasattr(tool_obj.func, '__name__'):
            return tool_obj.func.__name__
        
        # Fallback to string representation
        return str(tool_obj)[:50]
    
    def _humanize_tool_name(self, tool_name: str) -> str:
        """Convert snake_case tool name to human-readable format"""
        return tool_name.replace("_", " ").title()
    
    def _get_tool_description(self, tool_name: str, tool_use: Any) -> str:
        """Generate detailed description for tool execution"""
        try:
            # Extract parameters
            params = {}
            if hasattr(tool_use, 'input') and isinstance(tool_use.input, dict):
                params.update(tool_use.input)
            
            # Generate contextual descriptions
            if tool_name == "generate_lesson_content":
                topic = params.get('topic', 'English')
                return f"Creating lesson on {topic}"
            
            elif tool_name == "generate_adaptive_quiz":
                num_questions = params.get('num_questions', 'multiple')
                return f"Generating {num_questions} quiz questions"
            
            elif tool_name == "validate_student_response":
                return "Evaluating your answer with AI"
            
            elif tool_name == "analyze_learning_progress":
                return "Analyzing your learning patterns"
            
            elif tool_name == "check_and_award_achievements":
                return "Checking if you unlocked any badges"
            
            else:
                return f"Executing {self._humanize_tool_name(tool_name)}"
                
        except Exception as e:
            logger.warning(f"Error generating tool description: {e}")
            return f"Executing {self._humanize_tool_name(tool_name)}"
    
    def _get_result_preview(self, tool_name: str, result: Any) -> Optional[str]:
        """Generate preview text from tool result"""
        try:
            if not result:
                return None
            
            # Generate previews based on tool type
            if tool_name == "generate_lesson_content":
                if hasattr(result, 'topic'):
                    return f"Lesson ready: {result.topic}"
            
            elif tool_name == "generate_adaptive_quiz":
                if hasattr(result, 'total_questions'):
                    return f"Quiz ready with {result.total_questions} questions"
            
            elif tool_name == "validate_student_response":
                if hasattr(result, 'is_correct'):
                    return "✓ Correct!" if result.is_correct else "Let's review this"
            
            elif tool_name == "check_and_award_achievements":
                if isinstance(result, list) and len(result) > 0:
                    return f"Unlocked {len(result)} achievement{'s' if len(result) > 1 else ''}!"
            
            return "Completed successfully"
            
        except Exception as e:
            logger.warning(f"Error generating result preview: {e}")
            return "Completed"
