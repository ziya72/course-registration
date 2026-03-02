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
  Loader2
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

  useEffect(() => {
    fetchCourseHistory();
  }, []);

  const fetchCourseHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/student/course-history');
      setSemesters(response.data.semesters || []);
      setCourseAttempts(response.data.courseAttempts || []);
      setStatistics(response.data.statistics || null);
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card rounded-xl sm:rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">CPI</span>
            </div>
            <p className="text-2xl font-bold text-primary">{statistics.cpi.toFixed(2)}</p>
          </div>
          
          <div className="glass-card rounded-xl sm:rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-secondary" />
              <span className="text-xs text-muted-foreground">Courses</span>
            </div>
            <p className="text-2xl font-bold text-secondary">{statistics.uniqueCourses}</p>
            <p className="text-xs text-muted-foreground">{statistics.totalAttempts} attempts</p>
          </div>
          
          <div className="glass-card rounded-xl sm:rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Credits</span>
            </div>
            <p className="text-2xl font-bold text-primary">{statistics.earnedCredits}</p>
            <p className="text-xs text-muted-foreground">earned</p>
          </div>
          
          <div className="glass-card rounded-xl sm:rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Semesters</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{statistics.totalSemesters}</p>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'semester' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('semester')}
          className="rounded-lg"
        >
          Semester View
        </Button>
        <Button
          variant={viewMode === 'course' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('course')}
          className="rounded-lg"
        >
          Course View
        </Button>
      </div>

      {/* Semester View */}
      {viewMode === 'semester' && (
        <div className="space-y-4">
          {semesters.map((semester, index) => (
            <div key={index} className="glass-card rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="p-4 bg-primary/5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-foreground">
                      Semester {semester.semesterType === 1 ? 'Odd' : 'Even'} ({semester.academicYear})
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {semester.courses.length} courses • {semester.totalCredits} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">SGPA</p>
                    <p className="text-2xl font-bold text-primary">{semester.sgpa.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {semester.courses.map((course, courseIndex) => (
                  <div key={courseIndex} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
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
            </div>
          ))}
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
