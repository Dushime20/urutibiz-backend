#!/bin/bash
# Quick Fix Script for Firebase & Database Issues
# Run this on your server: bash quick-fix-run.sh

set -e

echo "🔧 UrutiBiz Backend - Quick Fix Script"
echo "======================================="

# Navigate to backend directory
cd /opt/urutibiz/urutibiz-backend

# 1. Start postgres and redis if not running
echo "📦 Starting postgres and redis..."
docker-compose -f docker/docker-compose.yml up -d postgres redis 2>/dev/null || echo "Containers already running or compose file not found"

# 2. Wait for postgres
echo "⏳ Waiting for postgres to be ready..."
sleep 5

# 3. Set Firebase private key with proper newlines
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

echo "🚀 Starting backend container..."
docker run --rm -it \
  --network urutibiz-backend_urutibiz-network \
  --env-file .env \
  -e NODE_ENV=production \
  -e PORT=10000 \
  -e DB_HOST=postgres \
  -e FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY" \
  urutibiz-backend:latest

echo "✅ Done!"
