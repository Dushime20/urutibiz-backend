import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Adding new verified user (preserving existing users)...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Define the new user to add
  const newUserEmail = 'verified.user@example.com';

  // Check if user already exists
  const existingUser = await knex('users')
    .where('email', newUserEmail)
    .first();

  if (existingUser) {
    console.log(`   ⏭️  User ${newUserEmail} already exists (ID: ${existingUser.id})`);
    console.log('✅ Seed completed - no changes made');
    return;
  }

  // Generate new UUID for the user
  const newUserId = uuidv4();

  // Insert the new verified user
  await knex('users').insert({
    id: newUserId,
    email: newUserEmail,
    phone_number: '+250788999888',
    phone: '+250788999888',
    password_hash: hashedPassword,
    role: 'owner', // Can be 'owner', 'renter', 'admin', 'moderator', 'inspector'
    is_active: true,
    first_name: 'Verified',
    last_name: 'User',
    preferred_currency: 'USD',
    date_of_birth: '1993-06-20',
    gender: 'male',
    
    // Global address fields (international standard)
    street_address: '123 Main Street, Downtown',
    city: 'Kigali',
    state_province: 'Kigali City',
    postal_code: '10001',
    country: 'Rwanda',
    
    // Legacy fields (for backward compatibility)
    province: 'rw-kigali',
    address_line: '123 Main Street, Downtown',
    district: 'rw-kigali-gasabo',
    sector: 'Remera',
    cell: 'Remera',
    village: 'Remera',
    
    // ✅ FULLY VERIFIED STATUS
    email_verified: true,
    phone_verified: true,
    kyc_status: 'verified',
    id_verification_status: 'verified',
    
    bio: 'New verified user ready to use the platform',
    two_factor_enabled: false,
    two_factor_verified: false,
    status: 'active',
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });

  console.log(`   ✅ Created new verified user: ${newUserEmail} (ID: ${newUserId})`);
  console.log(`   📧 Email: ${newUserEmail}`);
  console.log(`   🔑 Password: password123`);
  console.log(`   📱 Phone: +250788999888`);
  console.log(`   👤 Role: owner`);
  console.log(`   ✓ Email Verified: true`);
  console.log(`   ✓ Phone Verified: true`);
  console.log(`   ✓ KYC Status: verified`);
  console.log('✅ New verified user added successfully!');
}
