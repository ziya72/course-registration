import { useState } from 'react';
import SideDrawer from '@/components/SideDrawer';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import DashboardOverview from '@/components/DashboardOverview';
import ProfileView from '@/components/ProfileView';
import CoursesView from '@/components/CoursesView';
import CourseRegistrationView from '@/components/CourseRegistrationView';
import CourseHistory from '@/components/CourseHistory';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { StudentDashboardData, Course } from '@/services/api';

type View = 'dashboard' | 'profile' | 'courses' | 'registration' | 'history';

interface StudentDashboardProps {
  dashboardData: StudentDashboardData | null;
  courses: Course[];
  onRefresh: () => Promise<void>;
}

const StudentDashboard = ({ dashboardData, courses, onRefresh }: StudentDashboardProps) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const isMobile = useIsMobile();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderView = () => {
    switch (currentView) {
      case 'profile':
        return <ProfileView />;
      case 'courses':
        return <CoursesView />;
      case 'registration':
        return <CourseRegistrationView onBack={async () => {
          setCurrentView('dashboard');
          await onRefresh(); // Refresh dashboard data
        }} />;
      case 'history':
        return <CourseHistory />;
      default:
        return (
          <DashboardOverview 
            onNavigateToRegistration={() => setCurrentView('registration')}
            dashboardData={dashboardData}
            courses={courses}
          />
        );
    }
  };

  return (
    <div className={`${isMobile ? 'px-1 py-1' : 'px-2 py-2 sm:px-3 sm:py-3'} space-y-6 sm:space-y-8 lg:space-y-10 min-h-screen bg-gradient-to-br from-background via-background to-muted/20`}>
      {/* Top Navigation Bar - Completely Separated */}
      <div className={`flex items-center justify-between ${isMobile ? 'mb-6 px-3 py-2' : 'mb-8 px-4 sm:px-6 py-3 sm:py-4'} sticky top-0 z-40 bg-background/95 backdrop-blur-md rounded-xl border border-border/50 mx-auto`} style={{ width: isMobile ? '98%' : '95%' }}>
        <div className="flex items-center">
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-foreground whitespace-nowrap`}>
            Course Registration Portal
          </span>
        </div>
        
        {/* Right side - Sidebar, Notifications */}
        <div className="flex items-center gap-3 sm:gap-4">
          <SideDrawer currentView={currentView} onViewChange={setCurrentView} />
          <NotificationsDropdown />
        </div>
      </div>

      {/* Main Content - Completely Separated with More Space */}
      <div className={`${isMobile ? 'pb-16 px-1' : 'pb-6 sm:pb-8 px-2 sm:px-4'} transition-all duration-300`} style={{ maxWidth: isMobile ? '100%' : '95%', margin: '0 auto' }}>
        {renderView()}
      </div>

      {/* Mobile Bottom Safe Area */}
      {isMobile && <div className="h-3 sm:h-4" />}
    </div>
  );
};

export default StudentDashboard;
