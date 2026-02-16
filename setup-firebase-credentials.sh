#!/bin/bash
# Setup Firebase Credentials for Docker
# This script creates a proper Firebase service account JSON file

set -e

echo "🔥 Firebase Credentials Setup"
echo "=============================="

# Check if running in the correct directory
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Please run this script from the backend directory."
    exit 1
fi

# Create Firebase credentials JSON file
cat > firebase-credentials.json << 'EOF'
{
  "type": "service_account",
  "project_id": "urtbz-af684",
  "private_key_id": "generated-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCOWgOevjhN4BaW\nVrrzqgWxJmlu7S3txPhMZAbZ1IefkG7waOTg9YhrSL4RGiLJfcXQ0nymkGZpeCBQ\nhbpWw+0pCZrNAFfa0KYhswWHjEIuRRU1pYLHs/SUE1bemFaXpfhOrYB0Z3j9lLlo\n2f0Q8A95Ttp4vDGSB2KoJ6V+Y8hvt67d2O8VsesL1Yv5JZSc0WFVEV7os/fnYbMg\n5w7vzQJ6sKDUUR2m9L6BjrOXr6fAnjxGLDV4wO5xUjekBhw7sa1LRWsQJ6hIjckM\ndzibZjhUQ0XT4kzptpecQU2CriMXO0GyrnV8H48TiEl6c0ving5sDfWnmo9E9sYt\nc1QOjJhnAgMBAAECggEAP70VTuBsdI4ofvNhrVXNS6df4R/JB2RBK29EVAfiHDO/\nQN0u0n2OMj91f1HdDqxGxTxiPPB+Mq5rhbKDH3OF/vCChFUpgVwYbxFqIenO/knH\nd+hemQ2+LwlDxdKfPzK87nmogTaNibmslUK6Gfnra80/bH0TkwfEiHeMFf4W0tJY\ntrx6Vp68qr3wdOfxhl7ta84mhgYfCIHmxIKVK4jU1L9vzDsbSE5iGrHrbKpCbNco\n7TcLbdKQ7Y51xc1McNGlBRfXHebhTekcP1bilhTXqVlirXZ77Zeqy99SGl16eRNz\n/bFYlrlTFk+lo88a8XfEU46nmzynz4unXMAJYyIdsQKBgQDDLRDq0e3aQab6y24z\nnvz6Jc/kBnO1a9keqsDsDaxz51UO5nMUTY+gqOXS46D+bQwYt5fdeW0scoNcgtIm\njnWO7c1hK4n0vYQ5+Cp1X71nHAmbviA1S5M6a40V9dtaO/XUuS75DbRvoiiYjBt7\n7ROF1evFwELgqTMMaAcIgE9+EQKBgQC6tqw0PKND8ECWzFPN5go21rqWYDTHSl7J\nEnP06nDrNdAS2sjWUtVH/bXIppKi9z+3j1R5dHNcy+MmPZppYaZXxWByftaLeLIr\ncYgU8ABocXwIGHqH14uXDTAP+yH275t8pDxiIeJMSqDxPo/dqw7+1jhIkTaH14Go\n9OQUAjyW9wKBgCNaY2kVc48IO1XMSX7iOpKZDMoR/R2Mlnx+k4luhKFN8tNLHOc9\nkVmZnl+PydasK/fCMaj1WLgnWfIE5EoFnfewzXXfbBK/zVauxAoUuHsX0gm665yb\nvuRjHOAwc3YpzEKm9II6YEekSNQw9L2C2PlyIU3loHePTmbd5QA+NafxAoGAciia\nZV3l3PYaJ5lKbAuIlzr23lZ4Lpl0FrBnoYlt/QHr9Hs8bH481UV0Tfg6k9VkadEC\nrzfaCRTID2t+64u+7s9JRvfyKVhkZ1eFAngzZ6hrU2/UCxZozLRNfJfpjle106F/\nIejhug+vE5FS2Q9rnbhQtV3D346OQkVo5irv7MUCgYARL7obQEKHaHJW7E9q4L+o\nyM/molEeyExEhX9I10bx2dBNblxFIl+qsucsD4ZLr+L1u6oIDO+exo8uWJQT7XoR\nmXuWvhHvKtlr8qcXf2XSZRUZFiWTusl2nTCumLPzTJOmka+8r1UHNf7Kgp3O9tWG\nBLnOQQ0n9fi6cAFjVMVVZQ==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@urtbz-af684.iam.gserviceaccount.com",
  "client_id": "generated-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40urtbz-af684.iam.gserviceaccount.com"
}
EOF

# Set proper permissions
chmod 600 firebase-credentials.json

echo "✅ Firebase credentials file created: firebase-credentials.json"
echo ""
echo "📝 Next steps:"
echo "   1. Update your code to use GOOGLE_APPLICATION_CREDENTIALS"
echo "   2. Or use docker-compose.production.yml which mounts this file"
echo ""
echo "🚀 To start with docker-compose:"
echo "   docker-compose -f docker-compose.production.yml up -d"
