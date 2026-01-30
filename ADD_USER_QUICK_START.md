# Add Verified User - Quick Start

## 🚀 Fastest Way to Add a User

### Option 1: Interactive (Easiest)
```bash
npm run add:user
```

Follow the prompts:
1. Enter email
2. Enter phone number
3. Enter first name
4. Enter last name
5. Select role (1-5)
6. Enter password (or press Enter for "password123")

Done! User is created and ready to login.

### Option 2: Pre-configured User
```bash
npm run seed:new-user
```

Adds:
- Email: verified.user@example.com
- Password: password123
- Role: owner
- Status: Fully verified

### Option 3: Multiple Custom Users
1. Edit `database/seeds/05_add_custom_verified_user.ts`
2. Add users to the array
3. Run: `npm run seed:custom-users`

## ✅ What You Get

Every user created is:
- ✅ Email verified
- ✅ Phone verified
- ✅ KYC verified
- ✅ Ready to use immediately

## 📋 Check Users

```bash
npm run check:users
```

Shows all users in the database.

## 🔑 Login

All seeded users have password: **password123**

Login at: http://localhost:5173/login

## 💡 Tips

- Use unique email addresses
- Use unique phone numbers
- Default password is "password123"
- All users are fully verified
- Safe to run multiple times

## 🎯 Quick Examples

### Add an Owner
```bash
npm run add:user
# Email: owner@test.com
# Role: 1
```

### Add a Renter
```bash
npm run add:user
# Email: renter@test.com
# Role: 2
```

### Add an Admin
```bash
npm run add:user
# Email: admin2@test.com
# Role: 3
```

That's it! 🎉
