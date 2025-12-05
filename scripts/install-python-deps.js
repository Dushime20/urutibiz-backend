/**
 * Install Python dependencies for image search service
 * Cross-platform script
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const pythonServiceDir = path.join(__dirname, '..', 'python-service');
const requirementsFile = path.join(pythonServiceDir, 'requirements.txt');

console.log('📦 Installing Python dependencies for image search service...');
console.log(`   Directory: ${pythonServiceDir}`);
console.log(`   Requirements: ${requirementsFile}`);

// Check if requirements.txt exists
if (!fs.existsSync(requirementsFile)) {
  console.error('❌ requirements.txt not found!');
  console.error(`   Expected at: ${requirementsFile}`);
  process.exit(1);
}

// Check if Python is available
try {
  const pythonVersion = execSync('python --version', { encoding: 'utf-8' });
  console.log(`✅ Python found: ${pythonVersion.trim()}`);
} catch (error) {
  try {
    const python3Version = execSync('python3 --version', { encoding: 'utf-8' });
    console.log(`✅ Python3 found: ${python3Version.trim()}`);
  } catch (error2) {
    console.error('❌ Python not found!');
    console.error('   Please install Python 3.8+ from https://www.python.org/');
    process.exit(1);
  }
}

// Check if pip is available
try {
  execSync('pip --version', { stdio: 'ignore' });
  console.log('✅ pip found');
} catch (error) {
  try {
    execSync('pip3 --version', { stdio: 'ignore' });
    console.log('✅ pip3 found');
  } catch (error2) {
    console.error('❌ pip not found!');
    console.error('   Please install pip (usually comes with Python)');
    process.exit(1);
  }
}

// Check Python version
let pythonVersion = '';
try {
  pythonVersion = execSync('python --version', { encoding: 'utf-8' }).trim();
} catch {
  pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim();
}

const versionMatch = pythonVersion.match(/Python (\d+)\.(\d+)/);
if (versionMatch) {
  const major = parseInt(versionMatch[1]);
  const minor = parseInt(versionMatch[2]);
  
  if (major === 3 && minor >= 13) {
    console.log('⚠️  Python 3.13 detected - some packages may have compatibility issues');
    console.log('   Recommendation: Use Python 3.11 or 3.12 for better compatibility');
    console.log('   Or try installing without version pins: pip install fastapi uvicorn pillow torch sentence-transformers');
  }
}

// Install dependencies
try {
  console.log('\n🔄 Installing dependencies (this may take a few minutes)...');
  console.log('   First run will download CLIP model (~500MB)');
  console.log('   If installation fails, try: pip install --upgrade pip setuptools wheel');
  
  process.chdir(pythonServiceDir);
  
  // First, upgrade pip, setuptools, and wheel
  try {
    console.log('   Upgrading pip, setuptools, and wheel...');
    execSync('python -m pip install --upgrade pip setuptools wheel', { 
      stdio: 'inherit',
      cwd: pythonServiceDir
    });
  } catch (error) {
    try {
      execSync('python3 -m pip install --upgrade pip setuptools wheel', { 
        stdio: 'inherit',
        cwd: pythonServiceDir
      });
    } catch (error2) {
      console.warn('   ⚠️  Could not upgrade pip (non-critical)');
    }
  }
  
  // Try installing with pip first
  let installSuccess = false;
  try {
    execSync('pip install -r requirements.txt', { 
      stdio: 'inherit',
      cwd: pythonServiceDir
    });
    installSuccess = true;
  } catch (error) {
    // Try pip3 if pip fails
    try {
      execSync('pip3 install -r requirements.txt', { 
        stdio: 'inherit',
        cwd: pythonServiceDir
      });
      installSuccess = true;
    } catch (error2) {
      // If that fails, try installing without version pins
      console.log('\n   ⚠️  Installation with pinned versions failed');
      console.log('   Trying with flexible versions...');
      try {
        execSync('pip install fastapi uvicorn[standard] pillow torch torchvision sentence-transformers numpy python-multipart aiofiles', { 
          stdio: 'inherit',
          cwd: pythonServiceDir
        });
        installSuccess = true;
      } catch (error3) {
        throw error3;
      }
    }
  }
  
  if (installSuccess) {
    console.log('\n✅ Python dependencies installed successfully!');
    console.log('   You can now start the Python service with: npm run python:service');
  }
  
} catch (error) {
  console.error('\n❌ Failed to install Python dependencies');
  console.error(`   Error: ${error.message}`);
  console.error('\n💡 Troubleshooting:');
  console.error('   1. Upgrade pip: python -m pip install --upgrade pip setuptools wheel');
  console.error('   2. Try Python 3.11 or 3.12 (better compatibility)');
  console.error('   3. Install manually: cd python-service && pip install fastapi uvicorn pillow torch sentence-transformers');
  process.exit(1);
}
