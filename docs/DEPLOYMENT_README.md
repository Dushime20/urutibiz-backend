# 🚀 UrutiBiz - Production Deployment Guide

Complete deployment guide for the UrutiBiz platform - a comprehensive rental and booking management system with frontend and backend components.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Flow](#architecture--flow)
3. [System Requirements](#system-requirements)
4. [Prerequisites](#prerequisites)
5. [Environment Setup](#environment-setup)
6. [Database Setup](#database-setup)
7. [Backend Deployment](#backend-deployment)
8. [Frontend Deployment](#frontend-deployment)
9. [External Services Configuration](#external-services-configuration)
10. [Production Deployment](#production-deployment)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**UrutiBiz** is a full-stack rental and booking platform that enables users to rent products, manage bookings, handle payments, and process inspections. The system consists of:

- **Frontend**: React + TypeScript + Vite application
- **Backend**: Node.js + Express + TypeScript API server
- **Database**: PostgreSQL with PostGIS extension
- **Cache**: Redis for session management and caching
- **AI Services**: TensorFlow.js for image search, OCR for document verification

### Key Features

- User authentication with 2FA and KYC verification
- Product catalog with dynamic pricing
- Real-time booking system with conflict prevention
- Payment processing (Stripe integration)
- Insurance management
- Inspection workflows
- AI-powered image search
- Multi-language support (i18n)
- Real-time notifications (Socket.IO)
- Admin dashboard with analytics

---

## 🏗️ Architecture & Flow

### System Architecture

```
┌─────────────────┐
│   Frontend       │  React + Vite (Port 5173/3000)
│   (React/TS)     │
└────────┬─────────┘
         │ HTTP/REST API
         │ WebSocket (Socket.IO)
         ▼
┌─────────────────┐
│   Backend       │  Express + Node.js (Port 3000/10000)
│   (Node/TS)     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │        │
    ▼        ▼
┌────────┐ ┌────────┐
│PostgreSQL│ │ Redis  │
│Database │ │ Cache  │
└────────┘ └────────┘
```

### Request Flow

1. **User Request** → Frontend (React App)
2. **API Call** → Backend (Express Server)
3. **Authentication** → JWT Token Validation
4. **Business Logic** → Service Layer
5. **Data Access** → Repository Layer → PostgreSQL
6. **Caching** → Redis (for sessions, frequently accessed data)
7. **Response** → JSON → Frontend
8. **Real-time Updates** → Socket.IO WebSocket

### Key Components

#### Frontend Structure
```
urutibz-frontend/
├── src/
│   ├── pages/          # Page components
│   ├── components/     # Reusable components
│   ├── services/       # API service layer
│   ├── contexts/       # React contexts (Auth, Cart, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and HTTP client
│   └── i18n/           # Internationalization
├── public/             # Static assets
└── dist/               # Production build output
```

#### Backend Structure
```
urutibiz-backend/
├── src/
│   ├── routes/         # API route definitions
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── repositories/   # Data access layer
│   ├── models/         # Data models
│   ├── middleware/     # Express middleware
│   ├── config/         # Configuration
│   └── utils/          # Utilities
├── database/
│   ├── migrations/     # Database migrations
│   └── seeds/          # Seed data
└── dist/               # Compiled TypeScript output
```

---

## 💻 System Requirements

### Server Requirements

#### Minimum (Development)
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Linux (Ubuntu 20.04+), Windows Server, or macOS

#### Recommended (Production)
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB for high traffic)
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS or similar
- **Network**: Stable internet connection

### Software Requirements

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0 (or yarn/pnpm)
- **PostgreSQL**: >= 13.0 (15+ recommended)
- **Redis**: >= 6.0
- **Python**: >= 3.8 (for optional AI services)
- **Docker**: >= 20.10 (optional, for containerized deployment)
- **Git**: Latest version

---

## 🔧 Prerequisites

### 1. Install Node.js

```bash
# Using Node Version Manager (nvm) - Recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or download from https://nodejs.org/
```

### 2. Install PostgreSQL

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib postgis
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew install postgresql@15 postgis
brew services start postgresql@15
```

#### Windows
Download from: https://www.postgresql.org/download/windows/

### 3. Install Redis

#### Ubuntu/Debian
```bash
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### macOS
```bash
brew install redis
brew services start redis
```

#### Windows
Download from: https://github.com/microsoftarchive/redis/releases

### 4. Install Docker (Optional)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# macOS
brew install docker

# Windows
Download Docker Desktop from https://www.docker.com/products/docker-desktop/
```

---

## ⚙️ Environment Setup

### Backend Environment Variables

Create a `.env` file in `urutibiz-backend/` directory:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=production
PORT=10000
API_PREFIX=/api/v1
FRONTEND_URL=https://your-frontend-domain.com

# ============================================
# DATABASE CONFIGURATION
# ============================================
# Option 1: Use connection string (recommended for cloud)
DATABASE_URL=postgresql://username:password@host:port/database

# Option 2: Use individual variables
DB_HOST=localhost
DB_PORT=5432
DB_NAME=urutibiz_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=10000
DB_CONNECTION_TIMEOUT=2000

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=100
REDIS_OFFLINE_QUEUE=false

# ============================================
# JWT AUTHENTICATION
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=urutibiz
JWT_AUDIENCE=urutibiz-users

# ============================================
# ENCRYPTION
# ============================================
ENCRYPTION_KEY=your-32-character-encryption-key-here
BCRYPT_ROUNDS=12

# ============================================
# CORS CONFIGURATION
# ============================================
CORS_ORIGIN=https://your-frontend-domain.com,https://www.your-frontend-domain.com
CORS_CREDENTIALS=true

# ============================================
# EMAIL CONFIGURATION (SMTP)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@urutibiz.com
FROM_NAME=UrutiBiz

# ============================================
# TWILIO (SMS) - Optional
# ============================================
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# ============================================
# STRIPE (PAYMENTS) - Optional
# ============================================
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# ============================================
# AWS S3 (FILE STORAGE) - Optional
# ============================================
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=urutibiz-uploads

# ============================================
# CLOUDINARY (IMAGE STORAGE) - Optional
# ============================================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ============================================
# FIREBASE (PUSH NOTIFICATIONS) - Optional
# ============================================
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# ============================================
# AI SERVICES - Optional
# ============================================
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# FILE UPLOAD
# ============================================
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FILE=logs/app.log

# ============================================
# ADMIN CONFIGURATION
# ============================================
ADMIN_EMAIL=admin@urutibiz.com
ADMIN_PASSWORD=SecureAdminPassword123!

# ============================================
# SWAGGER/API DOCS
# ============================================
SWAGGER_ENABLED=true
```

### Frontend Environment Variables

Create a `.env` file in `urutibz-frontend/` directory:

```env
# API Base URL
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1

# WebSocket URL
VITE_WS_URL=wss://your-backend-domain.com

# Environment
VITE_NODE_ENV=production

# Optional: Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

**Note**: Vite requires `VITE_` prefix for environment variables to be exposed to the client.

---

## 🗄️ Database Setup

### Option 1: Docker Compose (Recommended for Development)

```bash
cd urutibiz-backend
docker-compose up -d
```

This will start:
- PostgreSQL with PostGIS on port 5432
- Redis on port 6379
- Adminer (database admin UI) on port 8080

### Option 2: Manual PostgreSQL Setup

#### 1. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE urutibiz_db;

# Create user
CREATE USER urutibiz_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE urutibiz_db TO urutibiz_user;

# Enable PostGIS extension
\c urutibiz_db
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit
\q
```

#### 2. Run Migrations

```bash
cd urutibiz-backend
npm install
npm run db:migrate
```

#### 3. Seed Initial Data (Optional)

```bash
npm run db:seed
```

### Database Migrations

The project uses Knex.js for database migrations. All migrations are in `urutibiz-backend/database/migrations/`.

**Important Migration Commands:**
```bash
# Run all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Check migration status
npx knex migrate:status

# Create new migration
npx knex migrate:make migration_name
```

---

## 🔙 Backend Deployment

### Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd urutibiz-backend

# Install dependencies
npm ci
```

### Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit with your configuration
nano .env
```

### Step 3: Build Application

```bash
# Build TypeScript to JavaScript
npm run build
```

### Step 4: Setup Database

```bash
# Run migrations
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

### Step 5: Start Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

### Step 6: Verify Deployment

```bash
# Health check
curl http://localhost:10000/health

# API documentation
curl http://localhost:10000/api-docs
```

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start dist/server.js --name urutibiz-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### Using Docker

```bash
# Build Docker image
docker build -t urutibiz-backend .

# Run container
docker run -d \
  --name urutibiz-backend \
  -p 10000:10000 \
  --env-file .env \
  urutibiz-backend
```

---

## 🎨 Frontend Deployment

### Step 1: Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd urutibz-frontend

# Install dependencies
npm ci
```

### Step 2: Configure Environment

```bash
# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
VITE_WS_URL=wss://your-backend-domain.com
VITE_NODE_ENV=production
EOF
```

### Step 3: Build for Production

```bash
# Build optimized production bundle
npm run build
```

This creates a `dist/` directory with optimized static files.

### Step 4: Deploy Static Files

#### Option A: Nginx (Recommended)

```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;
    
    root /var/www/urutibz-frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Option B: Apache

```apache
<VirtualHost *:80>
    ServerName your-frontend-domain.com
    DocumentRoot /var/www/urutibz-frontend/dist

    <Directory /var/www/urutibz-frontend/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # SPA routing
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</VirtualHost>
```

#### Option C: Vercel/Netlify

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd urutibz-frontend
vercel --prod
```

#### Option D: Docker

Create `Dockerfile` in frontend directory:

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t urutibz-frontend .
docker run -d -p 80:80 urutibz-frontend
```

---

## 🔌 External Services Configuration

### 1. Email Service (SMTP)

#### Gmail Setup
1. Enable 2-Step Verification
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `SMTP_PASS`

#### SendGrid Setup
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### 2. SMS Service (Twilio)

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Payment Processing (Stripe)

1. Sign up at https://stripe.com
2. Get API keys from Dashboard
3. Add to `.env`:
```env
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

4. Configure webhook endpoint: `https://your-backend-domain.com/api/v1/payments/webhook`

### 4. File Storage

#### Cloudinary (Recommended)
1. Sign up at https://cloudinary.com
2. Get credentials from Dashboard
3. Add to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### AWS S3 (Alternative)
1. Create S3 bucket
2. Create IAM user with S3 access
3. Add to `.env`:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### 5. Push Notifications (Firebase)

1. Create Firebase project: https://console.firebase.google.com
2. Generate service account key
3. Download JSON key file
4. Add to `.env`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

### 6. AI Services (Optional)

#### OpenAI
```env
OPENAI_API_KEY=sk-xxxxx
```

#### Anthropic
```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## 🚀 Production Deployment

### Complete Deployment Checklist

#### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates obtained
- [ ] Domain names configured
- [ ] DNS records set up
- [ ] External services configured
- [ ] Security audit completed
- [ ] Backup strategy in place

#### Backend Deployment

1. **Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL and Redis
sudo apt install -y postgresql postgresql-contrib postgis redis-server
```

2. **Application Deployment**
```bash
# Clone repository
git clone <repository-url>
cd urutibiz-backend

# Install dependencies
npm ci --production

# Build application
npm run build

# Setup database
npm run db:migrate

# Start with PM2
pm2 start dist/server.js --name urutibiz-backend
pm2 save
pm2 startup
```

3. **Nginx Reverse Proxy**
```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

4. **SSL Certificate (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

#### Frontend Deployment

1. **Build and Deploy**
```bash
cd urutibz-frontend
npm ci
npm run build

# Copy to web server
sudo cp -r dist/* /var/www/urutibz-frontend/
```

2. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/urutibz-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Deployment Platforms

#### Render.com
1. Connect GitHub repository
2. Create PostgreSQL database
3. Create Web Service
4. Set environment variables
5. Deploy

#### Heroku
```bash
heroku create urutibiz-backend
heroku addons:create heroku-postgresql
heroku addons:create heroku-redis
git push heroku main
```

#### AWS EC2
- Use the manual deployment steps above
- Configure Security Groups
- Set up Elastic IP
- Configure Auto Scaling Groups

#### DigitalOcean App Platform
- Connect repository
- Configure build settings
- Add databases
- Deploy

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl https://api.your-domain.com/health

# Database connection
curl https://api.your-domain.com/api/v1/health/db

# Redis connection
curl https://api.your-domain.com/api/v1/health/redis
```

### Logging

#### Backend Logs
```bash
# PM2 logs
pm2 logs urutibiz-backend

# Application logs
tail -f urutibiz-backend/logs/app.log
```

#### Frontend Logs
- Check browser console
- Monitor error tracking (Sentry, etc.)

### Database Backups

```bash
# Create backup
pg_dump -U postgres urutibiz_db > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U postgres urutibiz_db < backup_20240101.sql

# Automated backup script
0 2 * * * pg_dump -U postgres urutibiz_db | gzip > /backups/urutibiz_$(date +\%Y\%m\%d).sql.gz
```

### Performance Monitoring

- **PM2 Monitoring**: `pm2 monit`
- **Application Metrics**: `/api/v1/performance/metrics`
- **Database Monitoring**: PostgreSQL stats
- **Redis Monitoring**: `redis-cli INFO`

### Updates and Maintenance

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Run migrations
npm run db:migrate

# Rebuild
npm run build

# Restart application
pm2 restart urutibiz-backend
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U postgres -d urutibiz_db

# Check firewall
sudo ufw allow 5432
```

#### 2. Redis Connection Failed
```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping
```

#### 3. Port Already in Use
```bash
# Find process using port
sudo lsof -i :10000

# Kill process
sudo kill -9 <PID>
```

#### 4. Build Errors
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules
npm install

# Rebuild
npm run build
```

#### 5. CORS Errors
- Verify `CORS_ORIGIN` in backend `.env`
- Check frontend `VITE_API_BASE_URL`
- Ensure both URLs match exactly

#### 6. JWT Token Issues
- Verify `JWT_SECRET` is set correctly
- Check token expiration settings
- Ensure frontend sends token in Authorization header

### Debug Mode

```bash
# Backend debug
DEBUG=* npm run dev

# Frontend debug
VITE_ENABLE_DEBUG=true npm run dev
```

---

## 📚 Additional Resources

### Documentation
- [Backend API Docs](./urutibiz-backend/README.md)
- [Frontend Docs](./urutibz-frontend/README.md)
- [Database Schema](./urutibiz-backend/DATABASE_SCHEMA.md)

### Support
- GitHub Issues: [Repository Issues]
- Email: support@urutibiz.com

### Security Best Practices
1. Use strong passwords for all services
2. Enable SSL/TLS for all connections
3. Regularly update dependencies
4. Monitor logs for suspicious activity
5. Implement rate limiting
6. Use environment variables for secrets
7. Regular security audits
8. Keep backups encrypted

---

## ✅ Deployment Verification

After deployment, verify:

1. **Backend Health**: `https://api.your-domain.com/health`
2. **API Endpoints**: Test key endpoints
3. **Frontend Loads**: `https://your-domain.com`
4. **Authentication**: Login/logout works
5. **Database**: Data persists correctly
6. **Real-time**: WebSocket connections work
7. **File Uploads**: Image uploads work
8. **Payments**: Payment flow works (test mode)
9. **Notifications**: Email/SMS/Push work
10. **Mobile Responsive**: Test on mobile devices

---

**Last Updated**: 2024
**Version**: 1.0.0

