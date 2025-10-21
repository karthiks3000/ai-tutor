"""
Memory hooks for AgentCore short-term memory integration
Adapted for AI Tutor agent
"""
import logging
import uuid
import json
import re
from typing import List, Dict, Any
from datetime import datetime

from strands.hooks import AgentInitializedEvent, HookProvider, HookRegistry, MessageAddedEvent
from bedrock_agentcore.memory import MemoryClient

logger = logging.getLogger("tutor-agent-memory")


class TutorMemoryHook(HookProvider):
    """
    Memory hook for tutor_agent that stores conversation context
    """
    
    def __init__(self, memory_client: MemoryClient, memory_id: str):
        """
        Initialize memory hook with client and memory resource
        
        Args:
            memory_client: AgentCore MemoryClient instance
            memory_id: ID of the memory resource to use
        """
        self.memory_client = memory_client
        self.memory_id = memory_id
        logger.info(f"✅ Initialized TutorMemoryHook with memory_id: {memory_id}")
    
    def on_agent_initialized(self, event: AgentInitializedEvent):
        """
        Load recent conversation history when agent starts
        """
        try:
            # Get session info from agent state
            actor_id = event.agent.state.get("actor_id")
            session_id = event.agent.state.get("session_id")
            
            if not actor_id or not session_id:
                logger.warning("Missing actor_id or session_id in agent state")
                return
            
            logger.info(f"Loading conversation history for actor_id: {actor_id}, session_id: {session_id}")
            
            # Get recent conversation turns
            recent_turns = self.memory_client.get_last_k_turns(
                memory_id=self.memory_id,
                actor_id=actor_id,
                session_id=session_id,
                k=6,  # Last 6 turns (3 conversations)
                branch_name="main"
            )
            
            if recent_turns:
                # Format conversation history for context
                context_messages = []
                for turn in recent_turns:
                    for message in turn:
                        role = message['role'].lower()
                        content = message['content']['text']
                        context_messages.append(f"{role.title()}: {content}")
                
                if context_messages:
                    # Create formatted context
                    context = "\n".join(context_messages[-6:])  # Keep last 6 messages
                    logger.info(f"Context from memory (filtered): {context[:200]}...")
                    
                    # Add context to agent's system prompt
                    conversation_context = f"""

PREVIOUS CONVERSATION CONTEXT:
{context}

Continue the learning session naturally based on this context. Reference previous lessons and quizzes when relevant."""
                    
                    # Handle case where system_prompt might be None
                    if event.agent.system_prompt is None:
                        event.agent.system_prompt = conversation_context
                    else:
                        event.agent.system_prompt += conversation_context
                    logger.info(f"✅ Loaded {len(context_messages)} conversation messages")
                else:
                    logger.info("✨ No conversation context found - starting fresh")
            else:
                logger.info("No previous conversation history found - this is a new session")
                
        except Exception as e:
            logger.error(f"Failed to load conversation history: {e}")
            # Continue without memory context rather than failing
    
    def on_message_added(self, event: MessageAddedEvent):
        """
        Store all meaningful messages in memory
        """
        try:
            messages = event.agent.messages
            
            # Get session info from agent state
            actor_id = event.agent.state.get("actor_id")
            session_id = event.agent.state.get("session_id")
            
            if not actor_id or not session_id or not messages:
                logger.warning("Missing required info for memory storage")
                return
            
            latest_message = messages[-1]
            role = latest_message.get("role", "")
            content = latest_message.get("content", "")
            
            # Always store user messages
            if role == "user":
                self._store_message(actor_id, session_id, content, role)
                return
            
            # For assistant messages, store if meaningful
            if role == "assistant":
                # Skip if only thinking (no actual content)
                if self._is_thinking_only(content):
                    logger.info("🔇 Skipping thinking-only message")
                    return
                
                # Store everything else (responses, feedback, achievements)
                self._store_message(actor_id, session_id, content, role)
                
        except Exception as e:
            logger.error(f"Failed to store message: {e}")
    
    def _is_thinking_only(self, content: Any) -> bool:
        """Check if message contains only thinking blocks"""
        try:
            content_str = json.dumps(content) if isinstance(content, (dict, list)) else str(content)
            
            if "<thinking>" in content_str and "</thinking>" in content_str:
                thinking_removed = re.sub(r'<thinking>.*?</thinking>', '', content_str, flags=re.DOTALL).strip()
                if not thinking_removed or thinking_removed in ["[]", "{}", '""', "null"]:
                    return True
            
            return False
        except Exception as e:
            logger.error(f"Error checking thinking-only content: {e}")
            return False
    
    def _store_message(self, actor_id: str, session_id: str, content: Any, role: str):
        """Store message in memory with proper size handling"""
        try:
            # Convert content to string for storage
            if isinstance(content, (dict, list)):
                content_str = json.dumps(content)
            else:
                content_str = str(content)
            
            # Check byte size (9KB limit per message)
            content_bytes = content_str.encode('utf-8')
            
            # Convert role to valid AgentCore Memory format
            valid_role = role.upper() if role.lower() in ['user', 'assistant'] else 'OTHER'
            
            if len(content_bytes) <= 9000:  # 9KB limit with buffer
                self.memory_client.create_event(
                    memory_id=self.memory_id,
                    actor_id=actor_id,
                    session_id=session_id,
                    messages=[(content_str, valid_role)]
                )
                logger.info(f"✅ Stored {role} message ({len(content_bytes)} bytes)")
            else:
                # Split into chunks
                chunk_size = 8500
                chunk_count = 0
                
                for i in range(0, len(content_str), chunk_size):
                    chunk = content_str[i:i + chunk_size]
                    chunk_count += 1
                    
                    self.memory_client.create_event(
                        memory_id=self.memory_id,
                        actor_id=actor_id,
                        session_id=session_id,
                        messages=[(chunk, valid_role)]
                    )
                
                logger.info(f"✅ Stored {role} message in {chunk_count} chunks")
                
        except Exception as e:
            logger.error(f"Failed to store message in memory: {e}")
    
    def register_hooks(self, registry: HookRegistry) -> None:
        """Register memory hooks with the agent"""
        registry.add_callback(MessageAddedEvent, self.on_message_added)
        registry.add_callback(AgentInitializedEvent, self.on_agent_initialized)
        logger.info("✅ Registered memory hooks")


def generate_session_ids() -> str:
    """Generate session ID for tutor agent"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    uuid_suffix = str(uuid.uuid4())[:8]
    return f"tutor-session-{timestamp}-{uuid_suffix}"
