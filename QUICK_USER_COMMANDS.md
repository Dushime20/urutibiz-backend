# Quick User Management Commands

## 🚀 Quick Commands

### Add a Single Verified User (Interactive)
```bash
npm run add:user
```
This will prompt you for:
- Email
- Phone number
- First name
- Last name
- Role (owner/renter/admin/moderator/inspector)
- Password (optional, defaults to "password123")

### Add Pre-configured Verified User
```bash
npm run seed:new-user
```
Adds: `verified.user@example.com` / `password123`

### Add Multiple Custom Users
```bash
npm run seed:custom-users
```
Adds users defined in `database/seeds/05_add_custom_verified_user.ts`

### Check All Users in Database
```bash
npm run check:users
```
Shows all users with their IDs, emails, roles, and verification status

### Run All Seeds (Safe - Won't Delete Existing Users)
```bash
npm run seed
```
Runs all seed files, skipping users that already exist

## 📋 Examples

### Example 1: Add a New Owner Interactively
```bash
npm run add:user

# Then enter:
📧 Email address: newowner@example.com
📱 Phone number: +250788999777
👤 First name: New
👤 Last name: Owner
Select role (1-5): 1
🔑 Password: mypassword123
```

### Example 2: Add Multiple Test Users
1. Edit `database/seeds/05_add_custom_verified_user.ts`
2. Add your users to the `usersToAdd` array
3. Run: `npm run seed:custom-users`

### Example 3: Check Who's in the Database
```bash
npm run check:users

# Output:
✅ Found 9 users:
1. john.doe@example.com
   ID: abc-123-def
   Role: renter
   KYC Status: verified
   ...
```

## 🔑 Default Credentials

All seeded users have password: **password123**

## ✅ Safety Features

- ✅ Won't delete existing users
- ✅ Checks for duplicate emails
- ✅ Checks for duplicate phone numbers
- ✅ All new users are fully verified
- ✅ Can run multiple times safely

## 🎯 Common Use Cases

### Add a Test Owner
```bash
npm run add:user
# Email: testowner@example.com
# Role: 1 (owner)
```

### Add a Test Renter
```bash
npm run add:user
# Email: testrenter@example.com
# Role: 2 (renter)
```

### Add an Admin
```bash
npm run add:user
# Email: newadmin@example.com
# Role: 3 (admin)
```

### Reset Database and Add Fresh Users
```bash
npm run db:reset  # Resets database
npm run seed      # Adds all seed users (won't duplicate)
```

## 📝 Notes

- All users are created with verified status (email, phone, KYC)
- Users can login immediately after creation
- Phone numbers must be unique
- Email addresses must be unique
- Default password is "password123" unless specified

## 🔧 Troubleshooting

### "User already exists"
The email or phone is already in the database. Use `npm run check:users` to see existing users.

### "User not found" after login
Clear browser localStorage and login again:
```javascript
// In browser console:
localStorage.clear()
```

### Can't run scripts
Make sure to build first:
```bash
npm run build
```
