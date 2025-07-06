/**
 * Localization Routes
 * 
 * Main router for all localization-related endpoints
 */
import { Router } from 'express';
import countryBusinessRulesRoutes from './countryBusinessRules.routes';
import exchangeRatesRoutes from './exchangeRates.routes';

const router = Router();

// Mount sub-routes
router.use('/country-business-rules', countryBusinessRulesRoutes);
router.use('/exchange-rates', exchangeRatesRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Localization services are running',
    services: {
      country_business_rules: 'active',
      exchange_rates: 'active'
    },
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
router.get('/docs', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Localization API Documentation',
    endpoints: {
      country_business_rules: {
        base_path: '/api/localization/country-business-rules',
        endpoints: [
          'POST / - Create country business rules',
          'GET / - List all country business rules',
          'GET /:id - Get business rules by ID',
          'PUT /:id - Update business rules',
          'DELETE /:id - Delete business rules',
          'GET /country/:countryId - Get rules by country',
          'GET /country/:countryId/kyc-required - Check KYC requirement',
          'GET /country/:countryId/min-age - Get minimum user age',
          'GET /country/:countryId/support-availability - Check support availability',
          'POST /country/:countryId/calculate-fees - Calculate fees',
          'POST /country/:countryId/validate-amount - Validate booking amount'
        ]
      },
      exchange_rates: {
        base_path: '/api/localization/exchange-rates',
        endpoints: [
          'POST / - Create exchange rate',
          'GET / - List exchange rates with filters',
          'GET /:id - Get exchange rate by ID',
          'PUT /:id - Update exchange rate',
          'DELETE /:id - Delete exchange rate',
          'POST /bulk - Bulk create exchange rates',
          'PUT /upsert - Upsert exchange rate',
          'GET /latest/:fromCurrency/:toCurrency - Get latest rate',
          'GET /history/:fromCurrency/:toCurrency - Get historical rates',
          'DELETE /pair/:fromCurrency/:toCurrency - Delete rates by pair',
          'POST /convert - Convert currency',
          'GET /currency-pairs - Get available currency pairs'
        ]
      }
    }
  });
});

export default router;
