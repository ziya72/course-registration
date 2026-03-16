import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { processApiResponse, validateEncryptionConfig, testEncryptionSetup, testEncrypt, testActualData } from '../utils/encryption';

// =============================================================================
// API CONFIGURATION
// =============================================================================
// Backend API base URL from environment variable
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Debug: Log the base URL to console
console.log('🔧 API Base URL:', BASE_URL);
console.log('🔧 Environment:', import.meta.env.MODE);
console.log('🔧 VITE_API_BASE_URL from env:', import.meta.env.VITE_API_BASE_URL);

// Validate encryption configuration
if (!validateEncryptionConfig()) {
  console.warn('⚠️ Invalid encryption configuration. Check VITE_ENCRYPTION_KEY and VITE_ENCRYPTION_IV');
}

// Test encryption setup
testEncryptionSetup();

// Test with actual encrypted data from login response
if (import.meta.env.VITE_ENABLE_ENCRYPTION === 'true') {
  testActualData();
}

// =============================================================================
// AXIOS INSTANCE
// =============================================================================
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds for course registration (handles multiple validations)
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// REQUEST INTERCEPTOR - Automatically attach token
// =============================================================================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CRITICAL: Don't set Content-Type for FormData
    // The browser will set it automatically with the boundary
    if (config.data instanceof FormData) {
      // Remove Content-Type to let browser set it with boundary
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// =============================================================================
// RESPONSE INTERCEPTOR - Handle common errors and decrypt responses
// =============================================================================
api.interceptors.response.use(
  (response) => {
    try {
      // Process response data (decrypt if encrypted)
      response.data = processApiResponse(response.data);
      return response;
    } catch (error) {
      console.error('❌ Response processing error:', error);
      // Return original response if processing fails
      console.warn('⚠️ Returning original response due to processing error');
      return response;
    }
  },
  (error: AxiosError) => {
    // Decrypt error response if encrypted
    if (error.response?.data) {
      try {
        error.response.data = processApiResponse(error.response.data);
      } catch (decryptError) {
        console.error('❌ Error response decryption failed:', decryptError);
      }
    }

    if (error.response?.status === 401) {
      // Check if this is a login attempt vs token expiration
      const isLoginRequest = error.config?.url === '/api/auth/login';
      
      if (!isLoginRequest) {
        // Token expired or invalid - clear storage and redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/login';
      }
      // For login requests, let the component handle the error
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// API TYPES
// =============================================================================
export interface LoginCredentials {
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface RegisterData {
  name: string;
  email: string;
  enrollment_no?: string;
  faculty_no?: string;
  password: string;
  confirmPassword?: string;
  role?: 'student' | 'faculty';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
  };
  message?: string;
}

export interface StudentDashboardData {
  name: string;
  email: string;
  enrollmentNo: string;
  branch: string;
  admissionYear: number;
  cpi: number;
  totalCredits: number;
  currentSemester: number;
  courses: Course[];
}

export interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: string;
  status?: string;
  instructor?: string;
  schedule?: string;
  semester?: number;
  isElective?: boolean;
  electiveGroup?: string | null;
  courseType?: string;
  isAutoSelected?: boolean;
  registrationType?: 'regular' | 'backlog' | 'improvement' | 'graduating';
  registrationMode?: 'A' | 'B' | 'C';
  allowedModes?: string[];
  previousAttempts?: number;
  lastGrade?: string;
  lastGradePoints?: number;
  currentGrade?: string;
  currentGradePoints?: number;
  attemptType?: string;
  attemptNumber?: number;
  maxSeats?: number | null;
  currentEnrollment?: number;
  availableSeats?: number | null;
  isRunning?: boolean;
  prerequisites?: Array<{
    courseCode: string;
    courseName: string;
    minGrade: string;
  }>;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// =============================================================================
// AUTH API FUNCTIONS
// =============================================================================

/**
 * Request OTP for email verification
 * @endpoint POST /api/auth/request-otp
 */
export const requestOTP = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/request-otp', { email });
  return response.data;
};

/**
 * Verify OTP code
 * @endpoint POST /api/auth/verify-otp
 */
export const verifyOTP = async (email: string, otp: string): Promise<{ message: string; verified: boolean }> => {
  const response = await api.post<{ message: string; verified: boolean }>('/api/auth/verify-otp', { email, otp });
  return response.data;
};

/**
 * Login user with email and password
 * @endpoint POST /api/auth/login
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    // Validate input
    if (!credentials.email || !credentials.password || !credentials.role) {
      throw new Error('Email, password, and role are required');
    }
    
    // Validate role
    if (!['student', 'teacher', 'admin'].includes(credentials.role)) {
      throw new Error('Invalid role. Must be student, teacher, or admin');
    }
    
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    
    // Validate response
    if (!response.data) {
      throw new Error('No data received from server');
    }
    
    if (!response.data.token) {
      throw new Error('Authentication failed: No token received');
    }
    
    if (!response.data.user) {
      throw new Error('Authentication failed: No user data received');
    }
    
    return response.data;
    
  } catch (error: any) {
    // Re-throw with more specific error information
    if (error.response) {
      const serverError = error.response.data?.error || error.response.data?.message || `Server error (${error.response.status})`;
      throw new Error(serverError);
    } else if (error.request) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    } else {
      throw error;
    }
  }
};

/**
 * Register a new user
 * @endpoint POST /api/auth/register
 */
export const registerUser = async (data: RegisterData): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/register', data);
  return response.data;
};

/**
 * Logout user (optional server-side logout)
 * @endpoint POST /api/auth/logout
 */
export const logoutUser = async (email?: string): Promise<void> => {
  try {
    await api.post('/api/auth/logout', email ? { email } : {});
  } catch (error) {
    // Logout should succeed even if server call fails
    console.warn('Server logout failed, proceeding with local logout');
  }
};

/**
 * Forgot password - request OTP
 * @endpoint POST /api/auth/forgot-password
 */
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/forgot-password', { email });
  return response.data;
};

/**
 * Verify reset OTP
 * @endpoint POST /api/auth/verify-reset-otp
 */
export const verifyResetOtp = async (email: string, otp: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/verify-reset-otp', { email, otp });
  return response.data;
};

/**
 * Reset password using OTP
 * @endpoint POST /api/auth/reset-password
 */
export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/reset-password', { email, otp, newPassword });
  return response.data;
};

// =============================================================================
// STUDENT API FUNCTIONS
// =============================================================================

/**
 * Get student dashboard data (profile + courses)
 * @endpoint GET /api/student/dashboard
 */
export const getStudentDashboardData = async (): Promise<StudentDashboardData> => {
  const response = await api.get<StudentDashboardData>('/api/student/dashboard');
  return response.data;
};

/**
 * Get student's enrolled courses
 * @endpoint GET /api/student/courses
 */
export const getStudentCourses = async (): Promise<Course[]> => {
  const response = await api.get<Course[]>('/api/student/courses');
  return response.data;
};

/**
 * Get available courses for registration
 * @endpoint GET /api/courses/available
 */
export const getAvailableCourses = async (): Promise<Course[]> => {
  const response = await api.get<{ courses: Course[]; total: number }>('/api/courses/available');
  return response.data.courses;
};

/**
 * Register for multiple courses with modes
 * @endpoint POST /api/courses/register
 */
export const registerForCourses = async (courses: Array<{
  courseCode: string;
  registrationType: 'regular' | 'backlog' | 'improvement' | 'graduating';
  registrationMode: 'A' | 'B' | 'C';
}>): Promise<{
  message: string;
  registered: Array<{
    courseCode: string;
    courseName: string;
    credits: number;
    registrationType: string;
    registrationMode: string;
    attemptType: string;
    attemptNumber: number;
    registeredAt: string;
  }>;
  totalCredits: number;
  errors?: Array<{
    courseCode: string;
    error: string;
    reason: string;
    details?: any;
  }>;
}> => {
  const response = await api.post('/api/courses/register', { courses });
  return response.data;
};

/**
 * Get available courses with filter support
 * @endpoint GET /api/courses/available?filter=all|eligible|blocked|improvement|backlog
 */
export const getAvailableCoursesWithFilter = async (filter: string = 'eligible'): Promise<{
  courses: Course[];
  electiveGroups: Array<{
    groupCode: string;
    groupName: string;
    minSelection: number;
    maxSelection: number;
    courses: Course[];
  }>;
  filter: string;
  deadlines: {
    currentPhase: string;
    phaseEndDate: string;
  };
}> => {
  const response = await api.get(`/api/courses/available?filter=${filter}`);
  return response.data;
};

/**
 * Drop a registered course
 * @endpoint DELETE /api/courses/drop/:courseCode
 */
export const dropCourse = async (courseCode: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/api/courses/drop/${courseCode}`);
  return response.data;
};

/**
 * Get enrolled courses
 * @endpoint GET /api/courses/enrolled
 */
export const getEnrolledCourses = async (): Promise<{ courses: Course[]; total_courses: number; total_credits: number }> => {
  const response = await api.get<{ courses: Course[]; total_courses: number; total_credits: number }>('/api/courses/enrolled');
  return response.data;
};

/**
 * Get student course history (past semesters with grades)
 * @endpoint GET /api/student/course-history
 */
export const getCourseHistory = async (): Promise<{
  semesters: Array<{
    academicYear: number;
    semesterType: number;
    sgpa: number;
    totalCredits: number;
    courses: Array<{
      courseCode: string;
      courseName: string;
      credits: number;
      grade: string;
      gradePoints: number;
    }>;
  }>;
  statistics: {
    totalCourses: number;
    totalCredits: number;
    cpi: number;
    totalSemesters: number;
  };
}> => {
  const response = await api.get('/api/student/course-history');
  return response.data;
};

/**
 * Get student registration history (including dropped courses)
 * @endpoint GET /api/student/registration-history
 */
export const getRegistrationHistory = async (): Promise<{
  history: Array<{
    registrationId: number;
    courseCode: string;
    courseName: string;
    credits: number;
    courseType: string;
    registrationType: string;
    academicYear: number;
    semesterType: number;
    registeredAt: string;
    droppedAt: string | null;
    status: 'Active' | 'Pending' | 'Dropped';
    isApproved: boolean;
  }>;
  statistics: {
    totalRegistrations: number;
    activeRegistrations: number;
    droppedRegistrations: number;
    totalCreditsRegistered: number;
  };
}> => {
  const response = await api.get('/api/student/registration-history');
  return response.data;
};

// =============================================================================
// FACULTY API FUNCTIONS
// =============================================================================

/**
 * Get faculty dashboard data
 * @endpoint GET /api/teacher/dashboard
 */
export const getFacultyDashboardData = async (): Promise<any> => {
  const response = await api.get('/api/teacher/dashboard');
  return response.data;
};

/**
 * Get all students with filters
 * @endpoint GET /api/teacher/students
 */
export const getStudents = async (filters?: {
  search?: string;
  branch?: string;
  semester?: number;
  status?: string;
}): Promise<any> => {
  const response = await api.get('/api/teacher/students', { params: filters });
  return response.data;
};

/**
 * Get all courses with optional filters
 * @endpoint GET /api/teacher/courses
 */
export const getCourses = async (filters?: {
  branch?: string;
  semester?: number;
  courseType?: string;
  isElective?: boolean;
  electiveGroup?: string;
  minCredits?: number;
  maxCredits?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<any> => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.semester) params.append('semester', filters.semester.toString());
    if (filters.courseType) params.append('courseType', filters.courseType);
    if (filters.isElective !== undefined) params.append('isElective', filters.isElective.toString());
    if (filters.electiveGroup) params.append('electiveGroup', filters.electiveGroup);
    if (filters.minCredits) params.append('minCredits', filters.minCredits.toString());
    if (filters.maxCredits) params.append('maxCredits', filters.maxCredits.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
  }
  
  const response = await api.get(`/api/teacher/courses?${params.toString()}`);
  return response.data;
};

/**
 * Get pending approvals
 * @endpoint GET /api/teacher/approvals
 */
export const getApprovals = async (): Promise<any> => {
  const response = await api.get('/api/teacher/approvals');
  return response.data;
};

/**
 * Approve a registration
 * @endpoint POST /api/teacher/approvals/:id/approve
 */
export const approveRegistration = async (registrationId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/api/teacher/approvals/${registrationId}/approve`);
  return response.data;
};

/**
 * Reject a registration
 * @endpoint POST /api/teacher/approvals/:id/reject
 */
export const rejectRegistration = async (registrationId: number): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(`/api/teacher/approvals/${registrationId}/reject`);
  return response.data;
};

/**
 * Get registration statistics
 * @endpoint GET /api/teacher/reports/stats
 */
export const getRegistrationStats = async (): Promise<any> => {
  const response = await api.get('/api/teacher/reports/stats');
  return response.data;
};

/**
 * Update student status (admin only)
 * @endpoint PUT /api/teacher/students/:enrollmentNo/status
 */
export const updateStudentStatus = async (enrollmentNo: string, isActive: boolean): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/api/teacher/students/${enrollmentNo}/status`, { isActive });
  return response.data;
};

// =============================================================================
// ADMIN API FUNCTIONS (admin role only)
// =============================================================================

/**
 * Check if course exists (for real-time validation)
 * @endpoint GET /api/teacher/courses/check
 */
export const checkCourseExists = async (params: {
  courseCode?: string;
  courseName?: string;
}): Promise<{
  courseCodeExists?: boolean;
  courseNameExists?: boolean;
  existingCourseCode?: { course_code: string; course_name: string };
  existingCourseName?: { course_code: string; course_name: string };
}> => {
  const response = await api.get('/api/teacher/courses/check', { params });
  return response.data;
};

/**
 * Add a new course (admin only)
 * @endpoint POST /api/teacher/courses
 */
export const addCourse = async (courseData: {
  courseCode: string;
  courseName: string;
  credits: number;
  semesterNo: number;
  branchCode: string;
  isElective?: boolean;
  isAdvanced?: boolean;
  electiveGroup?: string;
  courseType?: string;
}): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/teacher/courses', courseData);
  return response.data;
};

/**
 * Update a course (admin only)
 * @endpoint PUT /api/teacher/courses/:courseCode
 */
export const updateCourse = async (courseCode: string, courseData: any): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/api/teacher/courses/${courseCode}`, courseData);
  return response.data;
};

/**
 * Delete a course (admin only)
 * @endpoint DELETE /api/teacher/courses/:courseCode
 */
export const deleteCourse = async (courseCode: string): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(`/api/teacher/courses/${courseCode}`);
  return response.data;
};

/**
 * Add prerequisite to a course (admin only)
 * @endpoint POST /api/teacher/courses/:courseCode/prerequisites
 */
export const addPrerequisite = async (
  courseCode: string,
  prerequisiteCourseCode: string,
  minGrade: string
): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>(
    `/api/teacher/courses/${courseCode}/prerequisites`,
    { prerequisiteCourseCode, minGrade }
  );
  return response.data;
};

/**
 * Update prerequisite (admin only)
 * @endpoint PUT /api/teacher/courses/:courseCode/prerequisites/:prerequisiteCode
 */
export const updatePrerequisite = async (
  courseCode: string,
  prerequisiteCode: string,
  minGrade: string
): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(
    `/api/teacher/courses/${courseCode}/prerequisites/${prerequisiteCode}`,
    { minGrade }
  );
  return response.data;
};

/**
 * Delete prerequisite (admin only)
 * @endpoint DELETE /api/teacher/courses/:courseCode/prerequisites/:prerequisiteCode
 */
export const deletePrerequisite = async (
  courseCode: string,
  prerequisiteCode: string
): Promise<{ message: string }> => {
  const response = await api.delete<{ message: string }>(
    `/api/teacher/courses/${courseCode}/prerequisites/${prerequisiteCode}`
  );
  return response.data;
};

/**
 * Get all registration rules (admin only)
 * @endpoint GET /api/teacher/rules
 */
export const getRegistrationRules = async (): Promise<any> => {
  const response = await api.get('/api/teacher/rules');
  return response.data;
};

/**
 * Update registration rule (admin only)
 * @endpoint PUT /api/teacher/rules/:ruleId
 */
export const updateRegistrationRule = async (
  ruleId: number,
  value?: string,
  isActive?: boolean
): Promise<{ message: string }> => {
  const response = await api.put<{ message: string }>(`/api/teacher/rules/${ruleId}`, { value, isActive });
  return response.data;
};

/**
 * Toggle registration window (admin only)
 * @endpoint POST /api/teacher/registration/toggle
 */
export const toggleRegistration = async (enabled: boolean): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/teacher/registration/toggle', { enabled });
  return response.data;
};

/**
 * Get registration phases
 * @endpoint GET /api/registration-control/phases
 */
export const getRegistrationPhases = async (): Promise<any> => {
  const response = await api.get('/api/registration-control/phases');
  return response.data;
};

/**
 * Get current active phase
 * @endpoint GET /api/registration-control/current-phase
 */
export const getCurrentPhase = async (): Promise<any> => {
  const response = await api.get('/api/registration-control/current-phase');
  return response.data;
};

/**
 * Update a registration phase
 * @endpoint PUT /api/registration-control/phases/:phaseId
 */
export const updateRegistrationPhase = async (
  phaseId: number,
  data: { start_date?: string | null; end_date?: string | null; is_enabled?: boolean }
): Promise<{ message: string; phase: any }> => {
  const response = await api.put(`/api/registration-control/phases/${phaseId}`, data);
  return response.data;
};

/**
 * Bulk update registration phases
 * @endpoint POST /api/registration-control/phases/bulk-update
 */
export const bulkUpdatePhases = async (phases: any[]): Promise<{ message: string }> => {
  const response = await api.post('/api/registration-control/phases/bulk-update', { phases });
  return response.data;
};

/**
 * Upload student results CSV file
 * @endpoint POST /api/faculty/upload/results
 */
export const uploadResultsCSV = async (file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ message: string }>('/api/faculty/upload/results', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Upload course subjects CSV file
 * @endpoint POST /api/faculty/upload/courses
 */
export const uploadCoursesCSV = async (file: File): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ message: string }>('/api/faculty/upload/courses', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// =============================================================================
// CSV UPLOAD API FUNCTIONS (Admin Only)
// =============================================================================

/**
 * Upload CSV file to seed database
 * @endpoint POST /api/admin/upload/csv
 */
export const uploadCSV = async (file: File): Promise<{
  message: string;
  format: string;
  inserted: {
    students: number;
    faculty: number;
    courses: number;
    grades: number;
  };
  totalRows: number;
  errors?: string[];
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/admin/upload/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Preview CSV file without inserting data
 * @endpoint POST /api/admin/upload/preview
 */
export const previewCSV = async (file: File): Promise<{
  format: string;
  totalRows: number;
  preview: any[];
  errors: string[];
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/admin/upload/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// =============================================================================
// ERROR HELPER
// =============================================================================

/**
 * Extract error message from API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // Check if there's a response from the server
    if (error.response?.data) {
      const apiError = error.response.data as any;
      // Backend sends errors as { error: "message" } or { message: "message" }
      return apiError.error || apiError.message || 'An unexpected error occurred';
    }
    // Network error or no response from server
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Unable to connect to server. Please check your connection.';
    }
    return error.message || 'An unexpected error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default api;
