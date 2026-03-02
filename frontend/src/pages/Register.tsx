import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@/context/AuthContext';
import { registerUser, getErrorMessage } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Users, AlertCircle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

const AMU_LOGO_URL = "https://registration.fyup.amucoe.ac.in/assets/logo.png";

const Register = () => {
  const navigate = useNavigate();
  
  const [role, setRole] = useState<UserRole>('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setErrors({});
    setApiError(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (role === 'student' && !formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await registerUser({
        name: formData.fullName,
        email: formData.email,
        studentId: formData.studentId || formData.email.split('@')[0],
        password: formData.password,
        role,
      });

      setSuccessMessage(response.message || 'Registration successful! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError(null);
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
            <h1 className="text-2xl font-bold text-foreground mb-1">Create Account</h1>
            <p className="text-sm text-muted-foreground">Register to access the course registration portal</p>
          </div>

          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-1 mb-6 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3 rounded-lg bg-primary/10 border border-primary/20 flex gap-2">
              <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-primary">{successMessage}</p>
            </div>
          )}

          {/* API Error Message */}
          {apiError && (
            <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`h-11 rounded-lg ${errors.fullName ? 'border-destructive' : ''}`}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">College Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="gp2212@myamu.ac.in"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`h-11 rounded-lg ${errors.email ? 'border-destructive' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                Use your official AMU college email (@myamu.ac.in)
              </p>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {role === 'student' && (
              <div className="space-y-1.5">
                <Label htmlFor="studentId" className="text-sm font-medium">Student ID / Enrollment Number</Label>
                <Input
                  id="studentId"
                  name="studentId"
                  placeholder="e.g., GP2212"
                  value={formData.studentId}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`h-11 rounded-lg ${errors.studentId ? 'border-destructive' : ''}`}
                />
                {errors.studentId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.studentId}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`h-11 rounded-lg ${errors.password ? 'border-destructive' : ''}`}
              />
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`h-11 rounded-lg ${errors.confirmPassword ? 'border-destructive' : ''}`}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 rounded-lg font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already registered?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
