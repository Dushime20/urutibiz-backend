const fs = require('fs');
const path = require('path');

// Test file upload directory
const uploadsDir = path.join(__dirname, 'uploads');
const testFile = path.join(uploadsDir, 'test-avatar.jpg');

console.log('=== Avatar Upload Test ===');
console.log('Uploads directory:', uploadsDir);
console.log('Directory exists:', fs.existsSync(uploadsDir));
console.log('Directory contents:', fs.readdirSync(uploadsDir));

// Check if we can write to the directory
try {
  const testContent = 'test file content';
  fs.writeFileSync(testFile, testContent);
  console.log('✅ Can write to uploads directory');
  fs.unlinkSync(testFile); // Clean up
} catch (error) {
  console.error('❌ Cannot write to uploads directory:', error.message);
}

console.log('=== End Test ===');
