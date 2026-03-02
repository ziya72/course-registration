import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CSVUpload } from '@/components/CSVUpload';
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
  Lock
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
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddCourseDialogOpen, setIsAddCourseDialogOpen] = useState(false);
  const [courseFilters, setCourseFilters] = useState<CourseFilters>({
    sortBy: 'course_code',
    sortOrder: 'asc',
  });
  
  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 sm:gap-2 glass-card px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-2 sm:mb-4">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-secondary" />
            <span className="text-foreground">{isAdmin ? 'Admin Dashboard' : 'Faculty Dashboard'}</span>
          </div>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">
            Welcome, <span className="serif-highlight gradient-text">{dashboardData.teacher.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isAdmin ? 'Manage courses, rules, and monitor registrations' : 'View students, courses, and reports'}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="rounded-full text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Alerts</span>
            <Badge className="ml-1 sm:ml-2 bg-destructive text-destructive-foreground text-[10px] sm:text-xs">{dashboardData.statistics.pendingApprovals}</Badge>
          </Button>
          <Button variant="outline" size="sm" className="rounded-full h-8 w-8 sm:h-9 sm:w-9 p-0">
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card p-0.5 sm:p-1 rounded-xl sm:rounded-2xl w-full overflow-x-auto flex">
          <TabsTrigger value="overview" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-[10px] sm:text-sm flex-1 sm:flex-none">Overview</TabsTrigger>
          <TabsTrigger value="students" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-[10px] sm:text-sm flex-1 sm:flex-none">Students</TabsTrigger>
          <TabsTrigger value="courses" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-[10px] sm:text-sm flex-1 sm:flex-none">Courses</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="approvals" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-[10px] sm:text-sm flex-1 sm:flex-none">Approvals</TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="upload" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-[10px] sm:text-sm flex-1 sm:flex-none">Upload CSV</TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="registration-control" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-[10px] sm:text-sm flex-1 sm:flex-none">Registration Control</TabsTrigger>
          )}
          <TabsTrigger value="reports" className="rounded-lg sm:rounded-xl px-2 sm:px-4 text-[10px] sm:text-sm flex-1 sm:flex-none">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            {[
              { label: 'Total Students', value: String(dashboardData.statistics.totalStudents), icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />, change: `${dashboardData.statistics.activeStudents} active` },
              { label: 'Active Courses', value: String(dashboardData.statistics.totalCourses), icon: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />, change: '' },
              { label: 'Pending', value: String(dashboardData.statistics.pendingApprovals), icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5" />, change: dashboardData.statistics.pendingApprovals > 0 ? 'Urgent' : '' },
              { label: 'Department', value: dashboardData.teacher.department, icon: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />, change: '' },
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
            {/* Registration Control */}
            <div className={`glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 ${isRegistrationEnabled ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  {isRegistrationEnabled ? (
                    <Unlock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  ) : (
                    <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  )}
                  <h3 className="font-bold text-sm sm:text-lg text-foreground">Registration</h3>
                </div>
                <Switch 
                  checked={isRegistrationEnabled} 
                  onCheckedChange={setIsRegistrationEnabled}
                />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                {isRegistrationEnabled 
                  ? 'Students can register for courses.' 
                  : 'Registration closed for students.'
                }
              </p>
              <Badge className={`text-[10px] sm:text-xs ${isRegistrationEnabled ? 'bg-primary/10 text-primary border-0' : 'bg-muted text-muted-foreground border-0'}`}>
                {isRegistrationEnabled ? 'Open' : 'Closed'}
              </Badge>
            </div>

            {/* Quick Actions */}
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
              <h3 className="font-bold text-sm sm:text-lg text-foreground mb-3 sm:mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {[
                  { label: 'Add Course', icon: <Plus className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'primary', action: () => setIsAddCourseDialogOpen(true) },
                  { label: 'Reports', icon: <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'secondary', action: () => setActiveTab('reports') },
                  { label: 'Rules', icon: <FileText className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'primary', action: () => {} },
                  { label: 'Export', icon: <Download className="h-4 w-4 sm:h-5 sm:w-5" />, color: 'secondary', action: () => {} },
                ].map((action, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl hover:bg-primary/5"
                    onClick={action.action}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {action.icon}
                    </div>
                    <span className="text-[10px] sm:text-sm font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <h3 className="font-bold text-sm sm:text-lg text-foreground">Recent Activity</h3>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab('reports')} className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {dashboardData.recentActivity.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary mt-1.5 sm:mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-foreground truncate">{log.action}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {log.student} • {log.course}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approvals Alert */}
          {isAdmin && dashboardData.statistics.pendingApprovals > 0 && (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-6 border-2 border-secondary/30 bg-secondary/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-secondary/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground">{dashboardData.statistics.pendingApprovals} Pending</h3>
                    <p className="text-[10px] sm:text-sm text-muted-foreground">Waiting for approval</p>
                  </div>
                </div>
                <Button className="rounded-full text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto" onClick={() => setActiveTab('approvals')}>
                  Review
                  <ArrowRight className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                <Button variant="outline" className="rounded-lg sm:rounded-xl h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm" onClick={fetchStudents}>
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
            
            {isLoadingStudents ? (
              <LoadingSpinner fullScreen={false} text="Loading students..." />
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-2">
                  {filteredStudents.map((student) => (
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
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
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
                      {filteredStudents.map((student) => (
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
                  className="rounded-lg sm:rounded-xl text-xs sm:text-sm h-8 sm:h-10"
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
                className="rounded-lg sm:rounded-xl h-8 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm" 
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
              <div className="space-y-2 sm:space-y-4">
                {courses.map((course) => (
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
                      <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                        className="rounded-lg sm:rounded-xl flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9" 
                        size="sm"
                        onClick={() => handleApprove(approval.id)}
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        className="rounded-lg sm:rounded-xl flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9" 
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
              <div className="grid gap-3 sm:gap-6 md:grid-cols-2">
                <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="font-bold text-sm sm:text-lg text-foreground">Registration Stats</h3>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { label: 'Total', value: stats.overview.total, max: stats.overview.total || 1 },
                      { label: 'Approved', value: stats.overview.approved, max: stats.overview.total || 1 },
                      { label: 'Pending', value: stats.overview.pending, max: stats.overview.total || 1 },
                      { label: 'Rejected', value: stats.overview.rejected, max: stats.overview.total || 1 },
                    ].map((stat, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-xs sm:text-sm mb-1">
                          <span className="text-muted-foreground">{stat.label}</span>
                          <span className="font-medium text-foreground">{stat.value}</span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${stat.max > 0 ? (stat.value / stat.max) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="font-bold text-sm sm:text-lg text-foreground">Top Courses</h3>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    {stats.topCourses && stats.topCourses.length > 0 ? (
                      stats.topCourses.slice(0, 5).map((course: any, index: number) => (
                        <div key={course.courseCode} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl bg-muted/30">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs sm:text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">{course.courseCode}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{course.courseName}</p>
                          </div>
                          <Badge variant="secondary" className="text-[10px] sm:text-xs">
                            {course.registrations}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                        No course registrations yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-lg text-foreground">Recent Activity</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {dashboardData.recentActivity && dashboardData.recentActivity.length > 0 ? (
                    dashboardData.recentActivity.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-muted/30 transition-colors">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary mt-1.5 sm:mt-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-foreground truncate">{log.action}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {log.student} • {log.course} • {new Date(log.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </div>
              </div>

              <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="font-bold text-sm sm:text-lg text-foreground">Export Reports</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  {[
                    { label: 'Student Report', desc: 'All student records' },
                    { label: 'Registration', desc: 'Semester data' },
                    { label: 'Audit Report', desc: 'Activity logs' },
                  ].map((report, index) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      className="h-auto py-3 sm:py-4 flex-col items-start gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="font-medium text-xs sm:text-sm">{report.label}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">{report.desc}</span>
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
            <CSVUpload />
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
  );
};

export default FacultyDashboard;
