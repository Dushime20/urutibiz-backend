module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'UrutiBiz Backend API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for UrutiBiz platform including country-specific CRUD systems',
    contact: {
      name: 'UrutiBiz API Support',
      email: 'api-support@urutibiz.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Main API server'
    },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Local development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Error message'
          },
          error: {
            type: 'string',
            example: 'Detailed error information'
          },
          validation_errors: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        }
      },
      PaginationInfo: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            example: 1
          },
          limit: {
            type: 'integer',
            example: 20
          },
          total: {
            type: 'integer',
            example: 100
          },
          total_pages: {
            type: 'integer',
            example: 5
          },
          has_next: {
            type: 'boolean',
            example: true
          },
          has_prev: {
            type: 'boolean',
            example: false
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'Products',
      description: 'Product management and search endpoints'
    },
    {
      name: 'Bookings',
      description: 'Booking management and lifecycle endpoints'
    },
    {
      name: 'Countries',
      description: 'Country-specific data management'
    },
    {
      name: 'Administrative Divisions',
      description: 'Country administrative divisions (states, provinces, etc.)'
    },
    {
      name: 'Verification Document Types',
      description: 'Country-specific verification document types management'
    },
    {
      name: 'Payment Providers',
      description: 'Country-specific payment provider management'
    },
    {
      name: 'Product Prices',
      description: 'Country and category-specific product pricing'
    },
    {
      name: 'Category Regulations',
      description: 'Country-specific category regulations and compliance'
    },
    {
      name: 'Insurance Providers',
      description: 'Country-specific insurance provider management and analysis'
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints for system management'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ]
};
