/**
 * Multiple Choice Question Component (Single/Multiple Answer)
 */
import { useState } from 'react';
import { Question } from '../../types';

interface MCQQuestionProps {
  question: Question;
  onAnswer: (answer: string | string[]) => void;
  isMultiple: boolean;
}

export default function MCQQuestion({ question, onAnswer, isMultiple }: MCQQuestionProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleOptionClick = (option: string) => {
    let newSelected: string[];
    
    if (isMultiple) {
      // MCMA - toggle selection
      newSelected = selected.includes(option)
        ? selected.filter(o => o !== option)
        : [...selected, option];
      setSelected(newSelected);
      
      // Immediately notify parent of answer change
      onAnswer(newSelected);
    } else {
      // MCSA - single selection
      newSelected = [option];
      setSelected(newSelected);
      
      // Immediately notify parent of answer (enables Next button)
      onAnswer(option);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <p className="text-xl font-semibold mb-1">📝 {question.question_text}</p>
        {isMultiple && (
          <p className="text-sm text-gray-500">Select ALL that apply</p>
        )}
      </div>

      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleOptionClick(option)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected 
                  ? 'bg-purple-50 border-purple-500 shadow-lg' 
                  : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex-1">
                  <span className="font-semibold mr-2 text-purple-600">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </span>
                {isSelected && <span className="text-2xl">✓</span>}
              </div>
            </button>
          );
        })}
      </div>

      {isMultiple && (
        <p className="text-center text-sm text-gray-600">
          {selected.length > 0 
            ? `${selected.length} of ${question.options?.length} selected` 
            : 'Select all correct answers'}
        </p>
      )}

      {question.hint && (
        <p className="text-center text-sm text-gray-500">
          💡 Hint: {question.hint}
        </p>
      )}
    </div>
  );
}
