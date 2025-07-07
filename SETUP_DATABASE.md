# 🗄️ UrutiBiz Database Setup Guide

This guide will help you set up a PostgreSQL database for the UrutiBiz backend application.

## 🎯 Quick Setup Options

### Option 1: Docker PostgreSQL (Recommended)
The fastest way to get PostgreSQL running for development.

```bash
# 1. Create and start PostgreSQL container
docker run --name urutibiz-postgres \
  -e POSTGRES_DB=urutibiz_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=12345 \
  -p 5432:5432 \
  -d postgres:15

# 2. Verify container is running
docker ps

# 3. Test connection
npm run db:setup
```

### Option 2: Local PostgreSQL Installation

#### Windows (using chocolatey)
```powershell
# Install PostgreSQL
choco install postgresql

# Start PostgreSQL service
net start postgresql-x64-15

# Create database
createdb -U postgres urutibiz_dev
```

#### Windows (Manual Download)
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run installer and follow setup wizard
3. Remember the password you set for 'postgres' user
4. Update `.env` file with your password

#### macOS (using Homebrew)
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb urutibiz_dev
```

#### Ubuntu/Debian
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb urutibiz_dev
```

### Option 3: Cloud Database Services

#### Supabase (Free Tier)
1. Go to https://supabase.com
2. Create new project
3. Get connection details from Settings > Database
4. Update `.env` with connection details

#### Railway
1. Go to https://railway.app
2. Create new project with PostgreSQL
3. Get connection details
4. Update `.env` with connection details

#### Render
1. Go to https://render.com
2. Create PostgreSQL database
3. Get connection string
4. Update `.env` with connection details

## ⚙️ Configuration

### 1. Environment Variables
Update your `.env` file with your database credentials:

```env
# Database Configuration
DB_HOST=localhost          # Your database host
DB_PORT=5432              # Your database port
DB_NAME=urutibiz_dev      # Your database name
DB_USER=postgres          # Your database username
DB_PASSWORD=12345         # Your database password
DB_SSL=false              # Set to true for cloud databases
```

### 2. Test Database Connection
```bash
# Run database setup test
npm run db:setup

# Alternative: Run basic connection test
npm run db:test
```

### 3. Run Migrations
```bash
# Create database tables
npm run db:migrate

# Seed with sample data (optional)
npm run db:seed
```

## 🐳 Docker Compose Setup (Full Stack)

For a complete development environment:

```bash
# Start all services (PostgreSQL + Redis)
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f postgres
```

## 🔧 Troubleshooting

### Connection Refused (ECONNREFUSED)
**Problem**: Can't connect to database
**Solutions**:
- PostgreSQL service is not running
- Wrong host/port in `.env`
- Firewall blocking connection

```bash
# Check if PostgreSQL is running (Windows)
sc query postgresql-x64-15

# Check if PostgreSQL is running (Mac/Linux)
brew services list | grep postgresql
sudo systemctl status postgresql
```

### Authentication Failed
**Problem**: Login credentials rejected
**Solutions**:
- Wrong username/password in `.env`
- User doesn't exist in PostgreSQL
- User lacks necessary permissions

```bash
# Connect to PostgreSQL and create user
psql -U postgres
CREATE USER your_username WITH PASSWORD 'your_password';
ALTER USER your_username CREATEDB;
```

### Database Does Not Exist
**Problem**: Database not found
**Solutions**:
- Create the database manually
- Update DB_NAME in `.env` to existing database

```bash
# Create database
createdb -U postgres urutibiz_dev

# Or connect to PostgreSQL and create
psql -U postgres
CREATE DATABASE urutibiz_dev;
```

### SSL Connection Issues
**Problem**: SSL-related connection errors
**Solutions**:
- Set `DB_SSL=false` for local development
- Set `DB_SSL=true` for cloud databases
- Add SSL certificate for production

## 📊 Database Schema

After successful connection, run migrations to create tables:

```bash
# Create all tables
npm run db:migrate

# Reset database (caution: deletes all data)
npm run db:reset
```

### Main Tables Created:
- `users` - User accounts and profiles
- `products` - Rental items/services
- `bookings` - Rental bookings and transactions
- `categories` - Product categorization
- `countries` - Country and region data
- `user_verifications` - KYC and document verification
- `payments` - Payment transactions
- `insurance_policies` - Insurance coverage

## 🚀 Next Steps

1. **Database Connected**: ✅
2. **Run Migrations**: `npm run db:migrate`
3. **Seed Data** (optional): `npm run db:seed`
4. **Start Server**: `npm run dev`
5. **Test API**: http://localhost:4000/api/v1/health

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Knex.js Documentation](https://knexjs.org/)
- [Docker PostgreSQL](https://hub.docker.com/_/postgres)

## 🆘 Need Help?

If you're still having issues:

1. Check the logs: `npm run db:setup` for detailed error messages
2. Verify your `.env` configuration
3. Ensure PostgreSQL service is running
4. Try using Docker option for quick setup

---

**Quick Docker Setup Command:**
```bash
docker run --name urutibiz-postgres -e POSTGRES_DB=urutibiz_dev -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=12345 -p 5432:5432 -d postgres:15 && npm run db:setup
```
