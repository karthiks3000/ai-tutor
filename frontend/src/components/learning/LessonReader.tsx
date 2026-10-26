/**
 * Lesson Reader Component - E-reader style content display
 */
import { LessonContent } from '../../types';

interface LessonReaderProps {
  lesson: LessonContent;
}

export default function LessonReader({ lesson }: LessonReaderProps) {
  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="card-3d p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{lesson.title}</h2>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>📚 {lesson.topic}</span>
              <span>⏱️ {lesson.estimated_reading_time_minutes} min read</span>
              <span>📊 {lesson.difficulty_level}</span>
            </div>
          </div>
        </div>

        {/* Learning Objectives */}
        {lesson.learning_objectives.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="font-semibold text-purple-900 mb-2">🎯 What you'll learn:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
              {lesson.learning_objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Lesson Content */}
      <div className="card-3d p-8">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      </div>

      {/* Key Vocabulary */}
      {lesson.key_vocabulary.length > 0 && (
        <div className="card-3d p-6">
          <h3 className="text-xl font-bold mb-4">📖 Key Vocabulary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.key_vocabulary.map((vocab, index) => (
              <div key={index} className="bg-blue-50 rounded-lg p-4">
                <p className="font-bold text-blue-900">{vocab.word}</p>
                <p className="text-sm text-blue-800 mt-1">{vocab.definition}</p>
                <p className="text-xs text-blue-600 mt-2 italic">
                  "{vocab.example_sentence}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
