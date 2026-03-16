import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Award, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  Plus,
  Lock,
  Trash2,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from 'react';
import api, { getCurrentPhase, getRegistrationPhases } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { StudentDashboardData, Course } from '@/services/api';

interface RegisteredCourse {
  registrationId: number;
  courseCode: string;
  courseName: string;
  credits: number;
  courseType: string;
  registrationType: string;
  isApproved: boolean;
  status: string;
  registeredAt: string;
}

interface DashboardOverviewProps {
  onNavigateToRegistration: () => void;
  dashboardData: StudentDashboardData | null;
  courses: Course[];
}

const DashboardOverview = ({ onNavigateToRegistration, dashboardData, courses }: DashboardOverviewProps) => {
  const { user, studentData } = useAuth();
  const { toast } = useToast();
  const [courseToDelete, setCourseToDelete] = useState<RegisteredCourse | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<any>(null);
  const [registrationPhases, setRegistrationPhases] = useState<any[]>([]);
  const [isLoadingPhases, setIsLoadingPhases] = useState(true);
  
  // Use dashboardData from API if available, fallback to context
  const displayData = dashboardData || studentData;
  const displayName = dashboardData?.name || user?.name || 'Student';
  const earnedCredits = (dashboardData as any)?.earnedCredits || displayData?.totalCredits || 0;
  const creditProgress = earnedCredits ? (earnedCredits / 160) * 100 : 0;

  // Check for active registration phase and fetch all phases
  const checkRegistrationStatus = async () => {
    try {
      setIsLoadingPhases(true);
      
      // Try to fetch current phase first
      let currentResponse = { currentPhase: null, isOpen: false };
      let phasesResponse = { phases: [] };
      
      try {
        currentResponse = await getCurrentPhase();
      } catch (currentError) {
        console.warn('Failed to fetch current phase:', currentError);
      }
      
      try {
        phasesResponse = await getRegistrationPhases();
      } catch (phasesError) {
        console.warn('Failed to fetch registration phases:', phasesError);
      }
      
      setCurrentPhase(currentResponse.currentPhase);
      setIsRegistrationOpen(currentResponse.isOpen);
      setRegistrationPhases(phasesResponse.phases || []);
      
    } catch (error) {
      console.error('Error checking registration status:', error);
      setIsRegistrationOpen(false);
      setCurrentPhase(null);
      setRegistrationPhases([]);
    } finally {
      setIsLoadingPhases(false);
    }
  };

  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  // Helper function to format phase timing
  const formatPhaseTime = (phase: any) => {
    if (!phase || !phase.start_date || !phase.end_date) return 'Not configured';
    
    try {
      const now = new Date();
      const start = new Date(phase.start_date);
      const end = new Date(phase.end_date);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid dates';
      }
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      if (now < start) {
        const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''} (${formatDate(start)})`;
      } else if (now >= start && now <= end) {
        const daysUntilEnd = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `Active - Ends in ${daysUntilEnd} day${daysUntilEnd !== 1 ? 's' : ''} (${formatDate(end)})`;
      } else {
        return `Ended on ${formatDate(end)}`;
      }
    } catch (error) {
      console.error('Error formatting phase time:', error);
      return 'Date unavailable';
    }
  };

  // Get phase status for styling
  const getPhaseStatus = (phase: any) => {
    if (!phase || !phase.start_date || !phase.end_date || !phase.is_enabled) return 'inactive';
    
    const now = new Date();
    const start = new Date(phase.start_date);
    const end = new Date(phase.end_date);
    
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
  };

  // Get registered courses from dashboard data
  const registeredCourses: RegisteredCourse[] = (dashboardData as any)?.registeredCourses || [];
  const hasRegistered = (dashboardData as any)?.hasRegistered || false;
  const registeredCredits = (dashboardData as any)?.registeredCredits || 0;
  const deadlines = (dashboardData as any)?.deadlines || { canModify: true, canRegister: true };

  // Calculate days remaining for modification
  const modificationDeadline = deadlines.modification ? new Date(deadlines.modification) : null;
  const daysUntilModificationDeadline = modificationDeadline 
    ? Math.ceil((modificationDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleDropCourse = async () => {
    if (!courseToDelete) return;

    try {
      setIsDropping(true);
      await api.delete(`/api/courses/drop/${courseToDelete.courseCode}`);
      
      toast({
        title: 'Course Dropped',
        description: `Successfully dropped ${courseToDelete.courseName}`,
      });

      // Refresh dashboard
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to drop course',
        variant: 'destructive',
      });
    } finally {
      setIsDropping(false);
      setCourseToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Welcome Header - Simplified */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full text-sm font-medium mb-4">
          <BookOpen className="h-4 w-4 text-secondary" />
          <span className="text-foreground">Student Dashboard</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Welcome, <span className="serif-highlight text-primary">{displayName}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Enrollment: <span className="font-mono font-medium text-foreground">{displayData?.enrollmentNo || 'N/A'}</span>
        </p>
      </div>

      {/* Academic Stats - Responsive Grid */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-primary mb-1">{displayData?.cpi?.toFixed(2) || '0.00'}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Current CPI</div>
        </div>

        <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-primary mb-1">{earnedCredits}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Credits Earned</div>
          <Progress value={creditProgress} className="h-1.5 mt-2" />
        </div>

        <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-primary mb-1">{displayData?.currentSemester || 1}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Current Semester</div>
        </div>
      </div>

      {/* Current Semester Registrations - Enhanced Mobile */}
      {hasRegistered && (
        <div className="glass-card rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Registered Courses</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Semester {displayData?.currentSemester || 1}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs sm:text-sm font-medium self-start sm:self-auto">
              {registeredCredits} Credits
            </Badge>
          </div>
          
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {registeredCourses.map((course) => (
              <div key={course.registrationId} className="p-3 sm:p-4 rounded-lg bg-muted/30 border border-muted/50 hover:border-muted transition-all duration-200">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs sm:text-sm font-bold text-secondary">{course.courseCode}</span>
                      <Badge 
                        variant={course.isApproved ? "default" : "outline"} 
                        className="text-xs"
                      >
                        {course.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-xs sm:text-sm text-foreground line-clamp-2 mb-1">{course.courseName}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{course.credits} credits</span>
                      <span>•</span>
                      <span className="hidden sm:inline">{course.courseType}</span>
                      <span className="sm:hidden">{course.courseType.length > 15 ? course.courseType.substring(0, 15) + '...' : course.courseType}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => setCourseToDelete(course)}
                    disabled={!deadlines.canModify}
                    title={!deadlines.canModify ? "Modification deadline has passed" : "Drop course"}
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                
                {/* Course Type Badges */}
                <div className="flex gap-1 flex-wrap">
                  {course.registrationType === 'backlog' && (
                    <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">
                      Backlog
                    </Badge>
                  )}
                  {course.registrationType === 'improvement' && (
                    <Badge className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Improvement
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Ready to Register Card - Enhanced Mobile */}
      <div className="glass-card rounded-xl p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <h3 className="font-semibold text-base sm:text-lg text-foreground">Ready to Register</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsLoadingPhases(true);
              checkRegistrationStatus();
            }}
            className="text-muted-foreground hover:text-foreground"
            title="Refresh registration status"
            disabled={isLoadingPhases}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingPhases ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Registration Action - Mobile Optimized */}
        <div className="p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">Start Registration</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isRegistrationOpen 
                    ? currentPhase 
                      ? `${currentPhase.phase_label} - Registration is open`
                      : 'Registration window is currently open'
                    : 'Registration is currently closed'
                  }
                </p>
              </div>
            </div>
            
            <Button 
              size={isRegistrationOpen ? "lg" : "default"}
              className={`rounded-full px-4 sm:px-6 font-medium transition-all duration-200 text-sm sm:text-base ${
                isRegistrationOpen 
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              onClick={() => {
                if (isRegistrationOpen && onNavigateToRegistration) {
                  try {
                    onNavigateToRegistration();
                  } catch (error) {
                    toast({
                      title: 'Navigation Error',
                      description: 'Failed to open registration. Please try again.',
                      variant: 'destructive',
                    });
                  }
                }
              }}
              disabled={!isRegistrationOpen}
            >
              {isRegistrationOpen ? (
                <span className="flex items-center gap-2">
                  <span className="hidden sm:inline">Register</span>
                  <span className="sm:hidden">Start</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Register</span>
                  <span className="sm:hidden">Locked</span>
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Registration Phases - Mobile Optimized */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm sm:text-base text-foreground">Registration Phases</h4>
            </div>
            
            <div className="space-y-2">
              {isLoadingPhases ? (
                <div className="flex items-center justify-center py-3 sm:py-4">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-primary"></div>
                  <span className="ml-2 text-xs sm:text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : registrationPhases && registrationPhases.length > 0 ? (
                registrationPhases.map((phase) => {
                  const status = getPhaseStatus(phase);
                  const isCurrentPhase = currentPhase && currentPhase.phase_id === phase.phase_id;
                  
                  return (
                    <div key={phase.phase_id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          status === 'active' ? 'bg-primary' :
                          status === 'upcoming' ? 'bg-secondary' :
                          'bg-muted-foreground'
                        }`} />
                        <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                          {phase.phase_label || 'Unknown Phase'}
                        </span>
                        {isCurrentPhase && (
                          <Badge className="text-xs bg-primary/20 text-primary border-primary/30 shrink-0">
                            Active
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatPhaseTime(phase)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs sm:text-sm text-muted-foreground py-3 px-3 text-center bg-muted/20 rounded-lg">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div>Phases will be available soon</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Eligibility Requirements - Mobile Optimized */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm sm:text-base text-foreground">Eligibility</h4>
            </div>
            <div className="space-y-2">
              {[
                { rule: 'Max 40 credits per semester', status: true },
                { rule: 'CPI ≥ 8.5 for advanced courses', status: (displayData?.cpi || 0) >= 8.5 },
                { rule: 'All prerequisites completed', status: true },
                { rule: 'No academic probation', status: true },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/20">
                  {item.status ? (
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <span className="text-xs sm:text-sm text-foreground">{item.rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drop Course Confirmation Dialog */}
      <AlertDialog open={!!courseToDelete} onOpenChange={() => setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Drop Course?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to drop <strong>{courseToDelete?.courseName}</strong> ({courseToDelete?.courseCode})?
              This action cannot be undone, but you can re-register if the course is still available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDropping}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDropCourse}
              disabled={isDropping}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDropping ? 'Dropping...' : 'Drop Course'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardOverview;
