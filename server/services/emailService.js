const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
    } catch (error) {
      logger.error('Email service connection failed:', error);
    }
  }

  /**
   * Send email with template
   */
  async sendEmail({ to, subject, html, text, attachments = [] }) {
    try {
      const mailOptions = {
        from: `${config.email.from.name} <${config.email.from.email}>`,
        to,
        subject,
        html,
        text,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        to,
        subject,
        messageId: result.messageId
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user, institution, temporaryPassword) {
    const subject = `Welcome to ${institution.name} - ScholarBridge LMS`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ScholarBridge LMS</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2; }
          .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ScholarBridge LMS</h1>
            <p>Your learning journey begins here</p>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName || user.username},</h2>
            <p>Welcome to <strong>${institution.name}</strong>! Your account has been created successfully.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Institution:</strong> ${institution.name}</p>
              <p><strong>Login URL:</strong> <a href="https://${institution.subdomain}.scholarbridgelms.com">https://${institution.subdomain}.scholarbridgelms.com</a></p>
              <p><strong>Username:</strong> ${user.username}</p>
              <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
            </div>
            
            <p><strong>Important:</strong> For security reasons, you will be required to change your password on first login.</p>
            
            <a href="https://${institution.subdomain}.scholarbridgelms.com" class="button">Login Now</a>
            
            <h3>Getting Started:</h3>
            <ul>
              <li>Complete your profile information</li>
              <li>Explore your assigned courses</li>
              <li>Access the digital library</li>
              <li>Connect with your instructors and peers</li>
            </ul>
            
            <p>If you have any questions or need assistance, please contact your institution administrator or our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 ScholarBridge LMS. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to ${institution.name} - ScholarBridge LMS
      
      Hello ${user.firstName || user.username},
      
      Welcome to ${institution.name}! Your account has been created successfully.
      
      Your Login Credentials:
      Institution: ${institution.name}
      Login URL: https://${institution.subdomain}.scholarbridgelms.com
      Username: ${user.username}
      Temporary Password: ${temporaryPassword}
      
      Important: For security reasons, you will be required to change your password on first login.
      
      Getting Started:
      - Complete your profile information
      - Explore your assigned courses
      - Access the digital library
      - Connect with your instructors and peers
      
      If you have any questions or need assistance, please contact your institution administrator.
      
      © 2024 ScholarBridge LMS. All rights reserved.
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text
    });
  }

  /**
   * Send password reset OTP email
   */
  async sendPasswordResetOTP(email, otp) {
    const subject = 'Password Reset - ScholarBridge LMS';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #1976d2; }
          .otp-code { font-size: 32px; font-weight: bold; color: #1976d2; letter-spacing: 8px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
            <p>ScholarBridge LMS</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Use the verification code below to proceed:</p>
            
            <div class="otp">
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p><small>This code will expire in 15 minutes</small></p>
            </div>
            
            <p><strong>Security Notice:</strong></p>
            <ul>
              <li>This code is valid for 15 minutes only</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this reset, please ignore this email</li>
            </ul>
            
            <p>If you continue to have problems, please contact your institution administrator.</p>
          </div>
          <div class="footer">
            <p>© 2024 ScholarBridge LMS. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Password Reset Request - ScholarBridge LMS
      
      We received a request to reset your password.
      
      Your verification code is: ${otp}
      
      This code will expire in 15 minutes.
      
      Security Notice:
      - This code is valid for 15 minutes only
      - Do not share this code with anyone
      - If you didn't request this reset, please ignore this email
      
      © 2024 ScholarBridge LMS. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * Send course enrollment notification
   */
  async sendCourseEnrollmentEmail(user, course, institution) {
    const subject = `Course Enrollment: ${course.name}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Enrollment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50; }
          .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Course Enrollment Confirmation</h1>
            <p>ScholarBridge LMS</p>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName || user.username},</h2>
            <p>You have been successfully enrolled in a new course!</p>
            
            <div class="course-info">
              <h3>${course.name}</h3>
              <p><strong>Course Code:</strong> ${course.code || 'N/A'}</p>
              <p><strong>Description:</strong> ${course.description || 'No description available'}</p>
              <p><strong>Institution:</strong> ${institution.name}</p>
            </div>
            
            <a href="https://${institution.subdomain}.scholarbridgelms.com/courses/${course.id}" class="button">Access Course</a>
            
            <p>You can now access course materials, participate in discussions, and track your progress.</p>
            
            <p>Happy learning!</p>
          </div>
          <div class="footer">
            <p>© 2024 ScholarBridge LMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }

  /**
   * Send system notification email
   */
  async sendSystemNotification(user, title, message, actionUrl = null) {
    const subject = `Notification: ${title}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
            <p>ScholarBridge LMS</p>
          </div>
          <div class="content">
            <h2>Hello ${user.firstName || user.username},</h2>
            
            <div class="message">
              ${message}
            </div>
            
            ${actionUrl ? `<a href="${actionUrl}" class="button">Take Action</a>` : ''}
          </div>
          <div class="footer">
            <p>© 2024 ScholarBridge LMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html
    });
  }
}

module.exports = new EmailService();