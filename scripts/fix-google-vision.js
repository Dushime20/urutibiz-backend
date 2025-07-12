#!/usr/bin/env node

/**
 * Google Vision API Diagnostic and Fix Script
 * This script helps diagnose and fix Google Vision API billing issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Google Vision API Diagnostic Tool\n');

// Check 1: Environment Variables
console.log('1. Checking Environment Variables...');
const googleCredsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (googleCredsPath) {
  console.log(`✅ GOOGLE_APPLICATION_CREDENTIALS is set: ${googleCredsPath}`);
  
  // Check if file exists
  if (fs.existsSync(googleCredsPath)) {
    console.log('✅ Credentials file exists');
    
    try {
      const creds = JSON.parse(fs.readFileSync(googleCredsPath, 'utf8'));
      console.log(`📋 Project ID: ${creds.project_id}`);
      console.log(`📧 Service Account: ${creds.client_email}`);
    } catch (error) {
      console.log('❌ Error reading credentials file:', error.message);
    }
  } else {
    console.log('❌ Credentials file does not exist');
  }
} else {
  console.log('❌ GOOGLE_APPLICATION_CREDENTIALS not set');
}

// Check 2: Look for vision-key.json in project
console.log('\n2. Checking for vision-key.json...');
const visionKeyPath = path.join(__dirname, '..', 'vision-key.json');
if (fs.existsSync(visionKeyPath)) {
  console.log('✅ vision-key.json found in project root');
  
  try {
    const creds = JSON.parse(fs.readFileSync(visionKeyPath, 'utf8'));
    console.log(`📋 Project ID: ${creds.project_id}`);
    console.log(`📧 Service Account: ${creds.client_email}`);
  } catch (error) {
    console.log('❌ Error reading vision-key.json:', error.message);
  }
} else {
  console.log('❌ vision-key.json not found in project root');
}

// Check 3: Test Google Vision Client
console.log('\n3. Testing Google Vision Client...');
try {
  const vision = require('@google-cloud/vision');
  console.log('✅ @google-cloud/vision package is installed');
  
  if (googleCredsPath && fs.existsSync(googleCredsPath)) {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: googleCredsPath,
    });
    console.log('✅ Google Vision client created successfully');
  } else {
    console.log('⚠️ Cannot test client without valid credentials');
  }
} catch (error) {
  console.log('❌ Error with Google Vision client:', error.message);
}

// Instructions
console.log('\n📋 INSTRUCTIONS TO FIX BILLING ISSUE:');
console.log('\n1. Go to Google Cloud Console: https://console.cloud.google.com/');
console.log('2. Select the correct project (check the project ID above)');
console.log('3. Go to Billing: https://console.developers.google.com/billing/enable');
console.log('4. Link a billing account to your project');
console.log('5. Go to APIs & Services > Library');
console.log('6. Search for "Cloud Vision API" and enable it');
console.log('7. Wait 5-10 minutes for changes to propagate');

console.log('\n🔧 QUICK FIXES:');
console.log('\nOption 1: Set environment variable:');
console.log(`export GOOGLE_APPLICATION_CREDENTIALS="${path.resolve(__dirname, '..', 'vision-key.json')}"`);

console.log('\nOption 2: Add to your .env file:');
console.log(`GOOGLE_APPLICATION_CREDENTIALS=${path.resolve(__dirname, '..', 'vision-key.json')}`);

console.log('\nOption 3: Create new service account:');
console.log('1. Go to IAM & Admin > Service Accounts');
console.log('2. Create new service account with "Cloud Vision API User" role');
console.log('3. Download new key file');
console.log('4. Update GOOGLE_APPLICATION_CREDENTIALS path');

console.log('\n✅ After fixing billing, restart your server and try again!'); 