import { Router } from 'express';
import { InsuranceProviderController } from '../controllers/insuranceProvider.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     InsuranceProvider:
 *       type: object
 *       required:
 *         - id
 *         - country_id
 *         - provider_name
 *         - is_active
 *         - provider_type
 *         - integration_status
 *         - created_at
 *         - updated_at
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the insurance provider
 *         country_id:
 *           type: string
 *           format: uuid
 *           description: ID of the country where provider operates
 *         provider_name:
 *           type: string
 *           maxLength: 100
 *           description: Official name of the insurance provider
 *         display_name:
 *           type: string
 *           maxLength: 100
 *           description: Display name for the provider (optional)
 *         logo_url:
 *           type: string
 *           format: uri
 *           description: URL to the provider's logo
 *         contact_info:
 *           type: object
 *           description: Contact information including phone, email, address
 *           properties:
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *               format: email
 *             website:
 *               type: string
 *               format: uri
 *             address:
 *               type: object
 *         supported_categories:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of category IDs that this provider covers
 *         api_endpoint:
 *           type: string
 *           format: uri
 *           description: API endpoint for integration
 *         api_credentials:
 *           type: object
 *           description: Encrypted API credentials
 *         is_active:
 *           type: boolean
 *           description: Whether the provider is active
 *         provider_type:
 *           type: string
 *           enum: [TRADITIONAL, DIGITAL, PEER_TO_PEER, GOVERNMENT, MUTUAL]
 *           description: Type of insurance provider
 *         license_number:
 *           type: string
 *           maxLength: 50
 *           description: Provider's license number
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *           description: Provider rating (0-5 stars)
 *         coverage_types:
 *           type: array
 *           items:
 *             type: string
 *           description: Types of coverage offered
 *         min_coverage_amount:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Minimum coverage amount
 *         max_coverage_amount:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Maximum coverage amount
 *         deductible_options:
 *           type: array
 *           items:
 *             type: number
 *           description: Available deductible amounts
 *         processing_time_days:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           description: Typical processing time in days
 *         languages_supported:
 *           type: array
 *           items:
 *             type: string
 *           description: Supported languages (ISO codes)
 *         commission_rate:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *           description: Commission rate (0-1)
 *         integration_status:
 *           type: string
 *           enum: [NOT_INTEGRATED, TESTING, LIVE, DEPRECATED]
 *           description: Integration status with the platform
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Deletion timestamp (soft delete)
 * 
 *     CreateInsuranceProvider:
 *       type: object
 *       required:
 *         - country_id
 *         - provider_name
 *       properties:
 *         country_id:
 *           type: string
 *           format: uuid
 *         provider_name:
 *           type: string
 *           maxLength: 100
 *         display_name:
 *           type: string
 *           maxLength: 100
 *         logo_url:
 *           type: string
 *           format: uri
 *         contact_info:
 *           type: object
 *         supported_categories:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         api_endpoint:
 *           type: string
 *           format: uri
 *         api_credentials:
 *           type: object
 *         is_active:
 *           type: boolean
 *           default: true
 *         provider_type:
 *           type: string
 *           enum: [TRADITIONAL, DIGITAL, PEER_TO_PEER, GOVERNMENT, MUTUAL]
 *           default: TRADITIONAL
 *         license_number:
 *           type: string
 *           maxLength: 50
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *         coverage_types:
 *           type: array
 *           items:
 *             type: string
 *         min_coverage_amount:
 *           type: number
 *           format: float
 *           minimum: 0
 *         max_coverage_amount:
 *           type: number
 *           format: float
 *           minimum: 0
 *         deductible_options:
 *           type: array
 *           items:
 *             type: number
 *         processing_time_days:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         languages_supported:
 *           type: array
 *           items:
 *             type: string
 *         commission_rate:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *         integration_status:
 *           type: string
 *           enum: [NOT_INTEGRATED, TESTING, LIVE, DEPRECATED]
 *           default: NOT_INTEGRATED
 * 
 *     UpdateInsuranceProvider:
 *       type: object
 *       properties:
 *         provider_name:
 *           type: string
 *           maxLength: 100
 *         display_name:
 *           type: string
 *           maxLength: 100
 *         logo_url:
 *           type: string
 *           format: uri
 *         contact_info:
 *           type: object
 *         supported_categories:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *         api_endpoint:
 *           type: string
 *           format: uri
 *         api_credentials:
 *           type: object
 *         is_active:
 *           type: boolean
 *         provider_type:
 *           type: string
 *           enum: [TRADITIONAL, DIGITAL, PEER_TO_PEER, GOVERNMENT, MUTUAL]
 *         license_number:
 *           type: string
 *           maxLength: 50
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *         coverage_types:
 *           type: array
 *           items:
 *             type: string
 *         min_coverage_amount:
 *           type: number
 *           format: float
 *           minimum: 0
 *         max_coverage_amount:
 *           type: number
 *           format: float
 *           minimum: 0
 *         deductible_options:
 *           type: array
 *           items:
 *             type: number
 *         processing_time_days:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         languages_supported:
 *           type: array
 *           items:
 *             type: string
 *         commission_rate:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 1
 *         integration_status:
 *           type: string
 *           enum: [NOT_INTEGRATED, TESTING, LIVE, DEPRECATED]
 * 
 *     InsuranceProviderStats:
 *       type: object
 *       properties:
 *         total_providers:
 *           type: integer
 *         active_providers:
 *           type: integer
 *         by_type:
 *           type: object
 *         by_integration_status:
 *           type: object
 *         by_country:
 *           type: object
 *         average_rating:
 *           type: number
 *         average_processing_time:
 *           type: number
 *         coverage_distribution:
 *           type: object
 *         language_distribution:
 *           type: object
 * 
 *     ProviderComparison:
 *       type: object
 *       properties:
 *         provider_id:
 *           type: string
 *           format: uuid
 *         provider_name:
 *           type: string
 *         rating:
 *           type: number
 *         coverage_types:
 *           type: array
 *           items:
 *             type: string
 *         min_coverage:
 *           type: number
 *         max_coverage:
 *           type: number
 *         processing_time:
 *           type: number
 *         commission_rate:
 *           type: number
 *         supported_languages:
 *           type: array
 *           items:
 *             type: string
 *         api_available:
 *           type: boolean
 *         integration_status:
 *           type: string
 * 
 *   parameters:
 *     ProviderId:
 *       name: id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: Insurance provider ID
 *     CountryId:
 *       name: countryId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: Country ID
 *     CategoryId:
 *       name: categoryId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: Category ID
 * 
 *   responses:
 *     ProviderResponse:
 *       description: Insurance provider response
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               data:
 *                 $ref: '#/components/schemas/InsuranceProvider'
 *     ProvidersListResponse:
 *       description: List of insurance providers
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               data:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/InsuranceProvider'
 *               pagination:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                   limit:
 *                     type: integer
 *                   total:
 *                     type: integer
 *                   total_pages:
 *                     type: integer
 *                   has_next:
 *                     type: boolean
 *                   has_prev:
 *                     type: boolean
 *     ErrorResponse:
 *       description: Error response
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *               error:
 *                 type: string
 *               validation_errors:
 *                 type: object
 */

/**
 * @swagger
 * /api/insurance-providers:
 *   post:
 *     summary: Create a new insurance provider
 *     tags: [Insurance Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInsuranceProvider'
 *     responses:
 *       201:
 *         description: Insurance provider created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/InsuranceProvider'
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 *   get:
 *     summary: Get all insurance providers
 *     tags: [Insurance Providers]
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: sort_by
 *         in: query
 *         schema:
 *           type: string
 *           default: provider_name
 *       - name: sort_order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *       - name: include_inactive
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProvidersListResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post('/', InsuranceProviderController.createProvider);
router.get('/', InsuranceProviderController.getAllProviders);

/**
 * @swagger
 * /api/insurance-providers/search:
 *   get:
 *     summary: Search insurance providers with filters
 *     tags: [Insurance Providers]
 *     parameters:
 *       - name: country_id
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: provider_name
 *         in: query
 *         schema:
 *           type: string
 *       - name: provider_type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [TRADITIONAL, DIGITAL, PEER_TO_PEER, GOVERNMENT, MUTUAL]
 *       - name: is_active
 *         in: query
 *         schema:
 *           type: boolean
 *       - name: integration_status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [NOT_INTEGRATED, TESTING, LIVE, DEPRECATED]
 *       - name: min_rating
 *         in: query
 *         schema:
 *           type: number
 *       - name: max_rating
 *         in: query
 *         schema:
 *           type: number
 *       - name: supports_category
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: coverage_type
 *         in: query
 *         schema:
 *           type: string
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *       - name: min_coverage
 *         in: query
 *         schema:
 *           type: number
 *       - name: max_coverage
 *         in: query
 *         schema:
 *           type: number
 *       - name: max_processing_days
 *         in: query
 *         schema:
 *           type: integer
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: sort_by
 *         in: query
 *         schema:
 *           type: string
 *           default: provider_name
 *       - name: sort_order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProvidersListResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/search', InsuranceProviderController.searchProviders);

/**
 * @swagger
 * /api/insurance-providers/stats:
 *   get:
 *     summary: Get insurance provider statistics
 *     tags: [Insurance Providers]
 *     parameters:
 *       - name: country_id
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter stats by country
 *     responses:
 *       200:
 *         description: Provider statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/InsuranceProviderStats'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/stats', InsuranceProviderController.getProviderStats);

/**
 * @swagger
 * /api/insurance-providers/live:
 *   get:
 *     summary: Get live providers with API integration
 *     tags: [Insurance Providers]
 *     parameters:
 *       - name: country_id
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: include_credentials
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Live providers list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InsuranceProvider'
 *                 count:
 *                   type: integer
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/live', InsuranceProviderController.getLiveProviders);

/**
 * @swagger
 * /api/insurance-providers/compare:
 *   get:
 *     summary: Compare providers for a category
 *     tags: [Insurance Providers]
 *     parameters:
 *       - name: category_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: coverage_amount
 *         in: query
 *         schema:
 *           type: number
 *           default: 0
 *       - name: country_id
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Provider comparison
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProviderComparison'
 *                 filters:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/compare', InsuranceProviderController.compareProviders);

/**
 * @swagger
 * /api/insurance-providers/coverage-analysis:
 *   get:
 *     summary: Analyze coverage for a category and country
 *     tags: [Insurance Providers]
 *     parameters:
 *       - name: category_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: country_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Coverage analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/coverage-analysis', InsuranceProviderController.analyzeCoverage);

/**
 * @swagger
 * /api/insurance-providers/bulk:
 *   post:
 *     summary: Bulk create insurance providers
 *     tags: [Insurance Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providers:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CreateInsuranceProvider'
 *     responses:
 *       201:
 *         description: Bulk creation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                     created_providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InsuranceProvider'
 *       207:
 *         description: Partial success (some providers failed)
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post('/bulk', InsuranceProviderController.bulkCreateProviders);

/**
 * @swagger
 * /api/insurance-providers/country/{countryId}:
 *   get:
 *     summary: Get providers by country
 *     tags: [Insurance Providers]
 *     parameters:
 *       - $ref: '#/components/parameters/CountryId'
 *       - name: include_inactive
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: include_credentials
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Providers in country
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InsuranceProvider'
 *                 count:
 *                   type: integer
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/country/:countryId', InsuranceProviderController.getProvidersByCountry);

/**
 * @swagger
 * /api/insurance-providers/category/{categoryId}:
 *   get:
 *     summary: Get providers by category
 *     tags: [Insurance Providers]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *       - name: country_id
 *         in: query
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: include_inactive
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: include_credentials
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Providers for category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InsuranceProvider'
 *                 count:
 *                   type: integer
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/category/:categoryId', InsuranceProviderController.getProvidersByCategory);

/**
 * @swagger
 * /api/insurance-providers/market-analysis/{countryId}:
 *   get:
 *     summary: Get market analysis for a country
 *     tags: [Insurance Providers]
 *     parameters:
 *       - $ref: '#/components/parameters/CountryId'
 *     responses:
 *       200:
 *         description: Market analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/market-analysis/:countryId', InsuranceProviderController.getMarketAnalysis);

/**
 * @swagger
 * /api/insurance-providers/{id}:
 *   get:
 *     summary: Get insurance provider by ID
 *     tags: [Insurance Providers]
 *     parameters:
 *       - $ref: '#/components/parameters/ProviderId'
 *       - name: include_inactive
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: include_credentials
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *       - name: include_stats
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProviderResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 *   put:
 *     summary: Update insurance provider
 *     tags: [Insurance Providers]
 *     parameters:
 *       - $ref: '#/components/parameters/ProviderId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInsuranceProvider'
 *     responses:
 *       200:
 *         description: Provider updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/InsuranceProvider'
 *                 changes_made:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         $ref: '#/components/responses/ErrorResponse'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 *   delete:
 *     summary: Delete insurance provider (soft delete)
 *     tags: [Insurance Providers]
 *     parameters:
 *       - $ref: '#/components/parameters/ProviderId'
 *     responses:
 *       200:
 *         description: Provider deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/:id', InsuranceProviderController.getProviderById);
router.put('/:id', InsuranceProviderController.updateProvider);
router.delete('/:id', InsuranceProviderController.deleteProvider);

export default router;
