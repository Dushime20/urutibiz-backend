# UrutiBiz Backend API Documentation

## Overview
This document provides comprehensive documentation for the UrutiBiz Backend API, a robust country-specific CRUD system for managing various business entities. The API is built with Node.js, Express, TypeScript, and Sequelize ORM.

## Base Information
- **API Version**: 1.0.0
- **Base URL**: `/api/v1`
- **Local Development**: `http://localhost:3000/api/v1`
- **Documentation Standard**: OpenAPI 3.0.0
- **Response Format**: JSON
- **Database**: PostgreSQL with Sequelize ORM
- **Language**: TypeScript

## Authentication
The API supports multiple authentication methods:
- **Bearer Token (JWT)**: `Authorization: Bearer <token>`
- **API Key**: `X-API-Key: <api-key>`

## Quick Start
1. **Setup**: Clone repository and install dependencies
2. **Database**: Run migrations to set up database schema
3. **Environment**: Configure environment variables
4. **API Key**: Obtain authentication credentials
5. **Documentation**: Access Swagger docs at `/api-docs`

## Available Modules

### 1. Insurance Providers (`/insurance-providers`)
Complete CRUD system for managing insurance providers with advanced analytics and country-specific features.

#### Core Endpoints
- `GET /insurance-providers` - List providers with filtering & pagination
- `POST /insurance-providers` - Create new provider
- `GET /insurance-providers/{id}` - Get provider details
- `PUT /insurance-providers/{id}` - Update provider
- `DELETE /insurance-providers/{id}` - Delete provider

#### Advanced Features
- `GET /insurance-providers/search` - Advanced multi-criteria search
- `GET /insurance-providers/stats` - Analytics and statistics
- `GET /insurance-providers/live` - Active providers only
- `POST /insurance-providers/compare` - Side-by-side comparison
- `GET /insurance-providers/coverage-analysis` - Coverage gap analysis
- `POST /insurance-providers/bulk` - Bulk create/update/delete operations

#### Country & Category Specific
- `GET /insurance-providers/country/{countryId}` - Providers by country
- `GET /insurance-providers/category/{categoryId}` - Providers by category
- `GET /insurance-providers/market-analysis/{countryId}` - Market insights

### Data Model Features
- **Comprehensive Fields**: 30+ fields covering all aspects of insurance providers
- **Country-Specific**: Full country localization support
- **Validation**: Extensive data validation and constraints
- **Relationships**: Foreign key relationships with countries and categories
- **Indexing**: Optimized database queries with proper indexing
- **Audit Trail**: Created/updated timestamps for all records

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

## Core Features

### Pagination & Filtering
- **Pagination**: Page-based with configurable limits (max 100 per page)
- **Sorting**: Multi-field sorting with ascending/descending order
- **Filtering**: 15+ filter options including rating, premium range, coverage types
- **Search**: Full-text search across names and descriptions

### Analytics & Reporting
- **Statistics**: Provider counts, rating distributions, market analysis
- **Coverage Analysis**: Identify market gaps and opportunities
- **Market Analysis**: Country-specific market insights and trends
- **Comparison Tools**: Side-by-side provider comparisons

### Data Operations
- **Bulk Operations**: Efficient batch processing for large datasets
- **Import/Export**: CSV and JSON data exchange capabilities
- **Validation**: Real-time data validation with detailed error messages
- **Transactions**: ACID-compliant database operations

### Security & Performance
- **Rate Limiting**: Configurable rate limits per endpoint type
- **Input Sanitization**: SQL injection and XSS protection
- **Data Encryption**: Sensitive data encryption at rest
- **Caching**: Redis caching for improved performance
- **Monitoring**: Built-in logging and error tracking

## Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
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

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "validation_errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

## Common Query Parameters

### Pagination
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)

### Sorting
- `sort` (string): Sort field (name, rating, created_at, etc.)
- `order` (string): Sort order (asc, desc)

### Filtering
- `search` (string): Full-text search term
- `country_id` (string): Filter by country UUID
- `status` (string): Filter by status (active, inactive, pending)
- `min_rating` / `max_rating` (number): Rating range filter
- `min_premium` / `max_premium` (number): Premium range filter

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limits
- **Standard Operations**: 100 requests/15 minutes
- **Bulk Operations**: 10 requests/hour
- **Analytics**: 50 requests/hour
- **Authenticated Users**: Higher limits available

## Development Tools

### Database Migrations
```bash
# Run all migrations
npm run migrate

# Create new migration
npm run migrate:create -- migration-name

# Rollback migrations
npm run migrate:rollback
```

### API Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run demo script
node demo-insurance-providers-crud.js
```

### Documentation
```bash
# Generate Swagger docs
npm run docs:generate

# Serve documentation
npm run docs:serve
```

## Integration Examples

### JavaScript/Node.js
```javascript
const UrutiBizAPI = require('@urutibiz/api-client');
const client = new UrutiBizAPI({
  baseURL: 'https://api.urutibiz.com/api/v1',
  apiKey: 'your-api-key'
});

// List insurance providers
const providers = await client.insuranceProviders.list({
  page: 1,
  limit: 10,
  country_id: 'us-uuid'
});

// Create new provider
const newProvider = await client.insuranceProviders.create({
  name: 'New Insurance Co.',
  country_id: 'us-uuid',
  license_number: 'INS-2024-001',
  regulatory_compliance_status: 'compliant'
});
```

### Python
```python
import requests

class UrutiBizAPI:
    def __init__(self, api_key):
        self.base_url = 'https://api.urutibiz.com/api/v1'
        self.headers = {'X-API-Key': api_key}
    
    def list_providers(self, **params):
        response = requests.get(
            f'{self.base_url}/insurance-providers',
            headers=self.headers,
            params=params
        )
        return response.json()

# Usage
api = UrutiBizAPI('your-api-key')
providers = api.list_providers(page=1, limit=10)
```

### cURL
```bash
# List providers
curl -X GET "https://api.urutibiz.com/api/v1/insurance-providers?page=1&limit=10" \
  -H "X-API-Key: your-api-key"

# Create provider
curl -X POST "https://api.urutibiz.com/api/v1/insurance-providers" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Insurance Co.", "country_id": "us-uuid"}'
```

## Architecture Overview

### Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Caching**: Redis
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest
- **Validation**: Joi

### Project Structure
```
src/
├── controllers/     # Route handlers
├── models/          # Database models
├── services/        # Business logic
├── routes/          # API routes
├── types/           # TypeScript definitions
├── middleware/      # Custom middleware
├── utils/           # Utility functions
└── config/          # Configuration files

database/
├── migrations/      # Database migrations
└── seeders/         # Sample data

docs/
├── swagger.json     # Generated API docs
└── *.md            # Documentation files
```

## Performance Considerations

### Database Optimization
- **Indexes**: Proper indexing on frequently queried fields
- **Relationships**: Efficient foreign key relationships
- **Query Optimization**: Optimized Sequelize queries
- **Connection Pooling**: Database connection pooling

### Caching Strategy
- **API Responses**: Cache frequently accessed data
- **Database Queries**: Query result caching
- **Static Content**: CDN for documentation and assets
- **Session Data**: Redis for session management

### Scalability
- **Horizontal Scaling**: Stateless API design
- **Load Balancing**: Support for multiple instances
- **Database Sharding**: Country-based data partitioning
- **Microservices**: Modular architecture for easy scaling

## Monitoring & Logging

### Error Tracking
- **Structured Logging**: JSON-formatted logs
- **Error Monitoring**: Automatic error capture and alerting
- **Performance Metrics**: API response time tracking
- **Health Checks**: Endpoint health monitoring

### Analytics
- **Usage Statistics**: API endpoint usage tracking
- **Performance Monitoring**: Database query performance
- **Rate Limit Monitoring**: Track API usage patterns
- **Business Metrics**: Insurance provider analytics

## Future Roadmap

### Planned Features
1. **Additional Modules**: Banks, hospitals, schools, restaurants
2. **Real-time Features**: WebSocket support for live updates
3. **Mobile SDK**: Native mobile app integration
4. **Advanced Analytics**: Machine learning insights
5. **Multi-language**: Full internationalization support

### Integrations
1. **Payment Gateways**: Integration with payment providers
2. **External APIs**: Third-party data source integration
3. **CRM Systems**: Customer relationship management
4. **Notification Services**: Email, SMS, push notifications
5. **File Storage**: Cloud storage for documents and media

## Support & Resources

### Documentation
- **API Reference**: Complete endpoint documentation
- **Swagger UI**: Interactive API documentation at `/api-docs`
- **Code Examples**: Sample implementations and demos
- **Migration Guide**: Database setup and migration instructions

### Community
- **GitHub Repository**: Source code and issue tracking
- **Developer Forum**: Community discussions and support
- **Stack Overflow**: Tagged questions and answers
- **API Status Page**: Real-time API status and incidents

### Contact
- **Email**: api-support@urutibiz.com
- **Documentation**: Available at `/api-docs`
- **GitHub Issues**: Bug reports and feature requests
- **Developer Portal**: Comprehensive developer resources

## License
This API is released under the MIT License. See LICENSE file for details.
