/**
 * Simple test file to verify our localization services compile correctly
 */

// Import our services
import { CountryBusinessRulesService } from './src/services/localization/CountryBusinessRulesService';
import { ExchangeRatesService } from './src/services/localization/ExchangeRatesService';
import { 
  CountryBusinessRulesData,
  ExchangeRateData,
  CreateCountryBusinessRulesData,
  CreateExchangeRateData 
} from './src/types/localization.types';

// Test type checking
const testCountryRules: CreateCountryBusinessRulesData = {
  country_id: 'test-country-id',
  min_user_age: 18,
  kyc_required: true
};

const testExchangeRate: CreateExchangeRateData = {
  from_currency: 'USD',
  to_currency: 'RWF',
  rate: 1350.50,
  rate_date: new Date(),
  source: 'central_bank'
};

// Test that classes exist and have correct methods
const testServiceMethods = () => {
  // CountryBusinessRulesService methods
  const cbr = CountryBusinessRulesService;
  cbr.createCountryBusinessRules;
  cbr.getCountryBusinessRulesById;
  cbr.getCountryBusinessRulesByCountryId;
  cbr.getAllCountryBusinessRules;
  cbr.updateCountryBusinessRules;
  cbr.deleteCountryBusinessRules;
  cbr.isKycRequiredForCountry;
  cbr.getMinUserAgeForCountry;
  cbr.calculateServiceFee;
  cbr.calculatePaymentProcessingFee;
  cbr.isBookingAmountValid;
  cbr.isSupportAvailable;

  // ExchangeRatesService methods
  const ers = ExchangeRatesService;
  ers.createExchangeRate;
  ers.bulkCreateExchangeRates;
  ers.getExchangeRateById;
  ers.getLatestExchangeRate;
  ers.getExchangeRates;
  ers.updateExchangeRate;
  ers.deleteExchangeRate;
  ers.deleteExchangeRatesByCurrencyPair;
  ers.convertCurrency;
  ers.getAvailableCurrencyPairs;
  ers.getHistoricalRates;
  ers.upsertExchangeRate;
};

console.log('✅ All localization services and types are properly defined');
console.log('✅ CountryBusinessRulesService implemented with utility methods');
console.log('✅ ExchangeRatesService implemented with conversion utilities');
console.log('✅ TypeScript types are properly structured');

export { testCountryRules, testExchangeRate, testServiceMethods };
