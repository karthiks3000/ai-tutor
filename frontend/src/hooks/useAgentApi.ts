/**
 * Centralized hook for AgentCore API calls
 * Ensures all calls have proper auth headers and prevents duplicates
 */
import { useState, useCallback, useRef } from 'react';
import { agentClient } from '../services/agentCoreClient';
import { cognitoService } from '../services/cognitoService';
import { OrchestratorResponse } from '../types';

export function useAgentApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Prevent duplicate calls

  // Get JWT token once and reuse
  const getAuthToken = useCallback(async (): Promise<string> => {
    try {
      const token = await cognitoService.getJwtToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return token;
    } catch (err) {
      console.error('Failed to get auth token:', err);
      throw new Error('Authentication required');
    }
  }, []);

  // Generic invoke with automatic token injection
  const invoke = useCallback(async (prompt: string): Promise<OrchestratorResponse> => {
    if (loadingRef.current) {
      throw new Error('Request already in progress');
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      const token = await getAuthToken();
      const response = await agentClient.invoke(prompt, token);
      
      return response;
    } catch (err: any) {
      const errorMsg = err.message || 'API request failed';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [getAuthToken]);

  // Specific API methods with auth headers automatically included
  const loadDiagnosticQuiz = useCallback(async (): Promise<OrchestratorResponse> => {
    return invoke('Start diagnostic quiz for middle school English assessment');
  }, [invoke]);

  const startLearningSession = useCallback(async (
    studentName: string,
    grade: number,
    interests: string[]
  ): Promise<OrchestratorResponse> => {
    const prompt = `Start learning session for ${studentName}, grade ${grade}, interests: ${interests.join(', ')}, first_time: true`;
    return invoke(prompt);
  }, [invoke]);

  const submitAnswer = useCallback(async (
    questionId: string,
    answer: string | string[],
    questionData: any
  ): Promise<OrchestratorResponse> => {
    const prompt = `Check answer for question ${questionId}: student answered "${JSON.stringify(answer)}"`;
    return invoke(prompt);
  }, [invoke]);

  const loadLesson = useCallback(async (
    topic?: string,
    difficulty?: string
  ): Promise<OrchestratorResponse> => {
    const prompt = topic
      ? `Present lesson on ${topic} at ${difficulty || 'intermediate'} level`
      : 'Present next recommended lesson';
    return invoke(prompt);
  }, [invoke]);

  const loadQuiz = useCallback(async (
    quizType: string,
    topic: string,
    numQuestions: number = 5
  ): Promise<OrchestratorResponse> => {
    const prompt = `Administer ${quizType} on ${topic} with ${numQuestions} questions`;
    return invoke(prompt);
  }, [invoke]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    
    // Methods - all automatically include auth headers
    invoke,
    loadDiagnosticQuiz,
    startLearningSession,
    submitAnswer,
    loadLesson,
    loadQuiz,
    clearError,
  };
}
