/**
 * Short Answer Question Component
 */
import { useState } from 'react';
import { Question } from '../../types';

interface ShortAnswerQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
}

export default function ShortAnswerQuestion({ question, onAnswer }: ShortAnswerQuestionProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    if (answer.trim()) {
      onAnswer(answer);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card-3d p-6 animate-glow">
        <p className="text-xl font-semibold">📝 {question.question_text}</p>
      </div>

      <div className="card-3d p-6">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
          autoFocus
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">{answer.length} characters</p>
          {answer.length < 20 && answer.length > 0 && (
            <p className="text-xs text-amber-600">Try to write more!</p>
          )}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={answer.trim().length === 0}
        className="gradient-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Answer →
      </button>

      {question.hint && (
        <p className="text-center text-sm text-gray-500">
          💡 Hint: {question.hint}
        </p>
      )}
    </div>
  );
}
