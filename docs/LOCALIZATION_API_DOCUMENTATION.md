# Localization API Documentation

## Overview

The Localization API provides endpoints for managing country-specific business rules and currency exchange rates. This API enables the UrutiBiz platform to handle international operations with proper localization support.

## Base URL

```
/api/v1/localization
```

## Available Services

- **Country Business Rules**: `/api/v1/localization/country-business-rules`
- **Exchange Rates**: `/api/v1/localization/exchange-rates`

---

## Country Business Rules API

Manage country-specific business rules, fees, and configurations.

### Endpoints

#### Create Country Business Rules
**POST** `/country-business-rules`

Creates new business rules for a country.

**Request Body:**
```json
{
  "country_id": "uuid",
  "min_user_age": 18,
  "kyc_required": true,
  "max_booking_value": 1000000,
  "support_hours_start": "09:00",
  "support_hours_end": "17:00",
  "support_days": [1, 2, 3, 4, 5],
  "service_fee_percentage": 3.5,
  "payment_processing_fee": 2.9,
  "min_payout_amount": 5000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Country business rules created successfully",
  "data": {
    "id": "uuid",
    "country_id": "uuid",
    "min_user_age": 18,
    "kyc_required": true,
    "created_at": "2025-07-05T10:00:00Z"
  }
}
```

#### Get All Country Business Rules
**GET** `/country-business-rules`

Retrieves all country business rules with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "rows": [...],
    "totalCount": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

#### Get Country Business Rules by ID
**GET** `/country-business-rules/:id`

Retrieves specific business rules by ID.

#### Get Country Business Rules by Country
**GET** `/country-business-rules/country/:countryId`

Retrieves business rules for a specific country.

#### Update Country Business Rules
**PUT** `/country-business-rules/:id`

Updates existing business rules.

#### Delete Country Business Rules
**DELETE** `/country-business-rules/:id`

Deletes business rules.

### Utility Endpoints

#### Check KYC Requirement
**GET** `/country-business-rules/country/:countryId/kyc-required`

**Response:**
```json
{
  "success": true,
  "data": {
    "country_id": "uuid",
    "kyc_required": true
  }
}
```

#### Get Minimum User Age
**GET** `/country-business-rules/country/:countryId/min-age`

**Response:**
```json
{
  "success": true,
  "data": {
    "country_id": "uuid",
    "min_user_age": 18
  }
}
```

#### Calculate Fees
**POST** `/country-business-rules/country/:countryId/calculate-fees`

**Request Body:**
```json
{
  "amount": 100000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "country_id": "uuid",
    "amount": 100000,
    "service_fee": 3500,
    "processing_fee": 2900,
    "total_fees": 6400,
    "total_amount": 106400
  }
}
```

#### Check Support Availability
**GET** `/country-business-rules/country/:countryId/support-availability`

**Query Parameters:**
- `date` (optional): ISO date string (default: current time)

**Response:**
```json
{
  "success": true,
  "data": {
    "country_id": "uuid",
    "check_date": "2025-07-05T14:30:00Z",
    "support_available": true
  }
}
```

#### Validate Booking Amount
**POST** `/country-business-rules/country/:countryId/validate-amount`

**Request Body:**
```json
{
  "amount": 50000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "country_id": "uuid",
    "amount": 50000,
    "is_valid": true
  }
}
```

---

## Exchange Rates API

Manage currency exchange rates and perform currency conversions.

### Endpoints

#### Create Exchange Rate
**POST** `/exchange-rates`

Creates a new exchange rate.

**Request Body:**
```json
{
  "from_currency": "USD",
  "to_currency": "RWF",
  "rate": 1350.50,
  "rate_date": "2025-07-05",
  "source": "central_bank"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exchange rate created successfully",
  "data": {
    "id": "uuid",
    "from_currency": "USD",
    "to_currency": "RWF",
    "rate": 1350.50,
    "rate_date": "2025-07-05",
    "source": "central_bank",
    "created_at": "2025-07-05T10:00:00Z"
  }
}
```

#### Bulk Create Exchange Rates
**POST** `/exchange-rates/bulk`

Creates multiple exchange rates at once.

**Request Body:**
```json
{
  "rates": [
    {
      "from_currency": "USD",
      "to_currency": "RWF",
      "rate": 1350.50,
      "rate_date": "2025-07-05",
      "source": "central_bank"
    },
    {
      "from_currency": "EUR",
      "to_currency": "RWF",
      "rate": 1420.75,
      "rate_date": "2025-07-05",
      "source": "central_bank"
    }
  ]
}
```

#### Get All Exchange Rates
**GET** `/exchange-rates`

Retrieves exchange rates with filtering and pagination.

**Query Parameters:**
- `from_currency` (optional): Filter by source currency
- `to_currency` (optional): Filter by target currency
- `rate_date` (optional): Filter by specific date
- `source` (optional): Filter by rate source
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

#### Get Exchange Rate by ID
**GET** `/exchange-rates/:id`

Retrieves a specific exchange rate by ID.

#### Get Latest Exchange Rate
**GET** `/exchange-rates/latest/:fromCurrency/:toCurrency`

Gets the latest exchange rate for a currency pair.

**Example:** `/exchange-rates/latest/USD/RWF`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "from_currency": "USD",
    "to_currency": "RWF",
    "rate": 1350.50,
    "rate_date": "2025-07-05",
    "source": "central_bank"
  }
}
```

#### Get Historical Rates
**GET** `/exchange-rates/history/:fromCurrency/:toCurrency`

Gets historical rates for a currency pair.

**Query Parameters:**
- `days` (optional): Number of days of history (default: 30, max: 365)

**Example:** `/exchange-rates/history/USD/RWF?days=7`

#### Update Exchange Rate
**PUT** `/exchange-rates/:id`

Updates an existing exchange rate.

#### Delete Exchange Rate
**DELETE** `/exchange-rates/:id`

Deletes a specific exchange rate.

#### Delete Rates by Currency Pair
**DELETE** `/exchange-rates/pair/:fromCurrency/:toCurrency`

Deletes all rates for a specific currency pair.

### Utility Endpoints

#### Convert Currency
**POST** `/exchange-rates/convert`

Converts an amount from one currency to another.

**Request Body:**
```json
{
  "amount": 100,
  "from_currency": "USD",
  "to_currency": "RWF",
  "rate_date": "2025-07-05"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "convertedAmount": 135050.00,
    "rate": 1350.50,
    "rateDate": "2025-07-05"
  }
}
```

#### Get Available Currency Pairs
**GET** `/exchange-rates/currency-pairs`

Gets all available currency pairs.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "from_currency": "USD",
      "to_currency": "RWF"
    },
    {
      "from_currency": "EUR",
      "to_currency": "RWF"
    }
  ]
}
```

#### Upsert Exchange Rate
**PUT** `/exchange-rates/upsert`

Updates an existing rate or creates a new one if it doesn't exist.

**Request Body:**
```json
{
  "from_currency": "USD",
  "to_currency": "RWF",
  "rate": 1355.25,
  "rate_date": "2025-07-05",
  "source": "api_provider"
}
```

---

## Health Check

#### Service Health
**GET** `/localization/health`

Checks the health of localization services.

**Response:**
```json
{
  "success": true,
  "message": "Localization services are running",
  "services": {
    "country_business_rules": "active",
    "exchange_rates": "active"
  },
  "timestamp": "2025-07-05T10:00:00Z"
}
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation errors)
- `404` - Resource not found
- `500` - Internal server error

---

## Integration Examples

### E-commerce Checkout Flow

```javascript
// 1. Check business rules for country
const countryRules = await fetch('/api/v1/localization/country-business-rules/country/rwanda-id');

// 2. Validate booking amount
const validation = await fetch('/api/v1/localization/country-business-rules/country/rwanda-id/validate-amount', {
  method: 'POST',
  body: JSON.stringify({ amount: 100000 })
});

// 3. Calculate fees
const fees = await fetch('/api/v1/localization/country-business-rules/country/rwanda-id/calculate-fees', {
  method: 'POST',
  body: JSON.stringify({ amount: 100000 })
});

// 4. Convert currency if needed
const conversion = await fetch('/api/v1/localization/exchange-rates/convert', {
  method: 'POST',
  body: JSON.stringify({
    amount: 100000,
    from_currency: 'RWF',
    to_currency: 'USD'
  })
});
```

### Multi-Currency Price Display

```javascript
// Get latest rates for multiple currencies
const currencies = ['RWF', 'KES', 'UGX', 'TZS'];
const baseAmount = 100; // USD
const prices = [];

for (const currency of currencies) {
  const conversion = await fetch('/api/v1/localization/exchange-rates/convert', {
    method: 'POST',
    body: JSON.stringify({
      amount: baseAmount,
      from_currency: 'USD',
      to_currency: currency
    })
  });
  
  const result = await conversion.json();
  if (result.success) {
    prices.push({
      currency,
      amount: result.data.convertedAmount,
      rate: result.data.rate
    });
  }
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Standard endpoints**: 100 requests per minute
- **Conversion endpoints**: 500 requests per minute (higher limit for frequent use)
- **Bulk operations**: 10 requests per minute

---

## Authentication

All endpoints require authentication. Include the authorization header:

```
Authorization: Bearer <your-access-token>
```

---

## Support

For technical support and questions about the Localization API, please contact the development team or refer to the main API documentation.
