import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  History,
  GraduationCap,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getCourseHistory, getErrorMessage } from '@/services/api';

interface CourseHistoryData {
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
      isAdvanced?: boolean;
    }>;
  }>;
  statistics: {
    totalCourses: number;
    totalCredits: number;
    cpi: number;
    totalSemesters: number;
  };
}

const CoursesView = () => {
  const { studentData } = useAuth();
  const { toast } = useToast();
  const [historyData, setHistoryData] = useState<CourseHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSemesters, setExpandedSemesters] = useState<string[]>([]);

  useEffect(() => {
    const fetchCourseHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getCourseHistory();
        setHistoryData(data);
        
        // Expand the latest semester by default
        if (data.semesters.length > 0) {
          const latest = data.semesters[data.semesters.length - 1];
          setExpandedSemesters([`${latest.academicYear}-${latest.semesterType}`]);
        }
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        setError(errorMsg);
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseHistory();
  }, [toast]);

  const toggleSemester = (academicYear: number, semesterType: number) => {
    const key = `${academicYear}-${semesterType}`;
    setExpandedSemesters(prev => 
      prev.includes(key)
        ? prev.filter(s => s !== key)
        : [...prev, key]
    );
  };

  const getGradeColor = (gradePoints: number) => {
    if (gradePoints >= 9) return 'bg-primary/10 text-primary';
    if (gradePoints >= 7) return 'bg-secondary/20 text-secondary-foreground';
    if (gradePoints >= 5) return 'bg-muted text-muted-foreground';
    return 'bg-destructive/10 text-destructive';
  };

  const getSemesterLabel = (semesterType: number) => {
    return semesterType === 1 ? 'Fall' : 'Spring';
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} text="Loading course history..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  if (!historyData || historyData.semesters.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
            Course History
          </h1>
          <p className="text-sm text-muted-foreground">
            View your past semester courses and grades
          </p>
        </div>
        <div className="glass-card rounded-2xl sm:rounded-3xl p-8 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">
          Course History
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          View your past semester courses and grades
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="glass-card rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 text-center">
          <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mx-auto text-primary mb-1 sm:mb-2" />
          <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{historyData.statistics.cpi.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Current CPI</p>
        </div>
        <div className="glass-card rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 text-center">
          <Award className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mx-auto text-secondary mb-1 sm:mb-2" />
          <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{historyData.statistics.totalCredits}</p>
          <p className="text-xs text-muted-foreground">Total Credits</p>
        </div>
        <div className="glass-card rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 text-center">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mx-auto text-accent-foreground mb-1 sm:mb-2" />
          <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{historyData.statistics.totalCourses}</p>
          <p className="text-xs text-muted-foreground">Courses Done</p>
        </div>
        <div className="glass-card rounded-lg sm:rounded-xl lg:rounded-2xl p-2 sm:p-3 lg:p-4 text-center">
          <History className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mx-auto text-muted-foreground mb-1 sm:mb-2" />
          <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground">{historyData.statistics.totalSemesters}</p>
          <p className="text-xs text-muted-foreground">Semesters</p>
        </div>
      </div>

      {/* Semester-wise History */}
      <div className="space-y-2 sm:space-y-3">
        {historyData.semesters.map((sem) => {
          const semesterKey = `${sem.academicYear}-${sem.semesterType}`;
          const isExpanded = expandedSemesters.includes(semesterKey);
          
          return (
            <div key={semesterKey} className="glass-card rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden">
              {/* Semester Header - Clickable */}
              <button
                onClick={() => toggleSemester(sem.academicYear, sem.semesterType)}
                className="w-full p-2 sm:p-3 lg:p-5 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg sm:rounded-xl lg:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm lg:text-base">
                    {sem.semesterType}
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-xs sm:text-sm lg:text-base text-foreground">
                      Semester {sem.semesterType}
                    </h3>
                    <p className="text-[9px] sm:text-xs lg:text-sm text-muted-foreground">
                      {getSemesterLabel(sem.semesterType)} {sem.academicYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-4">
                  <div className="text-right">
                    <Badge className="bg-secondary/20 text-secondary-foreground text-[9px] sm:text-xs lg:text-sm mb-0.5 sm:mb-1">
                      SGPA: {sem.sgpa.toFixed(1)}
                    </Badge>
                    <p className="text-[9px] sm:text-xs text-muted-foreground">{sem.totalCredits} Cr</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Course Details */}
              {isExpanded && (
                <div className="px-2 sm:px-3 lg:px-5 pb-2 sm:pb-3 lg:pb-5 border-t border-border">
                  <div className="pt-2 sm:pt-3 lg:pt-4 grid gap-1.5 sm:gap-2">
                    {sem.courses.map((course) => (
                      <div 
                        key={course.courseCode}
                        className="flex items-center justify-between p-1.5 sm:p-2 lg:p-3 rounded-lg sm:rounded-xl lg:rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 min-w-0 flex-1">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="font-mono text-[8px] sm:text-xs lg:text-sm font-bold text-primary">{course.courseCode}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                              <h4 className="font-medium text-xs sm:text-sm lg:text-base text-foreground truncate">{course.courseName}</h4>
                              {course.isAdvanced && (
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-[7px] sm:text-[9px] lg:text-[10px] px-0.5 sm:px-1 py-0">
                                  ADV
                                </Badge>
                              )}
                            </div>
                            <p className="text-[9px] sm:text-xs text-muted-foreground">{course.credits} Credits</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                          <Badge className={`${getGradeColor(course.gradePoints)} text-[9px] sm:text-xs lg:text-sm font-bold px-1 sm:px-1.5 lg:px-2`}>
                            {course.grade}
                          </Badge>
                          <span className="text-[9px] sm:text-xs text-muted-foreground font-mono hidden sm:inline lg:inline">
                            GP: {course.gradePoints.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoursesView;