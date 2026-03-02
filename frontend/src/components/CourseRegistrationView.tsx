import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft,
  Search, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  BookOpen,
  Info,
  Loader2,
  Clock
} from 'lucide-react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Course {
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  isElective: boolean;
  electiveGroup: string | null;
  courseType: string;
  isAutoSelected?: boolean;
  registrationType?: 'regular' | 'backlog' | 'improvement';
  previousAttempts?: number;
  lastGrade?: string;
  lastGradePoints?: number;
  currentGrade?: string;
  currentGradePoints?: number;
  prerequisites?: Array<{
    courseCode: string;
    courseName: string;
    minGrade: number;
  }>;
}

interface ElectiveGroup {
  groupCode: string;
  groupName: string;
  minSelection: number;
  maxSelection: number;
  courses: Course[];
}

interface CourseRegistrationViewProps {
  onBack: () => void | Promise<void>;
}

const CourseRegistrationView = ({ onBack }: CourseRegistrationViewProps) => {
  const { user, studentData } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]); // Currently displayed courses based on filter
  const [electiveGroups, setElectiveGroups] = useState<ElectiveGroup[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]); // All selected courses across all filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('eligible'); // Default to 'eligible'
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deadlines, setDeadlines] = useState<any>(null);
  
  // Store all course types separately
  const [eligibleCourses, setEligibleCourses] = useState<Course[]>([]);
  const [backlogCourses, setBacklogCourses] = useState<Course[]>([]);
  const [improvementCourses, setImprovementCourses] = useState<Course[]>([]);

  const maxCredits = 40;
  
  // Calculate total credits from ALL selected courses (across all filters)
  const allCoursesList = [...eligibleCourses, ...backlogCourses, ...improvementCourses];
  const selectedCredits = allCoursesList
    .filter(c => selectedCourses.includes(c.courseCode))
    .reduce((sum, c) => sum + c.credits, 0);

  const creditProgress = (selectedCredits / maxCredits) * 100;

  // Calculate days remaining
  const registrationDeadline = deadlines?.registration ? new Date(deadlines.registration) : null;
  const daysUntilDeadline = registrationDeadline 
    ? Math.ceil((registrationDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Fetch all course types on mount
  useEffect(() => {
    fetchAllCourses();
  }, []);
  
  // Update displayed courses when filter changes
  useEffect(() => {
    updateDisplayedCourses();
  }, [filter, eligibleCourses, backlogCourses, improvementCourses]);

  // Fetch all course types once on mount
  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch eligible courses
      const eligibleResponse = await api.get(`/api/courses/available?filter=eligible`);
      const eligibleData = eligibleResponse.data.courses || [];
      setEligibleCourses(eligibleData);
      setElectiveGroups(eligibleResponse.data.electiveGroups || []);
      setDeadlines(eligibleResponse.data.deadlines || null);
      
      // Fetch backlog courses
      const backlogResponse = await api.get(`/api/courses/available?filter=backlog`);
      const backlogData = backlogResponse.data.courses || [];
      setBacklogCourses(backlogData);
      
      // Fetch improvement courses
      const improvementResponse = await api.get(`/api/courses/available?filter=improvement`);
      const improvementData = improvementResponse.data.courses || [];
      setImprovementCourses(improvementData);
      
      // Auto-select ALL eligible courses (both mandatory and elective)
      const autoSelected = eligibleData.map((c: Course) => c.courseCode);
      setSelectedCourses(autoSelected);
      
      console.log('📚 All courses loaded:', {
        eligible: eligibleData.length,
        backlog: backlogData.length,
        improvement: improvementData.length,
        autoSelected: autoSelected.length,
      });
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to fetch courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update displayed courses based on current filter
  const updateDisplayedCourses = () => {
    switch (filter) {
      case 'eligible':
        setCourses(eligibleCourses);
        break;
      case 'backlog':
        setCourses(backlogCourses);
        break;
      case 'improvement':
        setCourses(improvementCourses);
        break;
      default:
        setCourses(eligibleCourses);
    }
  };

  const toggleCourse = (courseCode: string, course: Course) => {
    // Check if this is an eligible course (cannot be deselected)
    const isEligibleCourse = eligibleCourses.some(c => c.courseCode === courseCode);
    
    if (isEligibleCourse) {
      toast({
        title: 'Cannot deselect',
        description: 'Eligible courses are mandatory for registration',
        variant: 'destructive',
      });
      return;
    }
    
    // Toggle selection for backlog/improvement courses
    setSelectedCourses(prev => 
      prev.includes(courseCode) 
        ? prev.filter(id => id !== courseCode)
        : [...prev, courseCode]
    );
  };

  const handleRegister = async () => {
    if (selectedCourses.length === 0) {
      toast({
        title: 'No courses selected',
        description: 'Please select at least one course',
        variant: 'destructive',
      });
      return;
    }

    try {
      setRegistering(true);
      
      // Map courses to their registration types
      // Map selected courses to their registration types from all course lists
      const coursesToRegister = selectedCourses.map(courseCode => {
        // Find course in eligible, backlog, or improvement lists
        const course = [...eligibleCourses, ...backlogCourses, ...improvementCourses]
          .find(c => c.courseCode === courseCode);
        
        return {
          courseCode,
          registrationType: course?.registrationType || 'regular',
        };
      });

      const response = await api.post('/api/courses/register', {
        courses: coursesToRegister,
      });

      toast({
        title: 'Registration Successful',
        description: `Registered for ${response.data.registered.length} courses (${response.data.totalCredits} credits)`,
      });

      // Navigate back to dashboard to show registered courses
      onBack();
    } catch (error: any) {
      console.error('Error registering courses:', error);
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.error || 'Failed to register courses',
        variant: 'destructive',
      });
    } finally {
      setRegistering(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusText = (course: Course) => {
    const isEligible = eligibleCourses.some(c => c.courseCode === course.courseCode);
    if (isEligible) return course.isElective ? 'Eligible (Elective)' : 'Eligible (Mandatory)';
    if (course.registrationType === 'backlog') return `Backlog (${course.previousAttempts} attempts)`;
    if (course.registrationType === 'improvement') return `Improvement (Current: ${course.currentGrade})`;
    return 'Available';
  };

  const getStatusColor = (course: Course) => {
    const isEligible = eligibleCourses.some(c => c.courseCode === course.courseCode);
    if (isEligible) return 'text-primary';
    if (course.registrationType === 'backlog') return 'text-destructive';
    if (course.registrationType === 'improvement') return 'text-blue-500';
    return 'text-muted-foreground';
  };

  const getBadge = (course: Course) => {
    const isEligible = eligibleCourses.some(c => c.courseCode === course.courseCode);
    
    if (isEligible) {
      return <Badge className="text-xs bg-primary/10 text-primary">Eligible</Badge>;
    }
    if (course.registrationType === 'backlog') {
      return <Badge className="text-xs bg-destructive/10 text-destructive">Backlog</Badge>;
    }
    if (course.registrationType === 'improvement') {
      return <Badge className="text-xs bg-blue-500/10 text-blue-500">Improvement</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-3 sm:space-y-6 animate-fade-in">
      {/* Header with Back Button */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border-l-4 border-primary">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="rounded-lg h-8 px-2 sm:px-3 text-xs shrink-0"
            >
              <ArrowLeft className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Course Registration</p>
              <h2 className="font-bold text-sm sm:text-base text-foreground truncate">
                Semester {studentData?.currentSemester || 1}
              </h2>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20 text-[10px] sm:text-xs self-start sm:self-auto max-w-full truncate">
            <span className="font-mono truncate">{user?.name || 'Student'}</span>
          </Badge>
        </div>
      </div>

      {/* Registration Deadline Warning */}
      {daysUntilDeadline !== null && daysUntilDeadline > 0 && daysUntilDeadline <= 7 && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 border-l-4 border-destructive bg-destructive/5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-sm text-destructive">Registration Deadline Approaching!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Only <span className="font-bold text-destructive">{daysUntilDeadline} days</span> remaining.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Credit Selection Progress */}
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-5 border-l-4 border-secondary">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm sm:text-base text-foreground">Credit Selection Progress</h3>
          <span className="font-bold text-lg sm:text-xl text-secondary">
            {selectedCredits} / {maxCredits} credits
          </span>
        </div>
        <Progress value={creditProgress} className="h-3 sm:h-4" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-primary" />
            {selectedCredits <= maxCredits ? 'Within limit' : 'Exceeds limit'}
          </span>
          <span>{maxCredits - selectedCredits} credits remaining</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="relative col-span-2 sm:col-span-1">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 block">Search</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 rounded-lg h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1 block">Filter</label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="rounded-lg h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Eligible" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="eligible">Eligible Courses</SelectItem>
              <SelectItem value="backlog">Backlog Courses</SelectItem>
              <SelectItem value="improvement">Improvement Courses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Available Courses Table */}
      {!loading && (
        <div className="glass-card rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              {filter === 'backlog' ? 'Backlog Courses' : 
               filter === 'improvement' ? 'Improvement Courses' : 
               'Eligible Courses (Auto-selected)'}
            </h3>
          </div>

          {/* Table Header - Desktop */}
          <div className="hidden sm:grid grid-cols-12 gap-3 p-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <div className="col-span-1">Select</div>
            <div className="col-span-2">Course Code</div>
            <div className="col-span-4">Course Name</div>
            <div className="col-span-1">Credits</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
          </div>

          {/* Course Rows */}
          <div className="divide-y divide-border">
            {filteredCourses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No courses found</p>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <div 
                  key={course.courseCode}
                  onClick={() => toggleCourse(course.courseCode, course)}
                  className={`p-3 sm:p-4 transition-colors ${
                    course.isAutoSelected
                      ? 'bg-primary/5 cursor-default' 
                      : selectedCourses.includes(course.courseCode)
                        ? 'bg-secondary/10 hover:bg-secondary/20 cursor-pointer'
                        : 'hover:bg-muted/30 cursor-pointer'
                  }`}
                >
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedCourses.includes(course.courseCode)}
                        disabled={eligibleCourses.some(c => c.courseCode === course.courseCode)}
                        className="h-4 w-4 mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-foreground">{course.courseCode}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{course.credits}Cr</Badge>
                          </div>
                          {getBadge(course)}
                        </div>
                        <p className="text-xs text-foreground font-medium leading-tight line-clamp-2">{course.courseName}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-muted-foreground">{course.courseType}</p>
                          <span className={`text-[10px] ${getStatusColor(course)}`}>
                            {getStatusText(course)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-1">
                      <Checkbox
                        checked={selectedCourses.includes(course.courseCode)}
                        disabled={eligibleCourses.some(c => c.courseCode === course.courseCode)}
                        className="h-5 w-5"
                      />
                    </div>
                    <div className="col-span-2">
                      <span className="font-mono text-sm font-bold text-foreground">{course.courseCode}</span>
                    </div>
                    <div className="col-span-4">
                      <span className="text-sm text-foreground">{course.courseName}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-sm text-muted-foreground">{course.credits}</span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{course.courseType}</span>
                        {getBadge(course)}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className={`text-xs font-medium ${getStatusColor(course)}`}>
                        {getStatusText(course)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats Footer */}
          <div className="p-3 sm:p-4 bg-muted/20 border-t border-border">
            <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
              <span className="text-primary font-medium">{courses.length} courses available</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-secondary font-medium">{selectedCourses.length} selected</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-foreground font-medium">{selectedCredits} / {maxCredits} credits</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Bar */}
      {!loading && (
        <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-4 sticky bottom-2 sm:bottom-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-xs sm:text-base text-foreground">
                {selectedCourses.length} courses • {selectedCredits} credits
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {selectedCredits > maxCredits ? 'Credit limit exceeded!' : `${maxCredits - selectedCredits} credits remaining`}
              </p>
            </div>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAllCourses}
                className="rounded-lg text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
              >
                Refresh
              </Button>
              <Button 
                size="sm" 
                className="rounded-lg text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-4 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                disabled={selectedCourses.length === 0 || selectedCredits > maxCredits || registering}
                onClick={handleRegister}
              >
                {registering ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                    Registering...
                  </>
                ) : (
                  'Confirm Registration'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseRegistrationView;
