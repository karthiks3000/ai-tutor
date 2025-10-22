/**
 * Centralized hook for AgentCore API calls - Refactored for payload-based architecture
 */
import { useState, useCallback, useRef } from 'react';
import { agentClient } from '../services/agentCoreClient';
import { cognitoService } from '../services/cognitoService';
import { OrchestratorResponse } from '../types';

export function useAgentApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

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

  // === NEW REFACTORED METHODS (Payload-based) ===
  
  const loadDiagnosticQuiz = useCallback(async (subject: string): Promise<OrchestratorResponse> => {
    const token = await getAuthToken();
    return agentClient.requestDiagnostic(subject, token);
  }, [getAuthToken]);

  const completeDiagnostic = useCallback(async (
    quizId: string,
    subject: string,
    questions: any[],
    evaluation: any
  ): Promise<OrchestratorResponse> => {
    const token = await getAuthToken();
    return agentClient.completeDiagnostic(quizId, subject, questions, evaluation, token);
  }, [getAuthToken]);

  const loadNextSection = useCallback(async (): Promise<OrchestratorResponse> => {
    const token = await getAuthToken();
    // Backend queries DynamoDB for previous section performance automatically
    return agentClient.requestSection(undefined, token);
  }, [getAuthToken]);

  const loadSectionQuiz = useCallback(async (): Promise<OrchestratorResponse> => {
    const token = await getAuthToken();
    return agentClient.requestSectionQuiz(token);
  }, [getAuthToken]);

  const completeSection = useCallback(async (
    sectionNum: number,
    quizId: string,
    questions: any[],
    evaluation: any
  ): Promise<OrchestratorResponse> => {
    const token = await getAuthToken();
    return agentClient.completeSection(sectionNum, quizId, questions, evaluation, token);
  }, [getAuthToken]);

  const completeLesson = useCallback(async (subject: string): Promise<OrchestratorResponse> => {
    const token = await getAuthToken();
    return agentClient.completeLesson(subject, token);
  }, [getAuthToken]);

  // === REFACTORED METHODS ===
  
  const startLearningSession = useCallback(async (
    studentName: string,
    grade: number,
    interests: string[]
  ): Promise<OrchestratorResponse> => {
    const token = await getAuthToken();
    return agentClient.invoke({
      action: 'save_onboarding',
      data: { grade, interests }
    }, token);
  }, [getAuthToken]);

  const submitAnswer = useCallback(async (
    questionId: string,
    answer: string | string[],
    questionData: any
  ): Promise<OrchestratorResponse> => {
    const prompt = `Check answer for question ${questionId}: "${JSON.stringify(answer)}"`;
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
    
    // Refactored payload-based methods
    loadDiagnosticQuiz,
    completeDiagnostic,
    loadNextSection,
    loadSectionQuiz,
    completeSection,
    completeLesson,
    
    // Legacy prompt-based methods
    invoke,
    startLearningSession,
    submitAnswer,
    loadLesson,
    loadQuiz,
    
    clearError,
  };
}
