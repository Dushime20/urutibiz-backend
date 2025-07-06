# Insurance Providers API Documentation

## Overview

The Insurance Providers API provides comprehensive management of country-specific insurance providers with advanced features for market analysis, provider comparison, and coverage gap analysis.

## Base URL
```
/api/v1/insurance-providers
```

## Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Core Endpoints

### 1. Create Insurance Provider
**POST** `/`

Create a new insurance provider.

**Request Body:**
```json
{
  "country_id": "11111111-1111-1111-1111-111111111111",
  "provider_name": "Acme Insurance Co",
  "display_name": "Acme Insurance",
  "logo_url": "https://acme.com/logo.png",
  "contact_info": {
    "phone": "+1-800-ACME-INS",
    "email": "support@acme.com",
    "website": "https://acme.com",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    }
  },
  "supported_categories": ["22222222-2222-2222-2222-222222222222"],
  "api_endpoint": "https://api.acme.com/v1",
  "api_credentials": {
    "client_id": "acme_client_id",
    "api_key": "encrypted_api_key"
  },
  "provider_type": "TRADITIONAL",
  "license_number": "NY-INS-2023-001",
  "rating": 4.5,
  "coverage_types": ["LIABILITY", "COMPREHENSIVE", "COLLISION"],
  "min_coverage_amount": 25000.00,
  "max_coverage_amount": 1000000.00,
  "deductible_options": [250, 500, 1000, 2500],
  "processing_time_days": 3,
  "languages_supported": ["en", "es"],
  "commission_rate": 0.0850,
  "integration_status": "LIVE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Insurance provider created successfully",
  "data": {
    "id": "33333333-3333-3333-3333-333333333333",
    "country_id": "11111111-1111-1111-1111-111111111111",
    "provider_name": "Acme Insurance Co",
    "display_name": "Acme Insurance",
    "logo_url": "https://acme.com/logo.png",
    "contact_info": { ... },
    "supported_categories": ["22222222-2222-2222-2222-222222222222"],
    "api_endpoint": "https://api.acme.com/v1",
    "api_credentials": { ... },
    "is_active": true,
    "provider_type": "TRADITIONAL",
    "license_number": "NY-INS-2023-001",
    "rating": 4.5,
    "coverage_types": ["LIABILITY", "COMPREHENSIVE", "COLLISION"],
    "min_coverage_amount": 25000.00,
    "max_coverage_amount": 1000000.00,
    "deductible_options": [250, 500, 1000, 2500],
    "processing_time_days": 3,
    "languages_supported": ["en", "es"],
    "commission_rate": 0.0850,
    "integration_status": "LIVE",
    "created_at": "2025-07-05T12:00:00Z",
    "updated_at": "2025-07-05T12:00:00Z"
  }
}
```

### 2. Get Insurance Provider
**GET** `/:id`

Retrieve an insurance provider by ID.

**Query Parameters:**
- `include_inactive` (boolean) - Include inactive providers
- `include_credentials` (boolean) - Include API credentials
- `include_stats` (boolean) - Include provider statistics

**Example:**
```
GET /insurance-providers/33333333-3333-3333-3333-333333333333?include_credentials=true
```

### 3. Advanced Search
**GET** `/search`

Search insurance providers with advanced filters.

**Query Parameters:**
- `country_id` (string) - Filter by country
- `provider_name` (string) - Search by provider name
- `provider_type` (enum) - TRADITIONAL, DIGITAL, PEER_TO_PEER, GOVERNMENT, MUTUAL
- `is_active` (boolean) - Filter by active status
- `integration_status` (enum) - NOT_INTEGRATED, TESTING, LIVE, DEPRECATED
- `min_rating` (number) - Minimum rating (0-5)
- `max_rating` (number) - Maximum rating (0-5)
- `supports_category` (string) - Must support specific category
- `coverage_type` (string) - Must offer specific coverage type
- `language` (string) - Must support specific language
- `min_coverage` (number) - Minimum coverage amount
- `max_coverage` (number) - Maximum coverage amount
- `max_processing_days` (number) - Maximum processing time
- `search` (string) - Text search across name, display name, license
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `sort_by` (string) - Sort field (default: provider_name)
- `sort_order` (string) - ASC or DESC (default: ASC)

**Example:**
```
GET /insurance-providers/search?country_id=11111111-1111-1111-1111-111111111111&provider_type=DIGITAL&min_rating=4.0&integration_status=LIVE
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "33333333-3333-3333-3333-333333333333",
      "provider_name": "Digital Insurance Co",
      "rating": 4.5,
      "provider_type": "DIGITAL",
      "integration_status": "LIVE",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  },
  "filters_applied": {
    "country_id": "11111111-1111-1111-1111-111111111111",
    "provider_type": "DIGITAL",
    "min_rating": 4.0,
    "integration_status": "LIVE"
  }
}
```

### 4. Provider Statistics
**GET** `/stats`

Get comprehensive provider statistics.

**Query Parameters:**
- `country_id` (string) - Filter stats by country

**Response:**
```json
{
  "success": true,
  "data": {
    "total_providers": 25,
    "active_providers": 22,
    "by_type": {
      "TRADITIONAL": 15,
      "DIGITAL": 7,
      "PEER_TO_PEER": 2,
      "GOVERNMENT": 1,
      "MUTUAL": 0
    },
    "by_integration_status": {
      "NOT_INTEGRATED": 5,
      "TESTING": 8,
      "LIVE": 12,
      "DEPRECATED": 0
    },
    "by_country": {
      "11111111-1111-1111-1111-111111111111": 8,
      "22222222-2222-2222-2222-222222222222": 6,
      "33333333-3333-3333-3333-333333333333": 11
    },
    "average_rating": 4.2,
    "average_processing_time": 4.5,
    "coverage_distribution": {
      "LIABILITY": 20,
      "COMPREHENSIVE": 18,
      "COLLISION": 15,
      "THEFT": 12
    },
    "language_distribution": {
      "en": 25,
      "es": 12,
      "fr": 8,
      "de": 6
    }
  }
}
```

### 5. Provider Comparison
**GET** `/compare`

Compare providers for a specific category and coverage amount.

**Query Parameters:**
- `category_id` (string, required) - Category to compare for
- `coverage_amount` (number) - Required coverage amount
- `country_id` (string) - Filter by country

**Example:**
```
GET /insurance-providers/compare?category_id=22222222-2222-2222-2222-222222222222&coverage_amount=50000&country_id=11111111-1111-1111-1111-111111111111
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "provider_id": "33333333-3333-3333-3333-333333333333",
      "provider_name": "Acme Insurance",
      "rating": 4.5,
      "coverage_types": ["LIABILITY", "COMPREHENSIVE", "COLLISION"],
      "min_coverage": 25000,
      "max_coverage": 1000000,
      "processing_time": 3,
      "commission_rate": 0.0850,
      "supported_languages": ["en", "es"],
      "api_available": true,
      "integration_status": "LIVE"
    },
    {
      "provider_id": "44444444-4444-4444-4444-444444444444",
      "provider_name": "Quick Insurance",
      "rating": 4.2,
      "coverage_types": ["LIABILITY", "THEFT"],
      "min_coverage": 10000,
      "max_coverage": 500000,
      "processing_time": 1,
      "commission_rate": 0.1200,
      "supported_languages": ["en"],
      "api_available": true,
      "integration_status": "LIVE"
    }
  ],
  "filters": {
    "category_id": "22222222-2222-2222-2222-222222222222",
    "coverage_amount": 50000,
    "country_id": "11111111-1111-1111-1111-111111111111"
  }
}
```

### 6. Coverage Analysis
**GET** `/coverage-analysis`

Analyze coverage gaps and recommendations for a category and country.

**Query Parameters:**
- `category_id` (string, required) - Category to analyze
- `country_id` (string, required) - Country to analyze

**Response:**
```json
{
  "success": true,
  "data": {
    "category_id": "22222222-2222-2222-2222-222222222222",
    "country_id": "11111111-1111-1111-1111-111111111111",
    "available_providers": [
      {
        "provider_id": "33333333-3333-3333-3333-333333333333",
        "provider_name": "Acme Insurance",
        "rating": 4.5,
        "coverage_types": ["LIABILITY", "COMPREHENSIVE"],
        "min_coverage": 25000,
        "max_coverage": 1000000,
        "processing_time": 3,
        "commission_rate": 0.0850,
        "supported_languages": ["en", "es"],
        "api_available": true,
        "integration_status": "LIVE"
      }
    ],
    "coverage_gaps": ["PERSONAL_INJURY", "ROADSIDE_ASSISTANCE"],
    "recommended_providers": [
      {
        "provider_id": "33333333-3333-3333-3333-333333333333",
        "provider_name": "Acme Insurance",
        "rating": 4.5,
        ...
      }
    ],
    "average_coverage_amount": 537500,
    "processing_time_range": {
      "min": 1,
      "max": 7,
      "average": 3.2
    }
  }
}
```

### 7. Market Analysis
**GET** `/market-analysis/:countryId`

Get comprehensive market analysis for a country.

**Response:**
```json
{
  "success": true,
  "data": {
    "country_id": "11111111-1111-1111-1111-111111111111",
    "total_providers": 8,
    "market_share": [
      {
        "provider_id": "33333333-3333-3333-3333-333333333333",
        "provider_name": "Acme Insurance",
        "market_share_percentage": 25.5,
        "supported_categories_count": 5
      },
      {
        "provider_id": "44444444-4444-4444-4444-444444444444",
        "provider_name": "Quick Insurance",
        "market_share_percentage": 18.3,
        "supported_categories_count": 3
      }
    ],
    "coverage_gaps": [
      {
        "category_id": "55555555-5555-5555-5555-555555555555",
        "coverage_types": ["SPECIALIZED_EQUIPMENT", "ENVIRONMENTAL"]
      }
    ],
    "competitive_landscape": {
      "price_range": {
        "min_coverage": 10000,
        "max_coverage": 2000000
      },
      "rating_distribution": {
        "4": 3,
        "5": 2
      },
      "integration_readiness": 75.0
    }
  }
}
```

### 8. Bulk Operations
**POST** `/bulk`

Create multiple insurance providers in a single request.

**Request Body:**
```json
{
  "providers": [
    {
      "country_id": "11111111-1111-1111-1111-111111111111",
      "provider_name": "Bulk Provider 1",
      "provider_type": "TRADITIONAL",
      ...
    },
    {
      "country_id": "22222222-2222-2222-2222-222222222222",
      "provider_name": "Bulk Provider 2",
      "provider_type": "DIGITAL",
      ...
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Processed 2 providers, 0 failed",
  "data": {
    "processed": 2,
    "failed": 0,
    "errors": [],
    "created_providers": [
      {
        "id": "55555555-5555-5555-5555-555555555555",
        "provider_name": "Bulk Provider 1",
        ...
      },
      {
        "id": "66666666-6666-6666-6666-666666666666",
        "provider_name": "Bulk Provider 2",
        ...
      }
    ]
  }
}
```

## Specialized Endpoints

### Get Live Providers
**GET** `/live`

Get providers with live API integration.

**Query Parameters:**
- `country_id` (string) - Filter by country
- `include_credentials` (boolean) - Include API credentials

### Get Providers by Country
**GET** `/country/:countryId`

Get all providers operating in a specific country.

### Get Providers by Category
**GET** `/category/:categoryId`

Get providers that support a specific category.

**Query Parameters:**
- `country_id` (string) - Filter by country
- `include_inactive` (boolean) - Include inactive providers

## Data Models

### Provider Types
- `TRADITIONAL` - Traditional insurance companies
- `DIGITAL` - Digital-first insurance providers  
- `PEER_TO_PEER` - Peer-to-peer insurance platforms
- `GOVERNMENT` - Government-backed insurance
- `MUTUAL` - Mutual insurance companies

### Integration Status
- `NOT_INTEGRATED` - No API integration
- `TESTING` - Integration in testing phase
- `LIVE` - Live API integration
- `DEPRECATED` - Deprecated integration

### Coverage Types
- `LIABILITY` - Liability coverage
- `COMPREHENSIVE` - Comprehensive coverage
- `COLLISION` - Collision coverage
- `PERSONAL_INJURY` - Personal injury protection
- `THEFT` - Theft protection
- `DAMAGE` - Property damage
- `AUTO` - Auto insurance
- `MOTOR` - Motor vehicle insurance
- `HOME` - Home insurance
- `CONTENTS` - Contents insurance

## Error Handling

### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "validation_errors": {
    "provider_name": ["Provider name is required"],
    "country_id": ["Invalid country ID format"]
  }
}
```

### Business Logic Errors
```json
{
  "success": false,
  "message": "Provider with this name already exists in the country",
  "error": "DUPLICATE_PROVIDER_NAME"
}
```

## Rate Limits

- Standard CRUD operations: 100 requests/minute
- Search operations: 60 requests/minute  
- Analysis operations: 30 requests/minute
- Bulk operations: 10 requests/minute

## Best Practices

1. **Search Optimization**: Use specific filters to reduce response size
2. **Pagination**: Always use pagination for list endpoints
3. **Caching**: Cache provider data when possible
4. **Error Handling**: Always check the `success` field in responses
5. **Rate Limiting**: Implement exponential backoff for rate limit errors

## Examples

### Complete Provider Creation Example
```javascript
const providerData = {
  country_id: "11111111-1111-1111-1111-111111111111",
  provider_name: "Global Insurance Corp",
  display_name: "Global Insurance",
  logo_url: "https://global-ins.com/logo.png",
  contact_info: {
    phone: "+1-800-GLOBAL",
    email: "support@global-ins.com",
    website: "https://global-ins.com",
    address: {
      street: "456 Corporate Blvd",
      city: "Chicago",
      state: "IL",
      zip: "60601",
      country: "USA"
    },
    support_hours: {
      monday: "9:00-17:00",
      tuesday: "9:00-17:00",
      wednesday: "9:00-17:00",
      thursday: "9:00-17:00",
      friday: "9:00-17:00",
      saturday: "10:00-14:00",
      sunday: "Closed"
    }
  },
  supported_categories: [
    "22222222-2222-2222-2222-222222222222", // Vehicles
    "33333333-3333-3333-3333-333333333333"  // Electronics
  ],
  api_endpoint: "https://api.global-ins.com/v2",
  api_credentials: {
    client_id: "global_client_123",
    client_secret: "encrypted_secret_456",
    api_version: "v2",
    sandbox_mode: false,
    rate_limit: 1000,
    timeout_ms: 30000
  },
  provider_type: "TRADITIONAL",
  license_number: "IL-INS-2023-789",
  rating: 4.3,
  coverage_types: [
    "LIABILITY",
    "COMPREHENSIVE", 
    "COLLISION",
    "PERSONAL_INJURY"
  ],
  min_coverage_amount: 50000.00,
  max_coverage_amount: 2000000.00,
  deductible_options: [500, 1000, 2500, 5000],
  processing_time_days: 2,
  languages_supported: ["en", "es", "fr"],
  commission_rate: 0.0775,
  integration_status: "LIVE"
};

const response = await fetch('/api/v1/insurance-providers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(providerData)
});

const result = await response.json();
console.log('Created provider:', result.data);
```

### Advanced Search Example
```javascript
const searchParams = new URLSearchParams({
  country_id: "11111111-1111-1111-1111-111111111111",
  provider_type: "DIGITAL",
  min_rating: "4.0",
  integration_status: "LIVE",
  supports_category: "22222222-2222-2222-2222-222222222222",
  language: "en",
  max_processing_days: "3",
  sort_by: "rating",
  sort_order: "DESC",
  page: "1",
  limit: "10"
});

const response = await fetch(`/api/v1/insurance-providers/search?${searchParams}`, {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log('Found providers:', result.data);
console.log('Pagination:', result.pagination);
```

---

**Last Updated**: July 5, 2025  
**API Version**: 1.0.0
