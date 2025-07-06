// =====================================================
// PRODUCT PRICE ROUTES
// =====================================================

import { Router } from 'express';
import { productPriceController } from '../controllers/productPrice.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductPrice:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the product price
 *         product_id:
 *           type: string
 *           format: uuid
 *           description: ID of the product
 *         country_id:
 *           type: string
 *           format: uuid
 *           description: ID of the country
 *         currency:
 *           type: string
 *           description: ISO 4217 currency code
 *           example: "USD"
 *         price_per_hour:
 *           type: number
 *           description: Hourly rental rate
 *         price_per_day:
 *           type: number
 *           description: Daily rental rate
 *         price_per_week:
 *           type: number
 *           description: Weekly rental rate
 *         price_per_month:
 *           type: number
 *           description: Monthly rental rate
 *         security_deposit:
 *           type: number
 *           description: Security deposit amount
 *         market_adjustment_factor:
 *           type: number
 *           description: Price adjustment for local market
 *         auto_convert:
 *           type: boolean
 *           description: Auto-convert from base currency
 *         base_price:
 *           type: number
 *           description: Base price in original currency
 *         base_currency:
 *           type: string
 *           description: Original currency for base price
 *         exchange_rate:
 *           type: number
 *           description: Exchange rate used for conversion
 *         min_rental_duration_hours:
 *           type: number
 *           description: Minimum rental duration in hours
 *         max_rental_duration_days:
 *           type: number
 *           description: Maximum rental duration in days
 *         early_return_fee_percentage:
 *           type: number
 *           description: Fee for early returns as percentage
 *         late_return_fee_per_hour:
 *           type: number
 *           description: Fee per hour for late returns
 *         weekly_discount_percentage:
 *           type: number
 *           description: Discount for weekly rentals
 *         monthly_discount_percentage:
 *           type: number
 *           description: Discount for monthly rentals
 *         bulk_discount_threshold:
 *           type: number
 *           description: Minimum quantity for bulk discount
 *         bulk_discount_percentage:
 *           type: number
 *           description: Discount for bulk rentals
 *         dynamic_pricing_enabled:
 *           type: boolean
 *           description: Enable dynamic pricing based on demand
 *         peak_season_multiplier:
 *           type: number
 *           description: Price multiplier for peak season
 *         off_season_multiplier:
 *           type: number
 *           description: Price multiplier for off season
 *         seasonal_adjustments:
 *           type: object
 *           description: Month-based pricing adjustments
 *         is_active:
 *           type: boolean
 *           description: Whether this pricing is currently active
 *         effective_from:
 *           type: string
 *           format: date-time
 *           description: When this pricing becomes effective
 *         effective_until:
 *           type: string
 *           format: date-time
 *           description: When this pricing expires
 *         notes:
 *           type: string
 *           description: Additional notes about this pricing
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     
 *     CreateProductPriceRequest:
 *       type: object
 *       required:
 *         - product_id
 *         - country_id
 *         - currency
 *         - price_per_day
 *       properties:
 *         product_id:
 *           type: string
 *           format: uuid
 *         country_id:
 *           type: string
 *           format: uuid
 *         currency:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *         price_per_hour:
 *           type: number
 *           minimum: 0
 *         price_per_day:
 *           type: number
 *           minimum: 0.01
 *         price_per_week:
 *           type: number
 *           minimum: 0
 *         price_per_month:
 *           type: number
 *           minimum: 0
 *         security_deposit:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         market_adjustment_factor:
 *           type: number
 *           minimum: 0.01
 *           maximum: 10
 *           default: 1.0
 *         auto_convert:
 *           type: boolean
 *           default: true
 *         base_price:
 *           type: number
 *           minimum: 0
 *         base_currency:
 *           type: string
 *           minLength: 3
 *           maxLength: 3
 *         exchange_rate:
 *           type: number
 *           minimum: 0.000001
 *         min_rental_duration_hours:
 *           type: number
 *           minimum: 0.25
 *           default: 1.0
 *         max_rental_duration_days:
 *           type: number
 *           minimum: 0.01
 *         early_return_fee_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0
 *         late_return_fee_per_hour:
 *           type: number
 *           minimum: 0
 *           default: 0
 *         weekly_discount_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0
 *         monthly_discount_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0
 *         bulk_discount_threshold:
 *           type: number
 *           minimum: 1
 *           default: 1
 *         bulk_discount_percentage:
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           default: 0
 *         dynamic_pricing_enabled:
 *           type: boolean
 *           default: false
 *         peak_season_multiplier:
 *           type: number
 *           minimum: 0.1
 *           maximum: 10
 *           default: 1.0
 *         off_season_multiplier:
 *           type: number
 *           minimum: 0.1
 *           maximum: 10
 *           default: 1.0
 *         seasonal_adjustments:
 *           type: object
 *           description: JSON object with month numbers (1-12) as keys and multipliers as values
 *         is_active:
 *           type: boolean
 *           default: true
 *         effective_from:
 *           type: string
 *           format: date-time
 *         effective_until:
 *           type: string
 *           format: date-time
 *         notes:
 *           type: string
 *
 *     PriceCalculationRequest:
 *       type: object
 *       required:
 *         - product_id
 *         - country_id
 *         - rental_duration_hours
 *       properties:
 *         product_id:
 *           type: string
 *           format: uuid
 *         country_id:
 *           type: string
 *           format: uuid
 *         currency:
 *           type: string
 *           description: Preferred currency (optional)
 *         rental_duration_hours:
 *           type: number
 *           minimum: 0.01
 *         quantity:
 *           type: number
 *           minimum: 1
 *           default: 1
 *         rental_start_date:
 *           type: string
 *           format: date-time
 *         include_security_deposit:
 *           type: boolean
 *           default: true
 *         apply_discounts:
 *           type: boolean
 *           default: true
 *
 *     PriceCalculationResult:
 *       type: object
 *       properties:
 *         product_id:
 *           type: string
 *         country_id:
 *           type: string
 *         currency:
 *           type: string
 *         rental_duration_hours:
 *           type: number
 *         rental_duration_days:
 *           type: number
 *         quantity:
 *           type: number
 *         base_rate_type:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly]
 *         base_rate:
 *           type: number
 *         base_amount:
 *           type: number
 *         market_adjustment_factor:
 *           type: number
 *         seasonal_multiplier:
 *           type: number
 *         peak_season_adjustment:
 *           type: number
 *         weekly_discount:
 *           type: number
 *         monthly_discount:
 *           type: number
 *         bulk_discount:
 *           type: number
 *         total_discount:
 *           type: number
 *         subtotal:
 *           type: number
 *         security_deposit:
 *           type: number
 *         total_amount:
 *           type: number
 *         calculation_date:
 *           type: string
 *           format: date-time
 *         exchange_rate_used:
 *           type: number
 *         pricing_tier_used:
 *           type: string
 *         discounts_applied:
 *           type: array
 *           items:
 *             type: string
 *         notes:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/product-prices:
 *   post:
 *     summary: Create a new product price
 *     tags: [Product Prices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductPriceRequest'
 *     responses:
 *       201:
 *         description: Product price created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductPrice'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - validation error
 *       409:
 *         description: Conflict - price already exists
 */
router.post('/', productPriceController.createProductPrice);

/**
 * @swagger
 * /api/product-prices:
 *   get:
 *     summary: Get product prices with filters
 *     tags: [Product Prices]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: country_id
 *         schema:
 *           type: string
 *         description: Filter by country ID
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: auto_convert
 *         schema:
 *           type: boolean
 *         description: Filter by auto-convert setting
 *       - in: query
 *         name: dynamic_pricing_enabled
 *         schema:
 *           type: boolean
 *         description: Filter by dynamic pricing setting
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum daily price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum daily price filter
 *       - in: query
 *         name: has_hourly_pricing
 *         schema:
 *           type: boolean
 *         description: Filter by hourly pricing availability
 *       - in: query
 *         name: has_weekly_pricing
 *         schema:
 *           type: boolean
 *         description: Filter by weekly pricing availability
 *       - in: query
 *         name: has_monthly_pricing
 *         schema:
 *           type: boolean
 *         description: Filter by monthly pricing availability
 *       - in: query
 *         name: effective_on
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by effective date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in currency, base currency, and notes
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
 *           enum: [created_at, price_per_day, price_per_hour, currency, effective_from]
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
 *         description: Product prices retrieved successfully
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
 *                     $ref: '#/components/schemas/ProductPrice'
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
router.get('/', productPriceController.getProductPrices);

/**
 * @swagger
 * /api/product-prices/stats:
 *   get:
 *     summary: Get product price statistics
 *     tags: [Product Prices]
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
 *                     total_price_records:
 *                       type: integer
 *                     active_price_records:
 *                       type: integer
 *                     inactive_price_records:
 *                       type: integer
 *                     countries_with_pricing:
 *                       type: integer
 *                     currencies_supported:
 *                       type: integer
 *                     pricing_coverage:
 *                       type: object
 *                     price_distribution:
 *                       type: object
 *                     discount_analysis:
 *                       type: object
 *                     market_analysis:
 *                       type: object
 *                     temporal_analysis:
 *                       type: object
 */
router.get('/stats', productPriceController.getProductPriceStats);

/**
 * @swagger
 * /api/product-prices/search:
 *   get:
 *     summary: Search product prices
 *     tags: [Product Prices]
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
 *                     $ref: '#/components/schemas/ProductPrice'
 */
router.get('/search', productPriceController.searchProductPrices);

/**
 * @swagger
 * /api/product-prices/calculate:
 *   post:
 *     summary: Calculate rental price for specific parameters
 *     tags: [Product Prices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PriceCalculationRequest'
 *     responses:
 *       200:
 *         description: Price calculation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PriceCalculationResult'
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: No pricing found for the criteria
 */
router.post('/calculate', productPriceController.calculateRentalPrice);

/**
 * @swagger
 * /api/product-prices/calculate:
 *   get:
 *     summary: Calculate rental price using query parameters
 *     tags: [Product Prices]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: country_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *       - in: query
 *         name: rental_duration_hours
 *         required: true
 *         schema:
 *           type: number
 *         description: Rental duration in hours
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Preferred currency
 *       - in: query
 *         name: quantity
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Quantity to rent
 *       - in: query
 *         name: rental_start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Rental start date
 *       - in: query
 *         name: include_security_deposit
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include security deposit in calculation
 *       - in: query
 *         name: apply_discounts
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Apply available discounts
 *     responses:
 *       200:
 *         description: Price calculation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PriceCalculationResult'
 */
router.get('/calculate', productPriceController.calculateRentalPrice);

/**
 * @swagger
 * /api/product-prices/bulk:
 *   patch:
 *     summary: Bulk update product prices
 *     tags: [Product Prices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *               - data
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [update_prices, update_discounts, update_market_factors, activate, deactivate, update_exchange_rates]
 *               product_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               country_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               currencies:
 *                 type: array
 *                 items:
 *                   type: string
 *               filters:
 *                 type: object
 *               data:
 *                 type: object
 *                 properties:
 *                   price_adjustment_percentage:
 *                     type: number
 *                   market_adjustment_factor:
 *                     type: number
 *                   weekly_discount_percentage:
 *                     type: number
 *                   monthly_discount_percentage:
 *                     type: number
 *                   bulk_discount_percentage:
 *                     type: number
 *                   exchange_rate:
 *                     type: number
 *                   base_currency:
 *                     type: string
 *                   is_active:
 *                     type: boolean
 *                   effective_from:
 *                     type: string
 *                     format: date-time
 *                   effective_until:
 *                     type: string
 *                     format: date-time
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
router.patch('/bulk', productPriceController.bulkUpdateProductPrices);

/**
 * @swagger
 * /api/product-prices/product/{productId}:
 *   get:
 *     summary: Get all prices for a specific product
 *     tags: [Product Prices]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: country_id
 *         schema:
 *           type: string
 *         description: Filter by country ID
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *     responses:
 *       200:
 *         description: Product prices retrieved successfully
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
 *                     $ref: '#/components/schemas/ProductPrice'
 *                 pagination:
 *                   type: object
 */
router.get('/product/:productId', productPriceController.getProductPricesByProduct);

/**
 * @swagger
 * /api/product-prices/product/{productId}/compare:
 *   get:
 *     summary: Compare prices across countries for a product
 *     tags: [Product Prices]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: rental_duration_hours
 *         required: true
 *         schema:
 *           type: number
 *         description: Rental duration in hours
 *       - in: query
 *         name: quantity
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Quantity to rent
 *     responses:
 *       200:
 *         description: Price comparison completed successfully
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
 *                     product_id:
 *                       type: string
 *                     comparison_date:
 *                       type: string
 *                       format: date-time
 *                     base_duration_hours:
 *                       type: number
 *                     quantity:
 *                       type: number
 *                     country_prices:
 *                       type: array
 *                       items:
 *                         type: object
 *                     cheapest_country:
 *                       type: object
 *                     most_expensive_country:
 *                       type: object
 *                     average_price:
 *                       type: number
 *                     price_variance:
 *                       type: number
 *                     currency_diversity:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/product/:productId/compare', productPriceController.compareProductPricesAcrossCountries);

/**
 * @swagger
 * /api/product-prices/country/{countryId}:
 *   get:
 *     summary: Get all prices for a specific country
 *     tags: [Product Prices]
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *         description: Filter by product ID
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Country prices retrieved successfully
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
 *                     $ref: '#/components/schemas/ProductPrice'
 *                 pagination:
 *                   type: object
 */
router.get('/country/:countryId', productPriceController.getProductPricesByCountry);

/**
 * @swagger
 * /api/product-prices/{id}:
 *   get:
 *     summary: Get product price by ID
 *     tags: [Product Prices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product price ID
 *     responses:
 *       200:
 *         description: Product price retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductPrice'
 *       404:
 *         description: Product price not found
 */
router.get('/:id', productPriceController.getProductPriceById);

/**
 * @swagger
 * /api/product-prices/{id}:
 *   put:
 *     summary: Update product price
 *     tags: [Product Prices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product price ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price_per_hour:
 *                 type: number
 *                 minimum: 0
 *               price_per_day:
 *                 type: number
 *                 minimum: 0.01
 *               price_per_week:
 *                 type: number
 *                 minimum: 0
 *               price_per_month:
 *                 type: number
 *                 minimum: 0
 *               security_deposit:
 *                 type: number
 *                 minimum: 0
 *               market_adjustment_factor:
 *                 type: number
 *                 minimum: 0.01
 *                 maximum: 10
 *               auto_convert:
 *                 type: boolean
 *               base_price:
 *                 type: number
 *                 minimum: 0
 *               base_currency:
 *                 type: string
 *               exchange_rate:
 *                 type: number
 *                 minimum: 0.000001
 *               min_rental_duration_hours:
 *                 type: number
 *                 minimum: 0.25
 *               max_rental_duration_days:
 *                 type: number
 *                 minimum: 0.01
 *               early_return_fee_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               late_return_fee_per_hour:
 *                 type: number
 *                 minimum: 0
 *               weekly_discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               monthly_discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               bulk_discount_threshold:
 *                 type: number
 *                 minimum: 1
 *               bulk_discount_percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               dynamic_pricing_enabled:
 *                 type: boolean
 *               peak_season_multiplier:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 10
 *               off_season_multiplier:
 *                 type: number
 *                 minimum: 0.1
 *                 maximum: 10
 *               seasonal_adjustments:
 *                 type: object
 *               is_active:
 *                 type: boolean
 *               effective_from:
 *                 type: string
 *                 format: date-time
 *               effective_until:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product price updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ProductPrice'
 *                 message:
 *                   type: string
 *       404:
 *         description: Product price not found
 */
router.put('/:id', productPriceController.updateProductPrice);

/**
 * @swagger
 * /api/product-prices/{id}:
 *   delete:
 *     summary: Delete product price
 *     tags: [Product Prices]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product price ID
 *     responses:
 *       200:
 *         description: Product price deleted successfully
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
 *         description: Product price not found
 */
router.delete('/:id', productPriceController.deleteProductPrice);

export default router;
