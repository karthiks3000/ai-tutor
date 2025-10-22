/**
 * Agent Core API client for communicating with tutor_agent
 * Supports both new payload-based and legacy prompt-based interfaces
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
      const session = await fetchAuthSession();
      const sub = session.identityId || session.userSub;
      
      if (sub && sub.length >= 33) {
        return sub;
      }
      
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:T.]/g, '').substring(0, 14);
      const uuidSuffix = crypto.randomUUID().substring(0, 8);
      return `tutor-session-${timestamp}-${uuidSuffix}`;
    } catch (error) {
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
      const uuidSuffix = crypto.randomUUID().substring(0, 8);
      return `tutor-session-${timestamp}-${uuidSuffix}`;
    }
  }

  private async getStudentId(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.userSub || session.identityId || null;
    } catch (error) {
      console.error('Failed to get student ID:', error);
      return null;
    }
  }

  async invoke(payload: any, jwtToken: string = ''): Promise<OrchestratorResponse> {
    try {
      const sessionId = await this.getSessionId();
      const studentId = await this.getStudentId();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': sessionId,
      };
      
      if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
      }
      
      // Support both payload structures and legacy prompts
      let body: any;
      if (typeof payload === 'string') {
        body = { prompt: payload };
      } else {
        body = { ...payload };
      }
      
      // Add student_id to all payloads
      if (studentId) {
        body.student_id = studentId;
      }
      
      console.log('🚀 AgentCore call:', typeof payload === 'string' ? 'prompt' : 'action');
      console.log('👤 Student ID:', studentId ? 'included' : 'from JWT only');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Agent request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.OrchestratorResponse) {
        return data.OrchestratorResponse as OrchestratorResponse;
      }
      
      return data as OrchestratorResponse;
    } catch (error) {
      console.error('Agent invocation error:', error);
      throw error;
    }
  }

  // New payload-based methods
  async completeDiagnostic(
    quizId: string,
    subject: string,
    questions: any[],
    evaluation: any,
    jwtToken: string = ''
  ): Promise<OrchestratorResponse> {
    return this.invoke({
      action: 'diagnostic_complete',
      data: { quiz_id: quizId, subject, questions, evaluation }
    }, jwtToken);
  }

  async requestDiagnostic(subject: string, jwtToken: string = ''): Promise<OrchestratorResponse> {
    return this.invoke({
      action: 'request_diagnostic',
      data: { subject }
    }, jwtToken);
  }

  async requestSection(previousPerformance?: any, jwtToken: string = ''): Promise<OrchestratorResponse> {
    return this.invoke({
      action: 'request_section',
      data: { previous_performance: previousPerformance }
    }, jwtToken);
  }

  async requestSectionQuiz(jwtToken: string = ''): Promise<OrchestratorResponse> {
    return this.invoke({
      action: 'request_section_quiz',
      data: {}
    }, jwtToken);
  }

  async completeSection(
    sectionNum: number,
    quizId: string,
    questions: any[],
    evaluation: any,
    jwtToken: string = ''
  ): Promise<OrchestratorResponse> {
    return this.invoke({
      action: 'section_complete',
      data: { section_number: sectionNum, quiz_id: quizId, questions, evaluation }
    }, jwtToken);
  }

  async completeLesson(subject: string, jwtToken: string = ''): Promise<OrchestratorResponse> {
    return this.invoke({
      action: 'complete_lesson',
      data: { subject }
    }, jwtToken);
  }

  // Legacy methods (for backwards compatibility)
  async startLearningSession(
    studentName: string,
    grade: number,
    interests: string[],
    isFirstTime: boolean = true
  ): Promise<OrchestratorResponse> {
    const prompt = `Start learning session for ${studentName}, grade ${grade}, interests: ${interests.join(', ')}`;
    return this.invoke(prompt);
  }

  async answerQuestion(
    questionId: string,
    studentAnswer: string | string[],
    questionData: any
  ): Promise<OrchestratorResponse> {
    const prompt = `Check answer for question ${questionId}: ${JSON.stringify(studentAnswer)}`;
    return this.invoke(prompt);
  }

  async getNextLesson(topic?: string, difficulty?: string): Promise<OrchestratorResponse> {
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
