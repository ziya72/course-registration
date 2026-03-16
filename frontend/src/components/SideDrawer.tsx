import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Menu, 
  Home, 
  User, 
  History, 
  LogOut,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Lock
} from 'lucide-react';
import { getCurrentPhase } from '@/services/api';

type View = 'dashboard' | 'profile' | 'courses' | 'registration' | 'history';

interface SideDrawerProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const SideDrawer = ({ currentView, onViewChange }: SideDrawerProps) => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // Check for active registration phase
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const response = await getCurrentPhase();
        setIsRegistrationOpen(response.isOpen);
      } catch (error) {
        console.error('Error checking registration status:', error);
        setIsRegistrationOpen(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  const handleNavigation = (view: View) => {
    onViewChange(view);
    setOpen(false);
  };

  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: Home, disabled: false },
    { id: 'profile' as View, label: 'Profile', icon: User, disabled: false },
    { id: 'history' as View, label: 'Course History', icon: History, disabled: false },
    { id: 'registration' as View, label: 'Course Registration', icon: ClipboardList, disabled: !isRegistrationOpen },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl h-9 w-9 sm:h-10 sm:w-10 p-0 border-border/50 hover:bg-muted/50 transition-all duration-200"
        >
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[280px] sm:w-80 p-0 border-r border-border/50"
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
          {/* Header */}
          <SheetHeader className="p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg sm:text-xl shadow-lg">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-left text-base sm:text-lg font-bold truncate">
                  {user?.name || 'Student'}
                </SheetTitle>
                <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                  {user?.email || 'student@myamu.ac.in'}
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Logo Section */}
          <div className="px-4 sm:px-6 py-4 border-b border-border/30">
            <div className="flex items-center gap-2 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && handleNavigation(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl transition-all duration-200 group ${
                  item.disabled
                    ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                    : currentView === item.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-muted/80 active:scale-[0.98]'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  item.disabled
                    ? 'bg-muted/50'
                    : currentView === item.id 
                    ? 'bg-primary-foreground/20' 
                    : 'bg-muted group-hover:bg-primary/10'
                }`}>
                  {item.disabled ? <Lock className="h-4 w-4" /> : <item.icon className="h-4 w-4" />}
                </div>
                <span className="flex-1 text-left text-sm font-medium">
                  {item.label}
                </span>
                {!item.disabled && (
                  <ChevronRight className={`h-4 w-4 transition-all duration-200 ${
                    currentView === item.id 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0'
                  }`} />
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-border/50 bg-muted/30">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl sm:rounded-2xl text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideDrawer;
