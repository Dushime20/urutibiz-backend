# Add New Verified Users Guide

## Overview
This guide explains how to add new verified users to the database without deleting existing users.

## Available Seed Files

### 1. `04_add_new_verified_user.ts` - Single User
Adds one pre-configured verified user.

**User Details:**
- **Email:** verified.user@example.com
- **Password:** password123
- **Phone:** +250788999888
- **Role:** owner
- **Status:** Fully verified (email, phone, KYC)

**Usage:**
```bash
# Run this specific seed
npm run knex seed:run -- --specific=04_add_new_verified_user.ts

# Or run all seeds (will skip existing users)
npm run seed
```

### 2. `05_add_custom_verified_user.ts` - Multiple Users
Adds multiple customizable verified users.

**Pre-configured Users:**
1. owner.verified@example.com (Owner role)
2. renter.verified@example.com (Renter role)

**Customization:**
Edit the `usersToAdd` array in the file to add your own users:

```typescript
const usersToAdd = [
  {
    email: 'your.email@example.com',
    phone: '+250788123456',
    role: 'owner', // or 'renter', 'admin', 'moderator', 'inspector'
    firstName: 'Your',
    lastName: 'Name',
    city: 'Kigali',
    country: 'Rwanda',
    bio: 'Your bio here'
  },
  // Add more users...
];
```

**Usage:**
```bash
# Run this specific seed
npm run knex seed:run -- --specific=05_add_custom_verified_user.ts

# Or run all seeds
npm run seed
```

## User Roles Available

- **owner** - Can list products for rent
- **renter** - Can rent products
- **admin** - Full system access
- **moderator** - Can moderate content
- **inspector** - Can perform inspections

## Verification Status

All users created by these seeds have:
- ✅ Email verified
- ✅ Phone verified
- ✅ KYC status: verified
- ✅ ID verification: verified
- ✅ Account status: active

This means they can immediately:
- Create products
- Make bookings
- Access all platform features
- No verification steps required

## Important Notes

### ✅ Safe to Run Multiple Times
- These seeds check if users already exist
- Existing users are skipped (not deleted)
- Only new users are added
- Your existing data is preserved

### 🔑 Default Password
All seeded users have the same password: **password123**

### 📱 Phone Numbers
Make sure phone numbers are unique. Duplicate phone numbers will cause errors.

### 📧 Email Addresses
Make sure email addresses are unique. Duplicate emails will cause errors.

## Step-by-Step: Add a New User

### Method 1: Quick Single User
1. Run the pre-configured seed:
   ```bash
   cd urutibiz-backend
   npm run knex seed:run -- --specific=04_add_new_verified_user.ts
   ```

2. Login with:
   - Email: verified.user@example.com
   - Password: password123

### Method 2: Custom Multiple Users
1. Open `database/seeds/05_add_custom_verified_user.ts`

2. Edit the `usersToAdd` array:
   ```typescript
   const usersToAdd = [
     {
       email: 'myuser@example.com',
       phone: '+250788555666',
       role: 'owner',
       firstName: 'My',
       lastName: 'User',
       city: 'Kigali',
       country: 'Rwanda',
       bio: 'My custom user'
     }
   ];
   ```

3. Save the file

4. Run the seed:
   ```bash
   npm run knex seed:run -- --specific=05_add_custom_verified_user.ts
   ```

5. Login with:
   - Email: myuser@example.com
   - Password: password123

## Verify Users Were Added

Run the check-users script:
```bash
node check-users.js
```

This will show all users in the database with their details.

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Cause:** Email or phone number already exists in database

**Solution:** 
- Change the email or phone number to a unique value
- Or check if the user already exists with `node check-users.js`

### Error: "User not found" after seeding
**Cause:** Old authentication token in browser

**Solution:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `localStorage.clear()`
4. Refresh page and login again

### Seed doesn't run
**Cause:** TypeScript not compiled

**Solution:**
```bash
npm run build
npm run seed
```

## Example: Add 5 New Owners

Edit `05_add_custom_verified_user.ts`:

```typescript
const usersToAdd = [
  {
    email: 'owner1@example.com',
    phone: '+250788111111',
    role: 'owner',
    firstName: 'Owner',
    lastName: 'One',
    city: 'Kigali',
    country: 'Rwanda',
    bio: 'First owner'
  },
  {
    email: 'owner2@example.com',
    phone: '+250788222222',
    role: 'owner',
    firstName: 'Owner',
    lastName: 'Two',
    city: 'Kigali',
    country: 'Rwanda',
    bio: 'Second owner'
  },
  {
    email: 'owner3@example.com',
    phone: '+250788333333',
    role: 'owner',
    firstName: 'Owner',
    lastName: 'Three',
    city: 'Kigali',
    country: 'Rwanda',
    bio: 'Third owner'
  },
  {
    email: 'owner4@example.com',
    phone: '+250788444444',
    role: 'owner',
    firstName: 'Owner',
    lastName: 'Four',
    city: 'Kigali',
    country: 'Rwanda',
    bio: 'Fourth owner'
  },
  {
    email: 'owner5@example.com',
    phone: '+250788555555',
    role: 'owner',
    firstName: 'Owner',
    lastName: 'Five',
    city: 'Kigali',
    country: 'Rwanda',
    bio: 'Fifth owner'
  }
];
```

Then run:
```bash
npm run knex seed:run -- --specific=05_add_custom_verified_user.ts
```

## Summary

✅ **Safe:** Won't delete existing users
✅ **Flexible:** Easy to customize user details
✅ **Verified:** All users are fully verified
✅ **Reusable:** Can run multiple times safely
✅ **Fast:** Quick way to add test users

All new users can login immediately with password: **password123**
