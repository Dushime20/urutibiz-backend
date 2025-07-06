/**
 * Exchange Rates Routes
 * 
 * HTTP routes for currency exchange rates management and conversions
 */
import { Router } from 'express';
import { ExchangeRatesController } from '../controllers/exchangeRates.controller';

const router = Router();

// CRUD operations
router.post('/', ExchangeRatesController.createExchangeRate);
router.get('/', ExchangeRatesController.getExchangeRates);
router.get('/:id', ExchangeRatesController.getExchangeRateById);
router.put('/:id', ExchangeRatesController.updateExchangeRate);
router.delete('/:id', ExchangeRatesController.deleteExchangeRate);

// Bulk operations
router.post('/bulk', ExchangeRatesController.bulkCreateExchangeRates);
router.put('/upsert', ExchangeRatesController.upsertExchangeRate);

// Currency pair operations
router.get('/latest/:fromCurrency/:toCurrency', ExchangeRatesController.getLatestExchangeRate);
router.get('/history/:fromCurrency/:toCurrency', ExchangeRatesController.getHistoricalRates);
router.delete('/pair/:fromCurrency/:toCurrency', ExchangeRatesController.deleteExchangeRatesByCurrencyPair);

// Utility operations
router.post('/convert', ExchangeRatesController.convertCurrency);
router.get('/currency-pairs', ExchangeRatesController.getAvailableCurrencyPairs);

export default router;
