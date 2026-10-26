/**
 * Fill in the Blank Question Component with Drag & Drop
 */
import { useState } from 'react';
import { Question } from '../../types';

interface FillInBlankQuestionProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
}

export default function FillInBlankQuestion({ question, onAnswer }: FillInBlankQuestionProps) {
  const numBlanks = question.blank_positions?.length || 1;
  const [filledBlanks, setFilledBlanks] = useState<(string | null)[]>(Array(numBlanks).fill(null));
  const [wordBank, setWordBank] = useState<string[]>(question.options || []);

  const handleWordClick = (word: string, index: number) => {
    // Find first empty blank
    const emptyIndex = filledBlanks.findIndex(b => b === null);
    if (emptyIndex !== -1) {
      const newBlanks = [...filledBlanks];
      newBlanks[emptyIndex] = word;
      setFilledBlanks(newBlanks);
      
      // Remove word from bank
      setWordBank(prev => prev.filter((_, i) => i !== index));
      
      // Check if all blanks are filled and notify parent immediately
      const allFilled = newBlanks.every(b => b !== null);
      if (allFilled) {
        onAnswer(newBlanks.filter((b): b is string => b !== null));
      }
    }
  };

  const handleRemoveWord = (blankIndex: number) => {
    const word = filledBlanks[blankIndex];
    if (word) {
      // Return word to bank
      setWordBank(prev => [...prev, word]);
      
      // Clear blank
      const newBlanks = [...filledBlanks];
      newBlanks[blankIndex] = null;
      setFilledBlanks(newBlanks);
      
      // Notify parent that answer is now incomplete (disables Next button)
      onAnswer([]);
    }
  };

  const allFilled = filledBlanks.every(b => b !== null);

  return (
    <div className="space-y-6">
      <div className="card-3d p-6 animate-glow">
        <p className="text-xl font-semibold mb-4">Complete the sentence:</p>
      </div>

      {/* Sentence with blanks */}
      <div className="card-3d p-6">
        <div className="text-lg leading-relaxed">
          {question.sentence_template?.split('{blank}').map((part, index, array) => (
            <span key={index}>
              {part}
              {index < array.length - 1 && (
                <span className="inline-flex items-center mx-2">
                  {filledBlanks[index] ? (
                    <button
                      onClick={() => handleRemoveWord(index)}
                      className="px-4 py-2 bg-purple-100 border-2 border-purple-500 rounded-lg font-semibold hover:bg-purple-200 transition-all"
                    >
                      {filledBlanks[index]}
                      <span className="ml-2 text-red-500">×</span>
                    </button>
                  ) : (
                    <span className="px-8 py-2 border-2 border-dashed border-gray-300 rounded-lg inline-block animate-pulse">
                      ?
                    </span>
                  )}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Word Bank */}
      {wordBank.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Word Bank (Click to fill):</p>
          <div className="flex flex-wrap gap-3">
            {wordBank.map((word, index) => (
              <button
                key={index}
                onClick={() => handleWordClick(word, index)}
                className="card-3d px-6 py-3 hover:scale-105 hover:bg-blue-50 transition-all"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {!allFilled && (
        <p className="text-center text-sm text-gray-500">
          💡 Fill all blanks to continue
        </p>
      )}
    </div>
  );
}
