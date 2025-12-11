# ⚡ Quick Start - Local Development (No Docker)

## 🚀 Fastest Way to Start

### Option 1: PowerShell Script (Recommended)
```powershell
.\start-local.ps1
```

### Option 2: Manual Start
```powershell
npm run dev
```

### Option 3: With Python Service (for image search)
```powershell
.\start-local-with-python.ps1
```

## ✅ Before Starting

1. **Make sure PostgreSQL is running** on port 5434
2. **Update `.env`** with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5434
   DB_NAME=your_database_name
   DB_USER=postgres
   DB_PASSWORD=dushime20
   REDIS_ENABLED=false
   ```

3. **Run migrations** (first time only):
   ```powershell
   npm run db:migrate
   ```

## 📍 Services

- **Backend API:** http://localhost:3000
- **API Docs:** http://localhost:3000/api-docs
- **Python Service:** http://localhost:8001 (optional)

## 🔧 Troubleshooting

**Database connection failed?**
- Check PostgreSQL is running: `Get-Service postgresql*`
- Verify port in `.env` matches your PostgreSQL port
- Test connection: `npm run db:test`

**Redis connection failed?**
- This is OK! Set `REDIS_ENABLED=false` in `.env`
- App works fine without Redis (caching disabled)

**Python service not needed?**
- Just use `.\start-local.ps1` (backend only)
- Image search features will be disabled

## 📚 Full Guide

See `LOCAL_SETUP_GUIDE.md` for detailed instructions.


