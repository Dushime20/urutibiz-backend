# Localization Services Usage Guide

This document provides examples and usage guidelines for all localization services in the UrutiBiz backend.

## Services Overview

The localization services handle various aspects of internationalization and country-specific configurations:

- **TranslationsService**: Dynamic content translations
- **TaxRatesService**: Tax calculations by country/category
- **DeliveryProvidersService**: Delivery provider management and cost calculations
- **CountryBusinessRulesService**: Country-specific business rules and configurations
- **ExchangeRatesService**: Currency exchange rates and conversions

## Service Imports

```typescript
// Import individual services
import { TranslationsService } from './src/services/localization/TranslationsService';
import { CountryBusinessRulesService } from './src/services/localization/CountryBusinessRulesService';
import { ExchangeRatesService } from './src/services/localization/ExchangeRatesService';

// Or import all at once
import {
  TranslationsService,
  TaxRatesService,
  DeliveryProvidersService,
  CountryBusinessRulesService,
  ExchangeRatesService
} from './src/services/localization';
```

## Country Business Rules Service Examples

### Creating Business Rules for a Country

```typescript
const createRules = async () => {
  const result = await CountryBusinessRulesService.createCountryBusinessRules({
    country_id: 'uuid-rwanda-id',
    min_user_age: 18,
    kyc_required: true,
    max_booking_value: 1000000, // 1M RWF
    support_hours_start: '08:00',
    support_hours_end: '18:00',
    support_days: [1, 2, 3, 4, 5], // Monday to Friday
    service_fee_percentage: 3.5,
    payment_processing_fee: 2.9,
    min_payout_amount: 5000 // 5K RWF
  });

  if (result.success) {
    console.log('Business rules created:', result.data);
  }
};
```

### Getting Business Rules and Calculations

```typescript
const businessOperations = async () => {
  // Get rules by country
  const rules = await CountryBusinessRulesService.getCountryBusinessRulesByCountryId('uuid-rwanda-id');
  
  // Check if KYC is required
  const kycRequired = await CountryBusinessRulesService.isKycRequiredForCountry('uuid-rwanda-id');
  
  // Calculate fees
  const serviceFee = await CountryBusinessRulesService.calculateServiceFee('uuid-rwanda-id', 100000);
  const processingFee = await CountryBusinessRulesService.calculatePaymentProcessingFee('uuid-rwanda-id', 100000);
  
  // Check support availability
  const supportAvailable = await CountryBusinessRulesService.isSupportAvailable('uuid-rwanda-id');
  
  // Validate booking amount
  const isValidAmount = await CountryBusinessRulesService.isBookingAmountValid('uuid-rwanda-id', 50000);
  
  console.log({
    kycRequired,
    serviceFee,
    processingFee,
    supportAvailable,
    isValidAmount
  });
};
```

## Exchange Rates Service Examples

### Creating Exchange Rates

```typescript
const createExchangeRates = async () => {
  // Single rate
  const result = await ExchangeRatesService.createExchangeRate({
    from_currency: 'USD',
    to_currency: 'RWF',
    rate: 1350.50,
    rate_date: new Date(),
    source: 'central_bank'
  });

  // Bulk create rates
  const bulkResult = await ExchangeRatesService.bulkCreateExchangeRates([
    {
      from_currency: 'USD',
      to_currency: 'RWF',
      rate: 1350.50,
      rate_date: new Date(),
      source: 'central_bank'
    },
    {
      from_currency: 'EUR',
      to_currency: 'RWF',
      rate: 1420.75,
      rate_date: new Date(),
      source: 'central_bank'
    }
  ]);
};
```

### Currency Conversion and Rate Management

```typescript
const currencyOperations = async () => {
  // Convert currency
  const conversion = await ExchangeRatesService.convertCurrency(100, 'USD', 'RWF');
  if (conversion.success) {
    console.log(`100 USD = ${conversion.data.convertedAmount} RWF at rate ${conversion.data.rate}`);
  }

  // Get latest rate
  const latestRate = await ExchangeRatesService.getLatestExchangeRate('USD', 'RWF');
  
  // Get historical rates (last 30 days)
  const historicalRates = await ExchangeRatesService.getHistoricalRates('USD', 'RWF', 30);
  
  // Get all available currency pairs
  const currencyPairs = await ExchangeRatesService.getAvailableCurrencyPairs();
  
  // Upsert rate (update if exists, create if not)
  const upsertResult = await ExchangeRatesService.upsertExchangeRate({
    from_currency: 'USD',
    to_currency: 'RWF',
    rate: 1355.25,
    rate_date: new Date(),
    source: 'api_provider'
  });
};
```

### Advanced Exchange Rate Queries

```typescript
const advancedQueries = async () => {
  // Get rates with filters
  const ratesResult = await ExchangeRatesService.getExchangeRates({
    from_currency: 'USD',
    source: 'central_bank',
    page: 1,
    limit: 20
  });

  if (ratesResult.success) {
    const { rows, totalCount, page, totalPages } = ratesResult.data;
    console.log(`Found ${totalCount} rates, page ${page} of ${totalPages}`);
    
    rows.forEach(rate => {
      console.log(`${rate.from_currency} to ${rate.to_currency}: ${rate.rate} (${rate.rate_date})`);
    });
  }
};
```

## Integration Examples

### E-commerce Checkout Flow

```typescript
const checkoutFlow = async (countryId: string, amount: number, currency: string) => {
  try {
    // 1. Check business rules
    const isValidAmount = await CountryBusinessRulesService.isBookingAmountValid(countryId, amount);
    if (!isValidAmount) {
      throw new Error('Booking amount exceeds country limits');
    }

    // 2. Calculate fees
    const serviceFee = await CountryBusinessRulesService.calculateServiceFee(countryId, amount);
    const processingFee = await CountryBusinessRulesService.calculatePaymentProcessingFee(countryId, amount);
    
    // 3. Convert currency if needed
    let totalAmount = amount + serviceFee + processingFee;
    if (currency !== 'USD') {
      const conversion = await ExchangeRatesService.convertCurrency(totalAmount, currency, 'USD');
      if (conversion.success) {
        totalAmount = conversion.data.convertedAmount;
      }
    }

    // 4. Check support availability
    const supportAvailable = await CountryBusinessRulesService.isSupportAvailable(countryId);

    return {
      originalAmount: amount,
      serviceFee,
      processingFee,
      totalAmount,
      supportAvailable,
      currency: 'USD'
    };

  } catch (error) {
    console.error('Checkout flow error:', error);
    throw error;
  }
};
```

### Multi-Currency Price Display

```typescript
const displayPricesInMultipleCurrencies = async (baseAmount: number, baseCurrency: string, targetCurrencies: string[]) => {
  const prices = [];
  
  for (const targetCurrency of targetCurrencies) {
    if (baseCurrency === targetCurrency) {
      prices.push({
        currency: targetCurrency,
        amount: baseAmount,
        rate: 1
      });
    } else {
      const conversion = await ExchangeRatesService.convertCurrency(baseAmount, baseCurrency, targetCurrency);
      if (conversion.success) {
        prices.push({
          currency: targetCurrency,
          amount: conversion.data.convertedAmount,
          rate: conversion.data.rate
        });
      }
    }
  }
  
  return prices;
};

// Usage
const prices = await displayPricesInMultipleCurrencies(100, 'USD', ['RWF', 'KES', 'UGX', 'TZS']);
console.log(prices);
// Output: [
//   { currency: 'RWF', amount: 135050, rate: 1350.50 },
//   { currency: 'KES', amount: 13500, rate: 135.00 },
//   // ...
// ]
```

## Error Handling Best Practices

All services return a standardized response format:

```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}
```

Always check the `success` field before accessing `data`:

```typescript
const handleServiceResponse = async () => {
  const result = await CountryBusinessRulesService.getCountryBusinessRulesByCountryId('invalid-id');
  
  if (result.success) {
    // Safe to access result.data
    console.log('Rules found:', result.data);
  } else {
    // Handle error
    console.error('Error:', result.error);
  }
};
```

## Performance Considerations

1. **Caching**: Consider caching frequently accessed data like exchange rates and business rules
2. **Batch Operations**: Use bulk operations when creating multiple records
3. **Pagination**: Always use pagination for large datasets
4. **Indexing**: Ensure database indexes are properly set up for query performance

## Security Notes

1. **Input Validation**: All services validate input data
2. **SQL Injection**: Services use parameterized queries
3. **Rate Limiting**: Consider implementing rate limiting for API endpoints
4. **Access Control**: Implement proper authorization before calling service methods

## Testing

Each service should be thoroughly tested. Example test structure:

```typescript
describe('CountryBusinessRulesService', () => {
  describe('createCountryBusinessRules', () => {
    it('should create business rules with valid data', async () => {
      // Test implementation
    });
    
    it('should reject duplicate country rules', async () => {
      // Test implementation
    });
  });
  
  describe('utility methods', () => {
    it('should calculate service fees correctly', async () => {
      // Test implementation
    });
  });
});
```
