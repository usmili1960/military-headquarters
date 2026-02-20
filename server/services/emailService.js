const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isEnabled = process.env.ENABLE_EMAIL_VERIFICATION === 'true';
    this.init();
  }

  async init() {
    if (!this.isEnabled) {
      console.log('📧 Email service disabled in environment');
      return;
    }

    try {
      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.verify();
        console.log('✅ Email service connected successfully');
      } else {
        console.log('⚠️ Email credentials not configured, using fallback mode');
      }
    } catch (error) {
      console.log('❌ Email service connection failed:', error.message);
      console.log('📧 Falling back to console logging for verification codes');
      this.transporter = null;
    }
  }

  async sendVerificationCode(email, code, militaryId) {
    const subject = 'Military HQ - Email Verification Code';
    const html = this.getVerificationEmailTemplate(code, militaryId);
    
    return this.sendEmail(email, subject, html);
  }

  async sendPasswordReset(email, code, militaryId) {
    const subject = 'Military HQ - Password Reset Code';
    const html = this.getPasswordResetEmailTemplate(code, militaryId);
    
    return this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email, fullName, militaryId) {
    const subject = 'Welcome to Military HQ';
    const html = this.getWelcomeEmailTemplate(fullName, militaryId);
    
    return this.sendEmail(email, subject, html);
  }

  async sendEmail(to, subject, html) {
    if (!this.isEnabled) {
      return { success: false, method: 'disabled', error: 'Email service disabled in environment' };
    }

    if (!this.transporter) {
      return { success: false, method: 'unavailable', error: 'Email transporter is not configured' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Military HQ" <noreply@military-hq.gov>',
        to,
        subject,
        html,
      });

      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId, method: 'smtp' };
    } catch (error) {
      console.log('❌ Email send failed:', error.message);
      return { success: false, error: error.message, method: 'smtp_failed' };
    }
  }

  getVerificationEmailTemplate(code, militaryId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #1a472a; color: white; padding: 20px; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .code { font-size: 24px; font-weight: bold; color: #1a472a; text-align: center; margin: 20px 0; padding: 15px; background: white; border: 2px solid #1a472a; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎖️ U.S. MILITARY HEADQUARTERS</h1>
                <p>Washington DC - Email Verification</p>
            </div>
            <div class="content">
                <h2>Email Verification Required</h2>
                <p>Hello Service Member <strong>${militaryId}</strong>,</p>
                <p>Please use the following verification code to complete your registration:</p>
                <div class="code">${code}</div>
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This code will expire in 10 minutes</li>
                    <li>Do not share this code with anyone</li>
                    <li>If you didn't request this, please ignore this email</li>
                </ul>
            </div>
            <div class="footer">
                <p>© 2026 U.S. Military Headquarters, Washington DC</p>
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  getPasswordResetEmailTemplate(code, militaryId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #dc3545; color: white; padding: 20px; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .code { font-size: 24px; font-weight: bold; color: #dc3545; text-align: center; margin: 20px 0; padding: 15px; background: white; border: 2px solid #dc3545; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 PASSWORD RESET REQUEST</h1>
                <p>U.S. Military Headquarters</p>
            </div>
            <div class="content">
                <h2>Password Reset Code</h2>
                <p>Hello Service Member <strong>${militaryId}</strong>,</p>
                <p>You requested a password reset. Use the following code:</p>
                <div class="code">${code}</div>
                <p><strong>Security Notice:</strong></p>
                <ul>
                    <li>This code expires in 10 minutes</li>
                    <li>Do not share this code with anyone</li>
                    <li>If you didn't request this, change your password immediately</li>
                </ul>
            </div>
            <div class="footer">
                <p>© 2026 U.S. Military Headquarters, Washington DC</p>
                <p>This is an automated message. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  getWelcomeEmailTemplate(fullName, militaryId) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; background: #28a745; color: white; padding: 20px; }
            .content { padding: 30px 20px; background: #f9f9f9; }
            .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎖️ WELCOME TO MILITARY HQ</h1>
                <p>Your registration is complete</p>
            </div>
            <div class="content">
                <h2>Welcome Service Member!</h2>
                <p>Dear <strong>${fullName}</strong>,</p>
                <p>Your Military HQ account has been successfully created with ID: <strong>${militaryId}</strong></p>
                <p>You can now access:</p>
                <ul>
                    <li>Personal Dashboard</li>
                    <li>Procedure Management</li>
                    <li>Profile Updates</li>
                    <li>Military Resources</li>
                </ul>
                <p>Thank you for your service! 🇺🇸</p>
            </div>
            <div class="footer">
                <p>© 2026 U.S. Military Headquarters, Washington DC</p>
                <p>For support, visit our help center or contact IT support.</p>
            </div>
        </div>
    </body>
    </html>`;
  }
}

module.exports = new EmailService();
