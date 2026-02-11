# 🪟 Windows Commands Guide
## PowerShell Commands for Local Testing

Since `make` is not available on Windows, use these PowerShell commands instead.

---

## 🚀 Quick Start (Windows)

### Build Production Image

```powershell
# Method 1: Using build script (Recommended)
.\docker-build.ps1 -Environment production

# Method 2: Direct Docker command
docker build --target production -t urutibiz-backend:latest .
```

### Run Container

```powershell
# Create environment file first
Copy-Item .env.example .env.local
notepad .env.local

# Run container
docker run -d `
  --name urutibiz-backend-local `
  -p 3000:3000 `
  --env-file .env.local `
  --restart unless-stopped `
  urutibiz-backend:latest
```

### Check Health

```powershell
# Test health endpoint
curl http://localhost:3000/health

# Or open in browser
Start-Process "http://localhost:3000/health"
```

---

## 📦 Docker Compose Commands

### Start All Services

```powershell
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# With rebuild
docker-compose up -d --build
```

### Stop Services

```powershell
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail 100 backend
```

---

## 🔍 Monitoring Commands

### View Container Logs

```powershell
# Follow logs
docker logs -f urutibiz-backend-local

# Last 100 lines
docker logs --tail 100 urutibiz-backend-local

# With timestamps
docker logs -t urutibiz-backend-local
```

### Check Container Status

```powershell
# List running containers
docker ps

# List all containers
docker ps -a

# Check specific container
docker inspect urutibiz-backend-local

# Resource usage
docker stats urutibiz-backend-local
```

### Access Container Shell

```powershell
# Access shell
docker exec -it urutibiz-backend-local sh

# Run command
docker exec urutibiz-backend-local node --version

# Check environment variables
docker exec urutibiz-backend-local env
```

---

## 🗄️ Database Commands

### Run Migrations

```powershell
docker exec urutibiz-backend-local npm run db:migrate
```

### Seed Database

```powershell
docker exec urutibiz-backend-local npm run db:seed
```

### Access Database

```powershell
docker exec -it urutibiz-postgres psql -U postgres -d urutibiz_dev
```

### Backup Database

```powershell
docker exec urutibiz-postgres pg_dump -U postgres urutibiz_dev > backup.sql
```

### Restore Database

```powershell
Get-Content backup.sql | docker exec -i urutibiz-postgres psql -U postgres -d urutibiz_dev
```

---

## 🧹 Cleanup Commands

### Stop and Remove Container

```powershell
docker stop urutibiz-backend-local
docker rm urutibiz-backend-local
```

### Remove Images

```powershell
# Remove specific image
docker rmi urutibiz-backend:latest

# Remove unused images
docker image prune -f

# Remove all unused
docker system prune -af
```

### Clean Everything

```powershell
# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all images
docker rmi $(docker images -q)

# Clean system
docker system prune -af --volumes
```

---

## 🔧 Build Commands

### Build Different Targets

```powershell
# Production
.\docker-build.ps1 -Environment production

# Development
.\docker-build.ps1 -Environment development

# Testing
.\docker-build.ps1 -Environment testing

# Without cache
.\docker-build.ps1 -Environment production -NoCache

# Build and push
.\docker-build.ps1 -Environment production -Push
```

### Direct Docker Build

```powershell
# Production
docker build --target production -t urutibiz-backend:prod .

# Development
docker build --target development -t urutibiz-backend:dev .

# With build args
docker build `
  --target production `
  --build-arg NODE_ENV=production `
  --build-arg APP_VERSION=1.0.0 `
  -t urutibiz-backend:latest .
```

---

## 🔐 Security Commands

### Scan Image

```powershell
# Docker scan (if available)
docker scan urutibiz-backend:latest

# Check image details
docker inspect urutibiz-backend:latest

# View image history
docker history urutibiz-backend:latest
```

---

## 📊 Useful PowerShell Functions

Add these to your PowerShell profile for easier use:

```powershell
# Open PowerShell profile
notepad $PROFILE
```

Add these functions:

```powershell
# Quick build
function Build-Backend {
    .\docker-build.ps1 -Environment production
}

# Quick run
function Start-Backend {
    docker run -d --name urutibiz-backend-local -p 3000:3000 --env-file .env.local urutibiz-backend:latest
}

# Quick stop
function Stop-Backend {
    docker stop urutibiz-backend-local
    docker rm urutibiz-backend-local
}

# Quick logs
function Show-BackendLogs {
    docker logs -f urutibiz-backend-local
}

# Quick health check
function Test-BackendHealth {
    curl http://localhost:3000/health
}

# Quick restart
function Restart-Backend {
    docker restart urutibiz-backend-local
}
```

Save and reload:

```powershell
. $PROFILE
```

Now you can use:

```powershell
Build-Backend
Start-Backend
Show-BackendLogs
Test-BackendHealth
Stop-Backend
```

---

## 🎯 Complete Workflow Example

```powershell
# 1. Build image
.\docker-build.ps1 -Environment production

# 2. Create environment file
Copy-Item .env.example .env.local
notepad .env.local

# 3. Start database and Redis
docker-compose up -d postgres redis

# 4. Wait for database
Start-Sleep -Seconds 10

# 5. Run backend
docker run -d `
  --name urutibiz-backend-local `
  -p 3000:3000 `
  --env-file .env.local `
  --network urutibiz-backend_urutibiz-network `
  urutibiz-backend:latest

# 6. Wait for backend
Start-Sleep -Seconds 10

# 7. Run migrations
docker exec urutibiz-backend-local npm run db:migrate

# 8. Test health
curl http://localhost:3000/health

# 9. View logs
docker logs -f urutibiz-backend-local

# 10. When done, cleanup
docker stop urutibiz-backend-local
docker rm urutibiz-backend-local
docker-compose down
```

---

## 🆘 Troubleshooting

### Port Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
docker run -d -p 3001:3000 --name urutibiz-backend-local urutibiz-backend:latest
```

### Container Won't Start

```powershell
# Check logs
docker logs urutibiz-backend-local

# Check if image exists
docker images urutibiz-backend

# Rebuild without cache
docker build --no-cache -t urutibiz-backend:latest .
```

### Docker Desktop Not Running

```powershell
# Start Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Wait for it to start
Start-Sleep -Seconds 30

# Verify
docker info
```

---

## 📚 Additional Resources

- [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/)
- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [WSL2 Setup](https://docs.microsoft.com/en-us/windows/wsl/install)

---

**Tip**: For better experience, consider using Windows Terminal with PowerShell 7+
