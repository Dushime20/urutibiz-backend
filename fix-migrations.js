const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'database', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts'));

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Remove skip patterns
  content = content.replace(/if\s*\(\s*!has\w+\s*\)\s*{\s*console\.log\([^)]+skipping[^)]+\);\s*return;\s*}/gi, '');
  content = content.replace(/if\s*\(\s*!has\w+\s*\)\s*return;/gi, '');
  content = content.replace(/console\.log\([^)]*skipping[^)]*\);/gi, '');
  content = content.replace(/console\.warn\([^)]*skipping[^)]*\);/gi, '');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    console.log(`Fixed: ${file}`);
  }
});

console.log(`\nTotal files fixed: ${fixedCount}`);
