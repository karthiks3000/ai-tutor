/**
 * TutorMessageBubble - Display personalized AI tutor messages in a speech bubble
 * 
 * This component creates an engaging, personal connection between the student
 * and AI tutor by displaying friendly, encouraging messages throughout the learning journey.
 */

interface TutorMessageBubbleProps {
  message: string;
  variant?: 'default' | 'success' | 'encouragement' | 'quiz';
}

export function TutorMessageBubble({ 
  message, 
  variant = 'default' 
}: TutorMessageBubbleProps) {
  // Color schemes for different message types
  const variantStyles = {
    default: {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      avatar: 'from-purple-400 to-blue-500',
      shadow: 'shadow-purple-200'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      avatar: 'from-green-400 to-emerald-500',
      shadow: 'shadow-green-200'
    },
    encouragement: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      avatar: 'from-yellow-400 to-orange-500',
      shadow: 'shadow-yellow-200'
    },
    quiz: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      avatar: 'from-blue-400 to-cyan-500',
      shadow: 'shadow-blue-200'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed bottom-8 right-8 z-40 max-w-sm animate-in slide-in-from-right fade-in duration-500">
      {/* Floating Container */}
      <div className="flex items-end gap-3">
        {/* Speech Bubble */}
        <div className={`relative ${styles.bg} border-2 ${styles.border} rounded-2xl rounded-br-none p-4 shadow-2xl ${styles.shadow}`}>
          {/* Speech bubble pointer (bottom-right) */}
          <div 
            className={`absolute -right-2 bottom-0 w-4 h-4 ${styles.bg} border-r-2 border-b-2 ${styles.border} transform rotate-45`}
          />
          
          {/* Message content */}
          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto pr-2">
            {message}
          </div>
        </div>

        {/* Character Avatar - Robot on the right */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br ${styles.avatar} flex items-center justify-center text-3xl shadow-lg transform hover:scale-110 transition-transform animate-bounce-subtle`}>
          🤖
        </div>
      </div>

      <style>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default TutorMessageBubble;
