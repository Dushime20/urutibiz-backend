# Payment Methods Implementation Guide

## Overview

The Payment Methods feature provides comprehensive management of user payment methods including credit/debit cards, mobile money, and bank transfers. This implementation includes secure storage, validation, verification, and integration with the booking system.

## Architecture

### Components

1. **Database Migration**: `20250705_create_payment_methods_table.ts`
2. **TypeScript Types**: `src/types/paymentMethod.types.ts`
3. **Repository Layer**: `src/repositories/PaymentMethodRepository.ts` (in-memory)
4. **Service Layer**: `src/services/PaymentMethodService.ts`
5. **Controller Layer**: `src/controllers/paymentMethod.controller.ts`
6. **Routes**: `src/routes/paymentMethod.routes.ts`
7. **Booking Integration**: Enhanced `src/controllers/bookings.controller.ts`

### Database Schema

```sql
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'card', 'mobile_money', 'bank_transfer'
    provider VARCHAR(50), -- 'stripe', 'mtn_momo', 'airtel_money', etc.
    
    -- Card details (encrypted/tokenized)
    last_four VARCHAR(4),
    card_brand VARCHAR(20),
    exp_month INTEGER,
    exp_year INTEGER,
    
    -- Mobile money details
    phone_number VARCHAR(20),
    
    -- Tokenization
    provider_token VARCHAR(255),
    payment_provider_id UUID REFERENCES payment_providers(id),
    
    is_default BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    currency VARCHAR(3) DEFAULT 'RWF',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

## Features

### Core Features

1. **CRUD Operations**
   - Create payment methods
   - Read payment methods (filtered)
   - Update payment method details
   - Delete payment methods

2. **Security Features**
   - User authorization checks
   - Payment method ownership validation
   - Encrypted token storage
   - Input validation

3. **Payment Method Types**
   - **Cards**: Visa, MasterCard, AMEX, etc.
   - **Mobile Money**: MTN MoMo, Airtel Money
   - **Bank Transfer**: Direct bank transfers

4. **Management Features**
   - Set default payment method
   - Verify payment methods
   - Analytics and reporting
   - Expiration tracking

### Advanced Features

1. **Validation**
   - Card number validation (Luhn algorithm)
   - Expiry date validation
   - Phone number format validation
   - Provider-specific validation

2. **Analytics**
   - Payment method usage statistics
   - Verification rates
   - Method distribution by type/provider
   - Recent activity tracking

3. **Integration**
   - Booking system integration
   - Payment provider system integration
   - User management integration

## API Endpoints

### Base URL: `/api/v1/payment-methods`

#### Core Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Create payment method | Yes |
| GET | `/` | Get user's payment methods | Yes |
| GET | `/:id` | Get payment method by ID | Yes |
| PUT | `/:id` | Update payment method | Yes |
| DELETE | `/:id` | Delete payment method | Yes |

#### Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/:id/set-default` | Set as default | Yes |
| POST | `/:id/verify` | Verify payment method | Yes |
| GET | `/analytics` | Get analytics | Yes |

#### Validation Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/validate/card` | Validate card details | No |
| POST | `/validate/mobile-money` | Validate mobile money | No |

#### Booking Integration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings/:id/payment-method` | Set payment method for booking | Yes |
| GET | `/bookings/:id/payment-methods` | Get available payment methods | Yes |

## Usage Examples

### 1. Create a Credit Card Payment Method

```javascript
// POST /api/v1/payment-methods
const response = await fetch('/api/v1/payment-methods', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'card',
    provider: 'visa',
    lastFour: '4242',
    cardBrand: 'visa',
    expMonth: 12,
    expYear: 2025,
    providerToken: 'tok_visa_4242',
    isDefault: true,
    currency: 'RWF',
    metadata: {
      nickname: 'Primary Card'
    }
  })
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "data": {
//     "id": "uuid",
//     "type": "card",
//     "provider": "visa",
//     "lastFour": "4242",
//     "cardBrand": "visa",
//     "isDefault": true,
//     "isVerified": false,
//     "currency": "RWF",
//     "createdAt": "2025-07-05T..."
//   },
//   "message": "Payment method created successfully"
// }
```

### 2. Create a Mobile Money Payment Method

```javascript
// POST /api/v1/payment-methods
const response = await fetch('/api/v1/payment-methods', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'mobile_money',
    provider: 'mtn_momo',
    phoneNumber: '+250781234567',
    providerToken: 'mtn_token_123',
    currency: 'RWF',
    metadata: {
      nickname: 'MTN Mobile Money'
    }
  })
});
```

### 3. Get User's Payment Methods

```javascript
// GET /api/v1/payment-methods?type=card&is_verified=true
const response = await fetch('/api/v1/payment-methods?type=card&is_verified=true', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "data": [
//     {
//       "id": "uuid",
//       "type": "card",
//       "provider": "visa",
//       "lastFour": "4242",
//       "isDefault": true,
//       "isVerified": true
//     }
//   ]
// }
```

### 4. Set Default Payment Method

```javascript
// POST /api/v1/payment-methods/:id/set-default
const response = await fetch(`/api/v1/payment-methods/${paymentMethodId}/set-default`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

### 5. Validate Card Details

```javascript
// POST /api/v1/payment-methods/validate/card
const response = await fetch('/api/v1/payment-methods/validate/card', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cardNumber: '4242424242424242',
    expMonth: 12,
    expYear: 2025,
    cvv: '123'
  })
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "data": {
//     "isValid": true
//   }
// }
```

### 6. Set Payment Method for Booking

```javascript
// POST /api/v1/bookings/:id/payment-method
const response = await fetch(`/api/v1/bookings/${bookingId}/payment-method`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    paymentMethodId: 'payment-method-uuid'
  })
});
```

### 7. Get Analytics

```javascript
// GET /api/v1/payment-methods/analytics
const response = await fetch('/api/v1/payment-methods/analytics', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "data": {
//     "totalMethods": 3,
//     "methodsByType": {
//       "card": 2,
//       "mobile_money": 1
//     },
//     "methodsByProvider": {
//       "visa": 1,
//       "mtn_momo": 1
//     },
//     "verificationRate": 66.67,
//     "defaultMethodsCount": 1,
//     "recentlyAdded": [...]
//   }
// }
```

## Integration with Bookings

### Enhanced Booking Flow

1. **User selects payment method** during booking creation
2. **System validates** payment method ownership and verification
3. **Booking is created** with payment method reference
4. **Payment processing** uses the selected method

### New Booking Controller Methods

1. `setBookingPaymentMethod()` - Attach payment method to booking
2. `getBookingPaymentMethods()` - Get available payment methods for booking

## Security Considerations

### Data Protection

1. **Tokenization**: Sensitive payment data is tokenized
2. **Encryption**: Provider tokens are encrypted
3. **Access Control**: Users can only access their own payment methods
4. **Validation**: Comprehensive input validation

### Best Practices

1. **Never store full card numbers** - Only last 4 digits
2. **Use provider tokens** for actual payment processing
3. **Verify payment methods** before allowing use
4. **Implement rate limiting** for sensitive operations

## Error Handling

### Common Error Scenarios

1. **Unauthorized Access**: 401/403 responses
2. **Validation Errors**: 400 with detailed messages
3. **Not Found**: 404 for non-existent resources
4. **Server Errors**: 500 with generic messages

### Example Error Responses

```javascript
// Validation Error
{
  "success": false,
  "message": "Card details are required for card payment methods"
}

// Authorization Error
{
  "success": false,
  "message": "Access denied"
}

// Not Found Error
{
  "success": false,
  "message": "Payment method not found"
}
```

## Future Enhancements

### Short Term

1. **Persistent Database Storage** - Replace in-memory repository
2. **Real Payment Provider Integration** - Stripe, PayPal, etc.
3. **Enhanced Validation** - Real-time provider validation
4. **Audit Logging** - Track all payment method operations

### Long Term

1. **Machine Learning** - Fraud detection and risk scoring
2. **Multi-Currency Support** - Advanced currency handling
3. **Recurring Payments** - Subscription management
4. **Advanced Analytics** - Payment method performance metrics

## Testing

### Test Scenarios

1. **Unit Tests** - Service and repository methods
2. **Integration Tests** - Controller endpoints
3. **Security Tests** - Authorization and validation
4. **Performance Tests** - Load testing for high usage

### Sample Test Data

The migration includes sample payment methods for testing:
- Visa card (verified, default)
- MTN Mobile Money (verified)
- MasterCard (unverified)
- Airtel Money (verified, default)

## Deployment Notes

1. **Run migration** to create payment_methods table
2. **Ensure UUID extension** is enabled in PostgreSQL
3. **Configure environment variables** for payment providers
4. **Set up monitoring** for payment operations
5. **Implement backup strategy** for payment data

This implementation provides a solid foundation for payment method management with room for expansion as the platform grows.
