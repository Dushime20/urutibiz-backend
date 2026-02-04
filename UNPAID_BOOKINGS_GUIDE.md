# Unpaid Bookings Analysis Guide

This guide provides tools and scripts to identify, analyze, and manage unpaid bookings in the UrutiBiz platform.

## 📁 Available Tools

### 1. **Advanced Script** (`get-unpaid-bookings.js`)
Full-featured Node.js script with command-line options and export capabilities.

**Features:**
- ✅ Configurable time filters
- ✅ Multiple output formats (table, JSON, CSV)
- ✅ Export to file
- ✅ Safe deletion with dry-run mode
- ✅ Detailed statistics and analysis

**Requirements:**
- Node.js
- `commander` package for CLI options

### 2. **Simple Script** (`get-unpaid-bookings-simple.js`)
Lightweight Node.js script with no external dependencies.

**Features:**
- ✅ Basic unpaid bookings analysis
- ✅ Payment transaction details
- ✅ Summary statistics
- ✅ Age distribution analysis

**Requirements:**
- Node.js
- Knex.js (already in project)

### 3. **SQL Queries** (`get-unpaid-bookings.sql`)
Direct SQL queries for database analysis.

**Features:**
- ✅ 10 different analysis queries
- ✅ Run directly in PostgreSQL
- ✅ No Node.js required
- ✅ Customizable filters

## 🚀 Quick Start

### Option 1: Simple Script (Recommended)
```bash
cd urutibiz-backend
node get-unpaid-bookings-simple.js
```

### Option 2: Advanced Script
```bash
cd urutibiz-backend
npm install commander  # If not already installed
node get-unpaid-bookings.js --help
```

### Option 3: SQL Queries
```bash
# Connect to your database
psql -h localhost -U postgres -d urutibiz

# Copy and paste queries from get-unpaid-bookings.sql
```

## 📊 Understanding the Results

### Payment Status Types
- **`pending`**: Payment not yet attempted or waiting for processing
- **`processing`**: Payment is currently being processed
- **`failed`**: Payment attempt failed (check failure_reason)

### Key Metrics
- **Total Unpaid Amount**: Revenue at risk
- **Platform Fees at Risk**: Your commission from unpaid bookings
- **Age Distribution**: How long bookings have been unpaid

## 🔧 Configuration

### Environment Variables
Set these in your `.env` file or environment:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=urutibiz
```

### Script Options (Advanced Script)

```bash
# Show bookings older than 48 hours
node get-unpaid-bookings.js --hours 48

# Limit to 20 results
node get-unpaid-bookings.js --limit 20

# Export to JSON file
node get-unpaid-bookings.js --export unpaid-bookings.json

# Export to CSV file
node get-unpaid-bookings.js --export unpaid-bookings.csv --format csv

# Show what would be deleted (safe)
node get-unpaid-bookings.js --dry-run --hours 168  # 7 days

# Filter by specific payment status
node get-unpaid-bookings.js --status "pending,failed"
```

## 📈 Analysis Queries

The SQL file includes 10 different analysis queries:

1. **Basic Unpaid Bookings** - All unpaid bookings with details
2. **Old Unpaid Bookings** - Bookings older than 24 hours
3. **Summary Statistics** - Counts and totals by status
4. **Payment Transaction Details** - Booking + transaction info
5. **Age Group Analysis** - Bookings categorized by age
6. **High-Value Unpaid** - Focus on expensive bookings
7. **Failed Payment Attempts** - Specific failure analysis
8. **Category Analysis** - Unpaid bookings by product category
9. **Repeat Offenders** - Users with multiple unpaid bookings
10. **Cleanup Candidates** - Bookings safe to delete

## ⚠️ Safety Guidelines

### Before Running Cleanup Operations:

1. **Always backup your database first**
2. **Test on staging environment**
3. **Review business rules for payment timeframes**
4. **Consider customer communication**
5. **Use dry-run mode first**

### Recommended Cleanup Criteria:

- ✅ Payment status: `pending` or `failed` (not `processing`)
- ✅ Age: Older than 7 days minimum
- ✅ No completed payment transactions
- ✅ Booking status: Not `cancelled`

## 🔍 Common Use Cases

### Daily Monitoring
```bash
# Check for new unpaid bookings
node get-unpaid-bookings-simple.js
```

### Weekly Cleanup Analysis
```bash
# See what could be cleaned up
node get-unpaid-bookings.js --dry-run --hours 168 --status "pending,failed"
```

### Monthly Reporting
```bash
# Export detailed report
node get-unpaid-bookings.js --export monthly-unpaid-report.csv --format csv
```

### High-Value Investigation
Use SQL query #6 to focus on expensive unpaid bookings that need immediate attention.

### Failed Payment Analysis
Use SQL query #7 to understand why payments are failing and improve the payment flow.

## 📞 Troubleshooting

### Database Connection Issues
1. Check your environment variables
2. Ensure PostgreSQL is running
3. Verify database credentials
4. Check network connectivity

### No Results Found
- ✅ Good news! No unpaid bookings
- Check if you have any bookings in the database
- Verify payment status enum values match your database

### Script Errors
1. Ensure Node.js is installed
2. Run `npm install` in the backend directory
3. Check database connection
4. Review error messages for specific issues

## 🎯 Best Practices

### Monitoring
- Run daily checks for unpaid bookings
- Set up alerts for high-value unpaid bookings
- Monitor payment failure reasons

### Cleanup
- Establish clear business rules for cleanup timing
- Always communicate with customers before deletion
- Keep audit logs of cleanup operations
- Consider offering payment retry options

### Prevention
- Improve payment UX based on failure analysis
- Send payment reminders for pending bookings
- Implement payment retry mechanisms
- Monitor payment provider performance

## 📝 Adding to Package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "unpaid-bookings": "node get-unpaid-bookings-simple.js",
    "unpaid-bookings:advanced": "node get-unpaid-bookings.js",
    "unpaid-bookings:export": "node get-unpaid-bookings.js --export unpaid-bookings.json",
    "unpaid-bookings:cleanup": "node get-unpaid-bookings.js --dry-run --hours 168"
  }
}
```

Then run with:
```bash
npm run unpaid-bookings
npm run unpaid-bookings:export
npm run unpaid-bookings:cleanup
```

## 🔗 Related Documentation

- [Payment Transaction API](./docs/API_DOCUMENTATION.md)
- [Booking Management](./docs/BOOKING_SYSTEM_TESTING.md)
- [Database Schema](./DATABASE_SCHEMA.md)

---

**⚠️ Important**: Always test scripts in a development environment before running in production. Unpaid booking cleanup should be done carefully with proper business approval and customer communication.