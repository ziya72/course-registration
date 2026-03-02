import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, getErrorMessage } from '@/services/api';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id?: string;
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
      const response = await apiLoginUser({ email, password });
      
      // Store token
      localStorage.setItem(TOKEN_KEY, response.token);
      
      // Create user object
      const userData: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role || role,
        isLoggedIn: true,
      };
      
      // Store user data
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      
      return true;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setAuthError(errorMessage);
      console.error('Login error:', errorMessage);
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiLogoutUser();
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
