/**
 * Client-Side Quiz Evaluator
 * 
 * Instantly evaluates quiz answers without API calls for immediate feedback.
 * Supports all 5 question types: MCSA, MCMA, TRUE_FALSE, FILL_IN_BLANK, WORD_MATCH
 */

import { Question } from '../types/learning';

export interface QuizFeedback {
  questionId: string;
  isCorrect: boolean;
  studentAnswer: string | string[];
  correctAnswer: string | string[];
  explanation: string;
}

export interface QuizEvaluation {
  isCorrect: boolean[];
  correctCount: number;
  totalQuestions: number;
  scorePercentage: number;
  xpEarned: number;
  feedback: QuizFeedback[];
}

/**
 * Compare student answer with correct answer based on question type
 */
export function compareAnswers(
  studentAns: string | string[],
  correctAns: string | string[],
  questionType: string
): boolean {
  switch (questionType) {
    case 'mcma':
      // Multiple choice multiple answer - compare as sets
      if (!Array.isArray(studentAns) || !Array.isArray(correctAns)) {
        return false;
      }
      const studentSet = new Set(studentAns.map(a => a.trim().toLowerCase()));
      const correctSet = new Set(correctAns.map(a => a.trim().toLowerCase()));
      
      if (studentSet.size !== correctSet.size) {
        return false;
      }
      
      return [...studentSet].every(ans => correctSet.has(ans));
    
    case 'fill_in_blank':
      // Array of answers - must match in order
      if (!Array.isArray(studentAns) || !Array.isArray(correctAns)) {
        return false;
      }
      if (studentAns.length !== correctAns.length) {
        return false;
      }
      return studentAns.every((ans, idx) => 
        ans.trim().toLowerCase() === correctAns[idx].trim().toLowerCase()
      );
    
    case 'word_match':
      // Array of encoded matches like ["word1-0", "word2-1"]
      if (!Array.isArray(studentAns) || !Array.isArray(correctAns)) {
        return false;
      }
      // Sort both arrays and compare as JSON strings
      const sortedStudent = [...studentAns].sort();
      const sortedCorrect = [...correctAns].sort();
      return JSON.stringify(sortedStudent) === JSON.stringify(sortedCorrect);
    
    case 'mcsa':
    case 'true_false':
    default:
      // Single string comparison - case insensitive
      return String(studentAns).trim().toLowerCase() === 
             String(correctAns).trim().toLowerCase();
  }
}

/**
 * Evaluate an entire quiz and calculate results
 */
export function evaluateQuiz(
  questions: Question[],
  studentAnswers: (string | string[])[]
): QuizEvaluation {
  // Generate feedback for each question
  const feedback: QuizFeedback[] = questions.map((question, idx) => {
    const studentAns = studentAnswers[idx];
    const isCorrect = compareAnswers(
      studentAns,
      question.correct_answer,
      question.question_type
    );
    
    return {
      questionId: question.question_id,
      isCorrect,
      studentAnswer: studentAns,
      correctAnswer: question.correct_answer,
      explanation: question.explanation
    };
  });
  
  // Calculate statistics
  const correctCount = feedback.filter(f => f.isCorrect).length;
  const totalQuestions = questions.length;
  const scorePercentage = (correctCount / totalQuestions) * 100;
  
  // Calculate XP earned
  // Base: 10 XP per correct answer
  // Bonus: 50 XP for 90%+, 25 XP for 80%+
  const baseXP = correctCount * 10;
  const bonusXP = scorePercentage >= 90 ? 50 : scorePercentage >= 80 ? 25 : 0;
  const xpEarned = baseXP + bonusXP;
  
  return {
    isCorrect: feedback.map(f => f.isCorrect),
    correctCount,
    totalQuestions,
    scorePercentage,
    xpEarned,
    feedback
  };
}

/**
 * Helper to validate if an answer has been provided
 */
export function isAnswerProvided(answer: string | string[] | null | undefined): boolean {
  if (answer === null || answer === undefined) {
    return false;
  }
  
  if (Array.isArray(answer)) {
    return answer.length > 0 && answer.every(a => a !== null && a !== undefined && a.trim() !== '');
  }
  
  return answer.trim() !== '';
}

/**
 * Helper to check if all questions have been answered
 */
export function areAllQuestionsAnswered(
  answers: (string | string[] | null | undefined)[],
  totalQuestions: number
): boolean {
  if (answers.length !== totalQuestions) {
    return false;
  }
  
  return answers.every(answer => isAnswerProvided(answer));
}
