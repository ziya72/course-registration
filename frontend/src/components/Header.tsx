import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

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
    <header className="fixed top-2 sm:top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md sm:max-w-xl md:max-w-2xl">
      <nav className="nav-floating px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between">
        {/* Logo */}
        <Link to={user?.isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-1.5 sm:gap-2 text-foreground hover:text-primary transition-colors">
          <img 
            src="https://registration.fyup.amucoe.ac.in/assets/logo.png" 
            alt="AMU" 
            className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
          />
          <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight hidden xs:block">Aligarh Muslim<br className="sm:hidden" /> University</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {user?.isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-pill text-xs sm:text-sm px-2 sm:px-3 py-1.5 ${
                  isActive('/dashboard') ? 'nav-pill-active' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive text-xs h-7 px-2"
                >
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-pill text-xs sm:text-sm px-2 sm:px-3 py-1.5 ${
                  isActive('/login') ? 'nav-pill-active' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`nav-pill text-xs sm:text-sm px-2 sm:px-3 py-1.5 ${
                  isActive('/register') ? 'nav-pill-active' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-muted transition-colors"
        >
          Menu
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-1.5 glass-card rounded-xl p-2 animate-fade-in">
          <div className="flex flex-col gap-0.5">
            {user?.isLoggedIn ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-pill text-center text-xs py-2 ${
                    isActive('/dashboard') ? 'nav-pill-active' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="border-t border-border my-1.5"></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="nav-pill text-center text-xs py-2 text-muted-foreground hover:text-destructive hover:bg-muted"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-pill text-center text-xs py-2 ${
                    isActive('/login') ? 'nav-pill-active' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-pill text-center text-xs py-2 ${
                    isActive('/register') ? 'nav-pill-active' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;