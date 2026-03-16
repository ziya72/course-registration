# OTP-Based Forgot Password Implementation

## Changes Made:

### Backend:
1. ✅ Updated `forgotPassword` to generate 6-digit OTP instead of token
2. ✅ Updated `resetPassword` to accept email, OTP, and newPassword
3. ✅ Updated ResetPasswordDto type
4. ✅ Updated controller to handle new parameters

### Frontend Changes Needed:

Add these state variables in Login.tsx:
```typescript
const [showOtpStep, setShowOtpStep] = useState(false);
const [otp, setOtp] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmPassword, setConfirmPassword] = useState('');
const [isResettingPassword, setIsResettingPassword] = useState(false);
```

Update handleForgotPassword:
```typescript
const handleForgotPassword = async () => {
  // ... existing validation ...
  
  try {
    await forgotPassword(forgotPasswordEmail);
    setForgotPasswordSuccess('A 6-digit OTP has been sent to your email. Please check your inbox.');
    setShowOtpStep(true); // Show OTP input step
  } catch (error: unknown) {
    setForgotPasswordError((error as Error).message || 'Failed to send OTP');
  } finally {
    setIsSendingReset(false);
  }
};
```

Add new handleResetPassword function:
```typescript
const handleResetPassword = async () => {
  setForgotPasswordError('');
  
  if (!otp.trim() || otp.length !== 6) {
    setForgotPasswordError('Please enter a valid 6-digit OTP');
    return;
  }

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
    setShowOtpStep(false);
    setShowForgotPassword(false);
    // Reset all fields
  } catch (error: unknown) {
    setForgotPasswordError((error as Error).message || 'Failed to reset password');
  } finally {
    setIsResettingPassword(false);
  }
};
```

Update the forgot password dialog JSX to show OTP step when showOtpStep is true.

## Testing:
1. Click "Forgot Password?"
2. Enter email and click "Send OTP"
3. Check backend console for 6-digit OTP
4. Enter OTP, new password, confirm password
5. Click "Reset Password"
6. Login with new password
