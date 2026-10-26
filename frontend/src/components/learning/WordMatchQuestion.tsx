/**
 * Word Match Question Component
 */
import { useState } from 'react';
import { Question } from '../../types';

interface WordMatchQuestionProps {
  question: Question;
  onAnswer: (answer: string[]) => void;
}

export default function WordMatchQuestion({ question, onAnswer }: WordMatchQuestionProps) {
  const [matches, setMatches] = useState<Map<string, string>>(new Map());
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const words = question.word_pairs?.map(p => p.word) || [];
  const definitions = question.word_pairs?.map(p => p.definition) || [];

  const handleWordClick = (word: string) => {
    if (selectedWord === word) {
      setSelectedWord(null);
    } else {
      setSelectedWord(word);
    }
  };

  const handleDefinitionClick = (definition: string) => {
    if (selectedWord) {
      // Create new match
      const newMatches = new Map(matches);
      newMatches.set(selectedWord, definition);
      setMatches(newMatches);
      setSelectedWord(null);
      
      // Check if all words matched and notify parent immediately
      const allMatched = newMatches.size === words.length;
      if (allMatched) {
        const matchArray = Array.from(newMatches.entries()).map(([word, def]) => {
          const wordIndex = words.indexOf(word);
          const defIndex = definitions.indexOf(def);
          return `${word}-${defIndex}`;
        });
        onAnswer(matchArray);
      }
    }
  };

  const handleRemoveMatch = (word: string) => {
    const newMatches = new Map(matches);
    newMatches.delete(word);
    setMatches(newMatches);
    
    // Notify parent that answer is now incomplete (disables Next button)
    onAnswer([]);
  };

  const allMatched = matches.size === words.length;

  return (
    <div className="space-y-6">
      <div className="card-3d p-6 animate-glow">
        <p className="text-xl font-semibold">🔗 {question.question_text}</p>
        <p className="text-sm text-gray-500 mt-2">Click a word, then click its definition</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Words Column */}
        <div className="space-y-3">
          <p className="font-semibold text-gray-700">Words:</p>
          {words.map((word) => {
            const isMatched = matches.has(word);
            const isSelected = selectedWord === word;
            return (
              <button
                key={word}
                onClick={() => isMatched ? handleRemoveMatch(word) : handleWordClick(word)}
                className={`card-3d p-4 w-full text-left transition-all ${
                  isSelected ? 'ring-4 ring-blue-500 scale-105' : ''
                } ${isMatched ? 'bg-green-50 ring-2 ring-green-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{word}</span>
                  {isMatched && <span className="text-green-600 text-xl">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Definitions Column */}
        <div className="space-y-3">
          <p className="font-semibold text-gray-700">Definitions:</p>
          {definitions.map((def, index) => {
            const matchedWord = Array.from(matches.entries()).find(([_, d]) => d === def)?.[0];
            return (
              <button
                key={index}
                onClick={() => !matchedWord && handleDefinitionClick(def)}
                disabled={!!matchedWord}
                className={`card-3d p-4 w-full text-left transition-all ${
                  matchedWord ? 'bg-green-50 ring-2 ring-green-500' : 'hover:bg-blue-50'
                }`}
              >
                <div className="text-sm">
                  {def}
                  {matchedWord && (
                    <span className="block text-xs text-green-600 mt-1">
                      Matched with: {matchedWord}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-sm text-gray-600">
        {allMatched 
          ? '✅ All words matched!' 
          : `${matches.size} of ${words.length} matched - Keep going!`}
      </p>
    </div>
  );
}
