/**
 * Quiz Engine - Batch submission quiz flow with client-side evaluation
 * 
 * Collects all answers before submission, evaluates instantly client-side,
 * then displays results while background loading next adaptive lesson.
 */
import { useState } from 'react';
import { Question, Quiz, LessonContent } from '../../types';
import { QuestionType } from '../../types/constants';
import { evaluateQuiz, areAllQuestionsAnswered } from '../../utils/quizEvaluator';
import QuizResultsReview from './QuizResultsReview';
import FillInBlankQuestion from './FillInBlankQuestion';
import MCQQuestion from './MCQQuestion';
import TrueFalseQuestion from './TrueFalseQuestion';
import WordMatchQuestion from './WordMatchQuestion';

interface QuizEngineProps {
  quiz: Quiz;
  onComplete: () => void;
  onNextLesson: (lesson: LessonContent, tutorMessage: string) => void;
}

export default function QuizEngine({ quiz, onComplete, onNextLesson }: QuizEngineProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState<(string | string[] | null)[]>(
    new Array(quiz.questions.length).fill(null)
  );
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const allAnswered = areAllQuestionsAnswered(studentAnswers, quiz.questions.length);

  // Handle answer for current question
  const handleAnswer = (answer: string | string[]) => {
    const newAnswers = [...studentAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setStudentAnswers(newAnswers);
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit quiz and evaluate
  const handleSubmit = () => {
    // Instant client-side evaluation
    const evalResult = evaluateQuiz(
      quiz.questions,
      studentAnswers as (string | string[])[]
    );
    
    setEvaluation(evalResult);
    setQuizSubmitted(true);
  };

  // Handle transition to next lesson - pass through to parent
  const handleNextLesson = (lesson: LessonContent, tutorMessage: string) => {
    onNextLesson(lesson, tutorMessage);
    onComplete();
  };

  // If quiz submitted, show results review
  if (quizSubmitted && evaluation) {
    return (
      <QuizResultsReview
        quizId={quiz.quiz_id}
        quizType={quiz.quiz_type}
        topic={quiz.topic}
        questions={quiz.questions}
        studentAnswers={studentAnswers as (string | string[])[]}
        evaluation={evaluation}
        onNextLesson={handleNextLesson}
      />
    );
  }

  // Show current question
  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div>
        <div className="flex gap-2 mb-2">
          {quiz.questions.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-all ${
                index < currentQuestionIndex
                  ? 'bg-green-600'
                  : index === currentQuestionIndex
                  ? 'bg-purple-600'
                  : studentAnswers[index] !== null
                  ? 'bg-blue-400'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </p>
      </div>

      {/* Question Component */}
      <div className="min-h-[300px]" key={currentQuestionIndex}>
        {currentQuestion.question_type === QuestionType.MCSA && (
          <MCQQuestion 
            question={currentQuestion} 
            onAnswer={handleAnswer}
            isMultiple={false}
          />
        )}
        {currentQuestion.question_type === QuestionType.MCMA && (
          <MCQQuestion 
            question={currentQuestion} 
            onAnswer={handleAnswer}
            isMultiple={true}
          />
        )}
        {currentQuestion.question_type === QuestionType.TRUE_FALSE && (
          <TrueFalseQuestion 
            question={currentQuestion} 
            onAnswer={handleAnswer}
          />
        )}
        {currentQuestion.question_type === QuestionType.FILL_IN_BLANK && (
          <FillInBlankQuestion 
            question={currentQuestion} 
            onAnswer={handleAnswer}
          />
        )}
        {currentQuestion.question_type === QuestionType.WORD_MATCH && (
          <WordMatchQuestion 
            question={currentQuestion} 
            onAnswer={handleAnswer}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-4 pt-4 border-t">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {/* Answer Status */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {studentAnswers.filter(a => a !== null).length} of {quiz.questions.length} answered
          </p>
        </div>

        {/* Next/Submit Button */}
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="gradient-button px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={studentAnswers[currentQuestionIndex] === null}
            className="gradient-button px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        )}
      </div>

      {/* Helper Text */}
      {!allAnswered && (
        <div className="text-center text-sm text-gray-500 mt-4">
          💡 Tip: Answer all questions to submit the quiz
        </div>
      )}
    </div>
  );
}
