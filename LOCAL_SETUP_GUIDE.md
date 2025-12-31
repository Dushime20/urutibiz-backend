# 🚀 Local Development Setup (Without Docker)

This guide helps you run the UrutiBiz backend locally without Docker, using your existing local database.

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **PostgreSQL** running locally (your existing database)
3. **Python 3.11+** (for image search service - optional)
4. **Redis** (optional - app works without it, but caching will be disabled)

## 🔧 Step 1: Configure Environment Variables

Your `.env` file should have these settings for local development:

```env
# Database Configuration (use your existing local database)
DB_HOST=localhost
DB_PORT=5434
DB_NAME=your_database_name
DB_USER=postgres
DB_PASSWORD=dushime20
DB_SSL=false

# Redis Configuration (optional - set to false to disable)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:5173

# Python Image Service (optional - for image search features)
PYTHON_IMAGE_SERVICE_URL=http://localhost:8001

# Other required variables (add as needed)
ENCRYPTION_KEY=your-32-character-encryption-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
FROM_EMAIL=noreply@urutibiz.com
```

## 📦 Step 2: Install Dependencies

```powershell
# Install Node.js dependencies
npm install

# Install Python dependencies (if using image search)
cd python-service
pip install -r requirements.txt
cd ..
```

## 🗄️ Step 3: Setup Database

Make sure your PostgreSQL database is running and accessible:

```powershell
# Test database connection
npm run db:test

# Run migrations to create tables
npm run db:migrate

# (Optional) Seed initial data
npm run db:seed
```

## 🚀 Step 4: Start Services

### Option A: Start Backend Only (Recommended for development)

```powershell
# Start the backend server
npm run dev
```

The server will start on `http://localhost:3000`

### Option B: Start Backend + Python Service

**Terminal 1 - Backend:**
```powershell
npm run dev
```

**Terminal 2 - Python Service (optional, for image search):**
```powershell
npm run python:service
# OR
cd python-service
python main.py
```

## ✅ Step 5: Verify Everything Works

1. **Check Backend Health:**
   ```powershell
   curl http://localhost:3000/health
   # OR open in browser: http://localhost:3000/health
   ```

2. **Check Python Service (if running):**
   ```powershell
   curl http://localhost:8001/health
   ```

3. **Check API Documentation:**
   - Swagger UI: `http://localhost:3000/api-docs` (if enabled)

## 🛠️ Common Issues & Solutions

### Database Connection Failed

**Problem:** `ECONNREFUSED` or connection timeout

**Solutions:**
1. Verify PostgreSQL is running:
   ```powershell
   # Check if PostgreSQL service is running
   Get-Service postgresql*
   ```

2. Verify connection details in `.env`:
   - Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
   - Test connection: `psql -h localhost -p 5434 -U postgres -d your_database_name`

3. Check PostgreSQL is listening on the correct port:
   ```powershell
   netstat -an | findstr 5434
   ```

### Redis Connection Failed (Optional)

**Solution:** This is OK! Redis is optional. To disable it:
```env
REDIS_ENABLED=false
```

The app will continue without Redis, but caching features won't work.

### Python Service Not Starting

**Solutions:**
1. Install Python dependencies:
   ```powershell
   cd python-service
   pip install -r requirements.txt
   ```

2. Check Python version (needs 3.11+):
   ```powershell
   python --version
   ```

3. If image search isn't critical, you can skip the Python service:
   - Set `PYTHON_IMAGE_SERVICE_URL=` (empty) in `.env`
   - Image search features will be disabled

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
1. Change port in `.env`:
   ```env
   PORT=3001
   ```

2. Or kill the process using the port:
   ```powershell
   # Find process using port 3000
   netstat -ano | findstr :3000
   # Kill it (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

## 📝 Quick Start Scripts

I've created helper scripts for you:

- **`start-local.ps1`** - Starts backend server with local database config
- **`start-local-with-python.ps1`** - Starts both backend and Python service

## 🔄 Switching Between Local and Docker

When you're ready to use Docker again:

1. **Stop local services** (Ctrl+C in terminals)

2. **Update `.env`** for Docker:
   ```env
   DB_HOST=postgres  # Docker service name
   DB_PORT=5432      # Docker internal port
   REDIS_HOST=redis  # Docker service name
   ```

3. **Start with Docker:**
   ```powershell
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📚 Additional Resources

- Database setup: See `DATABASE_SETUP_GUIDE.md`
- API documentation: `http://localhost:3000/api-docs`
- Python service setup: See `python-service/README.md`

## 🎯 Development Workflow

1. **Start database** (if not running as service)
2. **Start backend:** `npm run dev`
3. **Start Python service** (optional): `npm run python:service`
4. **Make changes** - server auto-reloads with `ts-node-dev`
5. **Test endpoints** using Swagger UI or Postman

## 💡 Tips

- Use `npm run dev` for development (auto-reload on file changes)
- Use `npm run build && npm start` for production-like testing
- Check logs in console for errors
- Redis is optional - app works fine without it
- Python service is optional - only needed for image search features








