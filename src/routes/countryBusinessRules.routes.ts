/**
 * Country Business Rules Routes
 * 
 * HTTP routes for country-specific business rules management
 */
import { Router } from 'express';
import { CountryBusinessRulesController } from '../controllers/countryBusinessRules.controller';

const router = Router();

// CRUD operations
router.post('/', CountryBusinessRulesController.createCountryBusinessRules);
router.get('/', CountryBusinessRulesController.getAllCountryBusinessRules);
router.get('/:id', CountryBusinessRulesController.getCountryBusinessRulesById);
router.put('/:id', CountryBusinessRulesController.updateCountryBusinessRules);
router.delete('/:id', CountryBusinessRulesController.deleteCountryBusinessRules);

// Country-specific operations
router.get('/country/:countryId', CountryBusinessRulesController.getCountryBusinessRulesByCountryId);
router.get('/country/:countryId/kyc-required', CountryBusinessRulesController.isKycRequired);
router.get('/country/:countryId/min-age', CountryBusinessRulesController.getMinUserAge);
router.get('/country/:countryId/support-availability', CountryBusinessRulesController.checkSupportAvailability);

// Fee calculations and validations
router.post('/country/:countryId/calculate-fees', CountryBusinessRulesController.calculateFees);
router.post('/country/:countryId/validate-amount', CountryBusinessRulesController.validateBookingAmount);

export default router;
