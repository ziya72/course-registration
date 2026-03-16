import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Users, AlertCircle, ArrowLeft, Info, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { forgotPassword, verifyResetOtp, resetPassword } from '@/services/api';

const AMU_LOGO_URL = "https://registration.fyup.amucoe.ac.in/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticating, authError, clearAuthError } = useAuth();
  const isMobile = useIsMobile();
  
  const [role, setRole] = useState<UserRole>('student');
  const [formData, setFormData] = useState({ id: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Get redirect path from location state
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setFormData({ id: '', password: '' });
    setErrors({});
    clearAuthError();
    setForgotPasswordEmail('');
    setShowForgotPassword(false);
    setForgotPasswordSuccess('');
    setForgotPasswordError('');
    setResetStep('email');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordsMatch(null);
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address');
      return;
    }

    // Student email validation
    if (role === 'student' && !forgotPasswordEmail.endsWith('@myamu.ac.in')) {
      setForgotPasswordError('Student email must end with @myamu.ac.in');
      return;
    }

    setIsSendingReset(true);
    setForgotPasswordError('');
    setForgotPasswordSuccess('');

    try {
      await forgotPassword(forgotPasswordEmail);
      setForgotPasswordSuccess('A 6-digit OTP has been sent to your email. Please check your inbox.');
      setResetStep('otp');
    } catch (error: unknown) {
      setForgotPasswordError((error as Error).message || 'Failed to send OTP');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setForgotPasswordError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifyingOtp(true);
    setForgotPasswordError('');
    setForgotPasswordSuccess('');

    try {
      await verifyResetOtp(forgotPasswordEmail, otp);
      setForgotPasswordSuccess('OTP verified successfully! Now enter your new password.');
      setResetStep('password');
    } catch (error: unknown) {
      setForgotPasswordError((error as Error).message || 'Invalid OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePasswordChange = (value: string, field: 'new' | 'confirm') => {
    if (field === 'new') {
      setNewPassword(value);
      if (confirmPassword) {
        setPasswordsMatch(value === confirmPassword);
      }
    } else {
      setConfirmPassword(value);
      if (newPassword) {
        setPasswordsMatch(newPassword === value);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.id.trim()) {
      newErrors.id = role === 'student' ? 'College email is required' : 'Teacher email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    setForgotPasswordError('');
    
    if (!newPassword || newPassword.length < 6) {
      setForgotPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotPasswordError('Passwords do not match');
      return;
    }

    setIsResettingPassword(true);

    try {
      await resetPassword(forgotPasswordEmail, otp, newPassword);
      setForgotPasswordSuccess('Password reset successful! Please login with your new password.');
      setTimeout(() => {
        setResetStep('email');
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordsMatch(null);
        setForgotPasswordSuccess('');
      }, 2000);
    } catch (error: unknown) {
      setForgotPasswordError((error as Error).message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
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
    <div className={`min-h-screen bg-background grid-background flex items-center justify-center ${isMobile ? 'py-4 px-2' : 'py-8 sm:py-12 px-3 sm:px-4'}`}>
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className={`flex items-center gap-2 text-muted-foreground hover:text-foreground ${isMobile ? 'mb-3' : 'mb-4 sm:mb-6'} transition-colors`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Home</span>
        </button>

        {/* Logo */}
        <div className={`flex items-center gap-3 sm:gap-4 ${isMobile ? 'mb-4' : 'mb-6 sm:mb-8'}`}>
          <img 
            src={AMU_LOGO_URL} 
            alt="AMU Logo" 
            className={`${isMobile ? 'h-12 w-12' : 'h-14 w-14 sm:h-16 sm:w-16'} object-contain`}
          />
          <div>
            <span className={`font-bold ${isMobile ? 'text-base' : 'text-lg sm:text-xl'} text-foreground block leading-tight`}>
              Aligarh Muslim University
            </span>
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'} text-muted-foreground`}>
              Course Registration Portal
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className={`glass-card rounded-2xl ${isMobile ? 'p-4' : 'p-6 md:p-8'} animate-fade-in-up`}>
          <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-foreground mb-1`}>Welcome back</h1>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>Sign in to access your dashboard</p>
          </div>

          {/* Role Toggle */}
          <div className={`grid grid-cols-2 gap-1 ${isMobile ? 'mb-4' : 'mb-6'} p-1 bg-muted rounded-xl`}>
            <button
              type="button"
              onClick={() => handleRoleChange('student')}
              disabled={isAuthenticating}
              className={`flex items-center justify-center gap-2 ${isMobile ? 'py-2 px-2' : 'py-2.5 px-3'} rounded-lg font-medium ${isMobile ? 'text-xs' : 'text-sm'} transition-all duration-300 ${
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
              onClick={() => handleRoleChange('teacher')}
              disabled={isAuthenticating}
              className={`flex items-center justify-center gap-2 ${isMobile ? 'py-2 px-2' : 'py-2.5 px-3'} rounded-lg font-medium ${isMobile ? 'text-xs' : 'text-sm'} transition-all duration-300 ${
                role === 'teacher'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Teacher</span>
            </button>
          </div>

          {/* API Error Message */}
          {authError && (
            <div className={`${isMobile ? 'mb-3' : 'mb-5'} p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2`}>
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="id" className="text-sm font-medium">
                {role === 'student' ? 'College Email' : 'Teacher Email'}
              </Label>
              <Input
                id="id"
                name="id"
                placeholder={role === 'student' ? 'gp2212@myamu.ac.in' : 'teacher001@myamu.ac.in'}
                value={formData.id}
                onChange={handleChange}
                disabled={isAuthenticating}
                className={`${isMobile ? 'h-10' : 'h-11'} rounded-lg ${errors.id ? 'border-destructive' : ''}`}
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
                <button 
                  type="button" 
                  className="text-xs text-primary hover:underline"
                  onClick={() => setShowForgotPassword(true)}
                >
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
                className={`${isMobile ? 'h-10' : 'h-11'} rounded-lg ${errors.password ? 'border-destructive' : ''}`}
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
              className={`w-full ${isMobile ? 'h-10' : 'h-11'} rounded-lg font-semibold`}
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
          <div className={`${isMobile ? 'mt-3' : 'mt-5'} p-3 rounded-lg bg-muted/50 flex gap-2`}>
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Please use the 'Forgot Password' link to reset your password on your first login.
            </p>
          </div>

          <p className={`text-center ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground ${isMobile ? 'mt-3' : 'mt-5'}`}>
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>

        {/* Forgot Password Modal - 3 Steps */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                {resetStep === 'email' && 'Reset Password'}
                {resetStep === 'otp' && 'Verify OTP'}
                {resetStep === 'password' && 'Set New Password'}
              </h3>
              
              <div className="space-y-4">
                {/* Step 1: Email Input */}
                {resetStep === 'email' && (
                  <>
                    <div>
                      <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter your email address"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {forgotPasswordError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{forgotPasswordError}</p>
                      </div>
                    )}

                    {forgotPasswordSuccess && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">{forgotPasswordSuccess}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isSendingReset}
                        className="flex-1"
                      >
                        {isSendingReset ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send OTP'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                          setForgotPasswordError('');
                          setForgotPasswordSuccess('');
                          setResetStep('email');
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}

                {/* Step 2: OTP Verification */}
                {resetStep === 'otp' && (
                  <>
                    <div>
                      <Label htmlFor="otp" className="text-sm font-medium">6-Digit OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="mt-1 text-center text-lg tracking-widest"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Check your email ({forgotPasswordEmail}) for the OTP
                      </p>
                    </div>

                    {forgotPasswordError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{forgotPasswordError}</p>
                      </div>
                    )}

                    {forgotPasswordSuccess && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">{forgotPasswordSuccess}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otp.length !== 6}
                        className="flex-1"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify OTP'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setResetStep('email');
                          setOtp('');
                          setForgotPasswordError('');
                          setForgotPasswordSuccess('');
                        }}
                        className="flex-1"
                      >
                        Back
                      </Button>
                    </div>
                  </>
                )}

                {/* Step 3: New Password */}
                {resetStep === 'password' && (
                  <>
                    <div>
                      <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => handlePasswordChange(e.target.value, 'new')}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => handlePasswordChange(e.target.value, 'confirm')}
                        className="mt-1"
                      />
                      {passwordsMatch !== null && (
                        <div className={`mt-2 flex items-center gap-2 text-sm ${passwordsMatch ? 'text-green-600' : 'text-destructive'}`}>
                          {passwordsMatch ? (
                            <>
                              <div className="h-2 w-2 rounded-full bg-green-600"></div>
                              <span>Passwords match ✓</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 rounded-full bg-destructive"></div>
                              <span>Passwords do not match ✗</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {forgotPasswordError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <p className="text-sm text-destructive">{forgotPasswordError}</p>
                      </div>
                    )}

                    {forgotPasswordSuccess && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2">
                        <AlertCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800">{forgotPasswordSuccess}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={isResettingPassword || !passwordsMatch || !newPassword || !confirmPassword}
                        className="flex-1"
                      >
                        {isResettingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setResetStep('otp');
                          setNewPassword('');
                          setConfirmPassword('');
                          setPasswordsMatch(null);
                          setForgotPasswordError('');
                        }}
                        className="flex-1"
                      >
                        Back
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
