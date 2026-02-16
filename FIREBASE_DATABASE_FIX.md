# Firebase & Database Connection Fix

## Issues Identified

1. **Firebase Private Key Parsing Error**: The private key contains literal `\n` characters that aren't being properly converted to newlines
2. **Database Connection**: NotificationEngine can't initialize because database isn't ready

## Solutions

### Solution 1: Fix Firebase Private Key (Recommended)

The issue is that Docker's `--env-file` doesn't properly handle multi-line environment variables with escaped newlines. You have two options:

#### Option A: Pass Firebase Key Directly (Quick Fix)

Instead of using `--env-file` for Firebase credentials, pass them directly:

```bash
# Create a temporary file with the properly formatted key
cat > /tmp/firebase-key.txt << 'EOF'
-----BEGIN PRIVATE KEY-----
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
-----END PRIVATE KEY-----
EOF

# Export it as an environment variable with proper newlines
export FIREBASE_PRIVATE_KEY=$(cat /tmp/firebase-key.txt)

# Run container with the properly formatted key
docker run --rm -it \
  --network urutibiz-backend_urutibiz-network \
  --env-file .env \
  -e NODE_ENV=production \
  -e PORT=10000 \
  -e DB_HOST=postgres \
  -e FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
  urutibiz-backend:latest

# Clean up
rm /tmp/firebase-key.txt
```

#### Option B: Use Docker Secrets (Production Best Practice)

```bash
# Create a secret file
cat > firebase-key.json << 'EOF'
{
  "type": "service_account",
  "project_id": "urtbz-af684",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCOWgOevjhN4BaW\nVrrzqgWxJmlu7S3txPhMZAbZ1IefkG7waOTg9YhrSL4RGiLJfcXQ0nymkGZpeCBQ\nhbpWw+0pCZrNAFfa0KYhswWHjEIuRRU1pYLHs/SUE1bemFaXpfhOrYB0Z3j9lLlo\n2f0Q8A95Ttp4vDGSB2KoJ6V+Y8hvt67d2O8VsesL1Yv5JZSc0WFVEV7os/fnYbMg\n5w7vzQJ6sKDUUR2m9L6BjrOXr6fAnjxGLDV4wO5xUjekBhw7sa1LRWsQJ6hIjckM\ndzibZjhUQ0XT4kzptpecQU2CriMXO0GyrnV8H48TiEl6c0ving5sDfWnmo9E9sYt\nc1QOjJhnAgMBAAECggEAP70VTuBsdI4ofvNhrVXNS6df4R/JB2RBK29EVAfiHDO/\nQN0u0n2OMj91f1HdDqxGxTxiPPB+Mq5rhbKDH3OF/vCChFUpgVwYbxFqIenO/knH\nd+hemQ2+LwlDxdKfPzK87nmogTaNibmslUK6Gfnra80/bH0TkwfEiHeMFf4W0tJY\ntrx6Vp68qr3wdOfxhl7ta84mhgYfCIHmxIKVK4jU1L9vzDsbSE5iGrHrbKpCbNco\n7TcLbdKQ7Y51xc1McNGlBRfXHebhTekcP1bilhTXqVlirXZ77Zeqy99SGl16eRNz\n/bFYlrlTFk+lo88a8XfEU46nmzynz4unXMAJYyIdsQKBgQDDLRDq0e3aQab6y24z\nnvz6Jc/kBnO1a9keqsDsDaxz51UO5nMUTY+gqOXS46D+bQwYt5fdeW0scoNcgtIm\njnWO7c1hK4n0vYQ5+Cp1X71nHAmbviA1S5M6a40V9dtaO/XUuS75DbRvoiiYjBt7\n7ROF1evFwELgqTMMaAcIgE9+EQKBgQC6tqw0PKND8ECWzFPN5go21rqWYDTHSl7J\nEnP06nDrNdAS2sjWUtVH/bXIppKi9z+3j1R5dHNcy+MmPZppYaZXxWByftaLeLIr\ncYgU8ABocXwIGHqH14uXDTAP+yH275t8pDxiIeJMSqDxPo/dqw7+1jhIkTaH14Go\n9OQUAjyW9wKBgCNaY2kVc48IO1XMSX7iOpKZDMoR/R2Mlnx+k4luhKFN8tNLHOc9\nkVmZnl+PydasK/fCMaj1WLgnWfIE5EoFnfewzXXfbBK/zVauxAoUuHsX0gm665yb\nvuRjHOAwc3YpzEKm9II6YEekSNQw9L2C2PlyIU3loHePTmbd5QA+NafxAoGAciia\nZV3l3PYaJ5lKbAuIlzr23lZ4Lpl0FrBnoYlt/QHr9Hs8bH481UV0Tfg6k9VkadEC\nrzfaCRTID2t+64u+7s9JRvfyKVhkZ1eFAngzZ6hrU2/UCxZozLRNfJfpjle106F/\nIejhug+vE5FS2Q9rnbhQtV3D346OQkVo5irv7MUCgYARL7obQEKHaHJW7E9q4L+o\nyM/molEeyExEhX9I10bx2dBNblxFIl+qsucsD4ZLr+L1u6oIDO+exo8uWJQT7XoR\nmXuWvhHvKtlr8qcXf2XSZRUZFiWTusl2nTCumLPzTJOmka+8r1UHNf7Kgp3O9tWG\nBLnOQQ0n9fi6cAFjVMVVZQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@urtbz-af684.iam.gserviceaccount.com"
}
EOF

# Mount the file and use GOOGLE_APPLICATION_CREDENTIALS
docker run --rm -it \
  --network urutibiz-backend_urutibiz-network \
  --env-file .env \
  -e NODE_ENV=production \
  -e PORT=10000 \
  -e DB_HOST=postgres \
  -v $(pwd)/firebase-key.json:/app/firebase-key.json:ro \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/firebase-key.json \
  urutibiz-backend:latest
```

#### Option C: Fix the Code to Handle Base64 Encoded Keys

Update the `.env` file to use base64 encoding:

```bash
# In .env, replace the FIREBASE_PRIVATE_KEY line with:
FIREBASE_PRIVATE_KEY_BASE64=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUVWQUVCQURBZ...
```

Then update the code to decode it (I can help with this if needed).

### Solution 2: Fix Database Connection

The "Database not ready" warning is expected during startup. However, you need to ensure:

1. **Postgres container is running**:
```bash
docker ps | grep postgres
```

2. **Check if postgres is in the same network**:
```bash
docker network inspect urutibiz-backend_urutibiz-network
```

3. **If postgres isn't running, start it**:
```bash
cd /opt/urutibiz/urutibiz-backend
docker-compose -f docker/docker-compose.yml up -d postgres
```

4. **Verify postgres is accessible**:
```bash
docker run --rm --network urutibiz-backend_urutibiz-network postgres:15-alpine \
  psql -h postgres -U urutibiz_user -d urutibiz_db -c "SELECT 1"
```

## Complete Working Solution

Here's the complete command that should work:

```bash
#!/bin/bash

# 1. Ensure postgres is running
cd /opt/urutibiz/urutibiz-backend
docker-compose -f docker/docker-compose.yml up -d postgres redis

# 2. Wait for postgres to be ready
echo "Waiting for postgres..."
sleep 5

# 3. Create properly formatted Firebase key
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

# 4. Run the container
docker run --rm -it \
  --network urutibiz-backend_urutibiz-network \
  --env-file .env \
  -e NODE_ENV=production \
  -e PORT=10000 \
  -e DB_HOST=postgres \
  -e FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
  urutibiz-backend:latest
```

## Alternative: Disable Firebase Temporarily

If you don't need push notifications right now, you can disable Firebase:

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

## Verification

After applying the fix, you should see:
- ✅ No Firebase private key errors
- ✅ Database connection established
- ✅ Application starts successfully

Check logs:
```bash
docker logs -f <container-name>
```
