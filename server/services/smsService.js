const axios = require('axios');
const config = require('../config/config');
const logger = require('../utils/logger');

class SMSService {
  constructor() {
    this.msg91ApiKey = config.sms.msg91.apiKey;
    this.msg91SenderId = config.sms.msg91.senderId;
    this.twoFactorApiKey = config.sms.twoFactor.apiKey;
  }

  /**
   * Send OTP via MSG91
   */
  async sendOTPViaMSG91(phone, otp) {
    try {
      const url = 'https://api.msg91.com/api/v5/otp';
      const data = {
        template_id: 'OTP_TEMPLATE_ID', // Replace with actual template ID
        mobile: phone,
        authkey: this.msg91ApiKey,
        otp: otp,
        sender: this.msg91SenderId
      };

      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('OTP sent via MSG91', {
        phone,
        response: response.data
      });

      return {
        success: true,
        messageId: response.data.request_id,
        provider: 'MSG91'
      };
    } catch (error) {
      logger.error('MSG91 SMS sending failed:', error);
      throw new Error('Failed to send SMS via MSG91');
    }
  }

  /**
   * Send OTP via 2Factor
   */
  async sendOTPVia2Factor(phone, otp) {
    try {
      const url = `https://2factor.in/API/V1/${this.twoFactorApiKey}/SMS/${phone}/${otp}`;
      
      const response = await axios.get(url);

      logger.info('OTP sent via 2Factor', {
        phone,
        response: response.data
      });

      return {
        success: true,
        messageId: response.data.Details,
        provider: '2Factor'
      };
    } catch (error) {
      logger.error('2Factor SMS sending failed:', error);
      throw new Error('Failed to send SMS via 2Factor');
    }
  }

  /**
   * Send OTP with fallback
   */
  async sendOTP(phone, otp) {
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Try MSG91 first, fallback to 2Factor
    try {
      if (this.msg91ApiKey) {
        return await this.sendOTPViaMSG91(cleanPhone, otp);
      } else if (this.twoFactorApiKey) {
        return await this.sendOTPVia2Factor(cleanPhone, otp);
      } else {
        throw new Error('No SMS service configured');
      }
    } catch (error) {
      logger.error('Primary SMS service failed, trying fallback:', error);
      
      // Try fallback service
      try {
        if (this.twoFactorApiKey && this.msg91ApiKey) {
          return await this.sendOTPVia2Factor(cleanPhone, otp);
        }
        throw error;
      } catch (fallbackError) {
        logger.error('All SMS services failed:', fallbackError);
        throw new Error('Failed to send SMS - all services unavailable');
      }
    }
  }

  /**
   * Send custom SMS message
   */
  async sendMessage(phone, message) {
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      
      if (this.msg91ApiKey) {
        const url = 'https://api.msg91.com/api/v5/flow/';
        const data = {
          flow_id: 'FLOW_ID', // Replace with actual flow ID
          sender: this.msg91SenderId,
          mobiles: cleanPhone,
          message: message
        };

        const response = await axios.post(url, data, {
          headers: {
            'authkey': this.msg91ApiKey,
            'Content-Type': 'application/json'
          }
        });

        logger.info('SMS sent successfully', {
          phone: cleanPhone,
          message: message.substring(0, 50) + '...'
        });

        return {
          success: true,
          messageId: response.data.request_id
        };
      } else {
        throw new Error('SMS service not configured');
      }
    } catch (error) {
      logger.error('SMS sending failed:', error);
      throw new Error('Failed to send SMS');
    }
  }

  /**
   * Verify phone number format
   */
  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  /**
   * Format phone number for international use
   */
  formatPhoneNumber(phone, countryCode = '+91') {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
      return '+' + cleanPhone;
    } else if (cleanPhone.length === 10) {
      return countryCode + cleanPhone;
    } else {
      return '+' + cleanPhone;
    }
  }
}

module.exports = new SMSService();