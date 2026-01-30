import { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // ⚠️ IMPORTANT: Don't delete existing users to preserve tokens and user data
  // Instead, use upsert logic to insert only if user doesn't exist
  
  console.log('🌱 Starting user seed (preserving existing users)...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // Check if users already exist and get their IDs, or generate new ones
  const existingUsers = await knex('users')
    .select('id', 'email')
    .whereIn('email', [
      'john.doe@example.com',
      'jane.smith@example.com',
      'admin@urutibiz.com',
      'moderator@urutibiz.com',
      'inspector@urutibiz.com',
      'mary.wilson@example.com',
      'david.brown@example.com',
      'sarah.jones@example.com'
    ]);

  const existingUserMap = new Map(existingUsers.map(u => [u.email, u.id]));

  // Use existing IDs or generate new UUIDs
  const userIds = {
    user1: existingUserMap.get('john.doe@example.com') || uuidv4(),
    user2: existingUserMap.get('jane.smith@example.com') || uuidv4(),
    user3: existingUserMap.get('admin@urutibiz.com') || uuidv4(),
    user4: existingUserMap.get('moderator@urutibiz.com') || uuidv4(),
    user5: existingUserMap.get('inspector@urutibiz.com') || uuidv4(),
    user6: existingUserMap.get('mary.wilson@example.com') || uuidv4(),
    user7: existingUserMap.get('david.brown@example.com') || uuidv4(),
    user8: existingUserMap.get('sarah.jones@example.com') || uuidv4()
  };

  console.log(`📊 Found ${existingUsers.length} existing users, will preserve their IDs`);

  // Prepare users data
  const usersToSeed = [
    {
      id: userIds.user1,
      email: 'john.doe@example.com',
      phone_number: '+250788123456',
      password_hash: hashedPassword,
      role: 'renter',
      is_active: true,
      first_name: 'John',
      last_name: 'Doe',
      preferred_currency: 'RWF',
      date_of_birth: '1990-05-15',
      gender: 'male',
      province: 'rw-kigali',
      address_line: 'KG 123 St, Kacyiru',
      email_verified: true,
      phone_verified: true,
      kyc_status: 'verified',
      bio: 'Passionate traveler and adventure seeker',
      district: 'rw-kigali-gasabo',
      sector: 'Kacyiru',
      cell: 'Kacyiru',
      village: 'Kacyiru',
      two_factor_enabled: false,
      two_factor_verified: false,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: userIds.user2,
      email: 'jane.smith@example.com',
      phone_number: '+250788234567',
      password_hash: hashedPassword,
      role: 'owner',
      is_active: true,
      first_name: 'Jane',
      last_name: 'Smith',
      preferred_currency: 'RWF',
      date_of_birth: '1985-08-22',
      gender: 'female',
      province: 'rw-south',
      address_line: 'KN 456 St, Huye',
      email_verified: true,
      phone_verified: true,
      kyc_status: 'verified',
      bio: 'Local business owner specializing in equipment rental',
      district: 'rw-south-huye',
      sector: 'Huye',
      cell: 'Huye',
      village: 'Huye',
      two_factor_enabled: true,
      two_factor_verified: true,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: userIds.user3,
      email: 'admin@urutibiz.com',
      phone_number: '+250788345678',
      phone: '+250788345678',
      password_hash: adminPassword,
      role: 'admin',
      is_active: true,
      first_name: 'Admin',
      last_name: 'User',
      preferred_currency: 'RWF',
      date_of_birth: '1980-01-01',
      gender: 'male',
      // Global address fields
      street_address: 'KG 789 St, Kimisagara',
      city: 'Kigali',
      state_province: 'Kigali City',
      postal_code: '00000',
      country: 'Rwanda',
      // Legacy fields (for backward compatibility)
      province: 'rw-kigali',
      address_line: 'KG 789 St, Kimisagara',
      district: 'rw-kigali-nyarugenge',
      sector: 'Kimisagara',
      cell: 'Kimisagara',
      village: 'Kimisagara',
      // Verification status - FULLY VERIFIED
      email_verified: true,
      phone_verified: true,
      kyc_status: 'verified',
      bio: 'System administrator for UrutiBiz platform',
      two_factor_enabled: false,
      two_factor_verified: false,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: userIds.user4,
      email: 'moderator@urutibiz.com',
      phone_number: '+250788456789',
      password_hash: hashedPassword,
      role: 'moderator',
      is_active: true,
      first_name: 'Moderator',
      last_name: 'User',
      preferred_currency: 'RWF',
      date_of_birth: '1982-03-15',
      gender: 'female',
      province: 'rw-west',
      address_line: 'KG 321 St, Rubavu',
      email_verified: true,
      phone_verified: true,
      kyc_status: 'verified',
      bio: 'Content moderator ensuring platform quality',
      district: 'rw-west-rubavu',
      sector: 'Rubavu',
      cell: 'Rubavu',
      village: 'Rubavu',
      two_factor_enabled: false,
      two_factor_verified: false,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: userIds.user5,
      email: 'inspector@urutibiz.com',
      phone_number: '+250788567890',
      password_hash: hashedPassword,
      role: 'inspector',
      is_active: true,
      first_name: 'Inspector',
      last_name: 'User',
      preferred_currency: 'RWF',
      date_of_birth: '1978-07-10',
      gender: 'male',
      province: 'rw-north',
      address_line: 'KG 654 St, Musanze',
      email_verified: true,
      phone_verified: true,
      kyc_status: 'verified',
      bio: 'Professional inspector for product quality assurance',
      district: 'rw-north-musanze',
      sector: 'Musanze',
      cell: 'Musanze',
      village: 'Musanze',
      two_factor_enabled: true,
      two_factor_verified: true,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: userIds.user6,
      email: 'mary.wilson@example.com',
      phone_number: '+250788678901',
      password_hash: hashedPassword,
      role: 'renter',
      is_active: true,
      first_name: 'Mary',
      last_name: 'Wilson',
      preferred_currency: 'RWF',
      date_of_birth: '1992-12-03',
      gender: 'female',
      province: 'rw-east',
      address_line: 'KG 987 St, Kayonza',
      email_verified: true,
      phone_verified: false,
      kyc_status: 'pending_review',
      bio: 'Student and occasional renter',
      district: 'rw-east-kayonza',
      sector: 'Kayonza',
      cell: 'Kayonza',
      village: 'Kayonza',
      two_factor_enabled: false,
      two_factor_verified: false,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: userIds.user7,
      email: 'david.brown@example.com',
      phone_number: '+250788789012',
      password_hash: hashedPassword,
      role: 'owner',
      is_active: true,
      first_name: 'David',
      last_name: 'Brown',
      preferred_currency: 'RWF',
      date_of_birth: '1988-04-18',
      gender: 'male',
      province: 'rw-west',
      address_line: 'KG 147 St, Karongi',
      email_verified: true,
      phone_verified: true,
      kyc_status: 'verified',
      bio: 'Equipment rental business owner',
      district: 'rw-west-karongi',
      sector: 'Karongi',
      cell: 'Karongi',
      village: 'Karongi',
      two_factor_enabled: false,
      two_factor_verified: false,
      status: 'active',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: userIds.user8,
      email: 'sarah.jones@example.com',
      phone_number: '+250788890123',
      password_hash: hashedPassword,
      role: 'renter',
      is_active: false,
      first_name: 'Sarah',
      last_name: 'Jones',
      preferred_currency: 'RWF',
      date_of_birth: '1995-09-25',
      gender: 'female',
      province: 'rw-south',
      address_line: 'KG 258 St, Muhanga',
      email_verified: false,
      phone_verified: false,
      kyc_status: 'unverified',
      bio: 'New user exploring the platform',
      district: 'rw-south-muhanga',
      sector: 'Muhanga',
      cell: 'Muhanga',
      village: 'Muhanga',
      two_factor_enabled: false,
      two_factor_verified: false,
      status: 'pending',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ];

  // Use upsert logic: insert only if user doesn't exist
  for (const user of usersToSeed) {
    const existing = await knex('users').where('email', user.email).first();
    
    if (existing) {
      console.log(`   ⏭️  Skipping ${user.email} (already exists with ID: ${existing.id})`);
    } else {
      await knex('users').insert(user);
      console.log(`   ✅ Created ${user.email} (ID: ${user.id})`);
    }
  }

  console.log('✅ Users seed completed - existing users preserved!');
}
