/**
 * Diagnostic script to check why messaging notifications aren't working on server
 * Run: node scripts/check-messaging-notifications.js
 */

let getDatabase, connectDatabase, closeDatabase;
try {
  const dbModule = require('../dist/config/database');
  getDatabase = dbModule.getDatabase;
  connectDatabase = dbModule.connectDatabase;
  closeDatabase = dbModule.closeDatabase;
} catch (e) {
  try {
    const dbModule = require('../src/config/database');
    getDatabase = dbModule.getDatabase;
    connectDatabase = dbModule.connectDatabase;
    closeDatabase = dbModule.closeDatabase;
  } catch (e2) {
    console.error('❌ Could not load database module.');
    process.exit(1);
  }
}

async function checkMessagingNotifications() {
  console.log('🔍 Checking messaging notification configuration...\n');
  
  // Check 1: Environment
  console.log('1️⃣ Environment Check:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  if (process.env.NODE_ENV === 'demo') {
    console.log('   ⚠️  WARNING: Running in DEMO mode - notifications may be disabled!');
    console.log('   💡 Solution: Set NODE_ENV=production in .env file\n');
  } else {
    console.log('   ✅ Environment looks good\n');
  }
  
  // Check 2: Email Configuration
  console.log('2️⃣ Email Configuration:');
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  
  console.log(`   SMTP_HOST: ${smtpHost || '❌ NOT SET'}`);
  console.log(`   SMTP_USER: ${smtpUser ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`   SMTP_PASS: ${smtpPass ? '✅ SET' : '❌ NOT SET'}`);
  
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('   ⚠️  WARNING: Email not configured - notifications won\'t send via email!');
    console.log('   💡 Solution: Configure SMTP settings in .env file\n');
  } else {
    console.log('   ✅ Email configuration looks good\n');
  }
  
  // Check 3: Code Deployment
  console.log('3️⃣ Code Deployment Check:');
  try {
    const fs = require('fs');
    const path = require('path');
    
    const messagingServicePath = path.join(__dirname, '../dist/services/messaging.service.js');
    const fileExists = fs.existsSync(messagingServicePath);
    
    if (!fileExists) {
      console.log('   ❌ Compiled code not found!');
      console.log('   💡 Solution: Run "npm run build" to compile TypeScript\n');
    } else {
      // Check if sendMessageNotification method exists
      const fileContent = fs.readFileSync(messagingServicePath, 'utf8');
      if (fileContent.includes('sendMessageNotification')) {
        console.log('   ✅ Notification code is deployed\n');
      } else {
        console.log('   ❌ Notification code NOT found in compiled file!');
        console.log('   💡 Solution: Rebuild and restart: npm run build && pm2 restart all\n');
      }
    }
  } catch (e) {
    console.log('   ⚠️  Could not check code deployment:', e.message, '\n');
  }
  
  // Check 4: Database Connection
  console.log('4️⃣ Database Connection:');
  try {
    await connectDatabase();
    const knex = getDatabase();
    
    // Check if notifications table exists
    const hasNotificationsTable = await knex.schema.hasTable('notifications');
    console.log(`   notifications table: ${hasNotificationsTable ? '✅ exists' : '❌ missing'}`);
    
    // Check recent notifications
    if (hasNotificationsTable) {
      const recentNotifications = await knex('notifications')
        .orderBy('created_at', 'desc')
        .limit(5)
        .select('id', 'type', 'recipient_id', 'status', 'created_at');
      
      console.log(`   Recent notifications: ${recentNotifications.length} found`);
      if (recentNotifications.length > 0) {
        console.log('   Latest notification:', {
          type: recentNotifications[0].type,
          status: recentNotifications[0].status,
          created: recentNotifications[0].created_at
        });
      }
    }
    
    // Check messaging tables
    const hasChats = await knex.schema.hasTable('chats');
    const hasMessages = await knex.schema.hasTable('messages');
    console.log(`   chats table: ${hasChats ? '✅' : '❌'}`);
    console.log(`   messages table: ${hasMessages ? '✅' : '❌'}\n`);
    
    await closeDatabase();
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}\n`);
  }
  
  // Check 5: Notification Service
  console.log('5️⃣ Notification Service Check:');
  try {
    const { NotificationEngine } = require('../dist/services/notification/NotificationEngine');
    const engine = new NotificationEngine();
    console.log('   ✅ NotificationEngine can be instantiated\n');
  } catch (error) {
    console.log(`   ❌ NotificationEngine error: ${error.message}\n`);
  }
  
  // Summary
  console.log('📋 Summary:');
  console.log('   If notifications aren\'t working, check:');
  console.log('   1. NODE_ENV should be "production" (not "demo")');
  console.log('   2. SMTP credentials must be configured');
  console.log('   3. Code must be compiled (npm run build)');
  console.log('   4. Server must be restarted after code changes');
  console.log('   5. Check server logs: pm2 logs');
  console.log('\n💡 Quick Fix:');
  console.log('   npm run build && pm2 restart all');
}

checkMessagingNotifications().catch(console.error);

