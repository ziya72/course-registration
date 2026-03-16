import { useState, useEffect } from 'react';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CSVUploadV2 } from '@/components/CSVUploadV2';
import AddCourseDialog from '@/components/AddCourseDialog';
import CourseFiltersComponent, { CourseFilters } from '@/components/CourseFilters';
import RegistrationControlPanel from '@/components/RegistrationControlPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  BookOpen, 
  ClipboardList,
  ArrowRight,
  Settings,
  BarChart3,
  Shield,
  Sparkles,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Download,
  Bell,
  FileText,
  AlertTriangle,
  TrendingUp,
  Unlock,
  Lock,
  Menu,
  Home,
  Upload,
  Sliders,
  LogOut,
  User
} from 'lucide-react';
import {
  getFacultyDashboardData,
  getStudents,
  getCourses,
  getApprovals,
  approveRegistration,
  rejectRegistration,
  getRegistrationStats,
  getErrorMessage,
} from '@/services/api';

interface DashboardData {
  teacher: {
    id: number;
    name: string;
    email: string;
    department: string;
    role: string;
  };
  statistics: {
    totalStudents: number;
    activeStudents: number;
    totalCourses: number;
    pendingApprovals: number;
  };
  recentActivity: Array<{
    id: number;
    action: string;
    student: string;
    studentId: string;
    course: string;
    courseCode: string;
    time: string;
    status: string;
  }>;
}

interface Student {
  enrollmentNo: string;
  name: string;
  email: string;
  branch: string;
  branchCode: string;
  semester: number;
  cpi: number;
  status: string;
  admissionYear: number;
}

interface Course {
  courseCode: string;
  courseName: string;
  credits: number;
  semester: number;
  branch: string;
  isElective: boolean;
  electiveGroup: string | null;
  courseType: string;
  prerequisites: Array<{
    courseCode: string;
    courseName: string;
    minGrade: string;
  }>;
}

interface Approval {
  id: number;
  studentId: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  credits: number;
  registrationType: string;
  submittedAt: string;
  academicYear: number;
  semester: number;
}

const FacultyDashboard = () => {
  const { isRegistrationEnabled, setIsRegistrationEnabled, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [courseFilters, setCourseFilters] = useState<CourseFilters>({
    sortBy: 'course_code',
    sortOrder: 'asc',
  });
  
  // Student filters and pagination
  const [studentBranchFilter, setStudentBranchFilter] = useState<string>('all');
  const [studentSemesterFilter, setStudentSemesterFilter] = useState<string>('all');
  const [studentCurrentPage, setStudentCurrentPage] = useState(1);
  const [studentRowsPerPage] = useState(10);
  
  // Course pagination
  const [courseCurrentPage, setCourseCurrentPage] = useState(1);
  const [courseRowsPerPage] = useState(25);
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching faculty dashboard data...');
        const data = await getFacultyDashboardData();
        console.log('Dashboard data received:', data);
        console.log('Statistics:', data?.statistics);
        console.log('Teacher:', data?.teacher);
        setDashboardData(data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Fetch students when tab changes
  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    }
  }, [activeTab]);

  // Fetch courses when tab changes
  useEffect(() => {
    if (activeTab === 'courses') {
      fetchCourses();
    }
  }, [activeTab]);

  // Fetch approvals when tab changes
  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchApprovals();
    }
  }, [activeTab]);

  // Fetch stats when tab changes
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    try {
      setIsLoadingStudents(true);
      const data = await getStudents({ search: searchTerm });
      setStudents(data.students);
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setIsLoadingCourses(true);
      const data = await getCourses({
        ...courseFilters,
        search: searchTerm || undefined,
      });
      setCourses(data.courses);
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const fetchApprovals = async () => {
    try {
      setIsLoadingApprovals(true);
      const data = await getApprovals();
      setApprovals(data.approvals);
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getRegistrationStats();
      setStats(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveRegistration(id);
      toast({
        title: 'Success',
        description: 'Registration approved successfully',
      });
      fetchApprovals();
      // Refresh dashboard stats
      const data = await getFacultyDashboardData();
      setDashboardData(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectRegistration(id);
      toast({
        title: 'Success',
        description: 'Registration rejected successfully',
      });
      fetchApprovals();
      // Refresh dashboard stats
      const data = await getFacultyDashboardData();
      setDashboardData(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const filteredStudents = students
    .filter(student => {
      // Search filter
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Branch filter
      const matchesBranch = studentBranchFilter === 'all' || 
        student.branch.toLowerCase().includes(studentBranchFilter.toLowerCase());
      
      // Semester filter
      const matchesSemester = studentSemesterFilter === 'all' || 
        student.semester.toString() === studentSemesterFilter;
      
      return matchesSearch && matchesBranch && matchesSemester;
    });
  
  // Pagination logic for students
  const totalStudentPages = Math.ceil(filteredStudents.length / studentRowsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (studentCurrentPage - 1) * studentRowsPerPage,
    studentCurrentPage * studentRowsPerPage
  );
  
  // Get unique branches and semesters for filters
  const uniqueBranches = Array.from(new Set(students.map(s => s.branch))).sort();
  const uniqueSemesters = Array.from(new Set(students.map(s => s.semester))).sort((a, b) => a - b);
  
  // Reset page when filters change
  useEffect(() => {
    setStudentCurrentPage(1);
  }, [studentBranchFilter, studentSemesterFilter, searchTerm]);
  
  // Pagination logic for courses
  const totalCoursePages = Math.ceil(courses.length / courseRowsPerPage);
  const paginatedCourses = courses.slice(
    (courseCurrentPage - 1) * courseRowsPerPage,
    courseCurrentPage * courseRowsPerPage
  );
  
  // Reset course page when courses change
  useEffect(() => {
    setCourseCurrentPage(1);
  }, [courses.length]);

  // Mobile navigation items
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    ...(isAdmin ? [
      { id: 'approvals', label: 'Approvals', icon: ClipboardList },
      { id: 'upload', label: 'Upload CSV', icon: Upload },
      { id: 'registration-control', label: 'Registration Control', icon: Sliders },
    ] : []),
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen={false} text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  if (!dashboardData || !dashboardData.statistics || !dashboardData.teacher) {
    return <ErrorMessage message="Invalid dashboard data received" />;
  }

  return (
    <div className={`${isMobile ? 'px-1 py-1' : 'px-3 py-3'} space-y-8 sm:space-y-10 animate-fade-in min-h-screen`}>
      {/* Mobile Navigation Header */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-40 bg-background/95 backdrop-blur-md rounded-xl border border-border/50 mx-auto mb-8" style={{ width: '98%' }}>
          <div className="flex items-center gap-3">
            {/* AMU Logo */}
            <img 
              src="https://registration.fyup.amucoe.ac.in/assets/logo.png" 
              alt="AMU Logo" 
              className="h-9 w-9 object-contain"
            />
            <span className="text-xs font-bold text-foreground whitespace-nowrap">
              {isAdmin ? 'Admin Portal' : 'Faculty Portal'}
            </span>
          </div>
          
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-lg h-8 px-3">
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="text-left">
                  {isAdmin ? 'Admin Dashboard' : 'Faculty Dashboard'}
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.id === 'approvals' && dashboardData.statistics.pendingApprovals > 0 && (
                      <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs">
                        {dashboardData.statistics.pendingApprovals}
                      </Badge>
                    )}
                  </button>
                ))}
                
                {/* Logout Button in Mobile Sidebar */}
                <div className="border-t border-border mt-4 pt-4">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main Content Container - Completely Separated */}
      <div className={`${isMobile ? 'px-2' : 'px-4'} transition-all duration-300`} style={{ maxWidth: isMobile ? '100%' : '95%', margin: '0 auto' }}>
        {/* Welcome Header */}
        <div className="flex flex-col gap-2 sm:gap-4 mb-8 sm:mb-10">
          <div>
            {!isMobile && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* AMU Logo for Desktop */}
                  <img 
                    src="https://registration.fyup.amucoe.ac.in/assets/logo.png" 
                    alt="AMU Logo" 
                    className="h-16 w-16 object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-foreground leading-tight">
                      Aligarh Muslim University
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isAdmin ? 'Admin Dashboard' : 'Faculty Dashboard'}
                    </span>
                  </div>
                </div>
                
                {/* Desktop Logout Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full h-9 w-9 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            <h1 className="text-lg sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
              Welcome, <span className="serif-highlight gradient-text">{dashboardData.teacher.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isAdmin ? 'Manage courses, rules, and monitor registrations' : 'View students, courses, and reports'}
            </p>
          </div>
        </div>

        {/* Tabs Navigation - Desktop Only */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {!isMobile && (
            <TabsList className="glass-card p-0.5 sm:p-1 rounded-xl sm:rounded-2xl w-full overflow-x-auto flex">
              <TabsTrigger value="overview" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">Overview</TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">Students</TabsTrigger>
              <TabsTrigger value="courses" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">Courses</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="approvals" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">Approvals</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="upload" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">Upload CSV</TabsTrigger>
              )}
              {isAdmin && (
                <TabsTrigger value="registration-control" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">Registration Control</TabsTrigger>
              )}
              <TabsTrigger value="reports" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-xs sm:text-sm flex-1 sm:flex-none">Reports</TabsTrigger>
            </TabsList>
          )}

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: 'Total Students', value: String(dashboardData.statistics.totalStudents), icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />, change: `${dashboardData.statistics.activeStudents} active` },
              { label: 'Active Courses', value: String(dashboardData.statistics.totalCourses), icon: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />, change: '' },
              { label: 'Pending Approvals', value: String(dashboardData.statistics.pendingApprovals), icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5" />, change: dashboardData.statistics.pendingApprovals > 0 ? 'Urgent' : '' },
            ].map((stat, index) => (
              <div key={index} className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-5">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                    {stat.icon}
                  </div>
                  {stat.change && (
                    <Badge variant="outline" className="text-[9px] sm:text-xs text-primary px-1 sm:px-2">
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <p className="text-lg sm:text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-0.5 sm:mt-1 truncate">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Registration Control & Quick Actions */}
          <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
            {/* Registration Control - Compact Design */}
            <div className="glass-card rounded-xl p-4 border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-bold text-base text-foreground">Registration Control</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Manage registration phases and deadlines through the Registration Control Panel.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-lg text-sm h-8 px-4"
                onClick={() => setActiveTab('registration-control')}
              >
                Open Control Panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions - Fixed Square Buttons */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="font-bold text-base text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Add Course', icon: <Plus className="h-6 w-6" />, action: () => setIsAddCourseDialogOpen(true) },
                  { label: 'Reports', icon: <BarChart3 className="h-6 w-6" />, action: () => setActiveTab('reports') },
                  { label: 'Students', icon: <Users className="h-6 w-6" />, action: () => setActiveTab('students') },
                  { label: 'Export', icon: <Download className="h-6 w-6" />, action: () => {} },
                ].map((action, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="h-24 w-full flex-col gap-2 rounded-xl hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 transition-all duration-200"
                    onClick={action.action}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-white shadow-lg">
                      {action.icon}
                    </div>
                    <span className="text-sm font-bold text-gray-900">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Pending Approvals Alert */}
          {isAdmin && dashboardData.statistics.pendingApprovals > 0 && (
            <div className="glass-card rounded-xl p-4 border border-secondary/20 bg-secondary/5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{dashboardData.statistics.pendingApprovals} Pending Approvals</h3>
                    <p className="text-xs text-muted-foreground">Waiting for review</p>
                  </div>
                </div>
                <Button className="rounded-lg text-xs h-7" onClick={() => setActiveTab('approvals')}>
                  Review
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-xl font-bold text-foreground">Student Records</h2>
              <div className="flex gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-9 h-8 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                  />
                </div>
                <Button variant="outline" className={`rounded-lg sm:rounded-xl h-7 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm`} onClick={fetchStudents}>
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
              <div className="flex-1">
                <select
                  value={studentBranchFilter}
                  onChange={(e) => setStudentBranchFilter(e.target.value)}
                  className="w-full h-8 sm:h-10 px-3 rounded-lg sm:rounded-xl border border-input bg-background text-xs sm:text-sm"
                >
                  <option value="all">All Branches</option>
                  {uniqueBranches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={studentSemesterFilter}
                  onChange={(e) => setStudentSemesterFilter(e.target.value)}
                  className="w-full h-8 sm:h-10 px-3 rounded-lg sm:rounded-xl border border-input bg-background text-xs sm:text-sm"
                >
                  <option value="all">All Semesters</option>
                  {uniqueSemesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground flex items-center px-2">
                Showing {paginatedStudents.length} of {filteredStudents.length} students
              </div>
            </div>
            
            {isLoadingStudents ? (
              <LoadingSpinner fullScreen={false} text="Loading students..." />
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-2">
                  {paginatedStudents.map((student) => (
                    <div key={student.enrollmentNo} className="p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-primary">{student.enrollmentNo}</span>
                        <Badge className={`text-[10px] ${student.status === 'active' 
                          ? 'bg-primary/10 text-primary border-0'
                          : 'bg-destructive/10 text-destructive border-0'
                        }`}>
                          {student.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{student.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{student.branch}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>CPI: <span className={student.cpi >= 8.0 ? 'text-primary font-medium' : ''}>{student.cpi.toFixed(1)}</span></span>
                          <span>Sem: {student.semester}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className={`${isMobile ? 'h-6 w-6' : 'h-7 w-7'} p-0`}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Enrolment No.</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Branch</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">CPI</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Sem</th>
                        <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((student) => (
                        <tr key={student.enrollmentNo} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-sm font-medium text-primary">{student.enrollmentNo}</td>
                          <td className="py-3 px-4 text-sm text-foreground">{student.name}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{student.branch}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-sm ${student.cpi >= 8.0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                              {student.cpi.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-sm text-muted-foreground">{student.semester}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge className={`text-xs ${student.status === 'active' 
                              ? 'bg-primary/10 text-primary border-0'
                              : 'bg-destructive/10 text-destructive border-0'
                            }`}>
                              {student.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {filteredStudents.length > studentRowsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Page {studentCurrentPage} of {totalStudentPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStudentCurrentPage(p => Math.max(1, p - 1))}
                        disabled={studentCurrentPage === 1}
                        className="h-8 px-3 text-xs"
                      >
                        Previous
                      </Button>
                      <div className="flex gap-1">
                        {Array.from({ length: totalStudentPages }, (_, i) => i + 1)
                          .filter(page => {
                            return page === 1 || 
                                   page === totalStudentPages || 
                                   Math.abs(page - studentCurrentPage) <= 1;
                          })
                          .map((page, idx, arr) => (
                            <React.Fragment key={page}>
                              {idx > 0 && arr[idx - 1] !== page - 1 && (
                                <span className="px-2 flex items-center text-muted-foreground">...</span>
                              )}
                              <Button
                                variant={studentCurrentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStudentCurrentPage(page)}
                                className="h-8 w-8 p-0 text-xs"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStudentCurrentPage(p => Math.min(totalStudentPages, p + 1))}
                        disabled={studentCurrentPage >= totalStudentPages}
                        className="h-8 px-3 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Course Rules Tab */}
        <TabsContent value="courses" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-xl font-bold text-foreground">Course Management</h2>
              {isAdmin && (
                <Button 
                  className={`rounded-lg sm:rounded-xl text-xs sm:text-sm ${isMobile ? 'h-7' : 'h-8 sm:h-10'}`}
                  onClick={() => setIsAddCourseDialogOpen(true)}
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Add Course
                </Button>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchCourses();
                    }
                  }}
                  className="pl-8 sm:pl-9 h-8 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm"
                />
              </div>
              <CourseFiltersComponent
                filters={courseFilters}
                onFiltersChange={setCourseFilters}
                onApply={(newFilters) => {
                  // Fetch with the new filters immediately
                  setIsLoadingCourses(true);
                  getCourses({ ...newFilters, search: searchTerm || undefined })
                    .then(data => setCourses(data.courses))
                    .catch(err => toast({
                      title: 'Error',
                      description: getErrorMessage(err),
                      variant: 'destructive',
                    }))
                    .finally(() => setIsLoadingCourses(false));
                }}
              />
              <Button 
                variant="outline" 
                className={`rounded-lg sm:rounded-xl ${isMobile ? 'h-7' : 'h-8 sm:h-10'} px-2 sm:px-3 text-xs sm:text-sm`}
                onClick={fetchCourses}
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </div>

            {/* Active Filters Display */}
            {(courseFilters.branch || courseFilters.semester || courseFilters.courseType || 
              courseFilters.isElective !== undefined || courseFilters.electiveGroup ||
              courseFilters.minCredits || courseFilters.maxCredits || searchTerm) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {courseFilters.branch && (
                  <Badge variant="secondary" className="text-xs">
                    Branch: {courseFilters.branch}
                    <button
                      onClick={() => {
                        const newFilters = { ...courseFilters, branch: undefined };
                        setCourseFilters(newFilters);
                        // Fetch with new filters immediately
                        getCourses({ ...newFilters, search: searchTerm || undefined })
                          .then(data => setCourses(data.courses))
                          .catch(err => toast({
                            title: 'Error',
                            description: getErrorMessage(err),
                            variant: 'destructive',
                          }));
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {courseFilters.semester && (
                  <Badge variant="secondary" className="text-xs">
                    Semester: {courseFilters.semester}
                    <button
                      onClick={() => {
                        const newFilters = { ...courseFilters, semester: undefined };
                        setCourseFilters(newFilters);
                        // Fetch with new filters immediately
                        getCourses({ ...newFilters, search: searchTerm || undefined })
                          .then(data => setCourses(data.courses))
                          .catch(err => toast({
                            title: 'Error',
                            description: getErrorMessage(err),
                            variant: 'destructive',
                          }));
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {courseFilters.courseType && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {courseFilters.courseType}
                    <button
                      onClick={() => {
                        const newFilters = { ...courseFilters, courseType: undefined };
                        setCourseFilters(newFilters);
                        // Fetch with new filters immediately
                        getCourses({ ...newFilters, search: searchTerm || undefined })
                          .then(data => setCourses(data.courses))
                          .catch(err => toast({
                            title: 'Error',
                            description: getErrorMessage(err),
                            variant: 'destructive',
                          }));
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {courseFilters.isElective !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    {courseFilters.isElective ? 'Elective' : 'Core'}
                    <button
                      onClick={() => {
                        const newFilters = { ...courseFilters, isElective: undefined };
                        setCourseFilters(newFilters);
                        // Fetch with new filters immediately
                        getCourses({ ...newFilters, search: searchTerm || undefined })
                          .then(data => setCourses(data.courses))
                          .catch(err => toast({
                            title: 'Error',
                            description: getErrorMessage(err),
                            variant: 'destructive',
                          }));
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {courseFilters.electiveGroup && (
                  <Badge variant="secondary" className="text-xs">
                    Group: {courseFilters.electiveGroup}
                    <button
                      onClick={() => {
                        const newFilters = { ...courseFilters, electiveGroup: undefined };
                        setCourseFilters(newFilters);
                        getCourses({ ...newFilters, search: searchTerm || undefined })
                          .then(data => setCourses(data.courses))
                          .catch(err => toast({
                            title: 'Error',
                            description: getErrorMessage(err),
                            variant: 'destructive',
                          }));
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {(courseFilters.minCredits || courseFilters.maxCredits) && (
                  <Badge variant="secondary" className="text-xs">
                    Credits: {courseFilters.minCredits || 0} - {courseFilters.maxCredits || '∞'}
                    <button
                      onClick={() => {
                        const newFilters = { 
                          ...courseFilters, 
                          minCredits: undefined,
                          maxCredits: undefined 
                        };
                        setCourseFilters(newFilters);
                        getCourses({ ...newFilters, search: searchTerm || undefined })
                          .then(data => setCourses(data.courses))
                          .catch(err => toast({
                            title: 'Error',
                            description: getErrorMessage(err),
                            variant: 'destructive',
                          }));
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        getCourses({ ...courseFilters, search: undefined })
                          .then(data => setCourses(data.courses))
                          .catch(err => toast({
                            title: 'Error',
                            description: getErrorMessage(err),
                            variant: 'destructive',
                          }));
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
            
            {isLoadingCourses ? (
              <LoadingSpinner fullScreen={false} text="Loading courses..." />
            ) : (
              <>
                <div className="space-y-2 sm:space-y-4">
                  {paginatedCourses.map((course) => (
                  <div key={course.courseCode} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-primary">{course.courseCode}</span>
                        <Badge variant="outline" className="text-[10px] sm:text-xs">{course.credits} Cr</Badge>
                        {course.isElective && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">Elective</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base text-foreground mb-0.5 sm:mb-1">{course.courseName}</h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-sm text-muted-foreground">
                        <span>Semester: {course.semester}</span>
                        <span>Branch: {course.branch}</span>
                        {course.prerequisites.length > 0 && (
                          <span>Prerequisites: {course.prerequisites.map(p => p.courseCode).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <Button variant="ghost" size="sm" className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8 sm:h-9 sm:w-9'} p-0`}>
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="sm" className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8 sm:h-9 sm:w-9'} p-0`}>
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8 sm:h-9 sm:w-9'} p-0 text-destructive hover:text-destructive`}>
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Course Pagination Controls */}
              {courses.length > courseRowsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Showing {((courseCurrentPage - 1) * courseRowsPerPage) + 1} to {Math.min(courseCurrentPage * courseRowsPerPage, courses.length)} of {courses.length} courses
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCourseCurrentPage(p => Math.max(1, p - 1))}
                      disabled={courseCurrentPage === 1}
                      className="h-8 px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalCoursePages }, (_, i) => i + 1)
                        .filter(page => {
                          return page === 1 || 
                                 page === totalCoursePages || 
                                 Math.abs(page - courseCurrentPage) <= 1;
                        })
                        .map((page, idx, arr) => (
                          <React.Fragment key={page}>
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-2 flex items-center text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={courseCurrentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCourseCurrentPage(page)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {page}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCourseCurrentPage(p => Math.min(totalCoursePages, p + 1))}
                      disabled={courseCurrentPage >= totalCoursePages}
                      className="h-8 px-3 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
            )}
          </div>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6">
            <h2 className="text-base sm:text-xl font-bold text-foreground mb-4 sm:mb-6">Pending Approvals</h2>
            
            {isLoadingApprovals ? (
              <LoadingSpinner fullScreen={false} text="Loading approvals..." />
            ) : approvals.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {approvals.map((approval) => (
                  <div key={approval.id} className="flex flex-col gap-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-muted/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-primary">{approval.studentId}</span>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="font-mono text-xs sm:text-sm text-secondary">{approval.courseCode}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-foreground">{approval.studentName} → {approval.courseName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{approval.credits} credits • {approval.registrationType}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                        Submitted: {new Date(approval.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        className={`rounded-lg sm:rounded-xl flex-1 sm:flex-none text-xs sm:text-sm ${isMobile ? 'h-7' : 'h-8 sm:h-9'}`}
                        size="sm"
                        onClick={() => handleApprove(approval.id)}
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        className={`rounded-lg sm:rounded-xl flex-1 sm:flex-none text-xs sm:text-sm ${isMobile ? 'h-7' : 'h-8 sm:h-9'}`}
                        size="sm"
                        onClick={() => handleReject(approval.id)}
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {!stats ? (
            <LoadingSpinner fullScreen={false} text="Loading statistics..." />
          ) : (
            <>
              {/* Branch Filter */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <h2 className="text-lg font-bold text-foreground">Registration Analytics</h2>
                  <div className="flex gap-3">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-48 rounded-lg">
                        <SelectValue placeholder="Filter by Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        <SelectItem value="CSE">Computer Science</SelectItem>
                        <SelectItem value="ECE">Electronics & Communication</SelectItem>
                        <SelectItem value="ME">Mechanical Engineering</SelectItem>
                        <SelectItem value="CE">Civil Engineering</SelectItem>
                        <SelectItem value="EE">Electrical Engineering</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="rounded-lg">
                      <Filter className="h-4 w-4 mr-2" />
                      Apply Filter
                    </Button>
                  </div>
                </div>
              </div>

              {/* Key Metrics Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Registration Overview</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: 'Total Registrations', value: stats.overview.total, color: 'bg-gray-500' },
                      { label: 'Approved', value: stats.overview.approved, color: 'bg-gray-600' },
                      { label: 'Pending Review', value: stats.overview.pending, color: 'bg-gray-400' },
                      { label: 'Rejected', value: stats.overview.rejected, color: 'bg-gray-300' },
                    ].map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded ${stat.color}`} />
                          <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                        <span className="font-bold text-base text-foreground">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Popular Courses</h3>
                  </div>
                  <div className="space-y-3">
                    {stats.topCourses && stats.topCourses.length > 0 ? (
                      stats.topCourses.slice(0, 5).map((course: any, index: number) => (
                        <div key={course.courseCode} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="w-6 h-6 rounded bg-gray-500 flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{course.courseCode}</p>
                          </div>
                          <Badge variant="secondary" className="text-sm">
                            {course.registrations}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No registrations yet
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Student Analytics</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Students</span>
                      <span className="font-bold text-base text-foreground">{dashboardData.statistics.activeStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Students</span>
                      <span className="font-bold text-base text-foreground">{dashboardData.statistics.totalStudents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Participation Rate</span>
                      <span className="font-bold text-base text-foreground">
                        {dashboardData.statistics.totalStudents > 0 
                          ? Math.round((dashboardData.statistics.activeStudents / dashboardData.statistics.totalStudents) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Analysis */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="glass-card rounded-xl p-5">
                  <h3 className="font-bold text-base text-foreground mb-5">Registration Status Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Approved', value: stats.overview.approved, total: stats.overview.total, color: 'bg-gray-600' },
                      { label: 'Pending', value: stats.overview.pending, total: stats.overview.total, color: 'bg-gray-400' },
                      { label: 'Rejected', value: stats.overview.rejected, total: stats.overview.total, color: 'bg-gray-300' },
                    ].map((stat, index) => {
                      const percentage = stat.total > 0 ? (stat.value / stat.total) * 100 : 0;
                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">{stat.label}</span>
                            <span className="font-medium text-foreground">{stat.value} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${stat.color} rounded-full transition-all duration-300`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-card rounded-xl p-5">
                  <h3 className="font-bold text-base text-foreground mb-5">Branch-wise Distribution</h3>
                  <div className="space-y-3">
                    {[
                      { branch: 'Computer Science', count: 45, code: 'CSE' },
                      { branch: 'Electronics & Communication', count: 38, code: 'ECE' },
                      { branch: 'Mechanical Engineering', count: 32, code: 'ME' },
                      { branch: 'Civil Engineering', count: 28, code: 'CE' },
                      { branch: 'Electrical Engineering', count: 25, code: 'EE' },
                    ].map((branch, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-foreground">{branch.code}</span>
                          <span className="text-sm text-muted-foreground">{branch.branch}</span>
                        </div>
                        <Badge variant="outline" className="text-sm">{branch.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export and Actions */}
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-base text-foreground">Export Reports</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Registration Report', desc: 'All registrations', icon: <FileText className="h-5 w-5" /> },
                    { label: 'Student Report', desc: 'Student records', icon: <Users className="h-5 w-5" /> },
                    { label: 'Course Analytics', desc: 'Course statistics', icon: <BarChart3 className="h-5 w-5" /> },
                    { label: 'Approval Log', desc: 'Approval history', icon: <CheckCircle className="h-5 w-5" /> },
                  ].map((report, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      className="h-20 flex-col items-center gap-2 rounded-lg hover:bg-primary/5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center text-white">
                        {report.icon}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">{report.label}</div>
                        <div className="text-sm text-muted-foreground">{report.desc}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* CSV Upload Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="upload" className="mt-4 sm:mt-6">
            <CSVUploadV2 />
          </TabsContent>
        )}

        {/* Registration Control Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="registration-control" className="mt-4 sm:mt-6">
            <RegistrationControlPanel />
          </TabsContent>
        )}
      </Tabs>

      {/* Add Course Dialog */}
      {isAdmin && (
        <AddCourseDialog
          open={isAddCourseDialogOpen}
          onOpenChange={setIsAddCourseDialogOpen}
          onSuccess={fetchCourses}
        />
      )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
