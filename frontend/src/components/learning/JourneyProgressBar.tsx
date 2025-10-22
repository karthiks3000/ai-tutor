/**
 * Journey Progress Bar - Visual indicator of section progress
 */

interface JourneyProgressBarProps {
  currentSection: number;
  totalSections: number;
  completedSections: number[];
}

export default function JourneyProgressBar({
  currentSection,
  totalSections,
  completedSections
}: JourneyProgressBarProps) {
  const sections = Array.from({ length: totalSections }, (_, i) => i + 1);
  const progressPercentage = ((currentSection) / totalSections) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">
          Learning Journey Progress
        </h3>
        <span className="text-sm text-gray-600">
          Section {currentSection} of {totalSections}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        {/* Background Track */}
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Section Markers */}
        <div className="flex justify-between mt-4">
          {sections.map((sectionNum) => {
            const isCompleted = completedSections.includes(sectionNum);
            const isCurrent = sectionNum === currentSection;
            const isPending = sectionNum > currentSection;

            return (
              <div key={sectionNum} className="flex flex-col items-center gap-2">
                {/* Marker Circle */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                    isCompleted
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white scale-110'
                      : isCurrent
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-125 animate-pulse'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {isCompleted ? '✓' : sectionNum}
                </div>

                {/* Label */}
                <span
                  className={`text-xs font-medium ${
                    isCompleted
                      ? 'text-green-600'
                      : isCurrent
                      ? 'text-purple-600'
                      : 'text-gray-400'
                  }`}
                >
                  {isCompleted ? 'Done' : isCurrent ? 'Current' : isPending ? 'Next' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Percentage Display */}
      <div className="text-center mt-4">
        <span className="text-sm text-gray-600">
          {progressPercentage.toFixed(0)}% Complete
        </span>
      </div>
    </div>
  );
}
