import { getDatabase } from '../src/config/database';

async function fix2FAData() {
  try {
    const db = getDatabase();
    console.log('🔧 Starting 2FA data cleanup...');

    // Get all users with potentially corrupted backup codes
    const users = await db('users')
      .select('id', 'email', 'two_factor_backup_codes')
      .whereNotNull('two_factor_backup_codes');

    console.log(`Found ${users.length} users with backup codes data`);

    let fixedCount = 0;
    let removedCount = 0;

    for (const user of users) {
      try {
        // Try to parse the backup codes
        if (typeof user.two_factor_backup_codes === 'string') {
          JSON.parse(user.two_factor_backup_codes);
          console.log(`✅ User ${user.email}: Backup codes are valid JSON`);
        } else if (typeof user.two_factor_backup_codes === 'object') {
          console.log(`⚠️  User ${user.email}: Backup codes are object, converting to JSON`);
          
          // Convert object to proper JSON string
          await db('users')
            .where({ id: user.id })
            .update({
              two_factor_backup_codes: JSON.stringify(user.two_factor_backup_codes),
              updated_at: new Date()
            });
          fixedCount++;
        }
      } catch (parseError) {
        console.log(`❌ User ${user.email}: Invalid backup codes data, removing...`);
        
        // Remove corrupted backup codes data
        await db('users')
          .where({ id: user.id })
          .update({
            two_factor_backup_codes: null,
            two_factor_secret: null,
            two_factor_enabled: false,
            two_factor_verified: false,
            updated_at: new Date()
          });
        removedCount++;
      }
    }

    console.log(`\n🎉 Cleanup completed!`);
    console.log(`✅ Fixed: ${fixedCount} users`);
    console.log(`🗑️  Removed corrupted data: ${removedCount} users`);
    console.log(`📊 Total processed: ${users.length} users`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

fix2FAData();
