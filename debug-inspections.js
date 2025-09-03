const knex = require('knex');
const knexConfig = require('./knexfile');

async function debugInspections() {
  try {
    console.log('🔍 Debugging Inspections Issue...');
    console.log('');

    const db = knex(knexConfig.development);

    // Check if inspections table exists and has data
    console.log('1️⃣ Checking if inspections table exists...');
    const tableExists = await db.schema.hasTable('product_inspections');
    console.log(`   Table exists: ${tableExists}`);
    console.log('');

    if (tableExists) {
      // Check total count of inspections
      console.log('2️⃣ Checking total inspections count...');
      const totalCount = await db('product_inspections').count('* as count').first();
      console.log(`   Total inspections: ${totalCount.count}`);
      console.log('');

      if (totalCount.count > 0) {
        // Show sample inspections
        console.log('3️⃣ Sample inspections in database:');
        const sampleInspections = await db('product_inspections')
          .select('id', 'inspector_id', 'renter_id', 'owner_id', 'inspection_type', 'status', 'created_at')
          .limit(5);
        
        sampleInspections.forEach((inspection, index) => {
          console.log(`   ${index + 1}. ID: ${inspection.id}`);
          console.log(`      Inspector: ${inspection.inspector_id}`);
          console.log(`      Renter: ${inspection.renter_id}`);
          console.log(`      Owner: ${inspection.owner_id}`);
          console.log(`      Type: ${inspection.inspection_type}`);
          console.log(`      Status: ${inspection.status}`);
          console.log(`      Created: ${inspection.created_at}`);
          console.log('');
        });

        // Check what happens with different filter combinations
        console.log('4️⃣ Testing filter queries...');
        
        // Test with inspector_id filter
        const inspectorFilter = await db('product_inspections')
          .select('id', 'inspector_id', 'renter_id', 'owner_id')
          .where('inspector_id', '7f102034-45c2-460a-bc89-a7525cf32938')
          .limit(3);
        console.log(`   Inspections for inspector 7f102034-45c2-460a-bc89-a7525cf32938: ${inspectorFilter.length}`);
        
        // Test with renter_id filter
        const renterFilter = await db('product_inspections')
          .select('id', 'inspector_id', 'renter_id', 'owner_id')
          .where('renter_id', '19f2a419-df24-4506-a462-37b82d79516f')
          .limit(3);
        console.log(`   Inspections for renter 19f2a419-df24-4506-a462-37b82d79516f: ${renterFilter.length}`);
        
        // Test with owner_id filter
        const ownerFilter = await db('product_inspections')
          .select('id', 'inspector_id', 'renter_id', 'owner_id')
          .where('owner_id', '19f2a419-df24-4506-a462-37b82d79516f')
          .limit(3);
        console.log(`   Inspections for owner 19f2a419-df24-4506-a462-37b82d79516f: ${ownerFilter.length}`);
        console.log('');

        // Check what the toSnakeCase conversion does
        console.log('5️⃣ Testing toSnakeCase conversion...');
        const testKeys = ['inspectorId', 'renterId', 'ownerId', 'inspectionType', 'status'];
        testKeys.forEach(key => {
          const snakeCase = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          console.log(`   ${key} -> ${snakeCase}`);
        });
        console.log('');

      } else {
        console.log('❌ No inspections found in database!');
        console.log('   This explains why you get empty arrays.');
        console.log('');
        console.log('💡 To create test inspections:');
        console.log('   1. Create a booking first');
        console.log('   2. Create an inspection for that booking');
        console.log('   3. Use the inspection creation API');
      }
    } else {
      console.log('❌ product_inspections table does not exist!');
      console.log('   Run migrations to create the table.');
    }

    await db.destroy();

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  }
}

debugInspections();
