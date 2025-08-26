const knex = require('knex')(require('./knexfile.js'));

async function checkModerationData() {
  try {
    console.log('🔍 Checking moderation data...\n');

    // Check if moderation_actions table exists
    const tableExists = await knex.schema.hasTable('moderation_actions');
    console.log('✅ moderation_actions table exists:', tableExists);

    if (!tableExists) {
      console.log('❌ Table does not exist - run migration first');
      return;
    }

    // Get sample products
    console.log('\n📦 Sample Products:');
    const products = await knex('products').select('id', 'title', 'status').limit(5);
    console.log(JSON.stringify(products, null, 2));

    // Get moderation actions
    console.log('\n🛡️ Moderation Actions:');
    const actions = await knex('moderation_actions').select('*').limit(10);
    console.log(JSON.stringify(actions, null, 2));

    // Check if any moderation actions exist
    if (actions.length === 0) {
      console.log('\n⚠️ No moderation actions found in database');
      console.log('This explains why the API returns empty array!');
    } else {
      console.log('\n🔍 Checking resource ID matches...');
      
      // Check if resource IDs match actual product IDs
      for (const action of actions) {
        if (action.resource_type === 'product') {
          const product = await knex('products').where('id', action.resource_id).first();
          if (product) {
            console.log(`✅ Resource ID ${action.resource_id} matches product: ${product.title}`);
          } else {
            console.log(`❌ Resource ID ${action.resource_id} NOT found in products table!`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkModerationData();

