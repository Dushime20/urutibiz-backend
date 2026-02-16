# Production Deployment Fix - Complete Guide

## 🔍 Issues Identified

Your Docker container is failing with two main issues:

1. **Firebase Private Key Error**: `Failed to parse private key: Error: Invalid PEM formatted message`
2. **Database Connection Warning**: `Database not ready, retrying template initialization`

## 🎯 Root Causes

### Firebase Issue
The `.env` file contains the Firebase private key with literal `\n` characters (as text), but Docker's `--env-file` flag doesn't properly interpret these as actual newlines. The Firebase Admin SDK expects actual newline characters in the PEM format.

### Database Issue
The backend container is trying to connect to postgres before it's fully ready. This is a timing issue during startup.

## ✅ Solutions (Choose One)

### Solution 1: Quick Fix Script (Recommended for Testing)

Run the provided script on your server:

```bash
cd /opt/urutibiz/urutibiz-backend
bash quick-fix-run.sh
```

This script:
- Starts postgres and redis
- Exports Firebase key with proper newlines
- Runs the container with correct configuration

### Solution 2: Production Docker Compose (Recommended for Production)

This is the best long-term solution:

```bash
# 1. Setup Firebase credentials file
cd /opt/urutibiz/urutibiz-backend
bash setup-firebase-credentials.sh

# 2. Start all services with docker-compose
docker-compose -f docker-compose.production.yml up -d

# 3. Check logs
docker-compose -f docker-compose.production.yml logs -f api
```

Benefits:
- ✅ Proper service dependencies (waits for postgres to be healthy)
- ✅ Firebase credentials loaded from file (more secure)
- ✅ Health checks for all services
- ✅ Automatic restarts
- ✅ Proper networking

### Solution 3: Manual Docker Run with Fixed Key

```bash
# Export the key with actual newlines
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCOWgOevjhN4BaW
VrrzqgWxJmlu7S3txPhMZAbZ1IefkG7waOTg9YhrSL4RGiLJfcXQ0nymkGZpeCBQ
hbpWw+0pCZrNAFfa0KYhswWHjEIuRRU1pYLHs/SUE1bemFaXpfhOrYB0Z3j9lLlo
2f0Q8A95Ttp4vDGSB2KoJ6V+Y8hvt67d2O8VsesL1Yv5JZSc0WFVEV7os/fnYbMg
5w7vzQJ6sKDUUR2m9L6BjrOXr6fAnjxGLDV4wO5xUjekBhw7sa1LRWsQJ6hIjckM
dzibZjhUQ0XT4kzptpecQU2CriMXO0GyrnV8H48TiEl6c0ving5sDfWnmo9E9sYt
c1QOjJhnAgMBAAECggEAP70VTuBsdI4ofvNhrVXNS6df4R/JB2RBK29EVAfiHDO/
QN0u0n2OMj91f1HdDqxGxTxiPPB+Mq5rhbKDH3OF/vCChFUpgVwYbxFqIenO/knH
d+hemQ2+LwlDxdKfPzK87nmogTaNibmslUK6Gfnra80/bH0TkwfEiHeMFf4W0tJY
trx6Vp68qr3wdOfxhl7ta84mhgYfCIHmxIKVK4jU1L9vzDsbSE5iGrHrbKpCbNco
7TcLbdKQ7Y51xc1McNGlBRfXHebhTekcP1bilhTXqVlirXZ77Zeqy99SGl16eRNz
/bFYlrlTFk+lo88a8XfEU46nmzynz4unXMAJYyIdsQKBgQDDLRDq0e3aQab6y24z
nvz6Jc/kBnO1a9keqsDsDaxz51UO5nMUTY+gqOXS46D+bQwYt5fdeW0scoNcgtIm
jnWO7c1hK4n0vYQ5+Cp1X71nHAmbviA1S5M6a40V9dtaO/XUuS75DbRvoiiYjBt7
7ROF1evFwELgqTMMaAcIgE9+EQKBgQC6tqw0PKND8ECWzFPN5go21rqWYDTHSl7J
EnP06nDrNdAS2sjWUtVH/bXIppKi9z+3j1R5dHNcy+MmPZppYaZXxWByftaLeLIr
cYgU8ABocXwIGHqH14uXDTAP+yH275t8pDxiIeJMSqDxPo/dqw7+1jhIkTaH14Go
9OQUAjyW9wKBgCNaY2kVc48IO1XMSX7iOpKZDMoR/R2Mlnx+k4luhKFN8tNLHOc9
kVmZnl+PydasK/fCMaj1WLgnWfIE5EoFnfewzXXfbBK/zVauxAoUuHsX0gm665yb
vuRjHOAwc3YpzEKm9II6YEekSNQw9L2C2PlyIU3loHePTmbd5QA+NafxAoGAciia
ZV3l3PYaJ5lKbAuIlzr23lZ4Lpl0FrBnoYlt/QHr9Hs8bH481UV0Tfg6k9VkadEC
rzfaCRTID2t+64u+7s9JRvfyKVhkZ1eFAngzZ6hrU2/UCxZozLRNfJfpjle106F/
Iejhug+vE5FS2Q9rnbhQtV3D346OQkVo5irv7MUCgYARL7obQEKHaHJW7E9q4L+o
yM/molEeyExEhX9I10bx2dBNblxFIl+qsucsD4ZLr+L1u6oIDO+exo8uWJQT7XoR
mXuWvhHvKtlr8qcXf2XSZRUZFiWTusl2nTCumLPzTJOmka+8r1UHNf7Kgp3O9tWG
BLnOQQ0n9fi6cAFjVMVVZQ==
-----END PRIVATE KEY-----"

# Run container
docker run --rm -it \
  --network urutibiz-backend_urutibiz-network \
  --env-file .env \
  -e NODE_ENV=production \
  -e PORT=10000 \
  -e DB_HOST=postgres \
  -e FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
  urutibiz-backend:latest
```

### Solution 4: Disable Firebase Temporarily

If you don't need push notifications right now:

```bash
docker run --rm -it \
  --network urutibiz-backend_urutibiz-network \
  --env-file .env \
  -e NODE_ENV=production \
  -e PORT=10000 \
  -e DB_HOST=postgres \
  -e PUSH_PROVIDER=none \
  urutibiz-backend:latest
```

## 🔧 Code Improvements Made

I've updated `PushNotificationService.ts` to:
1. ✅ Try loading Firebase credentials from `GOOGLE_APPLICATION_CREDENTIALS` file first
2. ✅ Fallback to environment variables if file not found
3. ✅ Support base64-encoded private keys
4. ✅ Better error handling and logging

## 📋 Verification Steps

After applying any solution, verify:

```bash
# 1. Check if containers are running
docker ps

# 2. Check backend logs
docker logs -f urutibiz-api

# 3. Test database connection
docker exec -it urutibiz-postgres psql -U urutibiz_user -d urutibiz_db -c "SELECT 1"

# 4. Test API health
curl http://localhost:10000/health
```

## 🎯 Expected Results

After successful deployment, you should see:
- ✅ `Firebase Admin initialized` (no errors)
- ✅ `Database connection established`
- ✅ `Server listening on port 10000`
- ✅ No PEM format errors
- ✅ Notification templates initialized

## 📁 Files Created

1. `FIREBASE_DATABASE_FIX.md` - Detailed technical explanation
2. `quick-fix-run.sh` - Quick fix script for immediate testing
3. `docker-compose.production.yml` - Production-ready compose file
4. `setup-firebase-credentials.sh` - Firebase credentials setup
5. `PRODUCTION_DEPLOYMENT_FIX.md` - This guide

## 🚀 Recommended Deployment Flow

For production, follow this order:

```bash
# 1. Navigate to backend directory
cd /opt/urutibiz/urutibiz-backend

# 2. Setup Firebase credentials
bash setup-firebase-credentials.sh

# 3. Rebuild the image with updated code
docker build -t urutibiz-backend:latest .

# 4. Stop existing containers
docker-compose -f docker-compose.production.yml down

# 5. Start with new configuration
docker-compose -f docker-compose.production.yml up -d

# 6. Monitor logs
docker-compose -f docker-compose.production.yml logs -f
```

## 🔒 Security Notes

- The `firebase-credentials.json` file contains sensitive data
- Ensure it has proper permissions: `chmod 600 firebase-credentials.json`
- Add it to `.gitignore` to prevent committing to version control
- Consider using Docker secrets or Kubernetes secrets in production

## 📞 Troubleshooting

### If Firebase still fails:
```bash
# Check if credentials file exists and is readable
ls -la firebase-credentials.json
cat firebase-credentials.json | jq .

# Verify it's mounted in container
docker exec -it urutibiz-api ls -la /app/firebase-credentials.json
```

### If database connection fails:
```bash
# Check postgres is running
docker ps | grep postgres

# Check network connectivity
docker exec -it urutibiz-api ping postgres

# Check postgres logs
docker logs urutibiz-postgres
```

### If port conflicts:
```bash
# Check what's using port 10000
netstat -tulpn | grep 10000

# Change port in .env or docker-compose
PORT=10001
```

## 📚 Additional Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)
