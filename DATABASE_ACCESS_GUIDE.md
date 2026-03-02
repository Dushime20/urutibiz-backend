# Database Access Guide

## Overview

Your database can be accessed in multiple ways:

1. **Adminer (Web UI)** - Port 8082 ✅ Easiest
2. **Direct PostgreSQL Connection** - Port 5432
3. **Docker Exec** - Command line access
4. **pgAdmin** - Desktop application

---

## Method 1: Adminer (Web Interface) - RECOMMENDED

Adminer is already running in your docker-compose setup.

### Access Adminer

**URL:** `http://38.242.224.199:8082`

### Login Credentials

From your `.env` file:

| Field | Value |
|-------|-------|
| **System** | PostgreSQL |
| **Server** | `postgres` (or `urutibiz-postgres`) |
| **Username** | `postgres` |
| **Password** | `12345` |
| **Database** | `urutibiz_db` |

### Steps:
1. Open browser: `http://38.242.224.199:8082`
2. Select "PostgreSQL" from System dropdown
3. Enter credentials above
4. Click "Login"

### Features:
- ✅ Browse all tables
- ✅ Run SQL queries
- ✅ Export/Import data
- ✅ View table structure
- ✅ Edit data directly
- ✅ No installation needed

---

## Method 2: Direct PostgreSQL Connection

### From Server (SSH)

```bash
# SSH into server
ssh root@38.242.224.199

# Connect to PostgreSQL
docker exec -it urutibiz-postgres psql -U postgres -d urutibiz_db
```

### From Your Local Machine

**Using psql:**
```bash
psql -h 38.242.224.199 -p 5432 -U postgres -d urutibiz_db
# Password: 12345
```

**Using connection string:**
```bash
postgresql://postgres:12345@38.242.224.199:5432/urutibiz_db
```

### Connection Details:
- **Host:** `38.242.224.199`
- **Port:** `5432`
- **Database:** `urutibiz_db`
- **Username:** `postgres`
- **Password:** `12345`

---

## Method 3: Docker Exec (Command Line)

### Quick Access

```bash
# SSH into server first
ssh root@38.242.224.199

# Access PostgreSQL shell
docker exec -it urutibiz-postgres psql -U postgres -d urutibiz_db
```

### Common Commands

```sql
-- List all databases
\l

-- List all tables
\dt

-- Describe a table
\d table_name

-- List all schemas
\dn

-- Switch database
\c database_name

-- Show table data
SELECT * FROM users LIMIT 10;

-- Count records
SELECT COUNT(*) FROM bookings;

-- Exit
\q
```

### Useful Queries

```sql
-- View all users
SELECT id, email, phone, role, created_at FROM users;

-- View recent bookings
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;

-- Check database size
SELECT pg_size_pretty(pg_database_size('urutibiz_db'));

-- List all tables with row counts
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## Method 4: pgAdmin (Desktop Application)

### Install pgAdmin
- Download from: https://www.pgadmin.org/download/
- Install on your local machine

### Add Server Connection

1. Right-click "Servers" → "Register" → "Server"
2. **General Tab:**
   - Name: `UrutiBiz Production`
3. **Connection Tab:**
   - Host: `38.242.224.199`
   - Port: `5432`
   - Database: `urutibiz_db`
   - Username: `postgres`
   - Password: `12345`
   - Save password: ✓
4. Click "Save"

---

## Quick Database Checks

### Check if Database is Running

```bash
# On server
docker ps | grep postgres

# Should show:
# urutibiz-postgres   Up X minutes   0.0.0.0:5432->5432/tcp
```

### Test Connection

```bash
# From server
docker exec urutibiz-postgres pg_isready -U postgres

# Should return:
# /var/run/postgresql:5432 - accepting connections
```

### View Database Logs

```bash
docker logs urutibiz-postgres

# Follow logs in real-time
docker logs -f urutibiz-postgres
```

---

## Database Backup & Restore

### Backup Database

```bash
# On server
docker exec urutibiz-postgres pg_dump -U postgres urutibiz_db > backup_$(date +%Y%m%d).sql

# Or with compression
docker exec urutibiz-postgres pg_dump -U postgres urutibiz_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# From SQL file
docker exec -i urutibiz-postgres psql -U postgres urutibiz_db < backup.sql

# From compressed file
gunzip -c backup.sql.gz | docker exec -i urutibiz-postgres psql -U postgres urutibiz_db
```

---

## Troubleshooting

### Can't Access Adminer (Port 8082)

```bash
# Check if adminer is running
docker ps | grep adminer

# If not running, start it
docker-compose up -d adminer

# Check logs
docker logs urutibiz-adminer
```

### Can't Connect to Database

```bash
# Check if postgres is running
docker ps | grep postgres

# Check if port is open
sudo netstat -tuln | grep 5432

# Test connection from server
docker exec urutibiz-postgres psql -U postgres -d urutibiz_db -c "SELECT 1;"
```

### Firewall Blocking Ports

```bash
# Check firewall status
sudo ufw status

# Allow port 8082 (Adminer)
sudo ufw allow 8082/tcp

# Allow port 5432 (PostgreSQL) - Only if needed externally
sudo ufw allow 5432/tcp
```

### Wrong Password

Check your `.env` file:
```bash
cat /opt/urutibiz/urutibiz-backend/.env | grep DB_PASSWORD
```

---

## Security Recommendations

### For Production:

1. **Change default password:**
   ```bash
   # Update .env file
   DB_PASSWORD=your_strong_password_here
   
   # Restart services
   docker-compose down
   docker-compose up -d
   ```

2. **Restrict Adminer access:**
   - Only allow from specific IPs
   - Use nginx proxy with authentication
   - Or disable in production

3. **Restrict PostgreSQL port:**
   ```bash
   # In docker-compose.yml, change:
   ports:
     - "127.0.0.1:5432:5432"  # Only localhost
   ```

4. **Use SSL for connections:**
   - Configure PostgreSQL SSL
   - Update connection strings

---

## Quick Reference

| Service | Port | URL/Command |
|---------|------|-------------|
| Adminer | 8082 | http://38.242.224.199:8082 |
| PostgreSQL | 5432 | psql -h 38.242.224.199 -p 5432 -U postgres |
| Docker Exec | - | docker exec -it urutibiz-postgres psql -U postgres -d urutibiz_db |

### Credentials
- **Username:** postgres
- **Password:** 12345
- **Database:** urutibiz_db

---

## Next Steps

1. ✅ Access Adminer at http://38.242.224.199:8082
2. ⏳ Change default password
3. ⏳ Set up regular backups
4. ⏳ Configure SSL connections
5. ⏳ Restrict external access
