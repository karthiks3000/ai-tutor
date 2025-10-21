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
      avatar: 'from-purple-400 to-blue-500'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      avatar: 'from-green-400 to-emerald-500'
    },
    encouragement: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      avatar: 'from-yellow-400 to-orange-500'
    },
    quiz: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      avatar: 'from-blue-400 to-cyan-500'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div className="flex items-start gap-4 mb-6 animate-in fade-in slide-in-from-left duration-500">
      {/* Character Avatar - Placeholder for now, can be replaced with actual character later */}
      <div className={`flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br ${styles.avatar} flex items-center justify-center text-3xl shadow-lg transform hover:scale-105 transition-transform`}>
        🤖
      </div>
      
      {/* Speech Bubble */}
      <div className={`relative flex-1 ${styles.bg} border-2 ${styles.border} rounded-2xl rounded-tl-none p-4 shadow-md`}>
        {/* Speech bubble pointer */}
        <div 
          className={`absolute -left-2 top-0 w-4 h-4 ${styles.bg} border-l-2 border-t-2 ${styles.border} transform -rotate-45`}
        />
        
        {/* Message content */}
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {message}
        </div>
      </div>
    </div>
  );
}

export default TutorMessageBubble;
