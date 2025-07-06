// =====================================================
// PAYMENT METHODS API USAGE EXAMPLES
// =====================================================

/**
 * This file contains comprehensive examples of how to use the Payment Methods API
 * for testing and integration purposes.
 */

// Base configuration
const BASE_URL = 'http://localhost:3000/api/v1';
const API_TOKEN = 'your-auth-token'; // Replace with actual token

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`,
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();
  console.log(`${options.method || 'GET'} ${endpoint}:`, data);
  return data;
}

// =====================================================
// PAYMENT METHOD MANAGEMENT EXAMPLES
// =====================================================

/**
 * Example 1: Create a Credit Card Payment Method
 */
export async function createCreditCard() {
  console.log('\n=== Creating Credit Card Payment Method ===');
  
  const cardData = {
    type: 'card',
    provider: 'visa',
    lastFour: '4242',
    cardBrand: 'visa',
    expMonth: 12,
    expYear: 2025,
    providerToken: 'tok_visa_4242424242424242',
    paymentProviderId: 'provider-uuid-here',
    isDefault: true,
    currency: 'RWF',
    metadata: {
      nickname: 'Primary Visa Card',
      addedFrom: 'web_app',
      userAgent: 'Mozilla/5.0...'
    }
  };

  return await apiCall('/payment-methods', {
    method: 'POST',
    body: JSON.stringify(cardData)
  });
}

/**
 * Example 2: Create a Mobile Money Payment Method
 */
export async function createMobileMoney() {
  console.log('\n=== Creating Mobile Money Payment Method ===');
  
  const mobileMoneyData = {
    type: 'mobile_money',
    provider: 'mtn_momo',
    phoneNumber: '+250781234567',
    providerToken: 'mtn_token_encrypted_123',
    currency: 'RWF',
    metadata: {
      nickname: 'MTN Mobile Money',
      registeredName: 'John Doe',
      accountType: 'personal'
    }
  };

  return await apiCall('/payment-methods', {
    method: 'POST',
    body: JSON.stringify(mobileMoneyData)
  });
}

/**
 * Example 3: Create Airtel Money Payment Method
 */
export async function createAirtelMoney() {
  console.log('\n=== Creating Airtel Money Payment Method ===');
  
  const airtelData = {
    type: 'mobile_money',
    provider: 'airtel_money',
    phoneNumber: '+250732123456',
    providerToken: 'airtel_token_encrypted_456',
    currency: 'RWF',
    metadata: {
      nickname: 'Airtel Money Account',
      isBusinessAccount: false
    }
  };

  return await apiCall('/payment-methods', {
    method: 'POST',
    body: JSON.stringify(airtelData)
  });
}

/**
 * Example 4: Get All User Payment Methods
 */
export async function getAllPaymentMethods() {
  console.log('\n=== Getting All Payment Methods ===');
  
  return await apiCall('/payment-methods');
}

/**
 * Example 5: Get Payment Methods with Filters
 */
export async function getFilteredPaymentMethods() {
  console.log('\n=== Getting Filtered Payment Methods ===');
  
  // Get only verified card payment methods
  const filters = new URLSearchParams({
    type: 'card',
    is_verified: 'true',
    currency: 'RWF',
    page: '1',
    limit: '10'
  });

  return await apiCall(`/payment-methods?${filters}`);
}

/**
 * Example 6: Get Single Payment Method
 */
export async function getPaymentMethod(paymentMethodId: string) {
  console.log('\n=== Getting Single Payment Method ===');
  
  return await apiCall(`/payment-methods/${paymentMethodId}`);
}

/**
 * Example 7: Update Payment Method
 */
export async function updatePaymentMethod(paymentMethodId: string) {
  console.log('\n=== Updating Payment Method ===');
  
  const updateData = {
    expMonth: 1,
    expYear: 2026,
    metadata: {
      nickname: 'Updated Primary Card',
      lastUpdated: new Date().toISOString()
    }
  };

  return await apiCall(`/payment-methods/${paymentMethodId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData)
  });
}

/**
 * Example 8: Set Default Payment Method
 */
export async function setDefaultPaymentMethod(paymentMethodId: string) {
  console.log('\n=== Setting Default Payment Method ===');
  
  return await apiCall(`/payment-methods/${paymentMethodId}/set-default`, {
    method: 'POST'
  });
}

/**
 * Example 9: Verify Payment Method
 */
export async function verifyPaymentMethod(paymentMethodId: string) {
  console.log('\n=== Verifying Payment Method ===');
  
  return await apiCall(`/payment-methods/${paymentMethodId}/verify`, {
    method: 'POST'
  });
}

/**
 * Example 10: Delete Payment Method
 */
export async function deletePaymentMethod(paymentMethodId: string) {
  console.log('\n=== Deleting Payment Method ===');
  
  return await apiCall(`/payment-methods/${paymentMethodId}`, {
    method: 'DELETE'
  });
}

/**
 * Example 11: Get Payment Method Analytics
 */
export async function getPaymentMethodAnalytics() {
  console.log('\n=== Getting Payment Method Analytics ===');
  
  return await apiCall('/payment-methods/analytics');
}

// =====================================================
// VALIDATION EXAMPLES
// =====================================================

/**
 * Example 12: Validate Card Details
 */
export async function validateCardDetails() {
  console.log('\n=== Validating Card Details ===');
  
  const cardValidationData = {
    cardNumber: '4242424242424242',
    expMonth: 12,
    expYear: 2025,
    cvv: '123'
  };

  // Note: This endpoint doesn't require authentication
  return await apiCall('/payment-methods/validate/card', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No Authorization header needed
    },
    body: JSON.stringify(cardValidationData)
  });
}

/**
 * Example 13: Validate Mobile Money Details
 */
export async function validateMobileMoneyDetails() {
  console.log('\n=== Validating Mobile Money Details ===');
  
  const mobileMoneyValidationData = {
    phoneNumber: '+250781234567',
    provider: 'mtn_momo',
    countryCode: 'RW'
  };

  // Note: This endpoint doesn't require authentication
  return await apiCall('/payment-methods/validate/mobile-money', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
      // No Authorization header needed
    },
    body: JSON.stringify(mobileMoneyValidationData)
  });
}

// =====================================================
// BOOKING INTEGRATION EXAMPLES
// =====================================================

/**
 * Example 14: Set Payment Method for Booking
 */
export async function setBookingPaymentMethod(bookingId: string, paymentMethodId: string) {
  console.log('\n=== Setting Payment Method for Booking ===');
  
  const paymentMethodData = {
    paymentMethodId: paymentMethodId
  };

  return await apiCall(`/bookings/${bookingId}/payment-method`, {
    method: 'POST',
    body: JSON.stringify(paymentMethodData)
  });
}

/**
 * Example 15: Get Available Payment Methods for Booking
 */
export async function getBookingPaymentMethods(bookingId: string) {
  console.log('\n=== Getting Available Payment Methods for Booking ===');
  
  return await apiCall(`/bookings/${bookingId}/payment-methods`);
}

// =====================================================
// ERROR HANDLING EXAMPLES
// =====================================================

/**
 * Example 16: Handle Common Errors
 */
export async function demonstrateErrorHandling() {
  console.log('\n=== Demonstrating Error Handling ===');
  
  try {
    // Try to create an invalid payment method
    const invalidData = {
      type: 'card'
      // Missing required fields
    };

    await apiCall('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(invalidData)
    });
  } catch (error) {
    console.log('Expected validation error:', error);
  }

  try {
    // Try to access non-existent payment method
    await apiCall('/payment-methods/non-existent-id');
  } catch (error) {
    console.log('Expected not found error:', error);
  }

  try {
    // Try to access another user's payment method
    await apiCall('/payment-methods/other-user-payment-method-id');
  } catch (error) {
    console.log('Expected authorization error:', error);
  }
}

// =====================================================
// COMPREHENSIVE TESTING WORKFLOW
// =====================================================

/**
 * Example 17: Complete Payment Method Workflow
 */
export async function completePaymentMethodWorkflow() {
  console.log('\n=== Complete Payment Method Workflow ===');
  
  try {
    // Step 1: Create payment methods
    const cardResult = await createCreditCard();
    const mobileResult = await createMobileMoney();
    
    if (!cardResult.success || !mobileResult.success) {
      console.error('Failed to create payment methods');
      return;
    }

    const cardId = cardResult.data.id;
    const mobileId = mobileResult.data.id;

    // Step 2: Get all payment methods
    await getAllPaymentMethods();

    // Step 3: Verify payment methods
    await verifyPaymentMethod(cardId);
    await verifyPaymentMethod(mobileId);

    // Step 4: Set mobile money as default
    await setDefaultPaymentMethod(mobileId);

    // Step 5: Update card details
    await updatePaymentMethod(cardId);

    // Step 6: Get analytics
    await getPaymentMethodAnalytics();

    // Step 7: Test filtering
    await getFilteredPaymentMethods();

    // Step 8: Clean up - delete one payment method
    await deletePaymentMethod(cardId);

    console.log('\n✅ Complete workflow executed successfully!');

  } catch (error) {
    console.error('❌ Workflow failed:', error);
  }
}

// =====================================================
// BULK OPERATIONS EXAMPLE
// =====================================================

/**
 * Example 18: Bulk Payment Method Operations
 */
export async function bulkOperationsExample() {
  console.log('\n=== Bulk Operations Example ===');
  
  const paymentMethods = [
    {
      type: 'card',
      provider: 'visa',
      lastFour: '1234',
      cardBrand: 'visa',
      expMonth: 6,
      expYear: 2026,
      currency: 'USD'
    },
    {
      type: 'card',
      provider: 'mastercard',
      lastFour: '5678',
      cardBrand: 'mastercard',
      expMonth: 9,
      expYear: 2025,
      currency: 'EUR'
    },
    {
      type: 'mobile_money',
      provider: 'mtn_momo',
      phoneNumber: '+250788888888',
      currency: 'RWF'
    }
  ];

  const createdMethods: any[] = [];

  // Create multiple payment methods
  for (const method of paymentMethods) {
    try {
      const result = await apiCall('/payment-methods', {
        method: 'POST',
        body: JSON.stringify(method)
      });
      
      if (result.success) {
        createdMethods.push(result.data);
        console.log(`✅ Created ${method.type} payment method`);
      }
    } catch (error) {
      console.log(`❌ Failed to create ${method.type}:`, error);
    }
  }

  // Verify all created methods
  for (const method of createdMethods) {
    try {
      await verifyPaymentMethod(method.id);
      console.log(`✅ Verified payment method ${method.id}`);
    } catch (error) {
      console.log(`❌ Failed to verify ${method.id}:`, error);
    }
  }

  return createdMethods;
}

// =====================================================
// EXPORT ALL EXAMPLES
// =====================================================

export const PaymentMethodExamples = {
  // Core CRUD
  createCreditCard,
  createMobileMoney,
  createAirtelMoney,
  getAllPaymentMethods,
  getFilteredPaymentMethods,
  getPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  
  // Management
  setDefaultPaymentMethod,
  verifyPaymentMethod,
  getPaymentMethodAnalytics,
  
  // Validation
  validateCardDetails,
  validateMobileMoneyDetails,
  
  // Booking Integration
  setBookingPaymentMethod,
  getBookingPaymentMethods,
  
  // Workflows
  completePaymentMethodWorkflow,
  bulkOperationsExample,
  demonstrateErrorHandling
};

// =====================================================
// USAGE INSTRUCTIONS
// =====================================================

/*
To use these examples:

1. Update the BASE_URL and API_TOKEN constants
2. Import the functions you need:
   ```typescript
   import { PaymentMethodExamples } from './payment-methods-examples';
   ```

3. Run individual examples:
   ```typescript
   await PaymentMethodExamples.createCreditCard();
   await PaymentMethodExamples.getAllPaymentMethods();
   ```

4. Run complete workflow:
   ```typescript
   await PaymentMethodExamples.completePaymentMethodWorkflow();
   ```

5. Test error handling:
   ```typescript
   await PaymentMethodExamples.demonstrateErrorHandling();
   ```
*/
