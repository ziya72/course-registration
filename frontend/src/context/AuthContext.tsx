import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, getErrorMessage } from '@/services/api';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  enrollmentNo?: string;
  facultyNo?: string;
  name: string;
  role: UserRole;
  email: string;
  isLoggedIn: boolean;
}

export interface StudentAcademicData {
  enrollmentNo: string;
  branch: string;
  admissionYear: number;
  cpi: number;
  totalCredits: number;
  currentSemester: number;
}

interface AuthContextType {
  user: User | null;
  studentData: StudentAcademicData | null;
  isRegistrationEnabled: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  setIsRegistrationEnabled: (enabled: boolean) => void;
  setStudentData: (data: StudentAcademicData | null) => void;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage keys
const TOKEN_KEY = 'authToken';
const USER_KEY = 'userData';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<StudentAcademicData | null>(null);
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setUser({ ...parsedUser, isLoggedIn: true });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const checkAuth = (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && !!user?.isLoggedIn;
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const response = await apiLoginUser({ email, password, role });
      
      // Debug: Log the actual response structure
      console.log('🔍 Backend response:', response);
      console.log('🔍 Response user:', response.user);
      
      // Comprehensive response validation
      if (!response) {
        throw new Error('No response received from server. Please check your internet connection.');
      }
      
      if (typeof response !== 'object') {
        throw new Error('Invalid response format from server.');
      }
      
      if (!response.token) {
        throw new Error('Authentication failed: No token received.');
      }
      
      if (!response.user) {
        throw new Error('Authentication failed: No user data received.');
      }
      
      // Store token
      localStorage.setItem(TOKEN_KEY, response.token);
      
      // Create user object combining Mohit's backend mapping with comprehensive fallbacks
      const userRole = (response.user && response.user.role) ? response.user.role : role;
      const userId = (response.user && response.user.id) ? response.user.id : '';
      const userName = (response.user && response.user.name) ? response.user.name : '';
      const userEmail = (response.user && response.user.email) ? response.user.email : email;
      
      const userData: User = {
        enrollmentNo: userRole === 'student' ? userId : undefined, // Backend sends 'id' for enrollment
        facultyNo: userRole === 'teacher' || userRole === 'admin' ? userId : undefined,
        name: userName,
        email: userEmail,
        role: userRole,
        isLoggedIn: true,
      };
      
      // Store user data
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      
      return true;
    } catch (error: unknown) {
      console.log('🔍 Full error object:', error);
      console.log('🔍 Error response:', (error as any)?.response);
      console.log('🔍 Error data:', (error as any)?.response?.data);
      const errorMessage = getErrorMessage(error);
      console.log('🔍 Extracted message:', errorMessage);
      setAuthError(errorMessage);
      console.error('Login error:', error);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const email = user?.email;
      await apiLogoutUser(email);
    } catch (error) {
      console.warn('Server logout failed:', error);
    } finally {
      // Always clear local storage and state
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setStudentData(null);
      setAuthError(null);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        studentData, 
        isRegistrationEnabled, 
        isLoading,
        isAuthenticating,
        authError,
        setIsRegistrationEnabled, 
        setStudentData,
        login, 
        logout,
        checkAuth,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
