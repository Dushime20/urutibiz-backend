// =====================================================
// USER FAVORITES ROUTES
// =====================================================

/**
 * @swagger
 * tags:
 *   name: User Favorites
 *   description: User favorite products management API
 * 
 * components:
 *   schemas:
 *     UserFavorite:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Favorite unique identifier
 *         user_id:
 *           type: string
 *           format: uuid
 *           description: User ID who favorited the product
 *         product_id:
 *           type: string
 *           format: uuid
 *           description: Product ID that was favorited
 *         metadata:
 *           type: object
 *           description: Additional metadata about the favorite
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the favorite was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: When the favorite was last updated
 * 
 *     FavoriteStatusResponse:
 *       type: object
 *       properties:
 *         is_favorited:
 *           type: boolean
 *           description: Whether the product is favorited by the user
 *         favorite_id:
 *           type: string
 *           format: uuid
 *           description: Favorite ID if product is favorited
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the favorite was created (if favorited)
 * 
 *     BulkFavoriteRequest:
 *       type: object
 *       required: [product_ids, action]
 *       properties:
 *         product_ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of product IDs
 *           maxItems: 100
 *         action:
 *           type: string
 *           enum: [add, remove]
 *           description: Action to perform on the products
 *         metadata:
 *           type: object
 *           description: Additional metadata for bulk operations
 */

import { Router } from 'express';
import { userFavoritesController } from '../controllers/userFavorites.controller';
import { requireAuth } from '@/middleware/auth.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

/**
 * @swagger
 * /api/v1/users/favorites:
 *   post:
 *     summary: Add product to favorites
 *     description: Add a product to the authenticated user's favorites list
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id]
 *             properties:
 *               product_id:
 *                 type: string
 *                 format: uuid
 *                 description: Product ID to add to favorites
 *               metadata:
 *                 type: object
 *                 description: Additional metadata about the favorite
 *             example:
 *               product_id: "550e8400-e29b-41d4-a716-446655440000"
 *               metadata:
 *                 source: "product_page"
 *                 category: "electronics"
 *     responses:
 *       201:
 *         description: Product added to favorites successfully
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
 *                   $ref: '#/components/schemas/UserFavorite'
 *       400:
 *         description: Bad request - invalid input
 *       409:
 *         description: Product already in favorites
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', [
  body('product_id')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
], userFavoritesController.addToFavorites);

/**
 * @swagger
 * /api/v1/users/favorites:
 *   get:
 *     summary: Get user's favorites
 *     description: Retrieve the authenticated user's favorite products with optional filtering
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending]
 *         description: Filter by product status
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by product location
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search in product name and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, product_name, price]
 *           default: created_at
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: User favorites retrieved successfully
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
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/UserFavorite'
 *                       - type: object
 *                         properties:
 *                           product:
 *                             type: object
 *                             description: Product details
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('category_id')
    .optional()
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  query('min_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),
  query('max_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
  query('search')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Search query must be at least 2 characters')
], userFavoritesController.getUserFavorites);

/**
 * @swagger
 * /api/v1/users/favorites/count:
 *   get:
 *     summary: Get user's favorites count
 *     description: Get the total number of favorites for the authenticated user
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorites count retrieved successfully
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
 *                     count:
 *                       type: integer
 *                       description: Total number of favorites
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/count', userFavoritesController.getFavoritesCount);

/**
 * @swagger
 * /api/v1/users/favorites/stats:
 *   get:
 *     summary: Get user's favorite statistics
 *     description: Get detailed statistics about the user's favorites
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite statistics retrieved successfully
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
 *                     total_favorites:
 *                       type: integer
 *                     favorites_by_category:
 *                       type: object
 *                     favorites_by_status:
 *                       type: object
 *                     recent_favorites:
 *                       type: integer
 *                     average_price:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats', userFavoritesController.getFavoriteStats);

/**
 * @swagger
 * /api/v1/users/favorites/bulk:
 *   post:
 *     summary: Bulk operations on favorites
 *     description: Perform bulk add or remove operations on multiple products
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkFavoriteRequest'
 *           example:
 *             product_ids: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]
 *             action: "add"
 *             metadata:
 *               source: "wishlist_import"
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
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     added:
 *                       type: integer
 *                     removed:
 *                       type: integer
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: string
 *                           error:
 *                             type: string
 *       400:
 *         description: Bad request - invalid input
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/bulk', [
  body('product_ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('Product IDs must be an array with 1-100 items'),
  body('product_ids.*')
    .isUUID()
    .withMessage('Each product ID must be a valid UUID'),
  body('action')
    .isIn(['add', 'remove'])
    .withMessage('Action must be either "add" or "remove"'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
], userFavoritesController.bulkFavoriteOperation);

/**
 * @swagger
 * /api/v1/users/favorites/{productId}/status:
 *   get:
 *     summary: Check if product is favorited
 *     description: Check if a specific product is in the user's favorites
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to check
 *     responses:
 *       200:
 *         description: Favorite status retrieved successfully
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
 *                   $ref: '#/components/schemas/FavoriteStatusResponse'
 *       400:
 *         description: Bad request - invalid product ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:productId/status', [
  param('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID')
], userFavoritesController.getFavoriteStatus);

/**
 * @swagger
 * /api/v1/users/favorites/{productId}/toggle:
 *   post:
 *     summary: Toggle favorite status
 *     description: Toggle the favorite status of a product (add if not favorited, remove if favorited)
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to toggle
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *                 description: Additional metadata (only used when adding to favorites)
 *     responses:
 *       200:
 *         description: Favorite status toggled successfully
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
 *                     action:
 *                       type: string
 *                       enum: [added, removed]
 *                     favorite:
 *                       $ref: '#/components/schemas/UserFavorite'
 *       400:
 *         description: Bad request - invalid product ID
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:productId/toggle', [
  param('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
], userFavoritesController.toggleFavorite);

/**
 * @swagger
 * /api/v1/users/favorites/{productId}:
 *   delete:
 *     summary: Remove product from favorites
 *     description: Remove a specific product from the user's favorites
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to remove from favorites
 *     responses:
 *       200:
 *         description: Product removed from favorites successfully
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
 *                     removed:
 *                       type: boolean
 *       400:
 *         description: Bad request - invalid product ID
 *       404:
 *         description: Product not in favorites
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:productId', [
  param('productId')
    .isUUID()
    .withMessage('Product ID must be a valid UUID')
], userFavoritesController.removeFromFavorites);

/**
 * @swagger
 * /api/v1/users/favorites:
 *   delete:
 *     summary: Clear all favorites
 *     description: Remove all products from the user's favorites
 *     tags: [User Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All favorites cleared successfully
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
 *                     deleted_count:
 *                       type: integer
 *                       description: Number of favorites deleted
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/', userFavoritesController.clearFavorites);

export default router;
