import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  User, 
  GraduationCap, 
  Calendar, 
  Award, 
  BookOpen,
  Mail,
  Hash
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getStudentDashboardData } from '@/services/api';

const ProfileView = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getStudentDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === 'student') {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const earnedCredits = dashboardData?.earnedCredits || 0;
  const degreeProgress = Math.round((earnedCredits / 160) * 100);

  const profileFields = [
    { 
      label: 'Full Name', 
      value: dashboardData?.name || 'N/A',
      icon: User
    },
    { 
      label: 'Email', 
      value: dashboardData?.email || 'N/A',
      icon: Mail
    },
    { 
      label: 'Enrollment Number', 
      value: dashboardData?.enrollmentNo || 'N/A',
      icon: Hash
    },
    { 
      label: 'Branch', 
      value: dashboardData?.branch || 'N/A',
      icon: GraduationCap
    },
    { 
      label: 'Admission Year', 
      value: dashboardData?.admissionYear?.toString() || 'N/A',
      icon: Calendar
    },
    { 
      label: 'Current CPI', 
      value: dashboardData?.cpi?.toFixed(2) || '0.00',
      icon: Award
    },
    { 
      label: 'Total Credits', 
      value: `${earnedCredits} / 160`,
      icon: BookOpen
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl sm:text-3xl">
          {dashboardData?.name?.charAt(0) || 'S'}
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Student Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Your academic information
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="font-bold text-base sm:text-lg text-foreground">
            Personal Information
          </h3>
          <Badge className="bg-primary/10 text-primary border-0">
            Active Student
          </Badge>
        </div>

        <div className="grid gap-3 sm:gap-4">
          {profileFields.map((field, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <field.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                  {field.label}
                </p>
                <p className="font-semibold text-sm sm:text-base text-foreground truncate">
                  {field.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Status */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
        <h3 className="font-bold text-base sm:text-lg text-foreground mb-4">
          Academic Status
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-primary/10 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary">
              {dashboardData?.currentSemester || 1}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Current Semester
            </p>
          </div>
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-secondary/10 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-secondary">
              {degreeProgress}%
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Degree Progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
