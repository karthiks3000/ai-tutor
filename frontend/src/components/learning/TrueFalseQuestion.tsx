/**
 * True/False Question Component
 */
import { Question } from '../../types';

interface TrueFalseQuestionProps {
  question: Question;
  onAnswer: (answer: string) => void;
}

export default function TrueFalseQuestion({ question, onAnswer }: TrueFalseQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="card-3d p-6 animate-glow">
        <p className="text-xl font-semibold">📝 {question.question_text}</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => onAnswer('True')}
          className="card-3d p-8 hover:scale-105 hover:bg-green-50 hover:ring-4 hover:ring-green-500 transition-all"
        >
          <div className="text-6xl mb-2">✓</div>
          <div className="text-2xl font-bold">True</div>
        </button>

        <button
          onClick={() => onAnswer('False')}
          className="card-3d p-8 hover:scale-105 hover:bg-red-50 hover:ring-4 hover:ring-red-500 transition-all"
        >
          <div className="text-6xl mb-2">✗</div>
          <div className="text-2xl font-bold">False</div>
        </button>
      </div>

      {question.hint && (
        <p className="text-center text-sm text-gray-500">
          💡 Hint: {question.hint}
        </p>
      )}
    </div>
  );
}
