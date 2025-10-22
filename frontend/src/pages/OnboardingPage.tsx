import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentInterest, GradeLevel, INTEREST_DISPLAY_INFO } from '../types/constants';
import { useAuthStore } from '../stores/authStore';
import { useAgentApi } from '../hooks/useAgentApi';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const api = useAgentApi(); // Centralized API with auth
  const [grade, setGrade] = useState<GradeLevel | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<StudentInterest[]>([]);

  const toggleInterest = (interest: StudentInterest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (grade && selectedInterests.length > 0) {
      try {
        // Save onboarding data (grade + interests only, no subject)
        const response = await api.startLearningSession(
          user?.email || 'Student',
          grade,
          selectedInterests
        );
        
        if (response.success) {
          // Navigate to learning page where user will select subject
          navigate('/learn');
        } else {
          alert('Failed to save your profile. Please try again.');
        }
      } catch (error) {
        console.error('Failed to save profile:', error);
        alert('Unable to connect to server. Please check your connection.');
      }
    }
  };

  const interests = Object.values(StudentInterest);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
              style={{ width: `${grade ? '50%' : '0%'}` }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            Step {!grade ? '1' : '2'} of 2
          </p>
        </div>

        <h2 className="text-4xl font-bold text-center mb-12">🎯 Let's Personalize Your Learning</h2>

        {/* Grade Selection */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-center mb-6">What grade are you in?</h3>
          <div className="flex justify-center gap-6">
            {[GradeLevel.GRADE_6, GradeLevel.GRADE_7, GradeLevel.GRADE_8].map((g) => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`card-3d p-8 text-center transition-all ${
                  grade === g ? 'ring-4 ring-purple-500 scale-110' : ''
                }`}
              >
                <div className="text-4xl mb-2">{g === 6 ? '🎒' : g === 7 ? '📚' : '🎓'}</div>
                <div className="text-xl font-bold">{g}th</div>
              </button>
            ))}
          </div>
        </div>

        {/* Interest Selection */}
        {grade && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom duration-500">
          <h3 className="text-2xl font-semibold text-center mb-4">What are your interests?</h3>
          <p className="text-center text-gray-600 mb-6">(Choose as many as you like!)</p>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {interests.map((interest) => {
              const info = INTEREST_DISPLAY_INFO[interest];
              const isSelected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`card-3d p-4 text-center transition-all ${
                    isSelected ? 'ring-4 scale-105' : ''
                  }`}
                  style={{
                    boxShadow: isSelected ? `0 0 20px ${info.color}40` : undefined,
                    borderColor: isSelected ? info.color : undefined
                  }}
                >
                  <div className="text-3xl mb-2">{info.icon}</div>
                  <div className="text-sm font-semibold">{info.label}</div>
                </button>
              );
            })}
          </div>
          </div>
        )}

        {/* Submit Button */}
        {grade && selectedInterests.length > 0 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom duration-500">
            <button
              onClick={handleSubmit}
              disabled={!grade || selectedInterests.length === 0 || api.isLoading}
              className="gradient-button text-xl px-12 py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {api.isLoading ? 'Saving Your Profile...' : 'Continue to Learning →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
