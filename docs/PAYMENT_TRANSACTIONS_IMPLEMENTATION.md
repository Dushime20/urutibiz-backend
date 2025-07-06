# Payment Transactions Implementation

## Overview

This document describes the comprehensive implementation of payment transactions in the UrutiBiz backend system. The payment transactions module handles all aspects of payment processing, including booking payments, security deposits, refunds, platform fees, and analytics.

## Architecture

### Database Layer
- **Migration**: `database/migrations/20250705_create_payment_transactions_table.ts`
- **Table**: `payment_transactions` with comprehensive schema including multi-currency support, provider integration, and audit fields
- **Enums**: `payment_status` enum for transaction statuses
- **Views**: `transaction_summaries` view for analytics

### Application Layer
- **Types**: `src/types/paymentTransaction.types.ts`
- **Repository**: `src/repositories/PaymentTransactionRepository.ts` (in-memory implementation)
- **Service**: `src/services/PaymentTransactionService.ts`
- **Controller**: `src/controllers/paymentTransaction.controller.ts`
- **Routes**: `src/routes/paymentTransaction.routes.ts`

## Features

### Core Functionality
1. **Transaction Management**
   - Create, read, update, and delete payment transactions
   - Support for multiple transaction types (booking payments, deposits, refunds, fees)
   - Multi-currency support with exchange rate tracking
   - Provider integration (Stripe, MTN MoMo, Airtel Money, etc.)

2. **Payment Processing**
   - Process payments with external providers
   - Handle payment callbacks and status updates
   - Automatic retry mechanisms for failed payments
   - Support for 3D Secure and other authentication methods

3. **Refund Management**
   - Full and partial refunds
   - Automated refund processing
   - Refund tracking and reconciliation
   - Multi-step approval workflows

4. **Analytics and Reporting**
   - Transaction summaries by user
   - Statistical breakdowns by status, provider, currency
   - Monthly trends and patterns
   - Revenue analytics and fee tracking

### Advanced Features
1. **Multi-Currency Support**
   - Automatic currency conversion
   - Exchange rate tracking and historical data
   - Support for multiple currencies (RWF, USD, EUR, etc.)

2. **Provider Integration**
   - Abstracted provider interface
   - Support for multiple payment providers
   - Provider-specific fee calculations
   - Webhook handling for real-time updates

3. **Security and Compliance**
   - Encrypted sensitive data
   - Audit trails for all transactions
   - Compliance with financial regulations
   - PCI DSS considerations

4. **Error Handling and Resilience**
   - Comprehensive error handling
   - Transaction state management
   - Failure recovery mechanisms
   - Detailed error logging and monitoring

## API Endpoints

### Base URL: `/api/v1/payment-transactions`

#### CRUD Operations
- `POST /` - Create new transaction
- `GET /` - List transactions (with filters and pagination)
- `GET /:id` - Get transaction by ID
- `PUT /:id` - Update transaction
- `DELETE /:id` - Delete transaction (soft delete)

#### Specialized Queries
- `GET /user/:userId` - Get user's transactions
- `GET /booking/:bookingId` - Get booking's transactions
- `GET /user/:userId/summary` - Get user's transaction summary

#### Payment Processing
- `POST /process` - Process a payment
- `POST /:id/refund` - Process a refund
- `PATCH /:id/status` - Update transaction status

#### Analytics
- `GET /stats` - Get transaction statistics

#### Utility
- `GET /health` - Health check

## Database Schema

### payment_transactions Table

```sql
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    payment_method_id UUID REFERENCES payment_methods(id),
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'RWF',
    
    -- External provider details
    provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    provider_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Status and processing
    status payment_status DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Multi-currency support
    original_currency VARCHAR(3),
    original_amount DECIMAL(12,2),
    exchange_rate DECIMAL(10,6),
    exchange_rate_date DATE,
    
    -- Additional data and error handling
    metadata JSONB,
    failure_reason TEXT,
    provider_response TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);
```

### Enums

```sql
CREATE TYPE payment_status AS ENUM (
    'pending', 
    'processing', 
    'completed', 
    'failed', 
    'refunded', 
    'partially_refunded', 
    'cancelled'
);
```

### Views

```sql
CREATE VIEW transaction_summaries AS
SELECT 
  user_id,
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed_amount,
  SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed_amount,
  MAX(created_at) as last_transaction_date,
  COUNT(DISTINCT provider) as unique_providers_used
FROM payment_transactions
GROUP BY user_id;
```

## Transaction Types

1. **booking_payment** - Payment for equipment rental
2. **security_deposit** - Refundable security deposit
3. **refund** - Full refund of previous payment
4. **partial_refund** - Partial refund of previous payment
5. **platform_fee** - UrutiBiz service fee
6. **insurance_payment** - Insurance premium payment
7. **delivery_fee** - Equipment delivery charges

## Payment Providers

1. **stripe** - Credit card processing
2. **mtn_momo** - MTN Mobile Money
3. **airtel_money** - Airtel Money
4. **visa** - Visa Direct
5. **mastercard** - Mastercard Send
6. **paypal** - PayPal
7. **bank** - Direct bank transfer
8. **internal** - Internal platform transactions

## Transaction Status Flow

```
pending → processing → completed
pending → processing → failed
completed → refunded
completed → partially_refunded
pending → cancelled
failed → pending (retry)
```

## Usage Examples

### Creating a Transaction

```typescript
const transaction = await paymentTransactionService.createTransaction({
  userId: 'user_123',
  bookingId: 'booking_456',
  paymentMethodId: 'pm_789',
  transactionType: 'booking_payment',
  amount: 25000.00,
  currency: 'RWF',
  provider: 'mtn_momo',
  metadata: {
    booking_reference: 'BK123456',
    payment_description: 'Equipment rental payment'
  }
});
```

### Processing a Payment

```typescript
const result = await paymentTransactionService.processPayment({
  userId: 'user_123',
  paymentMethodId: 'pm_789',
  amount: 25000.00,
  transactionType: 'booking_payment',
  metadata: {
    booking_id: 'booking_456'
  }
});
```

### Processing a Refund

```typescript
const refund = await paymentTransactionService.processRefund({
  transactionId: 'txn_123',
  amount: 15000.00, // Partial refund
  reason: 'Equipment returned early',
  metadata: {
    days_used: 3,
    days_paid: 5
  }
});
```

### Getting Transaction Statistics

```typescript
const stats = await paymentTransactionService.getTransactionStats({
  status: 'completed',
  createdAfter: new Date('2025-01-01'),
  provider: 'mtn_momo'
});
```

## Error Handling

The system includes comprehensive error handling:

### Error Types
- `PaymentTransactionError` - General transaction errors
- `PaymentProviderError` - Provider-specific errors

### Error Codes
- `INVALID_ID` - Invalid transaction ID
- `TRANSACTION_NOT_FOUND` - Transaction not found
- `VALIDATION_ERROR` - Invalid input data
- `INVALID_STATUS_TRANSITION` - Invalid status change
- `PROCESSING_ERROR` - Payment processing failed
- `REFUND_ERROR` - Refund processing failed

## Security Considerations

1. **Data Encryption**
   - Sensitive data encrypted at rest
   - PCI DSS compliance for card data
   - Secure token storage

2. **Access Control**
   - Role-based access control
   - User permission validation
   - Admin-only operations

3. **Audit Trail**
   - Complete transaction history
   - User action logging
   - Change tracking

4. **Rate Limiting**
   - API rate limiting
   - Transaction frequency limits
   - Fraud detection

## Monitoring and Alerting

1. **Health Checks**
   - Service health monitoring
   - Database connectivity
   - Provider availability

2. **Metrics**
   - Transaction success rates
   - Processing times
   - Error rates

3. **Alerts**
   - Failed transaction alerts
   - High error rate notifications
   - Provider downtime alerts

## Integration with Booking System

The payment transactions system is integrated with the booking system:

1. **Booking Creation** - Automatic payment transaction creation
2. **Payment Processing** - Link transactions to booking status
3. **Refund Handling** - Automatic refund processing on cancellation
4. **Audit Trail** - Complete payment history for each booking

### Updated Booking Types

```typescript
interface BookingData {
  // ... existing fields ...
  paymentMethodId?: string;
  paymentTransactionId?: string;
  depositTransactionId?: string;
  refundTransactionId?: string;
}
```

## Testing

Comprehensive testing examples are provided in:
- `examples/payment-transactions-api-usage.ts`

Test scenarios include:
- Transaction creation and management
- Payment processing workflows
- Refund handling
- Error conditions
- Analytics and reporting

## Future Enhancements

1. **Persistent Storage**
   - Replace in-memory repository with database implementation
   - Connection pooling and optimization

2. **Advanced Analytics**
   - Real-time dashboards
   - Predictive analytics
   - Revenue forecasting

3. **Additional Providers**
   - More payment providers
   - Cryptocurrency support
   - Bank-to-bank transfers

4. **Automation**
   - Automated reconciliation
   - Smart retry mechanisms
   - Fraud detection algorithms

## Deployment Considerations

1. **Environment Configuration**
   - Provider API keys
   - Database connection strings
   - Encryption keys

2. **Scaling**
   - Database sharding
   - Read replicas
   - Caching strategies

3. **Backup and Recovery**
   - Transaction data backup
   - Disaster recovery procedures
   - Point-in-time recovery

## Compliance

1. **Financial Regulations**
   - Local payment regulations
   - International compliance
   - Reporting requirements

2. **Data Protection**
   - GDPR compliance
   - Data retention policies
   - Right to erasure

## Conclusion

The payment transactions implementation provides a robust, scalable, and secure foundation for handling all payment-related operations in the UrutiBiz platform. The modular architecture ensures easy maintenance and extensibility, while comprehensive error handling and monitoring ensure reliable operation in production environments.
