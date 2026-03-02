import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AMU_LOGO_URL = "https://registration.fyup.amucoe.ac.in/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background grid-background flex flex-col">
      {/* Header */}
      <header className="py-3 px-3 sm:px-4 relative z-10">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={AMU_LOGO_URL} alt="AMU Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
            <span className="text-xs sm:text-sm text-muted-foreground">Aligarh Muslim University</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')} className="text-xs sm:text-sm px-2 sm:px-3">
              Login
            </Button>
            <Button size="sm" onClick={() => navigate('/register')} className="text-xs sm:text-sm px-2 sm:px-3">
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center py-6 sm:py-12 px-3 sm:px-4">
        <div className="text-center max-w-2xl mx-auto animate-fade-in-up">
          {/* AMU Logo Centered */}
          <div className="mb-5 sm:mb-8">
            <img 
              src={AMU_LOGO_URL} 
              alt="Aligarh Muslim University" 
              className="h-20 w-20 sm:h-32 sm:w-32 mx-auto object-contain mb-3 sm:mb-6"
            />
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2 leading-tight">
              Aligarh Muslim University
            </h1>
            <p className="text-sm sm:text-lg text-muted-foreground">
              Course Registration Portal
            </p>
          </div>

          {/* Notice */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-primary/10 text-primary px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-sm font-medium mb-5 sm:mb-8">
            Registration for ODD Semester (2025-26) is open
          </div>

          {/* Welcome Text */}
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-4 leading-tight px-2">
            Welcome to Course Registration Portal
          </h2>
          <p className="text-xs sm:text-base text-muted-foreground mb-5 sm:mb-8 max-w-lg mx-auto px-2">
          For your initial login, please use the 'Forgot Password' link to reset your password and ensure account security.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="h-10 sm:h-12 px-10 sm:px-12 text-sm sm:text-base rounded-xl min-w-[160px] max-w-[200px]"
            >
              Login
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/register')}
              className="h-10 sm:h-12 px-10 sm:px-12 text-sm sm:text-base rounded-xl min-w-[160px] max-w-[200px]"
            >
              New Registration
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 sm:py-4 px-4 border-t border-border/50">
        <p className="text-center text-xs text-muted-foreground">
          © 2025 Aligarh Muslim University. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;
