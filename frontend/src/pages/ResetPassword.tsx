import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { resetPassword } from '@/services/api';
import { useIsMobile } from '@/hooks/use-mobile';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsResetting(true);
    setError('');
    setSuccess('');

    try {
      await resetPassword(token, newPassword);
      setSuccess('Password successfully reset! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background grid-background flex items-center justify-center ${isMobile ? 'py-4 px-2' : 'py-8 sm:py-12 px-3 sm:px-4'}`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">🔐</span>
            </div>
          </div>
          
          <h1 className={`text-2xl font-bold ${isMobile ? 'text-lg' : 'text-3xl'} mb-2`}>
            Reset Password
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>
            Enter your new password below
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/login')}
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>

        {/* Reset Form */}
        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token Display */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-muted-foreground">Reset Token</Label>
              <div className="p-3 bg-muted/50 rounded-md border font-mono text-sm">
                {token || 'No token provided'}
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 h-8 w-8 px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 h-8 w-8 px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-2">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2">
                <AlertCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isResetting || !token}
              className="w-full"
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          {/* Instructions */}
          <div className={`mt-6 p-4 rounded-lg bg-muted/50 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
            <h4 className="font-medium mb-2">Instructions:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Choose a strong password (at least 6 characters)</li>
              <li>Make sure both passwords match exactly</li>
              <li>This link will expire in 15 minutes</li>
              <li>If you didn't request this reset, please ignore this email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
