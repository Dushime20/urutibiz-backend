# UrutiBiz Backend Documentation Index

## Documentation Overview
This directory contains comprehensive documentation for the UrutiBiz Backend API, including OpenAPI/Swagger specifications, endpoint references, and integration guides.

## File Directory

### Core Documentation
- **`swagger.json`** - Complete OpenAPI 3.0.0 specification (auto-generated)
- **`API_SUMMARY.md`** - Executive summary of all API features and capabilities
- **`API_DOCUMENTATION_UPDATED.md`** - Comprehensive developer documentation with examples

### Module-Specific Documentation
- **`INSURANCE_PROVIDERS_ENDPOINTS.md`** - Detailed insurance provider API reference
- **`INSURANCE_PROVIDERS_API.md`** - Legacy insurance provider documentation

### Legacy Documentation
- **`API_DOCUMENTATION.md`** - Original API documentation (superseded by updated version)

## Quick Access

### For Developers
1. **Start Here**: `API_SUMMARY.md` - Get overview of all available features
2. **Integration**: `API_DOCUMENTATION_UPDATED.md` - Complete integration guide
3. **Interactive**: Visit `http://localhost:3000/api-docs` for Swagger UI

### For Specific Modules
- **Insurance Providers**: `INSURANCE_PROVIDERS_ENDPOINTS.md` - Complete endpoint reference

### For API Specification
- **OpenAPI JSON**: `swagger.json` - Machine-readable API specification
- **Online Docs**: `http://localhost:3000/api-docs.json` - Live specification

## Documentation Features

### Auto-Generated Content
- **Swagger/OpenAPI**: Complete API specification with examples
- **Interactive UI**: Live testing environment with request/response samples
- **Type Definitions**: Full TypeScript interface documentation

### Hand-Written Guides
- **Getting Started**: Step-by-step integration guides
- **Best Practices**: Performance and security recommendations
- **Examples**: Real-world usage patterns and code samples

### Module Coverage
- ✅ **Insurance Providers** - Complete CRUD with analytics
- ✅ **Administrative Divisions** - Country-specific management
- ✅ **Verification Documents** - Document type management
- ✅ **Authentication** - JWT and API key support
- ✅ **Core Features** - Pagination, filtering, error handling

## Update History

### Latest Updates (July 5, 2025)
- Added comprehensive insurance provider module documentation
- Updated OpenAPI specification with all current endpoints
- Created detailed endpoint reference for insurance providers
- Added integration examples for multiple programming languages
- Enhanced error handling and response format documentation

### Documentation Generation
The Swagger documentation is automatically generated from:
- Route definitions with OpenAPI annotations
- TypeScript type definitions
- Controller method documentation
- Validation schema definitions

## Accessing Documentation

### Development Environment
```bash
# Start the server
npm start

# Access interactive documentation
open http://localhost:3000/api-docs

# Download OpenAPI specification
curl http://localhost:3000/api-docs.json > openapi.json
```

### Static Documentation
All markdown files in this directory can be viewed directly or served through any markdown viewer.

## Integration Support

### Programming Languages
- **JavaScript/Node.js** - Native support with examples
- **Python** - HTTP client examples with requests library
- **cURL** - Command-line examples for all endpoints
- **TypeScript** - Full type definitions available

### Frameworks & Tools
- **Postman** - Import OpenAPI specification for collection
- **Insomnia** - Direct OpenAPI import support
- **VS Code** - REST Client examples available
- **Swagger Codegen** - Generate client SDKs from specification

## Support Resources

### Documentation Issues
- Report documentation bugs or requests via GitHub issues
- Suggest improvements or additional examples
- Request new module documentation

### API Support
- **Email**: api-support@urutibiz.com
- **Documentation**: Available at `/api-docs` endpoint
- **GitHub**: Repository issues and discussions

## Contributing to Documentation

### Guidelines
1. Keep documentation up to date with code changes
2. Include practical examples for all new features
3. Maintain consistent formatting and style
4. Update OpenAPI annotations when adding new endpoints

### Auto-Generation Process
Documentation is automatically updated when:
- New routes are added with proper annotations
- TypeScript types are modified
- OpenAPI definitions are updated in route files

---

Last updated: July 5, 2025
