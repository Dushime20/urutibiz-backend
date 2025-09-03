const knex = require('knex');
const knexConfig = require('./knexfile');

async function fixEmptyInspections() {
  try {
    console.log('🔍 Analyzing Empty Inspections Issue...');
    console.log('');

    const db = knex(knexConfig.development);

    // Get the user ID from the logs
    const userId = '19f2a419-df24-4506-a462-37b82d79516f';
    console.log(`👤 Analyzing user: ${userId}`);
    console.log('');

    // Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const user = await db('users').where('id', userId).first();
    if (user) {
      console.log(`   ✅ User found: ${user.email} (${user.role})`);
    } else {
      console.log(`   ❌ User not found: ${userId}`);
      return;
    }
    console.log('');

    // Check user's role and what inspections they should have
    console.log('2️⃣ Analyzing user role and potential inspections...');
    console.log(`   User role: ${user.role}`);
    
    if (user.role === 'inspector') {
      console.log('   🔍 As INSPECTOR, user should have inspections where:');
      console.log('      inspector_id = user_id');
      const inspectorInspections = await db('product_inspections')
        .where('inspector_id', userId)
        .select('id', 'inspection_type', 'status', 'created_at');
      console.log(`   Found: ${inspectorInspections.length} inspections as inspector`);
    }
    
    if (user.role === 'renter') {
      console.log('   🏠 As RENTER, user should have inspections where:');
      console.log('      renter_id = user_id');
      const renterInspections = await db('product_inspections')
        .where('renter_id', userId)
        .select('id', 'inspection_type', 'status', 'created_at');
      console.log(`   Found: ${renterInspections.length} inspections as renter`);
    }
    
    if (user.role === 'owner') {
      console.log('   🏢 As OWNER, user should have inspections where:');
      console.log('      owner_id = user_id');
      const ownerInspections = await db('product_inspections')
        .where('owner_id', userId)
        .select('id', 'inspection_type', 'status', 'created_at');
      console.log(`   Found: ${ownerInspections.length} inspections as owner`);
    }
    console.log('');

    // Show all existing inspections to understand the data
    console.log('3️⃣ All existing inspections in database:');
    const allInspections = await db('product_inspections')
      .select('id', 'inspector_id', 'renter_id', 'owner_id', 'inspection_type', 'status', 'created_at')
      .orderBy('created_at', 'desc');
    
    allInspections.forEach((inspection, index) => {
      console.log(`   ${index + 1}. ID: ${inspection.id}`);
      console.log(`      Inspector: ${inspection.inspector_id}`);
      console.log(`      Renter: ${inspection.renter_id}`);
      console.log(`      Owner: ${inspection.owner_id}`);
      console.log(`      Type: ${inspection.inspection_type}`);
      console.log(`      Status: ${inspection.status}`);
      console.log(`      Created: ${inspection.created_at}`);
      console.log('');
    });

    // Check if there are any bookings for this user
    console.log('4️⃣ Checking user\'s bookings...');
    const userBookings = await db('bookings')
      .where('renter_id', userId)
      .orWhere('owner_id', userId)
      .select('id', 'renter_id', 'owner_id', 'status', 'created_at');
    
    console.log(`   Found ${userBookings.length} bookings for user`);
    userBookings.forEach((booking, index) => {
      console.log(`   ${index + 1}. Booking ID: ${booking.id}`);
      console.log(`      Renter: ${booking.renter_id}`);
      console.log(`      Owner: ${booking.owner_id}`);
      console.log(`      Status: ${booking.status}`);
      console.log(`      Created: ${booking.created_at}`);
    });
    console.log('');

    // Provide solutions
    console.log('💡 SOLUTIONS:');
    console.log('');
    
    if (userBookings.length === 0) {
      console.log('❌ PROBLEM: User has no bookings');
      console.log('   SOLUTION: Create a booking first, then create inspections');
      console.log('');
      console.log('   Steps:');
      console.log('   1. Create a product listing');
      console.log('   2. Create a booking for that product');
      console.log('   3. Create inspections for that booking');
    } else if (allInspections.length === 0) {
      console.log('❌ PROBLEM: No inspections exist in database');
      console.log('   SOLUTION: Create inspections for existing bookings');
      console.log('');
      console.log('   Steps:');
      console.log('   1. Use the inspection creation API');
      console.log('   2. Provide booking_id, inspector_id, etc.');
    } else {
      console.log('❌ PROBLEM: User has no inspections assigned to them');
      console.log('   SOLUTION: Create inspections for this user');
      console.log('');
      console.log('   Steps:');
      console.log('   1. Create inspection with this user as inspector/renter/owner');
      console.log('   2. Use existing booking IDs from the database');
      console.log('   3. Use the inspection creation API');
    }
    console.log('');

    // Show API examples
    console.log('🔧 API Examples:');
    console.log('');
    console.log('Create inspection for this user:');
    console.log('POST /api/v1/inspections');
    console.log('{');
    console.log('  "productId": "existing-product-id",');
    console.log('  "bookingId": "existing-booking-id",');
    console.log('  "inspectorId": "' + userId + '",');
    console.log('  "inspectionType": "pre_rental",');
    console.log('  "scheduledAt": "2025-09-04T10:00:00Z"');
    console.log('}');
    console.log('');

    await db.destroy();

  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    console.error(error.stack);
  }
}

fixEmptyInspections();
