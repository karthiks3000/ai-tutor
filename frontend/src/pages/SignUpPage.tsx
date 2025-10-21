import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cognitoService } from '../services/cognitoService';
import { useAuthStore } from '../stores/authStore';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Sign up with Cognito
      const { isSignUpComplete } = await cognitoService.signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });

      if (!isSignUpComplete) {
        // Need email verification
        setPendingEmail(formData.email);
        setShowVerification(true);
      } else {
        // No verification needed - sign in directly
        await cognitoService.signIn({
          email: formData.email,
          password: formData.password
        });
        
        const user = await cognitoService.getCurrentUser();
        if (user) {
          setUser(user);
        }
        
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Confirm sign up with verification code
      await confirmSignUp({
        username: pendingEmail,
        confirmationCode: verificationCode
      });
      
      // Auto sign in after verification
      await cognitoService.signIn({
        email: pendingEmail,
        password: formData.password
      });
      
      const user = await cognitoService.getCurrentUser();
      if (user) {
        setUser(user);
      }
      
      // Navigate to onboarding
      navigate('/onboarding');
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({ username: pendingEmail });
      setError(null);
      alert('Verification code resent! Check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  // Show verification form
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="card-3d p-8 max-w-md w-full">
          <h2 className="text-3xl font-bold text-center mb-4">📧 Verify Your Email</h2>
          <p className="text-gray-600 text-center mb-8">
            We sent a verification code to {pendingEmail}
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleVerification} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="gradient-button w-full"
              disabled={isSubmitting || verificationCode.length !== 6}
            >
              {isSubmitting ? 'Verifying...' : '✅ Verify Email'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-purple-600 hover:text-purple-700 text-sm"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show sign up form
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="card-3d p-8 max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-800 mb-4"
        >
          ← Back
        </button>
        
        <h2 className="text-3xl font-bold text-center mb-8">🎓 Create Your Account</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">At least 8 characters, one uppercase, one number</p>
          </div>
          
          <button 
            type="submit" 
            className="gradient-button w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : '🚀 Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
