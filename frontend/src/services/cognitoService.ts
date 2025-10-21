/**
 * Cognito authentication service
 */
import { signUp, signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { SignUpData, SignInData, User } from '../types';

export class CognitoService {
  async signUp(data: SignUpData): Promise<{ isSignUpComplete: boolean; userId?: string }> {
    try {
      const { isSignUpComplete, userId } = await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            name: data.name,
          },
        },
      });

      return { isSignUpComplete, userId };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(data: SignInData): Promise<boolean> {
    try {
      const { isSignedIn } = await signIn({
        username: data.email,
        password: data.password,
      });

      return isSignedIn;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();

      return {
        id: user.userId,
        email: user.signInDetails?.loginId || '',
        name: user.username,
      };
    } catch (error) {
      return null;
    }
  }

  async getJwtToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      // Use accessToken for API authorization (not idToken)
      return session.tokens?.accessToken?.toString() || null;
    } catch (error) {
      console.error('Error getting JWT token:', error);
      return null;
    }
  }
}

export const cognitoService = new CognitoService();
