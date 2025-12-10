# 📦 Migrate Database from Ubuntu to Docker Container

This guide will help you copy your entire database (tables and data) from Ubuntu PostgreSQL to the Docker container.

## 🚀 Quick Migration (Windows PowerShell)

### Option 1: Using the Migration Script (Recommended)

```powershell
# Run the migration script
.\scripts\migrate-ubuntu-to-docker.ps1
```

The script will prompt you for:
- Ubuntu PostgreSQL host (IP address)
- Ubuntu database name
- Ubuntu database user
- Ubuntu database password

### Option 2: Manual Migration (Step by Step)

#### Step 1: Export Database from Ubuntu

On your **Ubuntu machine**, run:

```bash
# Export the entire database
pg_dump -h localhost -U your_ubuntu_user -d your_ubuntu_database -F c -f /tmp/ubuntu_backup.custom

# Or if you need to copy it to Windows, use SQL format:
pg_dump -h localhost -U your_ubuntu_user -d your_ubuntu_database -f /tmp/ubuntu_backup.sql

# Then copy to Windows (using SCP, shared folder, or USB)
```

#### Step 2: Import into Docker Container

On your **Windows machine**, run:

```powershell
# Make sure Docker container is running
docker-compose up -d postgres

# Import using pg_restore (for custom format)
Get-Content .\ubuntu_backup.custom | docker exec -i -e PGPASSWORD=dushimimana20 urutibiz-postgres pg_restore -U postgres -d urutibiz_db --clean --if-exists

# OR import using psql (for SQL format)
Get-Content .\ubuntu_backup.sql | docker exec -i -e PGPASSWORD=dushimimana20 urutibiz-postgres psql -U postgres -d urutibiz_db
```

#### Step 3: Enable Extensions

```powershell
# Enable required PostgreSQL extensions
docker exec -e PGPASSWORD=dushimimana20 urutibiz-postgres psql -U postgres -d urutibiz_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
docker exec -e PGPASSWORD=dushimimana20 urutibiz-postgres psql -U postgres -d urutibiz_db -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
docker exec -e PGPASSWORD=dushimimana20 urutibiz-postgres psql -U postgres -d urutibiz_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### Step 4: Verify Import

```powershell
# Check number of tables
docker exec -e PGPASSWORD=dushimimana20 urutibiz-postgres psql -U postgres -d urutibiz_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"

# List all tables
docker exec -e PGPASSWORD=dushimimana20 urutibiz-postgres psql -U postgres -d urutibiz_db -c "\dt"
```

## 🔧 Direct Migration from Windows (If Ubuntu is Accessible)

If your Ubuntu PostgreSQL is accessible from Windows:

```powershell
# Set Ubuntu connection details
$UBUNTU_HOST = "192.168.1.100"  # Your Ubuntu IP
$UBUNTU_PORT = "5432"
$UBUNTU_DB = "urutibizdb"       # Your Ubuntu database name
$UBUNTU_USER = "urutibiz_user"  # Your Ubuntu user
$UBUNTU_PASSWORD = "your_password"

# Export from Ubuntu
$env:PGPASSWORD = $UBUNTU_PASSWORD
pg_dump -h $UBUNTU_HOST -p $UBUNTU_PORT -U $UBUNTU_USER -d $UBUNTU_DB -F c -f ubuntu_backup.custom

# Import into Docker
Get-Content .\ubuntu_backup.custom | docker exec -i -e PGPASSWORD=dushimimana20 urutibiz-postgres pg_restore -U postgres -d urutibiz_db --clean --if-exists
```

## 📋 Prerequisites

### Windows Machine:
- ✅ PostgreSQL client tools installed (for `pg_dump` and `pg_restore`)
  - Download from: https://www.postgresql.org/download/windows/
- ✅ Docker Desktop running
- ✅ Docker container `urutibiz-postgres` running

### Ubuntu Machine:
- ✅ PostgreSQL server running
- ✅ Network access from Windows to Ubuntu (if migrating remotely)
- ✅ Database credentials (host, port, database name, user, password)

## 🔍 Troubleshooting

### Issue: pg_dump not found
**Solution**: Install PostgreSQL client tools from https://www.postgresql.org/download/windows/

### Issue: Cannot connect to Ubuntu
**Solution**: 
1. Check Ubuntu PostgreSQL is running: `sudo systemctl status postgresql`
2. Verify `listen_addresses = '*'` in `/etc/postgresql/*/main/postgresql.conf`
3. Check firewall: `sudo ufw allow 5432/tcp`
4. Verify `pg_hba.conf` allows your Windows IP

### Issue: Import fails with errors
**Solution**: 
- Try using SQL format instead of custom format
- Check if extensions are enabled in Docker container
- Verify database exists: `docker exec urutibiz-postgres psql -U postgres -l`

### Issue: Permission denied
**Solution**: 
- Make sure Docker container is running
- Verify password is correct
- Check database user has proper permissions

## ✅ After Migration

1. **Update .env file**:
   ```env
   DB_HOST=localhost
   DB_PORT=5434
   DB_NAME=urutibiz_db
   DB_USER=postgres
   DB_PASSWORD=dushimimana20
   ```

2. **Start the server**:
   ```powershell
   npm run dev
   ```

3. **Verify everything works**:
   - Check server logs for database connection
   - Test API endpoints
   - Verify data is accessible

## 📝 Notes

- The migration preserves all data, tables, indexes, and constraints
- Extensions (PostGIS, uuid-ossp, vector) need to be enabled separately
- Large databases may take several minutes to migrate
- Backup files are saved in `./database-backups/` directory

