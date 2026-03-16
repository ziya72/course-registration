import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  TrendingUp, 
  Award,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface CourseAttempt {
  attemptNumber: number;
  semester: string;
  grade: string;
  gradePoints: number;
  attemptType: 'Regular' | 'Backlog' | 'Improvement';
}

interface CourseAttemptDetail {
  courseCode: string;
  courseName: string;
  totalAttempts: number;
  attempts: CourseAttempt[];
  bestGrade: string;
  bestGradePoints: number;
  credits: number;
}

interface Semester {
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
    isBacklog: boolean;
    isImprovement: boolean;
    attemptType: string;
  }>;
}

interface Statistics {
  totalAttempts: number;
  uniqueCourses: number;
  earnedCredits: number;
  cpi: number;
  totalSemesters: number;
}

const CourseHistory = () => {
  const { toast } = useToast();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courseAttempts, setCourseAttempts] = useState<CourseAttemptDetail[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'semester' | 'course'>('semester');
  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourseHistory();
  }, []);

  const fetchCourseHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/student/course-history');
      const semesterData = response.data.semesters || [];
      setSemesters(semesterData);
      setCourseAttempts(response.data.courseAttempts || []);
      setStatistics(response.data.statistics || null);
      
      // Auto-expand the latest semester
      if (semesterData.length > 0) {
        const latestSemester = semesterData[semesterData.length - 1];
        const semesterKey = `${latestSemester.academicYear}-${latestSemester.semesterType}`;
        setExpandedSemesters(new Set([semesterKey]));
      }
    } catch (error: any) {
      console.error('Error fetching course history:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to fetch course history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate semester number based on academic year and semester type
  const calculateSemesterNumber = (academicYear: number, semesterType: number, admissionYear: number) => {
    const yearDiff = academicYear - admissionYear;
    return (yearDiff * 2) + semesterType;
  };

  // Get admission year (assuming it's available in statistics or can be calculated)
  const admissionYear = statistics ? (new Date().getFullYear() - Math.ceil(statistics.totalSemesters / 2)) : 2020;

  // Sort semesters by semester number (latest first)
  const sortedSemesters = [...semesters]
    .map(semester => ({
      ...semester,
      semesterNumber: calculateSemesterNumber(semester.academicYear, semester.semesterType, admissionYear)
    }))
    .sort((a, b) => b.semesterNumber - a.semesterNumber);

  const toggleSemester = (academicYear: number, semesterType: number) => {
    const key = `${academicYear}-${semesterType}`;
    const newExpandedSemesters = new Set(expandedSemesters);
    if (newExpandedSemesters.has(key)) {
      newExpandedSemesters.delete(key);
    } else {
      newExpandedSemesters.add(key);
    }
    setExpandedSemesters(newExpandedSemesters);
  };

  const getAttemptBadge = (attemptType: string) => {
    switch (attemptType) {
      case 'Backlog':
        return <Badge className="text-xs bg-destructive/10 text-destructive">Backlog</Badge>;
      case 'Improvement':
        return <Badge className="text-xs bg-blue-500/10 text-blue-500">Improvement</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Regular</Badge>;
    }
  };

  const getGradeIcon = (grade: string) => {
    const passGrades = ['A+', 'A', 'B+', 'B', 'C', 'D'];
    return passGrades.includes(grade) ? (
      <CheckCircle className="h-4 w-4 text-primary" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl sm:rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in px-3 sm:px-0">
      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs text-muted-foreground">CPI</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary">{statistics.cpi.toFixed(2)}</p>
          </div>
          
          <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Courses</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-secondary">{statistics.uniqueCourses}</p>
            <p className="text-xs text-muted-foreground">{statistics.totalAttempts} attempts</p>
          </div>
          
          <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Credits</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary">{statistics.earnedCredits}</p>
            <p className="text-xs text-muted-foreground">earned</p>
          </div>
          
          <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Semesters</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{statistics.totalSemesters}</p>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'semester' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('semester')}
          className="rounded-lg text-xs sm:text-sm"
        >
          Semester View
        </Button>
        <Button
          variant={viewMode === 'course' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('course')}
          className="rounded-lg text-xs sm:text-sm"
        >
          Course View
        </Button>
      </div>

      {/* Semester View */}
      {viewMode === 'semester' && (
        <div className="space-y-3 sm:space-y-4">
          {sortedSemesters.map((semester, index) => {
            const semesterKey = `${semester.academicYear}-${semester.semesterType}`;
            const isExpanded = expandedSemesters.has(semesterKey);
            const isLatestSemester = index === 0;

            return (
              <div key={semesterKey} className="glass-card rounded-xl overflow-hidden">
                {/* Semester Header - Mobile Optimized */}
                <div 
                  className="p-3 sm:p-4 bg-primary/5 border-b border-border cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => toggleSemester(semester.academicYear, semester.semesterType)}
                >
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                        <h3 className="font-bold text-lg text-foreground">
                          Semester {semester.semesterNumber}
                        </h3>
                        {isLatestSemester && (
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-0.5">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{semester.sgpa.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">SGPA</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{semester.courses.length} courses</span>
                      <span>{semester.totalCredits} credits</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Academic Year {semester.academicYear} • {semester.semesterType === 1 ? 'Odd' : 'Even'} Semester
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                          <h3 className="font-bold text-lg text-foreground">
                            Semester {semester.semesterNumber}
                            {isLatestSemester && (
                              <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 text-xs">
                                Current
                              </Badge>
                            )}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{semester.courses.length} courses</span>
                        <span>{semester.totalCredits} credits</span>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">SGPA</p>
                          <p className="text-lg font-bold text-primary">{semester.sgpa.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Academic Year {semester.academicYear} • {semester.semesterType === 1 ? 'Odd' : 'Even'} Semester
                    </div>
                  </div>
                </div>

                {/* Courses Content */}
                {isExpanded && (
                  <div className="divide-y divide-border">
                    {semester.courses.map((course, courseIndex) => (
                      <div key={courseIndex} className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                        {/* Mobile Course Layout */}
                        <div className="block sm:hidden">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-mono text-sm font-bold text-foreground">
                                  {course.courseCode}
                                </span>
                                <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                              </div>
                              <p className="text-sm text-foreground leading-tight">{course.courseName}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getGradeIcon(course.grade)}
                              <div className="text-right">
                                <p className="text-lg font-bold text-foreground">{course.grade}</p>
                                <p className="text-xs text-muted-foreground">{course.gradePoints.toFixed(1)}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-start">
                            {getAttemptBadge(course.attemptType)}
                          </div>
                        </div>

                        {/* Desktop Course Layout */}
                        <div className="hidden sm:flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-mono text-sm font-bold text-foreground">
                                {course.courseCode}
                              </span>
                              <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                              {getAttemptBadge(course.attemptType)}
                            </div>
                            <p className="text-sm text-foreground">{course.courseName}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getGradeIcon(course.grade)}
                            <div className="text-right">
                              <p className="text-lg font-bold text-foreground">{course.grade}</p>
                              <p className="text-xs text-muted-foreground">{course.gradePoints.toFixed(1)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Course View */}
      {viewMode === 'course' && (
        <div className="space-y-4">
          {courseAttempts.map((courseDetail, index) => (
            <div key={index} className="glass-card rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="p-4 bg-secondary/5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-base font-bold text-foreground">
                        {courseDetail.courseCode}
                      </span>
                      <Badge variant="outline" className="text-xs">{courseDetail.credits} cr</Badge>
                      {courseDetail.totalAttempts > 1 && (
                        <Badge className="text-xs bg-secondary/10 text-secondary">
                          {courseDetail.totalAttempts} attempts
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{courseDetail.courseName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Best Grade</p>
                    <p className="text-2xl font-bold text-primary">{courseDetail.bestGrade}</p>
                    <p className="text-xs text-muted-foreground">{courseDetail.bestGradePoints.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {courseDetail.attempts.map((attempt, attemptIndex) => (
                  <div key={attemptIndex} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-bold">
                          {attempt.attemptNumber}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{attempt.semester}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getAttemptBadge(attempt.attemptType)}
                            <span className="text-xs text-muted-foreground">
                              Attempt {attempt.attemptNumber} of {courseDetail.totalAttempts}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getGradeIcon(attempt.grade)}
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{attempt.grade}</p>
                          <p className="text-xs text-muted-foreground">{attempt.gradePoints.toFixed(1)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && semesters.length === 0 && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No course history available</p>
        </div>
      )}
    </div>
  );
};

export default CourseHistory;
