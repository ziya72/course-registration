import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  User, 
  GraduationCap, 
  Calendar, 
  Award, 
  BookOpen,
  Mail,
  Hash,
  Star,
  Trophy
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
  const currentCPI = dashboardData?.cpi || 0;

  // Get CPI grade and color
  const getCPIGrade = (cpi: number) => {
    if (cpi >= 9.0) return { grade: 'A+', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (cpi >= 8.0) return { grade: 'A', color: 'text-green-500', bgColor: 'bg-green-50' };
    if (cpi >= 7.0) return { grade: 'B+', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (cpi >= 6.0) return { grade: 'B', color: 'text-blue-500', bgColor: 'bg-blue-50' };
    if (cpi >= 5.0) return { grade: 'C', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { grade: 'D', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const cpiGrade = getCPIGrade(currentCPI);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto px-4 sm:px-0">
      {/* Profile Header Card */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg">
              {dashboardData?.name?.charAt(0) || 'S'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-white flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              {dashboardData?.name || 'Student Name'}
            </h1>
            <p className="text-muted-foreground text-lg mb-3">
              {dashboardData?.branch || 'Computer Engineering'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Trophy className="h-3 w-3 mr-1" />
                Semester {dashboardData?.currentSemester || 1}
              </Badge>
              <Badge className={`${cpiGrade.bgColor} ${cpiGrade.color} border-0`}>
                <Star className="h-3 w-3 mr-1" />
                Grade {cpiGrade.grade}
              </Badge>
            </div>
          </div>
          
          {/* CPI Display */}
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-1">{currentCPI.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Current CPI</div>
          </div>
        </div>
      </div>

      {/* Academic Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Credits Progress */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Credits Progress</h3>
              <p className="text-sm text-muted-foreground">{earnedCredits} of 160 credits</p>
            </div>
          </div>
          <Progress value={degreeProgress} className="h-3 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{degreeProgress}% Complete</span>
            <span>{160 - earnedCredits} remaining</span>
          </div>
        </div>

        {/* Academic Status */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Award className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Academic Status</h3>
              <p className="text-sm text-muted-foreground">Active Student</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Current Semester</span>
              <span className="font-medium">{dashboardData?.currentSemester || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Admission Year</span>
              <span className="font-medium">{dashboardData?.admissionYear || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-bold text-xl text-foreground mb-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Email */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              Email Address
            </div>
            <p className="font-medium text-foreground break-all">
              {dashboardData?.email || 'N/A'}
            </p>
          </div>

          {/* Enrollment Number */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-4 w-4" />
              Enrollment Number
            </div>
            <p className="font-medium text-foreground font-mono">
              {dashboardData?.enrollmentNo || 'N/A'}
            </p>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" />
              Branch
            </div>
            <p className="font-medium text-foreground">
              {dashboardData?.branch || 'N/A'}
            </p>
          </div>

          {/* Admission Year */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Admission Year
            </div>
            <p className="font-medium text-foreground">
              {dashboardData?.admissionYear?.toString() || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;