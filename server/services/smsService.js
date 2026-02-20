require('dotenv').config();

class SMSService {
  constructor() {
    this.client = null;
    this.isEnabled = process.env.ENABLE_SMS_VERIFICATION === 'true';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.init();
  }

  init() {
    if (!this.isEnabled) {
      console.log('📱 SMS service disabled in environment');
      return;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken || !this.phoneNumber) {
      console.log('⚠️ SMS credentials not configured, using fallback mode');
      return;
    }

    try {
      // Only require Twilio if credentials are available
      const twilio = require('twilio');
      this.client = twilio(accountSid, authToken);
      console.log('✅ SMS service configured successfully');
    } catch (error) {
      console.log('❌ SMS service initialization failed:', error.message);
      console.log('📱 Falling back to console logging for SMS codes');
      this.client = null;
    }
  }

  async sendVerificationCode(mobile, code, militaryId) {
    const message = `Military HQ Verification Code: ${code}\n\nFor Military ID: ${militaryId}\nExpires in 10 minutes.\n\nDo not share this code.`;
    
    return this.sendSMS(mobile, message);
  }

  async sendPasswordReset(mobile, code, militaryId) {
    const message = `Military HQ Password Reset Code: ${code}\n\nFor Military ID: ${militaryId}\nExpires in 10 minutes.\n\nIf you didn't request this, secure your account immediately.`;
    
    return this.sendSMS(mobile, message);
  }

  async sendWelcomeMessage(mobile, fullName, militaryId) {
    const message = `Welcome to Military HQ, ${fullName}!\n\nYour account (${militaryId}) is now active. Thank you for your service! 🇺🇸\n\n- Military HQ Team`;
    
    return this.sendSMS(mobile, message);
  }

  async sendSMS(to, body) {
    // Fallback to console if no client or in development
    if (!this.client || !this.isEnabled || process.env.NODE_ENV === 'development') {
      console.log('\n📱 SMS FALLBACK (would send):');
      console.log(`To: ${to}`);
      console.log(`Message: ${body}`);
      console.log('───────────────────────────────────\n');
      return { success: true, method: 'console' };
    }

    try {
      const message = await this.client.messages.create({
        body,
        from: this.phoneNumber,
        to: this.formatPhoneNumber(to)
      });

      console.log('✅ SMS sent successfully:', message.sid);
      return { success: true, sid: message.sid, method: 'twilio' };
    } catch (error) {
      console.log('❌ SMS send failed:', error.message);
      
      // Fallback to console on error
      console.log('\n📱 SMS FALLBACK (send failed):');
      console.log(`To: ${to}`);
      console.log(`Message: ${body}`);
      console.log('───────────────────────────────────\n');
      
      return { success: false, error: error.message, method: 'console_fallback' };
    }
  }

  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Add +1 if US number without country code
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    
    // Add + if missing
    if (!phone.startsWith('+')) {
      return `+${digits}`;
    }
    
    return phone;
  }

  validatePhoneNumber(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }
}

module.exports = new SMSService();