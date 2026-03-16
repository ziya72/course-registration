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
  BookOpen,
  Loader2,
  Users
} from 'lucide-react';
import { getAvailableCoursesWithFilter, registerForCourses, type Course } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ModeSelector from './ModeSelector';

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [electiveGroups, setElectiveGroups] = useState<ElectiveGroup[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedModes, setSelectedModes] = useState<Map<string, 'A' | 'B' | 'C'>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('eligible');
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
    .reduce((sum, c) => sum + Number(c.credits), 0);

  const creditProgress = (selectedCredits / maxCredits) * 100;

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
      const eligibleResponse = await getAvailableCoursesWithFilter('eligible');
      const eligibleData = eligibleResponse.courses || [];
      setEligibleCourses(eligibleData);
      setElectiveGroups(eligibleResponse.electiveGroups || []);
      setDeadlines(eligibleResponse.deadlines || null);
      
      // Fetch backlog courses
      const backlogResponse = await getAvailableCoursesWithFilter('backlog');
      const backlogData = backlogResponse.courses || [];
      setBacklogCourses(backlogData);
      
      // Fetch improvement courses
      const improvementResponse = await getAvailableCoursesWithFilter('improvement');
      const improvementData = improvementResponse.courses || [];
      setImprovementCourses(improvementData);
      
      // Auto-select only mandatory courses (where isAutoSelected is true)
      const autoSelected = eligibleData
        .filter((c: Course) => c.isAutoSelected === true)
        .map((c: Course) => c.courseCode);
      setSelectedCourses(autoSelected);
      
      // Initialize modes for auto-selected courses
      const initialModes = new Map<string, 'A' | 'B' | 'C'>();
      autoSelected.forEach(courseCode => {
        const course = eligibleData.find((c: Course) => c.courseCode === courseCode);
        if (course) {
          initialModes.set(courseCode, course.registrationMode || 'A');
        }
      });
      setSelectedModes(initialModes);
      
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
    // Check if this is a mandatory course (cannot be deselected)
    const mandatoryCourse = eligibleCourses.find(c => c.courseCode === courseCode);
    
    if (mandatoryCourse && mandatoryCourse.isAutoSelected) {
      toast({
        title: 'Cannot deselect',
        description: 'Mandatory courses must be registered',
        variant: 'destructive',
      });
      return;
    }

    setSelectedCourses(prev => {
      const newSelected = prev.includes(courseCode)
        ? prev.filter(code => code !== courseCode)
        : [...prev, courseCode];
      
      // If selecting a course, set default mode
      if (!prev.includes(courseCode)) {
        setSelectedModes(prevModes => {
          const newModes = new Map(prevModes);
          const defaultMode = course.registrationMode || course.allowedModes?.[0] || 'A';
          newModes.set(courseCode, defaultMode as 'A' | 'B' | 'C');
          return newModes;
        });
      } else {
        // If deselecting, remove mode
        setSelectedModes(prevModes => {
          const newModes = new Map(prevModes);
          newModes.delete(courseCode);
          return newModes;
        });
      }
      
      return newSelected;
    });
  };

  const handleModeChange = (courseCode: string, mode: 'A' | 'B' | 'C') => {
    setSelectedModes(prev => {
      const newModes = new Map(prev);
      newModes.set(courseCode, mode);
      return newModes;
    });
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
      
      // Map courses to their registration types and modes
      const coursesToRegister = selectedCourses.map(courseCode => {
        // Find course details
        const courseDetails = 
          eligibleCourses.find(c => c.courseCode === courseCode) ||
          backlogCourses.find(c => c.courseCode === courseCode) ||
          improvementCourses.find(c => c.courseCode === courseCode);
        
        const registrationType = courseDetails?.registrationType || 'regular';
        const registrationMode = selectedModes.get(courseCode) || 'A';
        
        return {
          courseCode,
          registrationType,
          registrationMode,
        };
      });

      const response = await registerForCourses(coursesToRegister);

      // Show detailed results
      if (response.errors && response.errors.length > 0) {
        // Some courses failed
        const successCount = response.registered.length;
        const errorCount = response.errors.length;
        
        toast({
          title: `Partial Success: ${successCount}/${successCount + errorCount} courses registered`,
          description: `${successCount} courses registered successfully. ${errorCount} failed.`,
          variant: successCount > 0 ? 'default' : 'destructive',
        });
        
        // Show detailed errors
        response.errors.forEach(error => {
          toast({
            title: `${error.courseCode} Registration Failed`,
            description: error.error,
            variant: 'destructive',
          });
        });
      } else {
        // All courses succeeded
        toast({
          title: 'Registration Successful',
          description: `Registered for ${response.registered.length} courses (${response.totalCredits} credits)`,
        });
      }

      // Navigate back to dashboard to show registered courses
      onBack();
    } catch (error: any) {
      console.error('❌ Error registering courses:', error);
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.error || 'Failed to register courses',
        variant: 'destructive',
      });
    } finally {
      setRegistering(false);
    }
  };

  // Helper function to get course type badge with appropriate color
  const getCourseTypeBadge = (course: Course) => {
    if (course.isAutoSelected) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs whitespace-nowrap">
          Mandatory
        </Badge>
      );
    }
    
    if (course.isElective) {
      // Check if it's departmental or open elective based on course code or elective group
      const isDepartmentalElective = course.electiveGroup && 
        (course.electiveGroup.toLowerCase().includes('dept') || 
         course.electiveGroup.toLowerCase().includes('departmental') ||
         course.courseCode.startsWith('CS') || 
         course.courseCode.startsWith('IT'));
      
      if (isDepartmentalElective) {
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs whitespace-nowrap">
            Dept. Elective
          </Badge>
        );
      } else {
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs whitespace-nowrap">
            Open Elective
          </Badge>
        );
      }
    }
    
    return null;
  };

  // Helper function to get course card border style based on course type and selection
  const getCourseCardBorderStyle = (course: Course, isSelected: boolean) => {
    if (isSelected) {
      return 'border-2 border-primary shadow-md'; // Selected state overrides course type
    }
    
    if (course.isAutoSelected) {
      return 'border-2 border-amber-300 hover:border-primary/50'; // Amber border for mandatory courses
    }
    
    if (course.isElective) {
      const isDepartmentalElective = course.electiveGroup && 
        (course.electiveGroup.toLowerCase().includes('dept') || 
         course.electiveGroup.toLowerCase().includes('departmental') ||
         course.courseCode.startsWith('CS') || 
         course.courseCode.startsWith('IT'));
      
      if (isDepartmentalElective) {
        return 'border-2 border-blue-300 hover:border-primary/50'; // Blue border for dept elective
      } else {
        return 'border-2 border-purple-300 hover:border-primary/50'; // Purple border for open elective
      }
    }
    
    return 'border border-muted hover:border-primary/50'; // Default border
  };

  // Helper function to get registration type badge
  const getRegistrationTypeBadge = (course: Course) => {
    if (course.registrationType === 'backlog') {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs whitespace-nowrap">
          Backlog
        </Badge>
      );
    }
    if (course.registrationType === 'improvement') {
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs whitespace-nowrap">
          Improvement
        </Badge>
      );
    }
    return null;
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => {
    const searchLower = searchTerm.toLowerCase();
    return (
      course.courseCode.toLowerCase().includes(searchLower) ||
      course.courseName.toLowerCase().includes(searchLower) ||
      course.courseType.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in max-w-6xl mx-auto px-2 sm:px-0">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
              className="rounded-lg h-8 sm:h-9 px-2 sm:px-3"
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
              <span className="sm:hidden">←</span>
            </Button>
            <div>
              <h2 className="font-bold text-lg sm:text-xl text-foreground">Course Registration</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Semester {studentData?.currentSemester || 1}</p>
            </div>
          </div>
        </div>
        
        {/* Student Info Card - Mobile Friendly */}
        <div className="glass-card rounded-lg p-3 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold text-sm">
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground text-sm truncate">
                {user?.name || 'Student'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Progress - Mobile Optimized */}
      <div className="glass-card rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="font-semibold text-foreground text-sm sm:text-base">Selected Credits</h3>
          <span className="font-bold text-lg sm:text-xl text-primary">
            {selectedCredits} / {maxCredits}
          </span>
        </div>
        <Progress value={creditProgress} className="h-2" />
        <div className="flex justify-between mt-2 text-xs sm:text-sm text-muted-foreground">
          <span>{selectedCourses.length} courses selected</span>
          <span className={selectedCredits > maxCredits ? 'text-destructive font-medium' : ''}>
            {selectedCredits > maxCredits ? 'Exceeds limit!' : `${maxCredits - selectedCredits} remaining`}
          </span>
        </div>
      </div>

      {/* Search and Filter - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-lg"
            />
          </div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eligible">Eligible Courses</SelectItem>
            <SelectItem value="backlog">Backlog Courses</SelectItem>
            <SelectItem value="improvement">Improvement Courses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass-card rounded-xl p-12 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading courses...</p>
          </div>
        </div>
      )}

      {/* Course List - Separated Cards */}
      {!loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                {filter === 'backlog' ? 'Backlog Courses' : 
                 filter === 'improvement' ? 'Improvement Courses' : 
                 'Available Courses'}
              </h3>
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredCourses.length} courses
            </Badge>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No courses found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <div 
                  key={course.courseCode}
                  className={`glass-card course-card rounded-xl p-3 sm:p-4 transition-all duration-200 ${getCourseCardBorderStyle(course, selectedCourses.includes(course.courseCode))}`}
                >
                  <div 
                    onClick={() => !course.isAutoSelected && toggleCourse(course.courseCode, course)}
                    className={`${course.isAutoSelected ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center gap-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0">
                        <Checkbox
                          checked={selectedCourses.includes(course.courseCode)}
                          disabled={course.isAutoSelected === true}
                          className="h-3.5 w-3.5 sm:h-5 sm:w-5 scale-50 sm:scale-100"
                        />
                      </div>
                      
                      {/* Course Code */}
                      <div className="flex-shrink-0 w-20">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {course.courseCode}
                        </span>
                      </div>
                      
                      {/* Credits */}
                      <div className="flex-shrink-0">
                        <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
                          {course.credits} Credits
                        </Badge>
                      </div>
                      
                      {/* Course Name */}
                      <div className="flex-1 min-w-0 px-2">
                        <h4 className="font-medium text-foreground text-sm leading-tight">
                          {course.courseName}
                        </h4>
                      </div>
                      
                      {/* Mode Selection - Show when selected */}
                      <div className="flex-shrink-0">
                        {selectedCourses.includes(course.courseCode) && (
                          <ModeSelector
                            courseCode={course.courseCode}
                            registrationType={course.registrationType || 'regular'}
                            allowedModes={course.allowedModes || ['A']}
                            selectedMode={selectedModes.get(course.courseCode) || 'A'}
                            onModeChange={(mode) => handleModeChange(course.courseCode, mode)}
                            attemptNumber={course.attemptNumber}
                            lastGrade={course.lastGrade}
                            courseType={course.courseType}
                          />
                        )}
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex-shrink-0 flex gap-2 items-center min-w-0">
                        {getCourseTypeBadge(course)}
                        {getRegistrationTypeBadge(course)}
                      </div>
                    </div>

                    {/* Mobile Layout - Redesigned */}
                    <div className="md:hidden">
                      {/* Top Row - Course Code, Checkbox, and Status Badges */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Checkbox
                            checked={selectedCourses.includes(course.courseCode)}
                            disabled={course.isAutoSelected === true}
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 scale-50 sm:scale-100"
                          />
                          <div className="min-w-0">
                            <div className="font-mono text-lg font-bold text-foreground mb-1">
                              {course.courseCode}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <BookOpen className="h-3 w-3" />
                              <span>{course.courseType}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {getCourseTypeBadge(course)}
                          {getRegistrationTypeBadge(course)}
                          <Badge variant="outline" className="text-xs font-medium">
                            {course.credits} Credits
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Course Name */}
                      <div className="mb-3">
                        <h4 className="font-medium text-foreground text-base leading-snug">
                          {course.courseName}
                        </h4>
                      </div>
                      
                      {/* Compact Info Row */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        {course.maxSeats && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{course.availableSeats || 0}/{course.maxSeats} seats</span>
                          </div>
                        )}
                        
                        {course.registrationType === 'improvement' && course.currentGrade && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Grade: {course.currentGrade}</span>
                          </div>
                        )}
                        
                        {(course.attemptNumber || course.lastGrade) && (
                          <div className="flex items-center gap-2">
                            {course.attemptNumber && (
                              <span>Attempt #{course.attemptNumber}</span>
                            )}
                            {course.lastGrade && (
                              <span>Last: {course.lastGrade}</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Mode Selection (Mobile) - Only when selected */}
                      {selectedCourses.includes(course.courseCode) && (
                        <div className="pt-3 border-t border-muted/30">
                          <div className="text-xs text-muted-foreground mb-2 font-medium">Registration Mode:</div>
                          <ModeSelector
                            courseCode={course.courseCode}
                            registrationType={course.registrationType || 'regular'}
                            allowedModes={course.allowedModes || ['A']}
                            selectedMode={selectedModes.get(course.courseCode) || 'A'}
                            onModeChange={(mode) => handleModeChange(course.courseCode, mode)}
                            attemptNumber={course.attemptNumber}
                            lastGrade={course.lastGrade}
                            courseType={course.courseType}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Desktop Course Details - Second Row */}
                    <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground mt-2 ml-9">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" />
                        <span>{course.courseType}</span>
                      </div>
                      
                      {course.maxSeats && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3" />
                          <span>{course.availableSeats || 0}/{course.maxSeats} seats</span>
                        </div>
                      )}
                      
                      {course.registrationType === 'improvement' && course.currentGrade && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3" />
                          <span>Current Grade: {course.currentGrade}</span>
                        </div>
                      )}
                      
                      {(course.attemptNumber || course.lastGrade) && (
                        <div className="flex items-center gap-2">
                          {course.attemptNumber && (
                            <span>Attempt #{course.attemptNumber}</span>
                          )}
                          {course.lastGrade && (
                            <span>Last Grade: {course.lastGrade}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Bar - Mobile Optimized */}
      {!loading && (
        <div className="glass-card rounded-xl p-4 sticky bottom-4">
          {/* Mobile Layout */}
          <div className="block sm:hidden space-y-3">
            <div className="text-center">
              <p className="font-semibold text-foreground text-lg">
                {selectedCourses.length} courses • {selectedCredits} credits
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedCredits > maxCredits ? (
                  <span className="text-destructive font-medium">Credit limit exceeded!</span>
                ) : (
                  `${maxCredits - selectedCredits} credits remaining`
                )}
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                disabled={selectedCourses.length === 0 || selectedCredits > maxCredits || registering}
                onClick={handleRegister}
                size="sm"
              >
                {registering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Registering...
                  </>
                ) : (
                  'Confirm Registration'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={fetchAllCourses}
                className="rounded-lg w-full"
                size="sm"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">
                {selectedCourses.length} courses selected • {selectedCredits} credits
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedCredits > maxCredits ? (
                  <span className="text-destructive font-medium">Credit limit exceeded!</span>
                ) : (
                  `${maxCredits - selectedCredits} credits remaining`
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={fetchAllCourses}
                className="rounded-lg"
              >
                Refresh
              </Button>
              <Button 
                className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                disabled={selectedCourses.length === 0 || selectedCredits > maxCredits || registering}
                onClick={handleRegister}
              >
                {registering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
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