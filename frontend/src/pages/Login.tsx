import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Users, AlertCircle, ArrowLeft, Info, Loader2 } from 'lucide-react';

const AMU_LOGO_URL = "https://registration.fyup.amucoe.ac.in/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticating, authError, clearAuthError } = useAuth();
  
  const [role, setRole] = useState<UserRole>('student');
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get redirect path from location state
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setFormData({ id: '', password: '' });
    setErrors({});
    clearAuthError();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.id.trim()) {
      newErrors.id = role === 'student' ? 'College email is required' : 'Faculty email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    
    if (validateForm()) {
      // Use the email directly if it contains @, otherwise append domain
      const email = formData.id.includes('@') ? formData.id : `${formData.id}@myamu.ac.in`;
      
      const success = await login(email, formData.password, role);
      
      if (success) {
        navigate(from, { replace: true });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (authError) {
      clearAuthError();
    }
  };

  return (
    <div className="min-h-screen bg-background grid-background flex items-center justify-center py-8 sm:py-12 px-3 sm:px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <img src={AMU_LOGO_URL} alt="AMU Logo" className="h-12 w-12 sm:h-16 sm:w-16 object-contain" />
          <div>
            <span className="font-bold text-lg sm:text-xl text-foreground block leading-tight">Aligarh Muslim University</span>
            <span className="text-xs sm:text-sm text-muted-foreground">Course Registration Portal</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8 animate-fade-in-up">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
          </div>

          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-1 mb-6 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              disabled={isAuthenticating}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                role === 'student'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('faculty')}
              disabled={isAuthenticating}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-300 ${
                role === 'faculty'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Faculty</span>
            </button>
          </div>

          {/* API Error Message */}
          {authError && (
            <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="id" className="text-sm font-medium">
                {role === 'student' ? 'College Email' : 'Faculty Email'}
              </Label>
              <Input
                id="id"
                name="id"
                placeholder={role === 'student' ? 'gp2212@myamu.ac.in' : 'faculty001@myamu.ac.in'}
                value={formData.id}
                onChange={handleChange}
                disabled={isAuthenticating}
                className={`h-11 rounded-lg ${errors.id ? 'border-destructive' : ''}`}
              />
              {errors.id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.id}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isAuthenticating}
                className={`h-11 rounded-lg ${errors.password ? 'border-destructive' : ''}`}
              />
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-lg font-semibold"
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Info Note */}
          <div className="mt-5 p-3 rounded-lg bg-muted/50 flex gap-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Please use the 'Forgot Password' link to reset your password on your first login.
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
