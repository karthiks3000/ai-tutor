/**
 * Authentication types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  grade?: number;
  interests?: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}
