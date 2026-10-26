import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cognitoService } from '../services/cognitoService';
import { useAuthStore } from '../stores/authStore';

export default function SignInPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Sign in with Cognito
      const isSignedIn = await cognitoService.signIn({
        email: formData.email,
        password: formData.password
      });

      if (isSignedIn) {
        // Get user info
        const user = await cognitoService.getCurrentUser();
        if (user) {
          setUser(user);
        }

        // Navigate to learning journey
        navigate('/learn');
      } else {
        setError('Sign in failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="card-3d p-8 max-w-md w-full">
        <button onClick={() => navigate('/')} className="text-gray-600 hover:text-gray-800 mb-4">← Back</button>
        <h2 className="text-3xl font-bold text-center mb-8">🎓 Welcome Back!</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <button 
            type="submit" 
            className="gradient-button w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing In...' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}
