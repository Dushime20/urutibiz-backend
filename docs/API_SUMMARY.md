# UrutiBiz Backend API Summary

## Overview
The UrutiBiz Backend API is a comprehensive RESTful API that provides country-specific CRUD systems for various business entities. The API is built with Node.js, Express, TypeScript, and Sequelize ORM.

## API Information
- **Version**: 1.0.0
- **Base URL**: `/api/v1`
- **Local Development**: `http://localhost:3000/api/v1`
- **Documentation Format**: OpenAPI 3.0.0

## Authentication
The API supports multiple authentication methods:
- **Bearer Token (JWT)**: `Authorization: Bearer <token>`
- **API Key**: `X-API-Key: <api-key>`

## Available Modules

### 1. Insurance Providers (`/insurance-providers`)
Complete CRUD system for managing insurance providers with advanced features:

#### Basic CRUD Operations
- `GET /insurance-providers` - List all insurance providers (with pagination and filtering)
- `POST /insurance-providers` - Create a new insurance provider
- `GET /insurance-providers/{id}` - Get insurance provider by ID
- `PUT /insurance-providers/{id}` - Update insurance provider
- `DELETE /insurance-providers/{id}` - Delete insurance provider

#### Advanced Operations
- `GET /insurance-providers/search` - Advanced search with multiple filters
- `GET /insurance-providers/stats` - Get statistics and analytics
- `GET /insurance-providers/live` - Get live/active providers only
- `POST /insurance-providers/compare` - Compare multiple providers
- `GET /insurance-providers/coverage-analysis` - Analyze coverage by criteria
- `POST /insurance-providers/bulk` - Bulk operations (create/update/delete)

#### Country & Category Specific
- `GET /insurance-providers/country/{countryId}` - Get providers by country
- `GET /insurance-providers/category/{categoryId}` - Get providers by category
- `GET /insurance-providers/market-analysis/{countryId}` - Market analysis for country

### Features Included:
- **Pagination**: All list endpoints support pagination with `page`, `limit` parameters
- **Filtering**: Advanced filtering by country, category, status, rating, premium range
- **Sorting**: Sort by name, rating, premium, created date, etc.
- **Search**: Full-text search across provider names and descriptions
- **Analytics**: Statistics, market analysis, coverage analysis
- **Bulk Operations**: Create, update, or delete multiple records at once
- **Data Validation**: Comprehensive input validation and error handling
- **Rate Limiting**: Built-in rate limiting for API protection
- **Security**: Input sanitization and SQL injection prevention

## Data Models

### Insurance Provider
```typescript
interface InsuranceProvider {
  id: string;                    // UUID primary key
  name: string;                  // Provider name (required)
  description?: string;          // Provider description
  website_url?: string;          // Official website
  phone_number?: string;         // Contact phone
  email?: string;                // Contact email
  country_id: string;           // Country UUID (required)
  license_number: string;       // License number (required)
  license_expiry_date?: Date;   // License expiry
  rating?: number;              // Rating (1-5)
  premium_range_min?: number;   // Minimum premium
  premium_range_max?: number;   // Maximum premium
  coverage_types: string[];     // Array of coverage types
  service_areas: string[];      // Service areas
  languages_supported: string[]; // Supported languages
  digital_services: string[];   // Digital services offered
  customer_support_hours?: string; // Support hours
  claims_process_time?: string; // Claims processing time
  financial_strength_rating?: string; // Financial rating
  regulatory_compliance_status: string; // Compliance status
  market_share_percentage?: number; // Market share
  established_year?: number;    // Year established
  employee_count?: number;      // Number of employees
  annual_revenue?: number;      // Annual revenue
  customer_satisfaction_score?: number; // Satisfaction score
  digital_transformation_level?: string; // Digital maturity
  sustainability_initiatives?: string[]; // Sustainability efforts
  partnerships?: string[];      // Business partnerships
  awards_certifications?: string[]; // Awards and certifications
  risk_assessment_tools?: string[]; // Risk assessment capabilities
  policy_customization_options?: string[]; // Customization options
  mobile_app_features?: string[]; // Mobile app features
  social_media_presence?: object; // Social media links
  regulatory_history?: object;  // Regulatory compliance history
  is_active: boolean;           // Active status
  metadata?: object;            // Additional metadata
  created_at: Date;             // Creation timestamp
  updated_at: Date;             // Update timestamp
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "pagination": { /* pagination info for list endpoints */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information",
  "validation_errors": { /* field-specific validation errors */ }
}
```

### Pagination Info
```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "total_pages": 5,
  "has_next": true,
  "has_prev": false
}
```

## Query Parameters

### Common Parameters
- `page` (integer): Page number for pagination (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `sort` (string): Sort field (e.g., 'name', 'rating', 'created_at')
- `order` (string): Sort order ('asc' or 'desc', default: 'asc')
- `search` (string): Search term for full-text search

### Insurance Provider Specific Filters
- `country_id` (string): Filter by country UUID
- `category` (string): Filter by insurance category
- `status` (string): Filter by status ('active', 'inactive', 'pending')
- `min_rating` (number): Minimum rating filter
- `max_rating` (number): Maximum rating filter
- `min_premium` (number): Minimum premium filter
- `max_premium` (number): Maximum premium filter
- `coverage_type` (string): Filter by coverage type
- `service_area` (string): Filter by service area
- `language` (string): Filter by supported language
- `established_after` (date): Filter by establishment year
- `has_mobile_app` (boolean): Filter providers with mobile apps
- `financial_rating` (string): Filter by financial strength rating

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting
- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user
- **Bulk Operations**: 10 requests per hour per user

## Database Features
- **ACID Compliance**: Full transaction support
- **Indexing**: Optimized queries with proper indexing
- **Constraints**: Data integrity with foreign keys and constraints
- **Auditing**: Created/updated timestamps on all records
- **Soft Deletes**: Optional soft delete functionality
- **Data Validation**: Database-level and application-level validation

## Integration Features
- **OpenAPI/Swagger Documentation**: Complete API documentation
- **TypeScript Support**: Full type safety and IntelliSense
- **Database Migrations**: Version-controlled database schema
- **Testing**: Comprehensive test coverage
- **Monitoring**: Built-in logging and monitoring capabilities
- **Caching**: Redis caching for improved performance
- **Background Jobs**: Queue system for heavy operations

## Development Tools
- **Demo Scripts**: Complete CRUD operation examples
- **Migration Scripts**: Database setup and sample data
- **Type Definitions**: Comprehensive TypeScript interfaces
- **Documentation**: Auto-generated API docs
- **Testing Scripts**: Unit and integration tests

## Next Steps for Extension
The current system provides a solid foundation that can be easily extended with:
1. Additional business entity modules (banks, hospitals, schools, etc.)
2. Advanced analytics and reporting features
3. Real-time notifications and webhooks
4. Integration with external APIs and services
5. Advanced security features (2FA, audit logs)
6. Performance optimization and caching strategies
7. Mobile SDK and client libraries
8. Internationalization and localization support

## Support
For API support and questions:
- **Email**: api-support@urutibiz.com
- **Documentation**: Available at `/api-docs` endpoint
- **GitHub**: [Repository link]
