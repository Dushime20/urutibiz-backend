import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Flexible seed to add custom verified users
 * Modify the usersToAdd array below to add multiple users at once
 */

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Adding custom verified users (preserving existing users)...');

  // Hash password once for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // ✏️ CUSTOMIZE THESE USERS AS NEEDED
  const usersToAdd = [
    {
      email: 'owner.verified@example.com',
      phone: '+250788111222',
      role: 'owner',
      firstName: 'John',
      lastName: 'Owner',
      city: 'Kigali',
      country: 'Rwanda',
      bio: 'Verified property owner'
    },
    {
      email: 'renter.verified@example.com',
      phone: '+250788333444',
      role: 'renter',
      firstName: 'Sarah',
      lastName: 'Renter',
      city: 'Kigali',
      country: 'Rwanda',
      bio: 'Verified renter looking for quality products'
    },
    // Add more users here as needed
  ];

  let addedCount = 0;
  let skippedCount = 0;

  for (const userData of usersToAdd) {
    // Check if user already exists
    const existingUser = await knex('users')
      .where('email', userData.email)
      .first();

    if (existingUser) {
      console.log(`   ⏭️  Skipping ${userData.email} (already exists)`);
      skippedCount++;
      continue;
    }

    // Generate new UUID
    const newUserId = uuidv4();

    // Insert the new verified user
    await knex('users').insert({
      id: newUserId,
      email: userData.email,
      phone_number: userData.phone,
      phone: userData.phone,
      password_hash: hashedPassword,
      role: userData.role,
      is_active: true,
      first_name: userData.firstName,
      last_name: userData.lastName,
      preferred_currency: 'USD',
      date_of_birth: '1990-01-01',
      gender: 'other',
      
      // Global address fields
      street_address: '123 Main Street',
      city: userData.city,
      state_province: userData.city,
      postal_code: '10001',
      country: userData.country,
      
      // Legacy fields
      province: 'rw-kigali',
      address_line: '123 Main Street',
      district: 'rw-kigali-gasabo',
      sector: 'Remera',
      cell: 'Remera',
      village: 'Remera',
      
      // ✅ FULLY VERIFIED STATUS
      email_verified: true,
      phone_verified: true,
      kyc_status: 'verified',
      id_verification_status: 'verified',
      
      bio: userData.bio,
      two_factor_enabled: false,
      two_factor_verified: false,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

    console.log(`   ✅ Created: ${userData.email} (${userData.role})`);
    addedCount++;
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Added: ${addedCount} user(s)`);
  console.log(`   ⏭️  Skipped: ${skippedCount} user(s) (already exist)`);
  console.log(`   🔑 Default password for all: password123`);
  console.log('✅ Custom verified users seed completed!');
}
