/**
 * Run Python image search service
 * Cross-platform script
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const pythonServiceDir = path.join(__dirname, '..', 'python-service');
const mainPy = path.join(pythonServiceDir, 'main.py');

console.log('🚀 Starting Python Image Service...');
console.log(`   Directory: ${pythonServiceDir}`);
console.log(`   Service will run on: http://localhost:8001`);
console.log('');

// Check if main.py exists
if (!fs.existsSync(mainPy)) {
  console.error('❌ main.py not found!');
  console.error(`   Expected at: ${mainPy}`);
  console.error('   Please ensure python-service directory exists');
  process.exit(1);
}

// Check if requirements are installed
const requirementsFile = path.join(pythonServiceDir, 'requirements.txt');
if (fs.existsSync(requirementsFile)) {
  console.log('💡 Tip: If you see import errors, run: npm run python:install');
  console.log('');
}

// Try to find Python
let pythonCmd = 'python';

// Check for virtual environment first
const isWin = process.platform === 'win32';
const venvPath = path.join(pythonServiceDir, 'venv');
const venvPython = isWin
  ? path.join(venvPath, 'Scripts', 'python.exe')
  : path.join(venvPath, 'bin', 'python');

if (fs.existsSync(venvPython)) {
  console.log('✅ Found virtual environment, using it.');
  pythonCmd = venvPython;
} else {
  console.log('⚠️ Virtual environment not found, falling back to system python.');
  try {
    require('child_process').execSync('python --version', { stdio: 'ignore' });
  } catch (error) {
    try {
      require('child_process').execSync('python3 --version', { stdio: 'ignore' });
      pythonCmd = 'python3';
    } catch (error2) {
      console.error('❌ Python not found!');
      console.error('   Please install Python 3.8+ or run setup_python_env.sh');
      process.exit(1);
    }
  }
}

// Start Python service
console.log(`🔄 Starting service with ${pythonCmd}...`);
console.log('   Press Ctrl+C to stop the service');
console.log('');

const pythonProcess = spawn(pythonCmd, [mainPy], {
  cwd: pythonServiceDir,
  stdio: 'inherit',
  shell: true
});

pythonProcess.on('error', (error) => {
  console.error('❌ Failed to start Python service:', error.message);
  console.error('   Make sure Python is installed and in your PATH');
  process.exit(1);
});

pythonProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ Python service exited with code ${code}`);
    console.error('   Check the error messages above');
  }
  process.exit(code || 0);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping Python service...');
  pythonProcess.kill('SIGINT');
  setTimeout(() => {
    pythonProcess.kill('SIGTERM');
    process.exit(0);
  }, 2000);
});

process.on('SIGTERM', () => {
  pythonProcess.kill('SIGTERM');
  process.exit(0);
});
