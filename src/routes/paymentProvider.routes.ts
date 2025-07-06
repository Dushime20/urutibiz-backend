// =====================================================
// PAYMENT PROVIDER ROUTES
// =====================================================

import { Router } from 'express';
import { paymentProviderController } from '../controllers/paymentProvider.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentProvider:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the payment provider
 *         country_id:
 *           type: string
 *           description: ISO country code (2-3 letters)
 *           example: "UG"
 *         provider_name:
 *           type: string
 *           description: Internal name of the payment provider
 *           example: "mtn_momo"
 *         provider_type:
 *           type: string
 *           enum: [card, mobile_money, bank_transfer, digital_wallet]
 *           description: Type of payment provider
 *         display_name:
 *           type: string
 *           description: Human-readable name for display
 *           example: "MTN Mobile Money"
 *         logo_url:
 *           type: string
 *           format: uri
 *           description: URL to the provider's logo
 *         is_active:
 *           type: boolean
 *           description: Whether the provider is currently active
 *         supported_currencies:
 *           type: array
 *           items:
 *             type: string
 *           description: List of supported currency codes
 *           example: ["UGX", "USD"]
 *         min_amount:
 *           type: number
 *           description: Minimum transaction amount
 *         max_amount:
 *           type: number
 *           description: Maximum transaction amount
 *         fee_percentage:
 *           type: number
 *           description: Fee as percentage (0-1)
 *         fee_fixed:
 *           type: number
 *           description: Fixed fee amount
 *         settings:
 *           type: object
 *           description: Provider-specific configuration
 *         description:
 *           type: string
 *           description: Description of the payment provider
 *         api_endpoint:
 *           type: string
 *           format: uri
 *           description: API endpoint for the provider
 *         supports_refunds:
 *           type: boolean
 *           description: Whether the provider supports refunds
 *         supports_recurring:
 *           type: boolean
 *           description: Whether the provider supports recurring payments
 *         processing_time_minutes:
 *           type: integer
 *           description: Average processing time in minutes
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     CreatePaymentProviderRequest:
 *       type: object
 *       required:
 *         - country_id
 *         - provider_name
 *         - provider_type
 *         - supported_currencies
 *       properties:
 *         country_id:
 *           type: string
 *           description: ISO country code
 *         provider_name:
 *           type: string
 *           description: Internal name of the provider
 *         provider_type:
 *           type: string
 *           enum: [card, mobile_money, bank_transfer, digital_wallet]
 *         display_name:
 *           type: string
 *           description: Display name for the provider
 *         logo_url:
 *           type: string
 *           format: uri
 *         is_active:
 *           type: boolean
 *           default: true
 *         supported_currencies:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *         min_amount:
 *           type: number
 *           minimum: 0
 *           default: 0.01
 *         max_amount:
 *           type: number
 *           minimum: 0
 *         fee_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0
 *         fee_fixed:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         settings:
 *           type: object
 *         description:
 *           type: string
 *         api_endpoint:
 *           type: string
 *           format: uri
 *         supports_refunds:
 *           type: boolean
 *           default: false
 *         supports_recurring:
 *           type: boolean
 *           default: false
 *         processing_time_minutes:
 *           type: integer
 *           minimum: 0
 *
 *     PaymentCalculationResult:
 *       type: object
 *       properties:
 *         provider_id:
 *           type: string
 *         provider_name:
 *           type: string
 *         amount:
 *           type: number
 *         fee_percentage:
 *           type: number
 *         fee_fixed:
 *           type: number
 *         total_fee:
 *           type: number
 *         total_amount:
 *           type: number
 *         currency:
 *           type: string
 *         processing_time_minutes:
 *           type: integer
 */

/**
 * @swagger
 * /api/payment-providers:
 *   post:
 *     summary: Create a new payment provider
 *     tags: [Payment Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentProviderRequest'
 *     responses:
 *       201:
 *         description: Payment provider created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaymentProvider'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: Conflict - provider already exists
 */
router.post('/', paymentProviderController.createPaymentProvider);

/**
 * @swagger
 * /api/payment-providers:
 *   get:
 *     summary: Get payment providers with filters
 *     tags: [Payment Providers]
 *     parameters:
 *       - in: query
 *         name: country_id
 *         schema:
 *           type: string
 *         description: Filter by country ID
 *       - in: query
 *         name: provider_name
 *         schema:
 *           type: string
 *         description: Filter by provider name
 *       - in: query
 *         name: provider_type
 *         schema:
 *           type: string
 *           enum: [card, mobile_money, bank_transfer, digital_wallet]
 *         description: Filter by provider type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by supported currency
 *       - in: query
 *         name: supports_refunds
 *         schema:
 *           type: boolean
 *         description: Filter by refund support
 *       - in: query
 *         name: supports_recurring
 *         schema:
 *           type: boolean
 *         description: Filter by recurring payment support
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in provider name, display name, and description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, provider_name, display_name, fee_percentage]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Payment providers retrieved successfully
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
 *                     $ref: '#/components/schemas/PaymentProvider'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', paymentProviderController.getPaymentProviders);

/**
 * @swagger
 * /api/payment-providers/stats:
 *   get:
 *     summary: Get payment provider statistics
 *     tags: [Payment Providers]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_providers:
 *                       type: integer
 *                     active_providers:
 *                       type: integer
 *                     inactive_providers:
 *                       type: integer
 *                     providers_by_country:
 *                       type: object
 *                     providers_by_type:
 *                       type: object
 *                     providers_with_refunds:
 *                       type: integer
 *                     providers_with_recurring:
 *                       type: integer
 *                     average_fee_percentage:
 *                       type: number
 *                     countries_with_providers:
 *                       type: integer
 *                     supported_currencies:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/stats', paymentProviderController.getPaymentProviderStats);

/**
 * @swagger
 * /api/payment-providers/search:
 *   get:
 *     summary: Search payment providers
 *     tags: [Payment Providers]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: country_id
 *         schema:
 *           type: string
 *         description: Filter by country ID
 *       - in: query
 *         name: provider_type
 *         schema:
 *           type: string
 *         description: Filter by provider type
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results
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
 *                     $ref: '#/components/schemas/PaymentProvider'
 */
router.get('/search', paymentProviderController.searchPaymentProviders);

/**
 * @swagger
 * /api/payment-providers/bulk:
 *   patch:
 *     summary: Bulk update payment providers
 *     tags: [Payment Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - provider_ids
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [activate, deactivate, update_fees, update_limits]
 *               provider_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *               data:
 *                 type: object
 *                 properties:
 *                   fee_percentage:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                   fee_fixed:
 *                     type: number
 *                     minimum: 0
 *                   min_amount:
 *                     type: number
 *                     minimum: 0
 *                   max_amount:
 *                     type: number
 *                     minimum: 0
 *                   is_active:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Bulk operation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     affected_count:
 *                       type: integer
 *                 message:
 *                   type: string
 */
router.patch('/bulk', paymentProviderController.bulkUpdateProviders);

/**
 * @swagger
 * /api/payment-providers/country/{countryId}:
 *   get:
 *     summary: Get payment providers by country
 *     tags: [Payment Providers]
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country payment providers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     country_id:
 *                       type: string
 *                     country_name:
 *                       type: string
 *                     country_code:
 *                       type: string
 *                     providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentProvider'
 *                     mobile_money_providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentProvider'
 *                     card_providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentProvider'
 *                     bank_transfer_providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentProvider'
 *                     digital_wallet_providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentProvider'
 *                     active_providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentProvider'
 *                     supported_currencies:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/country/:countryId', paymentProviderController.getPaymentProvidersByCountry);

/**
 * @swagger
 * /api/payment-providers/country/{countryId}/calculate:
 *   get:
 *     summary: Calculate payment fees for providers in a country
 *     tags: [Payment Providers]
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 0.01
 *         description: Payment amount
 *       - in: query
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency code
 *       - in: query
 *         name: provider_type
 *         schema:
 *           type: string
 *           enum: [card, mobile_money, bank_transfer, digital_wallet]
 *         description: Filter by provider type
 *     responses:
 *       200:
 *         description: Fee calculations retrieved successfully
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
 *                     $ref: '#/components/schemas/PaymentCalculationResult'
 */
router.get('/country/:countryId/calculate', paymentProviderController.calculatePaymentFees);

/**
 * @swagger
 * /api/payment-providers/country/{countryId}/compare:
 *   get:
 *     summary: Compare providers for a payment
 *     tags: [Payment Providers]
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 0.01
 *         description: Payment amount
 *       - in: query
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency code
 *       - in: query
 *         name: provider_type
 *         schema:
 *           type: string
 *           enum: [card, mobile_money, bank_transfer, digital_wallet]
 *         description: Filter by provider type
 *     responses:
 *       200:
 *         description: Provider comparison completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     providers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentCalculationResult'
 *                     cheapest_provider:
 *                       $ref: '#/components/schemas/PaymentCalculationResult'
 *                     fastest_provider:
 *                       $ref: '#/components/schemas/PaymentCalculationResult'
 */
router.get('/country/:countryId/compare', paymentProviderController.compareProvidersForPayment);

/**
 * @swagger
 * /api/payment-providers/{id}:
 *   get:
 *     summary: Get payment provider by ID
 *     tags: [Payment Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment provider ID
 *     responses:
 *       200:
 *         description: Payment provider retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaymentProvider'
 *       404:
 *         description: Payment provider not found
 */
router.get('/:id', paymentProviderController.getPaymentProviderById);

/**
 * @swagger
 * /api/payment-providers/{id}:
 *   put:
 *     summary: Update payment provider
 *     tags: [Payment Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               display_name:
 *                 type: string
 *               logo_url:
 *                 type: string
 *                 format: uri
 *               is_active:
 *                 type: boolean
 *               supported_currencies:
 *                 type: array
 *                 items:
 *                   type: string
 *               min_amount:
 *                 type: number
 *                 minimum: 0
 *               max_amount:
 *                 type: number
 *                 minimum: 0
 *               fee_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               fee_fixed:
 *                 type: number
 *                 minimum: 0
 *               settings:
 *                 type: object
 *               description:
 *                 type: string
 *               api_endpoint:
 *                 type: string
 *                 format: uri
 *               supports_refunds:
 *                 type: boolean
 *               supports_recurring:
 *                 type: boolean
 *               processing_time_minutes:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Payment provider updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaymentProvider'
 *                 message:
 *                   type: string
 *       404:
 *         description: Payment provider not found
 */
router.put('/:id', paymentProviderController.updatePaymentProvider);

/**
 * @swagger
 * /api/payment-providers/{id}:
 *   delete:
 *     summary: Delete payment provider
 *     tags: [Payment Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment provider ID
 *     responses:
 *       200:
 *         description: Payment provider deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Payment provider not found
 */
router.delete('/:id', paymentProviderController.deletePaymentProvider);

export default router;
