"""
Lightweight Bedrock client for AI content generation
Encapsulates Bedrock Converse API interactions for reuse across tools
"""
import json
import re
import boto3
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("bedrock-client")


class BedrockClient:
    """
    Lightweight client for AWS Bedrock Converse API.
    
    Provides a simple interface for generating AI content using Amazon Nova Pro.
    All tools can reuse this client instead of duplicating Bedrock interaction code.
    """
    
    def __init__(
        self,
        model_id: str = "amazon.nova-pro-v1:0",
        region: str = "us-east-1"
    ):
        """
        Initialize Bedrock client.
        
        Args:
            model_id: Bedrock model ID to use
            region: AWS region
        """
        self.model_id = model_id
        self.region = region
        self._client = None
    
    @property
    def client(self):
        """Lazy-load boto3 client."""
        if self._client is None:
            self._client = boto3.client('bedrock-runtime', region_name=self.region)
        return self._client
    
    def generate(
        self,
        prompt: str,
        max_tokens: int = 4000,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate content using Bedrock Converse API.
        
        Args:
            prompt: The prompt to send to the model
            max_tokens: Maximum tokens to generate
            temperature: Temperature for response randomness (0-1)
            system_prompt: Optional system prompt for context
        
        Returns:
            Generated text response from the model
        
        Raises:
            RuntimeError: If generation fails
        """
        try:
            # Prepare messages for Converse API
            messages = [{
                "role": "user",
                "content": [{"text": prompt}]
            }]
            
            # Prepare inference config
            inference_config = {
                "maxTokens": max_tokens,
                "temperature": temperature
            }
            
            # Build request parameters
            request_params = {
                "modelId": self.model_id,
                "messages": messages,
                "inferenceConfig": inference_config
            }
            
            # Add system prompt if provided
            if system_prompt:
                request_params["system"] = [{"text": system_prompt}]
            
            # Call Converse API
            logger.debug(f"Calling Bedrock Converse API with model {self.model_id}")
            response = self.client.converse(**request_params)
            
            # Extract response text
            ai_text = response['output']['message']['content'][0]['text']
            
            logger.debug(f"Successfully generated {len(ai_text)} characters")
            return ai_text
            
        except Exception as e:
            error_msg = f"Bedrock generation failed: {str(e)}"
            logger.error(error_msg)
            raise RuntimeError(error_msg) from e
    
    def generate_json(
        self,
        prompt: str,
        max_tokens: int = 4000,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate JSON content using Bedrock Converse API.
        
        Automatically parses the response as JSON, handling common edge cases like
        markdown code blocks.
        
        Args:
            prompt: The prompt to send to the model
            max_tokens: Maximum tokens to generate
            temperature: Temperature for response randomness (0-1)
            system_prompt: Optional system prompt for context
        
        Returns:
            Parsed JSON response as a dictionary
        
        Raises:
            RuntimeError: If generation or JSON parsing fails
        """
        # Generate raw text
        ai_text = self.generate(
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature,
            system_prompt=system_prompt
        )
        
        # Parse JSON with fallback strategies
        try:
            # Try direct parsing first
            return json.loads(ai_text)
        except json.JSONDecodeError:
            logger.debug("Direct JSON parsing failed, trying fallback strategies")
            
            # Try extracting from markdown code blocks
            json_match = re.search(r'```(?:json)?\s*(.*?)\s*```', ai_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(1))
                except json.JSONDecodeError:
                    pass
            
            # Last resort: try to find JSON object in text
            json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group(0))
                except json.JSONDecodeError:
                    pass
            
            # All parsing strategies failed
            error_msg = "AI did not return valid JSON. Response preview: " + ai_text[:200]
            logger.error(error_msg)
            raise RuntimeError(error_msg)


# Create a default global instance for convenience
default_client = BedrockClient()
