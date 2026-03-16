import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Course Registration';

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log('✅ SendGrid initialized');
} else {
  console.warn('⚠️  SendGrid API key not found. Email sending will be disabled.');
}

export class EmailService {
  /**
   * Send OTP email to user
   */
  static async sendOtpEmail(email: string, otp: string, expiryMinutes: number): Promise<void> {
    if (!SENDGRID_API_KEY) {
      console.log('📧 [DEV MODE] OTP Email would be sent to:', email);
      console.log('🔐 OTP:', otp);
      console.log('⏰ Expires in:', expiryMinutes, 'minutes');
      return;
    }

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: 'Your OTP for Course Registration',
      text: `Your OTP is: ${otp}. It will expire in ${expiryMinutes} minutes.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Course Registration System</h1>
              <p>Aligarh Muslim University</p>
            </div>
            <div class="content">
              <h2>Your One-Time Password (OTP)</h2>
              <p>Hello,</p>
              <p>You have requested to set up your password for the Course Registration Portal. Please use the OTP below to proceed:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This OTP will expire in <strong>${expiryMinutes} minutes</strong>.
              </div>
              
              <p>If you didn't request this OTP, please ignore this email.</p>
              
              <p>Best regards,<br>Course Registration Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Aligarh Muslim University</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log('✅ OTP email sent to:', email);
    } catch (error: any) {
      console.error('❌ Failed to send OTP email:', error.message);
      throw new Error('Failed to send OTP email. Please try again.');
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email: string, resetLink: string, expiryMinutes: number): Promise<void> {
    if (!SENDGRID_API_KEY) {
      console.log('📧 [DEV MODE] Password Reset Email would be sent to:', email);
      console.log('� Reset Link:', resetLink);
      console.log('⏰ Expires in:', expiryMinutes, 'minutes');
      return;
    }

    const msg = {
      to: email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: 'Reset your AMU Course Registration password',
      text: `We received a request to reset your password for the AMU Course Registration System. Click the link below to set a new password: ${resetLink}

This link will expire in ${expiryMinutes} minutes.

If you did not request a password reset, you can safely ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reset-link { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .link-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>AMU Course Registration System</p>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hello,</p>
              <p>We received a request to reset your password for the AMU Course Registration System. Click the link below to set a new password:</p>
              
              <div class="reset-link">
                <a href="${resetLink}" class="link-button">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in <strong>${expiryMinutes} minutes</strong>.
              </div>
              
              <p>If you didn't request this password reset, you can safely ignore this email and your password will remain unchanged.</p>
              
              <p>Best regards,<br>AMU Course Registration Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} Aligarh Muslim University</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log('✅ Password reset email sent to:', email);
    } catch (error: any) {
      console.error('❌ Failed to send password reset email:', error.message);
      throw error;
    }
  }
}
