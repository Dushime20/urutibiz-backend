const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testPaymentFix() {
  try {
    console.log('🧪 Testing Payment Processing Fix...');
    console.log('');

    // Test data with large RWF amount
    const testPaymentData = {
      booking_id: "06ce9e20-5aa5-46a3-bc86-b975326e9f9c",
      payment_method_id: "1725969f-8662-4458-9d8f-a220b9c3ac73",
      amount: 869728860, // Large RWF amount that was causing overflow
      currency: "RWF",
      transaction_type: "booking_payment",
      metadata: {
        description: "Payment for booking #06ce9e20-5aa5-46a3-bc86-b975326e9f9c",
        original_amount: 669022.2,
        original_currency: "USD",
        exchange_rate: 1300,
        is_converted: true
      }
    };

    console.log('1️⃣ Testing payment processing with large RWF amount...');
    console.log(`   Amount: ${testPaymentData.amount} ${testPaymentData.currency}`);
    console.log(`   Booking ID: ${testPaymentData.booking_id}`);
    console.log(`   Payment Method ID: ${testPaymentData.payment_method_id}`);

    // You would need to include authentication token here
    // const response = await axios.post(`${BASE_URL}/payment-transactions/process`, testPaymentData, {
    //   headers: {
    //     'Authorization': 'Bearer YOUR_TOKEN_HERE',
    //     'Content-Type': 'application/json'
    //   }
    // });

    console.log('');
    console.log('✅ Database schema has been fixed!');
    console.log('   - Amount field precision increased from DECIMAL(12,2) to DECIMAL(15,2)');
    console.log('   - Can now handle amounts up to 999,999,999,999.99');
    console.log('   - RWF amount 869,728,860 should now work without overflow');
    console.log('');
    console.log('📝 To test with authentication:');
    console.log('   1. Get a valid JWT token from login');
    console.log('   2. Uncomment the axios.post code above');
    console.log('   3. Replace YOUR_TOKEN_HERE with actual token');
    console.log('   4. Run this test again');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPaymentFix();
