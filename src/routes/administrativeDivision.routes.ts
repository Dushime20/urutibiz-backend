// =====================================================
// ADMINISTRATIVE DIVISION ROUTES
// =====================================================

import { Router } from 'express';
import { AdministrativeDivisionController } from '@/controllers/administrativeDivision.controller';
import { authenticateToken as auth, requireRole } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Administrative Divisions
 *   description: Administrative division management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AdministrativeDivision:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier
 *         country_id:
 *           type: string
 *           format: uuid
 *           description: Country this division belongs to
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: Parent division ID (null for root level)
 *         level:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Administrative level (1=Province/State, 2=District, etc.)
 *         code:
 *           type: string
 *           maxLength: 20
 *           nullable: true
 *           description: Official government code
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Division name
 *         local_name:
 *           type: string
 *           maxLength: 100
 *           nullable: true
 *           description: Name in local language
 *         type:
 *           type: string
 *           maxLength: 50
 *           nullable: true
 *           description: Division type (province, district, county, etc.)
 *           enum: [province, state, district, county, sector, ward, city, township, village]
 *         population:
 *           type: integer
 *           minimum: 0
 *           nullable: true
 *           description: Population count
 *         area_km2:
 *           type: number
 *           minimum: 0
 *           nullable: true
 *           description: Area in square kilometers
 *         coordinates:
 *           type: string
 *           nullable: true
 *           description: Center point coordinates (WKT format)
 *         bounds:
 *           type: string
 *           nullable: true
 *           description: Administrative boundary (WKT polygon format)
 *         is_active:
 *           type: boolean
 *           description: Whether the division is active
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         country:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             code:
 *               type: string
 *         parent:
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             type:
 *               type: string
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdministrativeDivision'
 *     
 *     DivisionHierarchy:
 *       type: object
 *       properties:
 *         division:
 *           $ref: '#/components/schemas/AdministrativeDivision'
 *         path:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdministrativeDivision'
 *           description: Path from root to current division
 *         ancestors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdministrativeDivision'
 *           description: All ancestor divisions
 *         descendants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdministrativeDivision'
 *           description: All descendant divisions
 *         siblings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AdministrativeDivision'
 *           description: Sibling divisions (same parent)
 *         depth:
 *           type: integer
 *           description: Depth in hierarchy (number of ancestors)
 *         total_children:
 *           type: integer
 *           description: Total number of descendants
 */

// Public routes (no authentication required)
router.get('/', AdministrativeDivisionController.getDivisions);
router.get('/search', AdministrativeDivisionController.searchDivisions);
router.get('/tree', AdministrativeDivisionController.getDivisionTree);
router.get('/countries/:countryId', AdministrativeDivisionController.getDivisionsByCountry);
router.get('/:id', AdministrativeDivisionController.getDivisionById);
router.get('/:id/hierarchy', AdministrativeDivisionController.getDivisionHierarchy);

// Protected routes (authentication required)
router.use(auth); // All routes below require authentication

// Admin-only routes
router.post('/', requireRole(['admin']), AdministrativeDivisionController.createDivision);
router.put('/:id', requireRole(['admin']), AdministrativeDivisionController.updateDivision);
router.delete('/:id', requireRole(['admin']), AdministrativeDivisionController.deleteDivision);
router.patch('/:id/toggle-status', requireRole(['admin']), AdministrativeDivisionController.toggleDivisionStatus);
router.get('/stats', requireRole(['admin']), AdministrativeDivisionController.getDivisionStats);

export default router;
