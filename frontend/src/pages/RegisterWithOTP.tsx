import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestOTP, verifyOTP, registerUser, getErrorMessage } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail, Key } from 'lucide-react';

const AMU_LOGO_URL = "https://registration.fyup.amucoe.ac.in/assets/logo.png";

type RegistrationStep = 'email' | 'otp' | 'password';

const RegisterWithOTP = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<RegistrationStep>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setApiError(null);
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    if (!email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!email.includes('@')) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestOTP(email);
      const message = response.message || 'OTP sent to your email';
      setSuccessMessage(message);
      
      // Show success toast
      toast({
        title: 'OTP Sent! 📧',
        description: message,
        duration: 3000,
      });
      
      setStep('otp');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setApiError(errorMessage);
      
      // Show error toast
      toast({
        title: 'Failed to Send OTP',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    if (otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyOTP(email, otp);
      const message = response.message || 'OTP verified successfully';
      setSuccessMessage(message);
      
      // Show success toast
      toast({
        title: 'OTP Verified! ✅',
        description: message,
        duration: 3000,
      });
      
      setStep('password');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setApiError(errorMessage);
      
      // Show error toast
      toast({
        title: 'OTP Verification Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Set Password and Complete Registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerUser({
        email,
        password,
        confirmPassword,
        name: email.split('@')[0], // Use email prefix as default name
      });

      const message = response.message || 'Registration successful!';
      setSuccessMessage(message);
      
      // Show success toast popup
      toast({
        title: 'Registration Successful! 🎉',
        description: `${message} Redirecting to login page...`,
        duration: 3000,
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setApiError(errorMessage);
      
      // Show error toast popup
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
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
            <p className="text-sm text-muted-foreground">
              {step === 'email' && 'Enter your email to get started'}
              {step === 'otp' && 'Enter the OTP sent to your email'}
              {step === 'password' && 'Set your password to complete registration'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-2 ${step === 'email' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'email' ? 'bg-primary text-primary-foreground' : step === 'otp' || step === 'password' ? 'bg-primary/20' : 'bg-muted'}`}>
                <Mail className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium hidden sm:inline">Email</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-2" />
            <div className={`flex items-center gap-2 ${step === 'otp' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'otp' ? 'bg-primary text-primary-foreground' : step === 'password' ? 'bg-primary/20' : 'bg-muted'}`}>
                <Key className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium hidden sm:inline">OTP</span>
            </div>
            <div className="flex-1 h-0.5 bg-muted mx-2" />
            <div className={`flex items-center gap-2 ${step === 'password' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'password' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium hidden sm:inline">Password</span>
            </div>
          </div>

          {/* Info Message */}
          <div className="mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Student Registration:</strong> Enter your institutional email to receive an OTP and set up your password.
            </p>
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

          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">College Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="gt9999@myamu.ac.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({});
                    if (apiError) setApiError(null);
                  }}
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

              <Button 
                type="submit" 
                className="w-full h-11 rounded-lg font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-sm font-medium">Enter OTP</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (errors.otp) setErrors({});
                    if (apiError) setApiError(null);
                  }}
                  disabled={isSubmitting}
                  className={`h-11 rounded-lg text-center text-2xl tracking-widest ${errors.otp ? 'border-destructive' : ''}`}
                />
                <p className="text-xs text-muted-foreground">
                  Check your email for the OTP code
                </p>
                {errors.otp && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.otp}
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
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('email')}
                disabled={isSubmitting}
              >
                Back to Email
              </Button>
            </form>
          )}

          {/* Step 3: Password */}
          {step === 'password' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({});
                    if (apiError) setApiError(null);
                  }}
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
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({});
                    if (apiError) setApiError(null);
                  }}
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
                  'Complete Registration'
                )}
              </Button>
            </form>
          )}

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

export default RegisterWithOTP;
