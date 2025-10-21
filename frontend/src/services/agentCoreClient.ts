/**
 * Agent Core API client for communicating with tutor_agent
 */
import env from '../config/environment';
import { OrchestratorResponse } from '../types';
import { fetchAuthSession } from 'aws-amplify/auth';

export class AgentCoreClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.agentCoreUrl;
  }

  private async getSessionId(): Promise<string> {
    try {
      // Use Cognito's user sub (unique identifier) as session ID
      const session = await fetchAuthSession();
      const sub = session.identityId || session.userSub;
      
      if (sub && sub.length >= 33) {
        return sub;
      }
      
      // Fallback: generate session ID with at least 33 characters
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:T.]/g, '').substring(0, 14);
      const uuidSuffix = crypto.randomUUID().substring(0, 8);
      return `tutor-session-${timestamp}-${uuidSuffix}`;
    } catch (error) {
      // Fallback if no session
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
      const uuidSuffix = crypto.randomUUID().substring(0, 8);
      return `tutor-session-${timestamp}-${uuidSuffix}`;
    }
  }

  async invoke(prompt: string, jwtToken: string = ''): Promise<OrchestratorResponse> {
    try {
      // Get session ID from Cognito
      const sessionId = await this.getSessionId();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': sessionId,
      };
      
      // Always include Authorization header if token provided
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }
      
      console.log('🚀 Calling AgentCore:', this.baseUrl);
      console.log('🔑 Auth token present:', !!jwtToken);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Unwrap if backend returns with OrchestratorResponse wrapper
      if (data.OrchestratorResponse) {
        return data.OrchestratorResponse as OrchestratorResponse;
      }
      
      return data as OrchestratorResponse;
    } catch (error) {
      console.error('Agent invocation error:', error);
      throw error;
    }
  }

  async startLearningSession(
    studentName: string,
    grade: number,
    interests: string[],
    isFirstTime: boolean = true
  ): Promise<OrchestratorResponse> {
    const prompt = `Start learning session for ${studentName}, grade ${grade}, interests: ${interests.join(', ')}, first_time: ${isFirstTime}`;
    return this.invoke(prompt);
  }

  async answerQuestion(
    questionId: string,
    studentAnswer: string | string[],
    questionData: any
  ): Promise<OrchestratorResponse> {
    const prompt = `Check answer for question ${questionId}: student answered "${JSON.stringify(studentAnswer)}"`;
    return this.invoke(prompt);
  }

  async getNextLesson(
    topic?: string,
    difficulty?: string
  ): Promise<OrchestratorResponse> {
    const prompt = topic
      ? `Present lesson on ${topic} at ${difficulty || 'intermediate'} level`
      : 'Present next recommended lesson';
    return this.invoke(prompt);
  }

  async requestQuiz(
    quizType: string,
    topic: string,
    numQuestions: number = 5
  ): Promise<OrchestratorResponse> {
    const prompt = `Administer ${quizType} on ${topic} with ${numQuestions} questions`;
    return this.invoke(prompt);
  }
}

export const agentClient = new AgentCoreClient();
