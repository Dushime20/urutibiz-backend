#!/usr/bin/env node

/**
 * Email Configuration Test
 * Tests if SMTP is properly configured
 */

// Use require instead of import for CommonJS
const { EmailService } = require('./dist/services/email.service');

async function testEmailConfig() {
  console.log('📧 Testing Email Configuration');
  console.log('==============================');

  try {
    const emailService = new EmailService();
    
    // Test 1: Check if transporter is available
    console.log('\n1. Checking SMTP configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'Not set');
    console.log('SMTP_USER:', process.env.SMTP_USER || 'Not set');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
    
    if (emailService.transporter) {
      console.log('✅ SMTP transporter is available');
    } else {
      console.log('❌ SMTP transporter not available');
      console.log('   Please configure SMTP credentials in .env file');
      console.log('\n📝 Required .env variables:');
      console.log('SMTP_HOST=smtp.gmail.com');
      console.log('SMTP_PORT=587');
      console.log('SMTP_USER=your-email@gmail.com');
      console.log('SMTP_PASS=your-app-password');
      console.log('SMTP_SECURE=false');
      console.log('FROM_EMAIL=noreply@urutibiz.com');
      console.log('FROM_NAME=UrutiBiz');
      return;
    }

    // Test 2: Test connection
    console.log('\n2. Testing SMTP connection...');
    const connectionTest = await emailService.testConnection();
    if (connectionTest) {
      console.log('✅ SMTP connection successful');
    } else {
      console.log('❌ SMTP connection failed');
      console.log('   Please check your SMTP credentials');
      return;
    }

    // Test 3: Send test email
    console.log('\n3. Sending test email...');
    const testEmail = {
      to: 'test@example.com',
      subject: 'Test Email from UrutiBiz',
      template: 'password-reset',
      data: {
        firstName: 'Test',
        resetUrl: 'http://localhost:5173/reset-password?token=test123',
        expiresIn: '15 minutes',
        supportEmail: 'support@urutibiz.com'
      }
    };

    const emailResult = await emailService.sendEmail(testEmail);
    if (emailResult) {
      console.log('✅ Test email sent successfully');
    } else {
      console.log('❌ Test email failed');
    }

    console.log('\n==============================');
    console.log('✅ Email configuration test completed!');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n📝 Make sure to:');
    console.log('1. Add SMTP credentials to .env file');
    console.log('2. Build the project: npm run build');
    console.log('3. Run the test again');
  }
}

// Run the test
testEmailConfig(); 