# Port Conflict Resolution

## Issue
Port 8080 was already in use by the frontend container, causing adminer to fail.

## Solution
Changed adminer port from 8080 to 8082.

## Port Allocation

- **Frontend**: 8080 (urutibiz-frontend)
- **Backend API**: 3000 (urutibiz-api)
- **Adminer (DB Admin)**: 8082 (urutibiz-adminer)
- **Python Service**: 8001 (urutibiz-python-service)
- **PostgreSQL**: 5432 (urutibiz-postgres)
- **Redis**: 6379 (urutibiz-redis)

## Deploy with Fix

```bash
cd /opt/urutibiz/urutibiz-backend

# Remove orphan containers and deploy
docker compose down
docker compose up -d --build --remove-orphans

# Check status
docker compose ps
```

## Access Services

- Frontend: http://38.242.224.199:8080
- Backend API: http://38.242.224.199:3000
- Backend Health: http://38.242.224.199:3000/health
- Adminer (DB): http://38.242.224.199:8082
- Python Service: http://38.242.224.199:8001

## Adminer Login

- System: PostgreSQL
- Server: postgres
- Username: postgres (or from .env DB_USER)
- Password: (from .env DB_PASSWORD)
- Database: urutibiz_db (or from .env DB_NAME)
