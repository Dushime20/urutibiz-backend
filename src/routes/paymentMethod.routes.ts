// =====================================================
// PAYMENT METHODS ROUTES
// =====================================================

import { Router } from 'express';
import { paymentMethodController } from '../controllers/paymentMethod.controller';
import { requireAuth } from '@/middleware';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the payment method
 *         userId:
 *           type: string
 *           format: uuid
 *           description: ID of the user who owns this payment method
 *         type:
 *           type: string
 *           enum: [card, mobile_money, bank_transfer]
 *           description: Type of payment method
 *         provider:
 *           type: string
 *           enum: [stripe, mtn_momo, airtel_money, visa, mastercard, paypal, bank]
 *           description: Payment provider
 *         lastFour:
 *           type: string
 *           description: Last 4 digits of card number (for cards)
 *           example: "4242"
 *         cardBrand:
 *           type: string
 *           enum: [visa, mastercard, amex, discover, diners, jcb, unionpay]
 *           description: Card brand (for cards)
 *         expMonth:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           description: Card expiration month (for cards)
 *         expYear:
 *           type: integer
 *           description: Card expiration year (for cards)
 *         phoneNumber:
 *           type: string
 *           description: Phone number (for mobile money)
 *           example: "+250781234567"
 *         providerToken:
 *           type: string
 *           description: Encrypted provider token
 *         paymentProviderId:
 *           type: string
 *           format: uuid
 *           description: Reference to payment provider configuration
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default payment method
 *         isVerified:
 *           type: boolean
 *           description: Whether the payment method is verified
 *         currency:
 *           type: string
 *           description: Currency code (ISO 4217)
 *           example: "RWF"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the payment method was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the payment method was last updated
 *         metadata:
 *           type: object
 *           description: Additional payment method metadata
 * 
 *     CreatePaymentMethodRequest:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [card, mobile_money, bank_transfer]
 *           description: Type of payment method
 *         provider:
 *           type: string
 *           enum: [stripe, mtn_momo, airtel_money, visa, mastercard, paypal, bank]
 *           description: Payment provider
 *         lastFour:
 *           type: string
 *           description: Last 4 digits of card number (required for cards)
 *         cardBrand:
 *           type: string
 *           enum: [visa, mastercard, amex, discover, diners, jcb, unionpay]
 *           description: Card brand (required for cards)
 *         expMonth:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           description: Card expiration month (required for cards)
 *         expYear:
 *           type: integer
 *           description: Card expiration year (required for cards)
 *         phoneNumber:
 *           type: string
 *           description: Phone number (required for mobile money)
 *         providerToken:
 *           type: string
 *           description: Provider token from payment processor
 *         paymentProviderId:
 *           type: string
 *           format: uuid
 *           description: Reference to payment provider configuration
 *         isDefault:
 *           type: boolean
 *           description: Set as default payment method
 *         currency:
 *           type: string
 *           description: Currency code (ISO 4217)
 *         metadata:
 *           type: object
 *           description: Additional metadata
 * 
 *     UpdatePaymentMethodRequest:
 *       type: object
 *       properties:
 *         isDefault:
 *           type: boolean
 *           description: Set as default payment method
 *         isVerified:
 *           type: boolean
 *           description: Verification status (admin only)
 *         expMonth:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           description: Update card expiration month
 *         expYear:
 *           type: integer
 *           description: Update card expiration year
 *         phoneNumber:
 *           type: string
 *           description: Update phone number
 *         metadata:
 *           type: object
 *           description: Update metadata
 * 
 *     CardValidationRequest:
 *       type: object
 *       required:
 *         - cardNumber
 *         - expMonth
 *         - expYear
 *         - cvv
 *       properties:
 *         cardNumber:
 *           type: string
 *           description: Full card number for validation
 *         expMonth:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           description: Card expiration month
 *         expYear:
 *           type: integer
 *           description: Card expiration year
 *         cvv:
 *           type: string
 *           description: Card CVV code
 * 
 *     MobileMoneyValidationRequest:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - provider
 *       properties:
 *         phoneNumber:
 *           type: string
 *           description: Mobile money phone number
 *         provider:
 *           type: string
 *           enum: [mtn_momo, airtel_money]
 *           description: Mobile money provider
 *         countryCode:
 *           type: string
 *           description: Country code for validation
 */

/**
 * @swagger
 * /api/v1/payment-methods:
 *   post:
 *     summary: Create a new payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentMethodRequest'
 *     responses:
 *       201:
 *         description: Payment method created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *                 message:
 *                   type: string
 *                   example: "Payment method created successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/',requireAuth, paymentMethodController.createPaymentMethod);

/**
 * @swagger
 * /api/v1/payment-methods:
 *   get:
 *     summary: Get user's payment methods
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [card, mobile_money, bank_transfer]
 *         description: Filter by payment method type
 *       - name: provider
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by payment provider
 *       - name: is_default
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by default status
 *       - name: is_verified
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *       - name: currency
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by currency
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/',requireAuth, paymentMethodController.getUserPaymentMethods);

/**
 * @swagger
 * /api/v1/payment-methods/{id}:
 *   get:
 *     summary: Get payment method by ID
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', paymentMethodController.getPaymentMethodById);

/**
 * @swagger
 * /api/v1/payment-methods/{id}:
 *   put:
 *     summary: Update payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentMethodRequest'
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *                 message:
 *                   type: string
 *                   example: "Payment method updated successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', paymentMethodController.updatePaymentMethod);

/**
 * @swagger
 * /api/v1/payment-methods/{id}:
 *   delete:
 *     summary: Delete payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
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
 *                   example: "Payment method deleted successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', paymentMethodController.deletePaymentMethod);

/**
 * @swagger
 * /api/v1/payment-methods/{id}/set-default:
 *   post:
 *     summary: Set payment method as default
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Default payment method set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *                 message:
 *                   type: string
 *                   example: "Default payment method set successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/set-default', paymentMethodController.setDefaultPaymentMethod);

/**
 * @swagger
 * /api/v1/payment-methods/{id}/verify:
 *   post:
 *     summary: Verify payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaymentMethod'
 *                 message:
 *                   type: string
 *                   example: "Payment method verified successfully"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Payment method not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/verify', paymentMethodController.verifyPaymentMethod);

/**
 * @swagger
 * /api/v1/payment-methods/analytics:
 *   get:
 *     summary: Get payment method analytics for user
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMethods:
 *                       type: integer
 *                       description: Total number of payment methods
 *                     methodsByType:
 *                       type: object
 *                       description: Breakdown by payment method type
 *                     methodsByProvider:
 *                       type: object
 *                       description: Breakdown by payment provider
 *                     verificationRate:
 *                       type: number
 *                       description: Verification rate percentage
 *                     defaultMethodsCount:
 *                       type: integer
 *                       description: Number of default payment methods
 *                     recentlyAdded:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentMethod'
 *                       description: Recently added payment methods
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/analytics', paymentMethodController.getPaymentMethodAnalytics);

/**
 * @swagger
 * /api/v1/payment-methods/validate/card:
 *   post:
 *     summary: Validate card details
 *     tags: [Payment Methods]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CardValidationRequest'
 *     responses:
 *       200:
 *         description: Card validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       description: Whether the card details are valid
 *                     error:
 *                       type: string
 *                       description: Error message if invalid
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/validate/card', paymentMethodController.validateCard);

/**
 * @swagger
 * /api/v1/payment-methods/validate/mobile-money:
 *   post:
 *     summary: Validate mobile money details
 *     tags: [Payment Methods]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MobileMoneyValidationRequest'
 *     responses:
 *       200:
 *         description: Mobile money validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       description: Whether the mobile money details are valid
 *                     error:
 *                       type: string
 *                       description: Error message if invalid
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/validate/mobile-money', paymentMethodController.validateMobileMoney);

/**
 * @swagger
 * /api/v1/payment-methods/all:
 *   get:
 *     summary: Get all payment methods (admin only)
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All payment methods retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PaymentMethod'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       500:
 *         description: Internal server error
 */
// router.get('/all',requireAuth, paymentMethodController.getAllPaymentMethods);

export default router;
