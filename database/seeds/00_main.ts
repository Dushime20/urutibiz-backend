import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Run all seed files in order
    console.log('\n📋 Seeding categories...');
    await knex.seed.run({ specific: '01_categories.ts' });
    
    console.log('\n🏛️ Seeding administrative divisions...');
    await knex.seed.run({ specific: '02_administrative_divisions.ts' });
    
    console.log('\n👥 Seeding users...');
    await knex.seed.run({ specific: '03_users.ts' });
    
    console.log('\n📦 Seeding products...');
    await knex.seed.run({ specific: '04_products.ts' });
    
    console.log('\n💰 Seeding product prices...');
    await knex.seed.run({ specific: '05_product_prices.ts' });
    
    console.log('\n📅 Seeding bookings...');
    await knex.seed.run({ specific: '06_bookings.ts' });
    
    console.log('\n💳 Seeding payment transactions...');
    await knex.seed.run({ specific: '07_payment_transactions.ts' });
    
    console.log('\n⭐ Seeding product reviews...');
    await knex.seed.run({ specific: '08_product_reviews.ts' });
    
    console.log('\n🔍 Seeding user verifications...');
    await knex.seed.run({ specific: '09_user_verifications.ts' });
    
    console.log('\n🔔 Seeding notifications...');
    await knex.seed.run({ specific: '10_notifications.ts' });
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 8 Categories');
    console.log('- 15 Administrative divisions');
    console.log('- 8 Users (renter, owner, admin, moderator, inspector)');
    console.log('- 8 Products across different categories');
    console.log('- 16 Product prices');
    console.log('- 3 Bookings (confirmed, pending, completed)');
    console.log('- 5 Payment transactions');
    console.log('- 8 Product reviews');
    console.log('- 8 User verifications');
    console.log('- 8 Notifications');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}
