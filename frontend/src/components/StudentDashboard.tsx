import { useState } from 'react';
import SideDrawer from '@/components/SideDrawer';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import DashboardOverview from '@/components/DashboardOverview';
import ProfileView from '@/components/ProfileView';
import CoursesView from '@/components/CoursesView';
import CourseRegistrationView from '@/components/CourseRegistrationView';
import CourseHistory from '@/components/CourseHistory';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import type { StudentDashboardData, Course } from '@/services/api';

type View = 'dashboard' | 'profile' | 'courses' | 'registration' | 'history';

interface StudentDashboardProps {
  dashboardData: StudentDashboardData | null;
  courses: Course[];
  onRefresh: () => Promise<void>;
}

const StudentDashboard = ({ dashboardData, courses, onRefresh }: StudentDashboardProps) => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <SideDrawer currentView={currentView} onViewChange={setCurrentView} />
        
        {/* Right side - Notifications & Settings */}
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {renderView()}
    </div>
  );
};

export default StudentDashboard;
