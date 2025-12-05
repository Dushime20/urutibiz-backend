# Connecting to Ubuntu PostgreSQL with pgvector from Windows

This guide will help you connect your Windows development machine to a PostgreSQL database with pgvector installed on Ubuntu.

## Prerequisites

- ✅ PostgreSQL with pgvector installed on Ubuntu
- ✅ Network access between Windows and Ubuntu machines
- ✅ Ubuntu IP address or hostname

## Step 1: Configure PostgreSQL on Ubuntu for Remote Access

### 1.1 Edit PostgreSQL Configuration Files

On your Ubuntu machine, you need to configure PostgreSQL to accept remote connections:

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Find and modify these lines:
```conf
# Listen on all interfaces (or specific IP)
listen_addresses = '*'  # or 'localhost,192.168.1.100' for specific IP

# Connection settings
max_connections = 100
```

### 1.2 Configure pg_hba.conf for Remote Access

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Add this line to allow connections from your Windows machine:
```conf
# Allow connections from Windows machine (replace with your Windows IP)
host    all             all             192.168.1.0/24          md5

# Or allow from any IP (less secure, use only for development)
# host    all             all             0.0.0.0/0               md5
```

**Note**: Replace `192.168.1.0/24` with your actual network range. To find your Windows IP:
- Windows: Open PowerShell and run `ipconfig`
- Look for IPv4 Address (e.g., 192.168.1.50)

### 1.3 Restart PostgreSQL Service

```bash
sudo systemctl restart postgresql
```

### 1.4 Verify PostgreSQL is Listening

```bash
# Check if PostgreSQL is listening on port 5432
sudo netstat -tlnp | grep 5432
# or
sudo ss -tlnp | grep 5432
```

You should see something like:
```
tcp  0  0 0.0.0.0:5432  0.0.0.0:*  LISTEN  12345/postgres
```

### 1.5 Configure Ubuntu Firewall (if enabled)

If you have UFW (Ubuntu Firewall) enabled:

```bash
# Allow PostgreSQL port
sudo ufw allow 5432/tcp

# Check firewall status
sudo ufw status
```

## Step 2: Get Ubuntu Database Connection Details

On your Ubuntu machine, get the following information:

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Inside psql, run:
\l                    # List databases
\du                   # List users
SELECT version();     # Check PostgreSQL version

# Create a database user for your application (if needed)
CREATE USER urutibiz_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE urutibizdb OWNER urutibiz_user;
GRANT ALL PRIVILEGES ON DATABASE urutibizdb TO urutibiz_user;

# Enable pgvector extension
\c urutibizdb
CREATE EXTENSION IF NOT EXISTS vector;

# Exit
\q
```

**Note down:**
- Ubuntu IP address: `ip addr show` or `hostname -I`
- Database name: `urutibizdb` (or your database name)
- Username: `urutibiz_user` (or `postgres`)
- Password: (the password you set)

## Step 3: Update .env File on Windows

Update your `.env` file in the `urutibiz-backend` directory:

```env
# Ubuntu PostgreSQL with pgvector
DB_HOST=192.168.1.100          # Replace with your Ubuntu IP address
DB_PORT=5432
DB_NAME=urutibizdb              # Your database name
DB_USER=urutibiz_user           # Your database user
DB_PASSWORD=your_secure_password # Your database password
DB_SSL=false                     # Usually false for local network connections

# If using hostname instead of IP
# DB_HOST=ubuntu-server.local    # or your Ubuntu hostname
```

### Alternative: Using Connection String

You can also use `DATABASE_URL` instead:

```env
# Connection string format
DATABASE_URL=postgresql://urutibiz_user:your_secure_password@192.168.1.100:5432/urutibizdb
```

## Step 4: Test Connection from Windows

### 4.1 Test Network Connectivity

From Windows PowerShell:

```powershell
# Test if you can reach Ubuntu
ping 192.168.1.100

# Test if PostgreSQL port is accessible
Test-NetConnection -ComputerName 192.168.1.100 -Port 5432
```

### 4.2 Test Database Connection

```bash
# Navigate to backend directory
cd urutibiz-backend

# Test connection using Node.js script
node scripts/test-db-config.js

# Or use npm script if available
npm run db:test
```

### 4.3 Test with psql (if installed on Windows)

If you have PostgreSQL client tools installed on Windows:

```bash
psql -h 192.168.1.100 -U urutibiz_user -d urutibizdb
```

## Step 5: Verify pgvector is Enabled

Once connected, verify pgvector is installed:

```sql
-- Check if pgvector extension exists
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check vector extension version
SELECT extversion FROM pg_extension WHERE extname = 'vector';

-- Test vector operations
SELECT '[1,2,3]'::vector;
```

## Step 6: Run Database Migrations

Run migrations to set up pgvector support in your database:

```bash
# Run all migrations
npm run db:migrate

# Or using knex directly
npx knex migrate:latest
```

This will:
- Enable pgvector extension (if not already enabled)
- Convert `image_embedding` column to vector type
- Create indexes for efficient similarity search

## Step 7: Test Image Search

After migrations, test that image search works:

```bash
# Start your server
npm run dev

# The server should connect to Ubuntu PostgreSQL
# Image search should now use pgvector for fast similarity search
```

## Troubleshooting

### Connection Refused

**Problem**: `ECONNREFUSED` or connection timeout

**Solutions**:
1. Check PostgreSQL is running on Ubuntu:
   ```bash
   sudo systemctl status postgresql
   ```

2. Verify `listen_addresses` in `postgresql.conf`:
   ```bash
   grep listen_addresses /etc/postgresql/*/main/postgresql.conf
   ```

3. Check `pg_hba.conf` allows your IP:
   ```bash
   sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v "^#"
   ```

4. Check firewall:
   ```bash
   sudo ufw status
   sudo iptables -L -n | grep 5432
   ```

### Authentication Failed

**Problem**: Password authentication failed

**Solutions**:
1. Verify username and password are correct
2. Check `pg_hba.conf` uses `md5` or `scram-sha-256` (not `trust` for remote)
3. Reset password if needed:
   ```bash
   sudo -u postgres psql
   ALTER USER urutibiz_user WITH PASSWORD 'new_password';
   ```

### pgvector Extension Not Found

**Problem**: `ERROR: extension "vector" does not exist`

**Solutions**:
1. Install pgvector on Ubuntu:
   ```bash
   sudo apt update
   sudo apt install postgresql-*-pgvector
   ```

2. Or compile from source:
   ```bash
   git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
   cd pgvector
   make
   sudo make install
   ```

3. Enable extension in database:
   ```sql
   CREATE EXTENSION vector;
   ```

### SSL Connection Issues

If you get SSL-related errors, set `DB_SSL=false` in `.env` for local network connections.

## Security Considerations

For production environments:

1. **Use SSL/TLS**: Set `DB_SSL=true` and configure SSL certificates
2. **Restrict IP Access**: Only allow specific IPs in `pg_hba.conf`
3. **Strong Passwords**: Use complex passwords for database users
4. **Firewall Rules**: Only allow PostgreSQL port from trusted networks
5. **VPN**: Consider using VPN for remote database access

## Quick Reference

### Ubuntu Commands
```bash
# Restart PostgreSQL
sudo systemctl restart postgresql

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# Connect to PostgreSQL
sudo -u postgres psql

# Check listening ports
sudo ss -tlnp | grep 5432
```

### Windows Commands
```powershell
# Test connectivity
Test-NetConnection -ComputerName <ubuntu-ip> -Port 5432

# Check environment variables
Get-Content .env | Select-String "DB_"
```

## Next Steps

After successful connection:

1. ✅ Run database migrations
2. ✅ Verify pgvector is working
3. ✅ Test image search functionality
4. ✅ Monitor connection performance
5. ✅ Set up connection pooling if needed

## Support

If you encounter issues:
1. Check PostgreSQL logs on Ubuntu: `/var/log/postgresql/`
2. Check application logs for connection errors
3. Verify network connectivity between machines
4. Ensure all configuration files are correctly updated

