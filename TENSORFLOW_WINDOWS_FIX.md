# TensorFlow.js Windows Fix Guide

## Current Issue
```
Error: The specified module could not be found.
ERR_DLOPEN_FAILED
```

This means the native binding file exists but can't be loaded.

## Solutions (Try in Order)

### Solution 1: Install Visual C++ Redistributables (Most Common Fix)

TensorFlow.js requires Visual C++ Redistributables on Windows:

1. Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
2. Install it
3. Restart your server

### Solution 2: Rebuild for Your Node.js Version

```powershell
# Rebuild native bindings
npm rebuild @tensorflow/tfjs-node

# If that doesn't work, try:
npm rebuild @tensorflow/tfjs-node --build-addon-from-source
```

### Solution 3: Check Node.js Version Compatibility

Node.js v22 is very new. TensorFlow.js might not fully support it yet.

**Option A: Use Node.js LTS (Recommended)**
```powershell
# Install Node.js v20 LTS from nodejs.org
# Then reinstall:
npm install @tensorflow/tfjs-node@^4.22.0
```

**Option B: Wait for TensorFlow.js Update**
- Check: https://github.com/tensorflow/tfjs/issues
- Look for Node.js v22 support

### Solution 4: Use Fallback Method (Current Workaround)

The system automatically falls back to basic feature extraction:
- ✅ Works without TensorFlow.js
- ✅ Fast (<500ms after optimization)
- ⚠️ Less accurate (128-dim vs 1280-dim)

The fallback is already optimized and working!

## Verification

After applying fixes, restart server and check logs:

**Success:**
```
✅ TensorFlow.js loaded successfully
✅ MobileNet model loaded successfully
✅ Feature extraction completed in 300ms (1280 dimensions)
```

**Still Failing (Using Fallback):**
```
⚠️ TensorFlow.js native bindings failed to load.
Using fallback feature extraction method
✅ Feature extraction completed in 400ms (128 dimensions)
```

## Quick Test

```powershell
# Test if native module loads
node -e "require('@tensorflow/tfjs-node')"
```

If this fails, the issue is with the native bindings.
If this works, the issue is with how it's being imported.

## Current Status

- ✅ Package installed: `@tensorflow/tfjs-node@4.22.0`
- ✅ Native binding exists: `lib/napi-v8/tfjs_binding.node`
- ❌ Module can't load: `ERR_DLOPEN_FAILED`
- ✅ Fallback working: Basic feature extraction (optimized)

## Recommended Action

1. **Install Visual C++ Redistributables** (Solution 1) - This fixes 90% of cases
2. If that doesn't work, **downgrade to Node.js v20 LTS** (Solution 3A)
3. The fallback method is already optimized and works well as a temporary solution

