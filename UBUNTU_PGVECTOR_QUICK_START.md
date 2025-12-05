# Quick Start: Connect to Ubuntu PostgreSQL with pgvector

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure Ubuntu PostgreSQL (Run on Ubuntu)

```bash
# 1. Edit PostgreSQL config
sudo nano /etc/postgresql/*/main/postgresql.conf
# Set: listen_addresses = '*'

# 2. Edit pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Add: host    all    all    192.168.1.0/24    md5
# (Replace 192.168.1.0/24 with your network range)

# 3. Restart PostgreSQL
sudo systemctl restart postgresql

# 4. Allow firewall (if UFW is enabled)
sudo ufw allow 5432/tcp

# 5. Get your Ubuntu IP address
hostname -I
```

### Step 2: Create Database and User (Run on Ubuntu)

```bash
sudo -u postgres psql

# Inside psql:
CREATE USER urutibiz_user WITH PASSWORD 'your_password';
CREATE DATABASE urutibizdb OWNER urutibiz_user;
GRANT ALL PRIVILEGES ON DATABASE urutibizdb TO urutibiz_user;

\c urutibizdb
CREATE EXTENSION IF NOT EXISTS vector;

\q
```

### Step 3: Update .env File (On Windows)

Edit `urutibiz-backend/.env`:

```env
DB_HOST=192.168.1.100          # Your Ubuntu IP address
DB_PORT=5432
DB_NAME=urutibizdb
DB_USER=urutibiz_user
DB_PASSWORD=your_password
DB_SSL=false
```

### Step 4: Test Connection

```bash
npm run db:test-ubuntu-pgvector
```

### Step 5: Run Migrations

```bash
npm run db:migrate
```

## ✅ Done!

Your application is now connected to Ubuntu PostgreSQL with pgvector support.

## 📖 Full Documentation

For detailed setup instructions, troubleshooting, and security considerations, see:
- **[Complete Setup Guide](docs/UBUNTU_PGVECTOR_CONNECTION_SETUP.md)**

## 🔧 Common Issues

### Connection Refused
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify `listen_addresses = '*'` in `postgresql.conf`
- Check firewall: `sudo ufw status`

### Authentication Failed
- Verify username/password in `.env`
- Check `pg_hba.conf` allows your IP with `md5` authentication

### pgvector Not Found
- Install: `sudo apt install postgresql-*-pgvector`
- Enable: `CREATE EXTENSION vector;`

## 🆘 Need Help?

Run the test script for detailed diagnostics:
```bash
npm run db:test-ubuntu-pgvector
```

