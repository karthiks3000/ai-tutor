/**
 * Subject Selection View - Choose subject for learning session
 * Displayed at start of each learning journey
 */
import { Subject, SUBJECT_DISPLAY_INFO } from '../../types/constants';

interface SubjectSelectionViewProps {
  onSubjectSelect: (subject: Subject) => void;
}

export default function SubjectSelectionView({
  onSubjectSelect
}: SubjectSelectionViewProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 animate-in fade-in duration-500">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          What Would You Like to Learn Today?
        </h2>
        <p className="text-xl text-gray-600">
          Choose a subject to start your personalized learning journey
        </p>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {Object.values(Subject).map((subject) => {
          const info = SUBJECT_DISPLAY_INFO[subject];
          return (
            <button
              key={subject}
              onClick={() => onSubjectSelect(subject)}
              className="card-3d p-8 text-left hover:scale-105 transition-all duration-300 group"
              style={{
                borderLeft: `4px solid ${info.color}`
              }}
            >
              {/* Icon */}
              <div className="text-6xl mb-4 transition-transform group-hover:scale-110 duration-300">
                {info.icon}
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold mb-3 group-hover:text-purple-600 transition-colors">
                {info.displayName}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-4">
                {info.description}
              </p>
              
              {/* Skill Preview */}
              <div className="text-sm text-gray-500">
                {info.diagnosticFocuses.slice(0, 3).join(' • ')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="text-center text-gray-500 text-sm animate-in fade-in duration-700">
        <p>💡 You can explore different subjects anytime!</p>
        <p>Your progress in each subject is saved separately.</p>
      </div>
    </div>
  );
}
