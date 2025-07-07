# 🗄️ Database Setup Guide for UrutiBiz Backend

This guide will help you set up a real database connection for the UrutiBiz backend.

## 🚀 Quick Setup (Recommended)

### Option 1: Docker Setup (Easiest)

1. **Install Docker Desktop** (if not already installed):
   - Download from: https://www.docker.com/products/docker-desktop/
   - Start Docker Desktop

2. **Start the database services**:
   ```bash
   # On Windows:
   .\start-database.bat
   
   # On Linux/Mac:
   ./start-database.sh
   ```

3. **Verify the connection**:
   ```bash
   node test-db-connection.js
   ```

### Option 2: Local PostgreSQL Installation

1. **Install PostgreSQL 15+**:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql@15`
   - Ubuntu: `sudo apt-get install postgresql-15`

2. **Create database and user**:
   ```sql
   -- Connect to PostgreSQL as superuser
   psql -U postgres
   
   -- Create database (if not exists)
   CREATE DATABASE postgres;
   
   -- Set password for postgres user
   ALTER USER postgres PASSWORD '12345';
   ```

3. **Initialize database schema**:
   ```bash
   psql -U postgres -d postgres -f init.sql
   ```

## 🔧 Configuration

### Environment Variables

Update your `.env` file with your database settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=12345
DB_SSL=false

# For production, use stronger credentials:
# DB_PASSWORD=your-strong-password
# DB_SSL=true
```

### Connection Test

Test your database connection:

```bash
npm run test:db
# OR
node test-db-connection.js
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
```

## 📊 Database Schema

The system will automatically create these tables:

- `users` - User accounts and profiles
- `products` - Rental items/services
- `bookings` - Rental bookings and reservations
- `user_verifications` - KYC verification data
- `booking_status_history` - Booking state changes

## 🔍 Testing Database Connection

### Manual Testing

```bash
# Test raw connection
psql -U postgres -h localhost -p 5432 -d postgres

# Test with application
node test-db-connection.js
```

### Health Check

```bash
curl http://localhost:4000/health
```

## ⚠️ Demo Mode

The application can run in demo mode without a database:

```env
NODE_ENV=demo
```

In demo mode:
- ✅ Server starts without database
- ✅ API endpoints respond with mock data
- ⚠️ No persistent data storage
- ⚠️ Limited functionality

## 🐛 Troubleshooting

### Common Issues

1. **Port 5432 already in use**:
   ```bash
   # Find process using port
   netstat -ano | findstr :5432
   
   # Kill process or change port in docker-compose.yml
   ```

2. **Connection refused**:
   - Check if PostgreSQL is running
   - Verify credentials in .env
   - Check firewall settings

3. **Permission denied**:
   ```bash
   # Fix PostgreSQL permissions (Linux/Mac)
   sudo chown -R postgres:postgres /var/lib/postgresql/data
   ```

### Getting Help

1. Check logs: `docker-compose logs postgres`
2. Verify environment: `npm run config:check`
3. Test connection: `npm run test:db`

## 🚀 Production Deployment

For production deployment:

1. **Use managed database service**:
   - AWS RDS PostgreSQL
   - Google Cloud SQL
   - Azure Database for PostgreSQL

2. **Update connection settings**:
   ```env
   DB_HOST=your-production-host
   DB_SSL=true
   DB_PASSWORD=strong-production-password
   ```

3. **Run migrations**:
   ```bash
   npm run migrate
   ```

## 📈 Monitoring

### Database Metrics

The application provides database metrics at:
```
GET /api/v1/admin/metrics/database
```

### Health Checks

Regular health checks are available:
```
GET /health
```

---

**🎯 Goal**: Get your UrutiBiz backend connected to a real database for full functionality and persistent data storage.

**✅ Success**: When you can run `npm run dev` and see "Database connected successfully" in the logs.
