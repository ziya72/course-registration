import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Bell, Menu, X, LogOut, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo - Mobile Optimized */}
        <Link to={user?.isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 sm:gap-3 text-foreground">
          <img 
            src="https://registration.fyup.amucoe.ac.in/assets/logo.png" 
            alt="AMU" 
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs sm:text-sm font-semibold truncate">Course Registration</span>
            <span className="text-xs sm:text-sm font-semibold text-muted-foreground truncate">Portal</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {user?.isLoggedIn && (
          <div className="hidden sm:flex items-center gap-4">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/dashboard') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              Dashboard
            </Link>
            
            {/* Notifications */}
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer" />
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                3
              </Badge>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}

        {/* Mobile Right Section */}
        <div className="flex items-center gap-3 sm:hidden">
          {user?.isLoggedIn && (
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs">
                3
              </Badge>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-foreground" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-sm border-b border-border shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {user?.isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                
                <div className="border-t border-border my-2"></div>
                
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Please log in to access the portal
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;