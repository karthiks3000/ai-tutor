/**
 * Diagnostic Results View - Display quiz results while plan generates
 * Shows immediate feedback on diagnostic performance
 */
import { Question } from '../../types';

interface DiagnosticResultsViewProps {
  evaluation: any;
  questions: Question[];
  isPlanReady: boolean;
  onContinue: () => void;
}

export default function DiagnosticResultsView({
  evaluation,
  questions,
  isPlanReady,
  onContinue
}: DiagnosticResultsViewProps) {
  const scorePercentage = Math.round(evaluation.scorePercentage || 0);
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Score Summary */}
      <div className="text-center mb-8 animate-in zoom-in duration-500">
        <div className="text-6xl mb-4">
          {scorePercentage >= 80 ? '🎉' : scorePercentage >= 60 ? '👍' : '💪'}
        </div>
        <h2 className="text-4xl font-bold mb-4">
          {scorePercentage >= 80 ? 'Excellent Work!' : scorePercentage >= 60 ? 'Good Job!' : 'Keep Going!'}
        </h2>
        <div className="text-6xl font-bold text-blue-600 mb-2">
          {scorePercentage}%
        </div>
        <p className="text-xl text-gray-600">
          {evaluation.correctCount} out of {evaluation.totalQuestions} correct
        </p>
      </div>

      {/* Question-by-Question Results */}
      <div className="space-y-4 mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Review Your Answers:</h3>
        
        {evaluation.feedback.map((fb: any, idx: number) => {
          const question = questions[idx];
          
          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border-2 transition-all ${
                fb.isCorrect 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl flex-shrink-0">
                  {fb.isCorrect ? '✅' : '❌'}
                </span>
                
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 mb-2">
                    Question {idx + 1}: {question.question_text}
                  </p>
                  
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Your answer:</span>{' '}
                      <span className={fb.isCorrect ? 'text-green-700' : 'text-red-700'}>
                        {Array.isArray(fb.studentAnswer) 
                          ? fb.studentAnswer.join(', ') 
                          : fb.studentAnswer}
                      </span>
                    </p>
                    
                    {!fb.isCorrect && (
                      <p>
                        <span className="font-medium">Correct answer:</span>{' '}
                        <span className="text-green-700 font-semibold">
                          {Array.isArray(fb.correctAnswer) 
                            ? fb.correctAnswer.join(', ') 
                            : fb.correctAnswer}
                        </span>
                      </p>
                    )}
                    
                    <div className="mt-3 p-3 bg-white rounded border">
                      <p className="text-gray-700">
                        <span className="font-medium">💡 </span>
                        {question.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading / Continue Button */}
      <div className="text-center">
        {!isPlanReady ? (
          <div className="card-3d p-8 animate-in fade-in">
            <div className="animate-spin text-5xl mb-4">⏳</div>
            <p className="text-2xl font-bold text-gray-800 mb-2">
              Creating Your Personalized Learning Plan
            </p>
            <p className="text-gray-600">
              Analyzing your results and building your 3-section journey...
            </p>
          </div>
        ) : (
          <button
            onClick={onContinue}
            className="gradient-button text-xl px-12 py-4 w-full animate-in slide-in-from-bottom duration-500"
          >
            Start Your Learning Journey →
          </button>
        )}
      </div>

      {isPlanReady && (
        <p className="text-center mt-4 text-green-600 font-medium animate-pulse">
          ✨ Your personalized plan is ready!
        </p>
      )}
    </div>
  );
}
