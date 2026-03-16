import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const AMU_LOGO_URL = "https://registration.fyup.amucoe.ac.in/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="h-screen bg-background grid-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className={`${isMobile ? 'py-2 px-4' : 'py-3 px-4 sm:px-6'} relative z-10 flex-shrink-0`}>
        <div className="container mx-auto max-w-[100vw] sm:max-w-[95vw] lg:max-w-7xl flex items-center justify-center">
        </div>
      </header>

      {/* Main Content - Centered and Responsive */}
      <main className="flex-1 flex items-center justify-center px-4 py-2 overflow-y-auto">
        <div className="text-center max-w-2xl mx-auto animate-fade-in-up w-full">
          {/* AMU Logo Centered */}
          <div className={`${isMobile ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
            <img 
              src={AMU_LOGO_URL} 
              alt="Aligarh Muslim University" 
              className={`${isMobile ? 'h-16 w-16' : 'h-20 w-20 sm:h-24 sm:w-24'} mx-auto object-contain ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'}`}
            />
            <h1 className={`${isMobile ? 'text-lg' : 'text-xl sm:text-2xl md:text-3xl'} font-bold text-foreground mb-1 leading-tight`}>
              Aligarh Muslim University
            </h1>
            <p className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} text-muted-foreground`}>
              Course Registration Portal
            </p>
          </div>

          {/* Notice */}
          <div className={`inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} font-medium ${isMobile ? 'mb-3' : 'mb-4 sm:mb-6'}`}>
            Registration for ODD Semester (2025-26) is open
          </div>

          {/* Welcome Text */}
          <h2 className={`${isMobile ? 'text-base' : 'text-lg sm:text-xl md:text-2xl'} font-bold text-foreground ${isMobile ? 'mb-2' : 'mb-3 sm:mb-4'} leading-tight px-2`}>
            Welcome to Course Registration Portal
          </h2>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground ${isMobile ? 'mb-4' : 'mb-5 sm:mb-6'} max-w-lg mx-auto px-2 leading-relaxed`}>
            For your initial login, please use the 'Forgot Password' link to reset your password and ensure account security.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col items-center justify-center ${isMobile ? 'gap-3' : 'gap-4'} px-4`}>
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className={`${isMobile ? 'h-11 px-8 text-sm' : 'h-12 px-10 sm:px-12 text-base'} rounded-xl w-full max-w-[200px]`}
            >
              Login
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/register')}
              className={`${isMobile ? 'h-11 px-8 text-sm' : 'h-12 px-10 sm:px-12 text-base'} rounded-xl w-full max-w-[200px] border-2`}
            >
              New Registration
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${isMobile ? 'py-2 px-4' : 'py-3 px-4'} border-t border-border/50 flex-shrink-0`}>
        <p className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
          © 2025 Aligarh Muslim University. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Index;
