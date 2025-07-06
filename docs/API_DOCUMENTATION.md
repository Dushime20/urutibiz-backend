# UrutiBiz Backend API Documentation

## Overview

The UrutiBiz Backend API provides comprehensive country-specific CRUD systems for managing rental platform operations. This includes administrative divisions, verification documents, payment providers, product pricing, category regulations, and insurance providers.

## API Information

- **Base URL**: `http://localhost:3000/api/v1` (development)
- **Version**: 1.0.0
- **Documentation**: Available at `/api-docs` when server is running
- **Swagger JSON**: Available at `/api-docs.json`

## Authentication

The API uses JWT bearer tokens for authentication:

```
Authorization: Bearer <your-jwt-token>
```

## Core Modules

### 🏛️ Administrative Divisions
Manage country-specific administrative divisions (states, provinces, counties, etc.)

**Base URL**: `/administrative-divisions`

Key endpoints:
- `GET /` - List all divisions with filtering
- `POST /` - Create new division
- `GET /:id` - Get division by ID
- `PUT /:id` - Update division
- `DELETE /:id` - Delete division
- `GET /country/:countryId` - Get divisions by country
- `GET /hierarchy/:countryId` - Get division hierarchy
- `GET /stats` - Get division statistics

### 📄 Verification Document Types
Manage country-specific verification document requirements

**Base URL**: `/verification-document-types`

Key endpoints:
- `GET /` - List all document types
- `POST /` - Create new document type
- `GET /:id` - Get document type by ID
- `PUT /:id` - Update document type
- `DELETE /:id` - Delete document type
- `GET /country/:countryId` - Get document types by country
- `GET /category/:categoryId` - Get document types by category

### 💳 Payment Providers
Manage country-specific payment provider integrations

**Base URL**: `/payment-providers`

Key endpoints:
- `GET /` - List all payment providers
- `POST /` - Create new payment provider
- `GET /:id` - Get payment provider by ID
- `PUT /:id` - Update payment provider
- `DELETE /:id` - Delete payment provider
- `GET /country/:countryId` - Get providers by country
- `GET /active` - Get active providers only
- `GET /stats` - Get provider statistics

### 💰 Product Prices
Manage country and category-specific product pricing

**Base URL**: `/product-prices`

Key endpoints:
- `GET /` - List all product prices
- `POST /` - Create new price entry
- `GET /:id` - Get price by ID
- `PUT /:id` - Update price
- `DELETE /:id` - Delete price
- `GET /product/:productId` - Get prices for product
- `GET /compare` - Compare prices across countries
- `GET /stats` - Get pricing statistics
- `POST /bulk` - Bulk price operations

### 📋 Category Regulations
Manage country-specific category regulations and compliance

**Base URL**: `/category-regulations`

Key endpoints:
- `GET /` - List all regulations
- `POST /` - Create new regulation
- `GET /:id` - Get regulation by ID
- `PUT /:id` - Update regulation
- `DELETE /:id` - Delete regulation
- `GET /category/:categoryId` - Get regulations by category
- `GET /country/:countryId` - Get regulations by country
- `GET /compliance-check` - Check compliance
- `GET /stats` - Get regulation statistics

### 🛡️ Insurance Providers
Manage country-specific insurance provider integrations and analysis

**Base URL**: `/insurance-providers`

Key endpoints:
- `GET /` - List all insurance providers
- `POST /` - Create new insurance provider
- `GET /:id` - Get provider by ID
- `PUT /:id` - Update provider
- `DELETE /:id` - Delete provider
- `GET /search` - Advanced search with filters
- `GET /country/:countryId` - Get providers by country
- `GET /category/:categoryId` - Get providers by category
- `GET /live` - Get live providers with API integration
- `GET /stats` - Get provider statistics
- `GET /compare` - Compare providers for category
- `GET /coverage-analysis` - Analyze coverage gaps
- `GET /market-analysis/:countryId` - Market analysis
- `POST /bulk` - Bulk provider operations

## Advanced Features

### Search and Filtering
All modules support advanced search and filtering:

```
GET /endpoint?search=term&country_id=uuid&page=1&limit=20&sort_by=name&sort_order=ASC
```

### Pagination
Standardized pagination across all endpoints:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

### Bulk Operations
Support for bulk create/update operations:

```json
{
  "items": [
    { "field1": "value1" },
    { "field2": "value2" }
  ]
}
```

### Statistics and Analytics
Comprehensive statistics endpoints for business intelligence:

- Provider distribution by type/status
- Market analysis and competitive landscape
- Coverage gap analysis
- Performance metrics

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "validation_errors": {
    "field": ["Field-specific errors"]
  }
}
```

## Data Models

### Country-Specific Fields
Most entities include country-specific fields:

- `country_id` - UUID reference to country
- `is_active` - Boolean flag for active status
- `created_at` / `updated_at` - Timestamps
- `deleted_at` - Soft delete timestamp

### Insurance Provider Model
Comprehensive insurance provider with:

- Basic info (name, logo, contact)
- Provider type (Traditional, Digital, P2P, Government, Mutual)
- Integration status (Not Integrated, Testing, Live, Deprecated)
- Coverage details (types, amounts, deductibles)
- Performance metrics (rating, processing time)
- API integration (endpoints, credentials)

### Category Regulation Model
Detailed regulation framework:

- Basic regulations (allowed, license requirements, age limits)
- Insurance requirements (mandatory, coverage amounts)
- Advanced features (seasonal restrictions, documentation)
- Compliance levels and scoring

## Demo Scripts

Demo scripts are available for testing all modules:

- `demo-administrative-divisions-crud.js`
- `demo-verification-document-types-crud.js`
- `demo-payment-providers-crud.js`
- `demo-product-prices-crud.js`
- `demo-category-regulations-crud.js`
- `demo-insurance-providers-crud.js`

Run with: `node demo-[module]-crud.js`

## Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- Standard endpoints: 100 requests/minute
- Search endpoints: 60 requests/minute
- Bulk operations: 10 requests/minute

## Development

### Running Locally
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Generating Documentation
```bash
npm run docs:generate
```

## Support

For API support and questions:
- Email: api-support@urutibiz.com
- Documentation: `/api-docs` endpoint
- GitHub: [Repository URL]

---

**Last Updated**: July 5, 2025
**API Version**: 1.0.0
