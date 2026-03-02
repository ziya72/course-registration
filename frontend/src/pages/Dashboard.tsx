import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import StudentDashboard from '@/components/StudentDashboard';
import FacultyDashboard from '@/components/FacultyDashboard';
import PullToRefresh from '@/components/PullToRefresh';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { getStudentDashboardData, getFacultyDashboardData, getErrorMessage } from '@/services/api';
import type { StudentDashboardData, Course } from '@/services/api';

const Dashboard = () => {
  const { user, setStudentData } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is teacher or admin (both use faculty dashboard)
      if (user?.role === 'teacher' || user?.role === 'admin') {
        const data = await getFacultyDashboardData();
        setDashboardData(data);
      } else {
        const data = await getStudentDashboardData();
        setDashboardData(data);
        setCourses(data.courses || []);
        
        // Update auth context with student data
        setStudentData({
          enrollmentNo: data.enrollmentNo,
          branch: data.branch,
          admissionYear: data.admissionYear,
          cpi: data.cpi,
          totalCredits: data.totalCredits,
          currentSemester: data.currentSemester,
        });
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.role, setStudentData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background grid-background">
        <Header />
        <div className="pt-16 sm:pt-20 pb-8 sm:pb-12 px-3 sm:px-4">
          <div className="container mx-auto max-w-6xl">
            <LoadingSpinner fullScreen={false} text="Loading dashboard..." className="min-h-[60vh]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background grid-background">
        <Header />
        <div className="pt-16 sm:pt-20 pb-8 sm:pb-12 px-3 sm:px-4">
          <div className="container mx-auto max-w-6xl">
            <ErrorMessage 
              message={error} 
              onRetry={fetchDashboardData}
              fullHeight 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background grid-background">
        <Header />
        
        <div className="pt-16 sm:pt-20 pb-8 sm:pb-12 px-3 sm:px-4">
          <div className="container mx-auto max-w-6xl">
            {user?.role === 'teacher' || user?.role === 'admin' ? (
              <FacultyDashboard />
            ) : (
              <StudentDashboard 
                dashboardData={dashboardData} 
                courses={courses}
                onRefresh={fetchDashboardData}
              />
            )}
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default Dashboard;
