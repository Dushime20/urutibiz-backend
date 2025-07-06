# Insurance Providers API Reference

## Overview
The Insurance Providers API provides comprehensive CRUD operations and advanced features for managing insurance providers. This module supports country-specific operations, advanced filtering, analytics, and bulk operations.

## Base URL
```
/api/v1/insurance-providers
```

## Authentication
All endpoints require authentication via:
- **Bearer Token**: `Authorization: Bearer <jwt-token>`
- **API Key**: `X-API-Key: <api-key>`

---

## Endpoints

### 1. List Insurance Providers
**GET** `/insurance-providers`

Get a paginated list of insurance providers with optional filtering and sorting.

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | integer | Page number | 1 |
| `limit` | integer | Items per page (max: 100) | 20 |
| `sort` | string | Sort field (name, rating, created_at, etc.) | name |
| `order` | string | Sort order (asc, desc) | asc |
| `search` | string | Search term for name/description | - |
| `country_id` | string | Filter by country UUID | - |
| `category` | string | Filter by insurance category | - |
| `status` | string | Filter by status (active, inactive, pending) | - |
| `min_rating` | number | Minimum rating (1-5) | - |
| `max_rating` | number | Maximum rating (1-5) | - |
| `min_premium` | number | Minimum premium amount | - |
| `max_premium` | number | Maximum premium amount | - |
| `coverage_type` | string | Filter by coverage type | - |
| `service_area` | string | Filter by service area | - |
| `language` | string | Filter by supported language | - |
| `established_after` | date | Filter by establishment year | - |
| `has_mobile_app` | boolean | Filter providers with mobile apps | - |
| `financial_rating` | string | Filter by financial strength rating | - |

#### Response Example
```json
{
  "success": true,
  "message": "Insurance providers retrieved successfully",
  "data": [
    {
      "id": "uuid-here",
      "name": "SafeGuard Insurance Co.",
      "description": "Leading provider of comprehensive insurance solutions",
      "website_url": "https://safeguard.com",
      "phone_number": "+1-555-0123",
      "email": "contact@safeguard.com",
      "country_id": "country-uuid",
      "license_number": "INS-2024-001",
      "license_expiry_date": "2025-12-31",
      "rating": 4.5,
      "premium_range_min": 500,
      "premium_range_max": 5000,
      "coverage_types": ["auto", "home", "life"],
      "service_areas": ["urban", "suburban"],
      "languages_supported": ["en", "es"],
      "digital_services": ["online_quotes", "mobile_app"],
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

---

### 2. Create Insurance Provider
**POST** `/insurance-providers`

Create a new insurance provider.

#### Request Body
```json
{
  "name": "New Insurance Co.",
  "description": "Comprehensive insurance solutions",
  "website_url": "https://newinsurance.com",
  "phone_number": "+1-555-0456",
  "email": "info@newinsurance.com",
  "country_id": "country-uuid",
  "license_number": "INS-2024-002",
  "license_expiry_date": "2025-12-31",
  "rating": 4.0,
  "premium_range_min": 300,
  "premium_range_max": 3000,
  "coverage_types": ["auto", "health"],
  "service_areas": ["urban"],
  "languages_supported": ["en"],
  "digital_services": ["online_quotes"],
  "regulatory_compliance_status": "compliant"
}
```

#### Response
```json
{
  "success": true,
  "message": "Insurance provider created successfully",
  "data": {
    "id": "new-uuid-here",
    // ... full provider object
  }
}
```

---

### 3. Get Insurance Provider by ID
**GET** `/insurance-providers/{id}`

Retrieve a specific insurance provider by its UUID.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Insurance provider UUID |

#### Response
```json
{
  "success": true,
  "message": "Insurance provider retrieved successfully",
  "data": {
    // ... full provider object
  }
}
```

---

### 4. Update Insurance Provider
**PUT** `/insurance-providers/{id}`

Update an existing insurance provider.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Insurance provider UUID |

#### Request Body
```json
{
  "name": "Updated Insurance Co.",
  "rating": 4.8,
  "premium_range_max": 6000,
  // ... other fields to update
}
```

#### Response
```json
{
  "success": true,
  "message": "Insurance provider updated successfully",
  "data": {
    // ... updated provider object
  }
}
```

---

### 5. Delete Insurance Provider
**DELETE** `/insurance-providers/{id}`

Delete an insurance provider.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Insurance provider UUID |

#### Response
```json
{
  "success": true,
  "message": "Insurance provider deleted successfully"
}
```

---

### 6. Advanced Search
**GET** `/insurance-providers/search`

Perform advanced search with multiple criteria.

#### Query Parameters
All parameters from the list endpoint plus:
| Parameter | Type | Description |
|-----------|------|-------------|
| `keywords` | string | Comma-separated keywords | - |
| `exclude_ids` | string | Comma-separated UUIDs to exclude | - |
| `include_inactive` | boolean | Include inactive providers | false |

---

### 7. Get Statistics
**GET** `/insurance-providers/stats`

Get analytics and statistics about insurance providers.

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `country_id` | string | Filter by country | - |
| `category` | string | Filter by category | - |
| `date_from` | date | Start date for analytics | - |
| `date_to` | date | End date for analytics | - |

#### Response
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "total_providers": 150,
    "active_providers": 142,
    "inactive_providers": 8,
    "average_rating": 4.2,
    "rating_distribution": {
      "1": 2,
      "2": 5,
      "3": 15,
      "4": 68,
      "5": 52
    },
    "coverage_type_distribution": {
      "auto": 89,
      "home": 76,
      "life": 45,
      "health": 67
    },
    "country_distribution": {
      "US": 89,
      "CA": 32,
      "MX": 21
    },
    "premium_range_stats": {
      "min": 100,
      "max": 10000,
      "average": 2500,
      "median": 2000
    }
  }
}
```

---

### 8. Get Live Providers
**GET** `/insurance-providers/live`

Get only active/live insurance providers.

#### Query Parameters
Same as list endpoint but automatically filters for `status: active` and `is_active: true`.

---

### 9. Compare Providers
**POST** `/insurance-providers/compare`

Compare multiple insurance providers side by side.

#### Request Body
```json
{
  "provider_ids": ["uuid1", "uuid2", "uuid3"],
  "comparison_criteria": ["rating", "premium_range", "coverage_types", "digital_services"]
}
```

#### Response
```json
{
  "success": true,
  "message": "Provider comparison completed",
  "data": {
    "providers": [
      {
        "id": "uuid1",
        "name": "Provider 1",
        "rating": 4.5,
        "premium_range": "500-5000",
        "coverage_types": ["auto", "home"],
        "digital_services": ["mobile_app", "online_quotes"]
      },
      // ... other providers
    ],
    "comparison_summary": {
      "highest_rated": "uuid1",
      "most_affordable": "uuid2",
      "most_coverage_types": "uuid3",
      "most_digital_services": "uuid1"
    }
  }
}
```

---

### 10. Coverage Analysis
**GET** `/insurance-providers/coverage-analysis`

Analyze coverage availability by various criteria.

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `country_id` | string | Country to analyze |
| `coverage_type` | string | Specific coverage type |
| `service_area` | string | Service area to analyze |

#### Response
```json
{
  "success": true,
  "message": "Coverage analysis completed",
  "data": {
    "total_providers": 89,
    "coverage_gaps": ["rural areas", "high-risk zones"],
    "market_saturation": "medium",
    "competition_level": "high",
    "coverage_by_area": {
      "urban": 89,
      "suburban": 67,
      "rural": 23
    },
    "recommendations": [
      "Expand rural coverage",
      "Focus on digital services"
    ]
  }
}
```

---

### 11. Bulk Operations
**POST** `/insurance-providers/bulk`

Perform bulk create, update, or delete operations.

#### Request Body
```json
{
  "operation": "create", // or "update" or "delete"
  "data": [
    {
      "name": "Bulk Provider 1",
      "country_id": "country-uuid",
      "license_number": "BULK-001",
      "regulatory_compliance_status": "compliant"
    },
    // ... more providers
  ]
}
```

For update operations:
```json
{
  "operation": "update",
  "data": [
    {
      "id": "existing-uuid",
      "rating": 4.8,
      "premium_range_max": 6000
    },
    // ... more updates
  ]
}
```

For delete operations:
```json
{
  "operation": "delete",
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

#### Response
```json
{
  "success": true,
  "message": "Bulk operation completed",
  "data": {
    "processed": 5,
    "successful": 4,
    "failed": 1,
    "errors": [
      {
        "index": 2,
        "error": "Validation error: license_number already exists"
      }
    ],
    "created_ids": ["new-uuid1", "new-uuid2"], // for create operations
    "updated_ids": ["existing-uuid1"], // for update operations
    "deleted_ids": ["deleted-uuid1"] // for delete operations
  }
}
```

---

### 12. Get Providers by Country
**GET** `/insurance-providers/country/{countryId}`

Get all insurance providers for a specific country.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `countryId` | string | Country UUID |

#### Query Parameters
Same filtering and pagination options as the main list endpoint.

---

### 13. Get Providers by Category
**GET** `/insurance-providers/category/{categoryId}`

Get insurance providers filtered by category.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | Category identifier |

---

### 14. Market Analysis by Country
**GET** `/insurance-providers/market-analysis/{countryId}`

Get detailed market analysis for insurance providers in a specific country.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `countryId` | string | Country UUID |

#### Response
```json
{
  "success": true,
  "message": "Market analysis completed",
  "data": {
    "country_id": "country-uuid",
    "total_providers": 89,
    "market_leaders": [
      {
        "id": "uuid1",
        "name": "Leader 1",
        "market_share": 25.5,
        "rating": 4.8
      }
    ],
    "market_trends": {
      "growth_rate": 5.2,
      "digital_adoption": 78,
      "customer_satisfaction": 4.1
    },
    "competitive_landscape": {
      "concentration_ratio": 0.65,
      "barriers_to_entry": "medium",
      "innovation_level": "high"
    },
    "recommendations": [
      "Focus on digital transformation",
      "Improve customer service"
    ]
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "validation_errors": {
    "name": ["Name is required"],
    "license_number": ["License number must be unique"]
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Insurance provider not found",
  "error": "No provider found with ID: uuid-here"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

---

## Rate Limits
- **Standard endpoints**: 100 requests per 15 minutes
- **Bulk operations**: 10 requests per hour
- **Analytics endpoints**: 50 requests per hour

## Best Practices

1. **Pagination**: Always use pagination for list endpoints
2. **Filtering**: Use specific filters to reduce response size
3. **Caching**: Cache frequently accessed data on client side
4. **Error Handling**: Always check the `success` field in responses
5. **Bulk Operations**: Use bulk endpoints for multiple operations
6. **Rate Limiting**: Implement exponential backoff for rate limit errors

## Example Usage

### JavaScript/Node.js
```javascript
// Get all providers with pagination
const response = await fetch('/api/v1/insurance-providers?page=1&limit=10', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Create a new provider
const newProvider = await fetch('/api/v1/insurance-providers', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'New Insurance Co.',
    country_id: 'country-uuid',
    license_number: 'INS-2024-003',
    regulatory_compliance_status: 'compliant'
  })
});
```

### cURL
```bash
# List providers
curl -X GET "https://api.urutibiz.com/api/v1/insurance-providers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create provider
curl -X POST "https://api.urutibiz.com/api/v1/insurance-providers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Insurance Co.",
    "country_id": "country-uuid",
    "license_number": "INS-2024-003",
    "regulatory_compliance_status": "compliant"
  }'
```
