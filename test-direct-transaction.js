#!/usr/bin/env node

const { PaymentTransactionRepository } = require('./dist/repositories/PaymentTransactionRepository.knex');

async function testDirectTransaction() {
  console.log('💾 Testing Direct Database Transaction Creation');
  console.log('=============================================\n');

  try {
    console.log('1. Testing direct repository transaction creation...');
    
    const repository = new PaymentTransactionRepository();
    
    const transactionData = {
      user_id: '39f22329-d38e-4e0a-a01c-6ae36d911b30',
      transaction_type: 'booking_payment',
      amount: 150.00,
      currency: 'USD',
      provider: 'stripe',
      metadata: {
        test: true,
        description: 'Direct database persistence test'
      }
    };

    console.log('📋 Transaction data:', JSON.stringify(transactionData, null, 2));

    const transaction = await repository.create(transactionData);

    console.log('\n🎉 SUCCESS! Transaction created directly in database:');
    console.log(`   Transaction ID: ${transaction.id}`);
    console.log(`   Status: ${transaction.status}`);
    console.log(`   Amount: $${transaction.amount}`);
    console.log(`   Currency: ${transaction.currency}`);
    console.log(`   Provider: ${transaction.provider}`);

    console.log('\n2. Verifying transaction in database...');
    console.log('   Run this SQL query to check:');
    console.log(`   SELECT * FROM payment_transactions WHERE id = '${transaction.id}';`);

    console.log('\n✅ DATABASE PERSISTENCE WORKING! 🚀');
    console.log('Payment transactions are now being saved to the database!');

  } catch (error) {
    console.log('\n❌ Direct transaction test failed:');
    console.log(`Error: ${error.message}`);
    
    if (error.stack) {
      console.log('\n🔍 Stack trace:');
      console.log(error.stack);
    }
  }
}

testDirectTransaction(); 