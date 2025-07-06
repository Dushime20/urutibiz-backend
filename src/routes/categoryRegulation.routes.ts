import { Router } from 'express';
import { body, param } from 'express-validator';
import CategoryRegulationController from '../controllers/categoryRegulation.controller';

const router = Router();

// Validation middleware
const createValidation = [
  body('category_id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('country_id')
    .isUUID()
    .withMessage('Country ID must be a valid UUID'),
  body('is_allowed')
    .optional()
    .isBoolean()
    .withMessage('Is allowed must be a boolean'),
  body('requires_license')
    .optional()
    .isBoolean()
    .withMessage('Requires license must be a boolean'),
  body('license_type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('License type must be 100 characters or less'),
  body('min_age_requirement')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum age requirement must be between 0 and 100'),
  body('max_rental_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Maximum rental days must be between 1 and 365'),
  body('special_requirements')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Special requirements must be 2000 characters or less'),
  body('mandatory_insurance')
    .optional()
    .isBoolean()
    .withMessage('Mandatory insurance must be a boolean'),
  body('min_coverage_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Minimum coverage amount must be a valid decimal'),
  body('max_liability_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Maximum liability amount must be a valid decimal'),
  body('requires_background_check')
    .optional()
    .isBoolean()
    .withMessage('Requires background check must be a boolean'),
  body('prohibited_activities')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Prohibited activities must be 2000 characters or less'),
  body('compliance_level')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Compliance level must be LOW, MEDIUM, HIGH, or CRITICAL'),
];

const updateValidation = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
  body('is_allowed')
    .optional()
    .isBoolean()
    .withMessage('Is allowed must be a boolean'),
  body('requires_license')
    .optional()
    .isBoolean()
    .withMessage('Requires license must be a boolean'),
  body('license_type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('License type must be 100 characters or less'),
  body('min_age_requirement')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum age requirement must be between 0 and 100'),
  body('max_rental_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Maximum rental days must be between 1 and 365'),
  body('special_requirements')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Special requirements must be 2000 characters or less'),
  body('mandatory_insurance')
    .optional()
    .isBoolean()
    .withMessage('Mandatory insurance must be a boolean'),
  body('min_coverage_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Minimum coverage amount must be a valid decimal'),
  body('max_liability_amount')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Maximum liability amount must be a valid decimal'),
  body('requires_background_check')
    .optional()
    .isBoolean()
    .withMessage('Requires background check must be a boolean'),
  body('prohibited_activities')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Prohibited activities must be 2000 characters or less'),
  body('compliance_level')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
    .withMessage('Compliance level must be LOW, MEDIUM, HIGH, or CRITICAL'),
];

const complianceCheckValidation = [
  body('category_id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),
  body('country_id')
    .isUUID()
    .withMessage('Country ID must be a valid UUID'),
  body('user_age')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('User age must be between 0 and 120'),
  body('rental_duration_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Rental duration must be between 1 and 365 days'),
  body('has_license')
    .optional()
    .isBoolean()
    .withMessage('Has license must be a boolean'),
  body('has_insurance')
    .optional()
    .isBoolean()
    .withMessage('Has insurance must be a boolean'),
  body('coverage_amount')
    .optional()
    .isDecimal()
    .withMessage('Coverage amount must be a valid decimal'),
  body('background_check_status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Background check status must be pending, approved, or rejected'),
];

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryRegulation:
 *       type: object
 *       required:
 *         - category_id
 *         - country_id
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the category regulation
 *         category_id:
 *           type: string
 *           format: uuid
 *           description: ID of the category
 *         country_id:
 *           type: string
 *           format: uuid
 *           description: ID of the country
 *         is_allowed:
 *           type: boolean
 *           default: true
 *           description: Whether the category is allowed in this country
 *         requires_license:
 *           type: boolean
 *           default: false
 *           description: Whether a license is required
 *         license_type:
 *           type: string
 *           maxLength: 100
 *           description: Type of license required
 *         min_age_requirement:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Minimum age requirement
 *         max_rental_days:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           description: Maximum rental duration in days
 *         special_requirements:
 *           type: string
 *           maxLength: 2000
 *           description: Special requirements or conditions
 *         mandatory_insurance:
 *           type: boolean
 *           default: false
 *           description: Whether insurance is mandatory
 *         min_coverage_amount:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           description: Minimum insurance coverage amount
 *         max_liability_amount:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *           description: Maximum liability amount
 *         requires_background_check:
 *           type: boolean
 *           default: false
 *           description: Whether background check is required
 *         prohibited_activities:
 *           type: string
 *           maxLength: 2000
 *           description: List of prohibited activities
 *         seasonal_restrictions:
 *           type: object
 *           description: Seasonal restrictions as JSON object
 *         documentation_required:
 *           type: array
 *           items:
 *             type: string
 *           description: List of required documentation types
 *         compliance_level:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           default: MEDIUM
 *           description: Compliance level for the regulation
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     
 *     CreateCategoryRegulationRequest:
 *       type: object
 *       required:
 *         - category_id
 *         - country_id
 *       properties:
 *         category_id:
 *           type: string
 *           format: uuid
 *         country_id:
 *           type: string
 *           format: uuid
 *         is_allowed:
 *           type: boolean
 *           default: true
 *         requires_license:
 *           type: boolean
 *           default: false
 *         license_type:
 *           type: string
 *           maxLength: 100
 *         min_age_requirement:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         max_rental_days:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         special_requirements:
 *           type: string
 *           maxLength: 2000
 *         mandatory_insurance:
 *           type: boolean
 *           default: false
 *         min_coverage_amount:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *         max_liability_amount:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *         requires_background_check:
 *           type: boolean
 *           default: false
 *         prohibited_activities:
 *           type: string
 *           maxLength: 2000
 *         seasonal_restrictions:
 *           type: object
 *         documentation_required:
 *           type: array
 *           items:
 *             type: string
 *         compliance_level:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *           default: MEDIUM
 *     
 *     ComplianceCheckRequest:
 *       type: object
 *       required:
 *         - category_id
 *         - country_id
 *       properties:
 *         category_id:
 *           type: string
 *           format: uuid
 *         country_id:
 *           type: string
 *           format: uuid
 *         user_age:
 *           type: integer
 *           minimum: 0
 *           maximum: 120
 *         rental_duration_days:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *         has_license:
 *           type: boolean
 *         license_type:
 *           type: string
 *         has_insurance:
 *           type: boolean
 *         coverage_amount:
 *           type: number
 *           format: decimal
 *         background_check_status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         season:
 *           type: string
 *         documentation_provided:
 *           type: array
 *           items:
 *             type: string
 *     
 *     ComplianceCheckResult:
 *       type: object
 *       properties:
 *         is_compliant:
 *           type: boolean
 *         category_id:
 *           type: string
 *           format: uuid
 *         country_id:
 *           type: string
 *           format: uuid
 *         regulation_exists:
 *           type: boolean
 *         checks:
 *           type: object
 *           properties:
 *             is_allowed:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             age_requirement:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 required:
 *                   type: integer
 *                 provided:
 *                   type: integer
 *                 message:
 *                   type: string
 *             license_requirement:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 required:
 *                   type: string
 *                 provided:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             rental_duration:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 max_allowed:
 *                   type: integer
 *                 requested:
 *                   type: integer
 *                 message:
 *                   type: string
 *             insurance_requirement:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 required:
 *                   type: boolean
 *                 coverage_sufficient:
 *                   type: boolean
 *                 message:
 *                   type: string
 *             background_check:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 required:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *             documentation:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 required:
 *                   type: array
 *                   items:
 *                     type: string
 *                 provided:
 *                   type: array
 *                   items:
 *                     type: string
 *                 missing:
 *                   type: array
 *                   items:
 *                     type: string
 *                 message:
 *                   type: string
 *             seasonal_restrictions:
 *               type: object
 *               properties:
 *                 passed:
 *                   type: boolean
 *                 restrictions:
 *                   type: object
 *                 message:
 *                   type: string
 *         violations:
 *           type: array
 *           items:
 *             type: string
 *         warnings:
 *           type: array
 *           items:
 *             type: string
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *     
 *     CategoryRegulationStats:
 *       type: object
 *       properties:
 *         total_regulations:
 *           type: integer
 *         by_country:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         by_category:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         by_compliance_level:
 *           type: object
 *           properties:
 *             LOW:
 *               type: integer
 *             MEDIUM:
 *               type: integer
 *             HIGH:
 *               type: integer
 *             CRITICAL:
 *               type: integer
 *         licensing_required:
 *           type: integer
 *         insurance_required:
 *           type: integer
 *         background_check_required:
 *           type: integer
 *         average_age_requirement:
 *           type: number
 *         average_max_rental_days:
 *           type: number
 *         most_restrictive_countries:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               country_id:
 *                 type: string
 *                 format: uuid
 *               country_code:
 *                 type: string
 *               restriction_count:
 *                 type: integer
 *               average_compliance_level:
 *                 type: number
 *         most_regulated_categories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: string
 *                 format: uuid
 *               category_name:
 *                 type: string
 *               regulation_count:
 *                 type: integer
 *               average_compliance_level:
 *                 type: number
 *   
 *   parameters:
 *     CategoryRegulationId:
 *       name: id
 *       in: path
 *       required: true
 *       description: Category regulation ID
 *       schema:
 *         type: string
 *         format: uuid
 *     CategoryId:
 *       name: categoryId
 *       in: path
 *       required: true
 *       description: Category ID
 *       schema:
 *         type: string
 *         format: uuid
 *     CountryId:
 *       name: countryId
 *       in: path
 *       required: true
 *       description: Country ID
 *       schema:
 *         type: string
 *         format: uuid
 */

/**
 * @swagger
 * /api/v1/category-regulations:
 *   get:
 *     summary: Get all category regulations
 *     description: Retrieve category regulations with filtering, pagination, and sorting options
 *     tags: [Category Regulations]
 *     parameters:
 *       - name: category_id
 *         in: query
 *         description: Filter by category ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: country_id
 *         in: query
 *         description: Filter by country ID
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: country_code
 *         in: query
 *         description: Filter by country code
 *         schema:
 *           type: string
 *       - name: is_allowed
 *         in: query
 *         description: Filter by allowed status
 *         schema:
 *           type: boolean
 *       - name: requires_license
 *         in: query
 *         description: Filter by license requirement
 *         schema:
 *           type: boolean
 *       - name: license_type
 *         in: query
 *         description: Filter by license type
 *         schema:
 *           type: string
 *       - name: min_age
 *         in: query
 *         description: Filter by minimum age requirement (>=)
 *         schema:
 *           type: integer
 *       - name: max_age
 *         in: query
 *         description: Filter by maximum age requirement (<=)
 *         schema:
 *           type: integer
 *       - name: mandatory_insurance
 *         in: query
 *         description: Filter by insurance requirement
 *         schema:
 *           type: boolean
 *       - name: requires_background_check
 *         in: query
 *         description: Filter by background check requirement
 *         schema:
 *           type: boolean
 *       - name: compliance_level
 *         in: query
 *         description: Filter by compliance level
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *       - name: has_seasonal_restrictions
 *         in: query
 *         description: Filter by seasonal restrictions presence
 *         schema:
 *           type: boolean
 *       - name: search
 *         in: query
 *         description: Search in requirements and activities
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         description: Page number
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Items per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - name: sort_by
 *         in: query
 *         description: Sort field
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, compliance_level, min_age_requirement, max_rental_days, min_coverage_amount]
 *           default: created_at
 *       - name: sort_order
 *         in: query
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Category regulations retrieved successfully
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
 *                     $ref: '#/components/schemas/CategoryRegulation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_prev:
 *                       type: boolean
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/', CategoryRegulationController.getCategoryRegulations);

/**
 * @swagger
 * /api/v1/category-regulations:
 *   post:
 *     summary: Create a new category regulation
 *     description: Create a new category regulation for a specific category-country combination
 *     tags: [Category Regulations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRegulationRequest'
 *     responses:
 *       201:
 *         description: Category regulation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoryRegulation'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - validation errors or regulation already exists
 *       500:
 *         description: Internal server error
 */
router.post('/', createValidation, CategoryRegulationController.createCategoryRegulation);

/**
 * @swagger
 * /api/v1/category-regulations/{id}:
 *   get:
 *     summary: Get category regulation by ID
 *     description: Retrieve a specific category regulation by its ID
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryRegulationId'
 *     responses:
 *       200:
 *         description: Category regulation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoryRegulation'
 *       404:
 *         description: Category regulation not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', CategoryRegulationController.getCategoryRegulationById);

/**
 * @swagger
 * /api/v1/category-regulations/{id}:
 *   put:
 *     summary: Update category regulation
 *     description: Update an existing category regulation
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryRegulationId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_allowed:
 *                 type: boolean
 *               requires_license:
 *                 type: boolean
 *               license_type:
 *                 type: string
 *                 maxLength: 100
 *               min_age_requirement:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               max_rental_days:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *               special_requirements:
 *                 type: string
 *                 maxLength: 2000
 *               mandatory_insurance:
 *                 type: boolean
 *               min_coverage_amount:
 *                 type: number
 *                 format: decimal
 *               max_liability_amount:
 *                 type: number
 *                 format: decimal
 *               requires_background_check:
 *                 type: boolean
 *               prohibited_activities:
 *                 type: string
 *                 maxLength: 2000
 *               seasonal_restrictions:
 *                 type: object
 *               documentation_required:
 *                 type: array
 *                 items:
 *                   type: string
 *               compliance_level:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *     responses:
 *       200:
 *         description: Category regulation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoryRegulation'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request - validation errors
 *       404:
 *         description: Category regulation not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', updateValidation, CategoryRegulationController.updateCategoryRegulation);

/**
 * @swagger
 * /api/v1/category-regulations/{id}:
 *   delete:
 *     summary: Delete category regulation
 *     description: Soft delete a category regulation
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryRegulationId'
 *     responses:
 *       200:
 *         description: Category regulation deleted successfully
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
 *         description: Category regulation not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', CategoryRegulationController.deleteCategoryRegulation);

/**
 * @swagger
 * /api/v1/category-regulations/{id}/permanent:
 *   delete:
 *     summary: Permanently delete category regulation
 *     description: Permanently delete a category regulation (cannot be undone)
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryRegulationId'
 *     responses:
 *       200:
 *         description: Category regulation permanently deleted successfully
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
 *         description: Category regulation not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/permanent', CategoryRegulationController.permanentlyDeleteCategoryRegulation);

/**
 * @swagger
 * /api/v1/category-regulations/bulk:
 *   post:
 *     summary: Bulk operations for category regulations
 *     description: Perform bulk create, update, or delete operations
 *     tags: [Category Regulations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               regulations:
 *                 type: array
 *                 description: Array of regulations to create
 *                 items:
 *                   $ref: '#/components/schemas/CreateCategoryRegulationRequest'
 *               updates:
 *                 type: object
 *                 description: Bulk update operation
 *                 properties:
 *                   filters:
 *                     type: object
 *                     description: Filters to select regulations to update
 *                   data:
 *                     type: object
 *                     description: Data to update
 *               deletes:
 *                 type: object
 *                 description: Bulk delete operation
 *                 properties:
 *                   ids:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: uuid
 *                     description: Array of IDs to delete
 *                   filters:
 *                     type: object
 *                     description: Filters to select regulations to delete
 *     responses:
 *       200:
 *         description: Bulk operations completed successfully
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
 *                     created:
 *                       type: integer
 *                     updated:
 *                       type: integer
 *                     deleted:
 *                       type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/bulk', CategoryRegulationController.bulkOperations);

/**
 * @swagger
 * /api/v1/category-regulations/compliance/check:
 *   post:
 *     summary: Check compliance for category-country combination
 *     description: Check if a user/rental meets all regulatory requirements for a category in a specific country
 *     tags: [Category Regulations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComplianceCheckRequest'
 *     responses:
 *       200:
 *         description: Compliance check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceCheckResult'
 *       400:
 *         description: Bad request - validation errors
 *       500:
 *         description: Internal server error
 */
router.post('/compliance/check', complianceCheckValidation, CategoryRegulationController.checkCompliance);

/**
 * @swagger
 * /api/v1/category-regulations/stats:
 *   get:
 *     summary: Get category regulation statistics
 *     description: Get comprehensive statistics about category regulations across all countries and categories
 *     tags: [Category Regulations]
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoryRegulationStats'
 *       500:
 *         description: Internal server error
 */
router.get('/stats', CategoryRegulationController.getStats);

/**
 * @swagger
 * /api/v1/category-regulations/country/{countryId}/overview:
 *   get:
 *     summary: Get country regulation overview
 *     description: Get comprehensive overview of all regulations for a specific country
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CountryId'
 *     responses:
 *       200:
 *         description: Country regulation overview retrieved successfully
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
 *                     country_id:
 *                       type: string
 *                       format: uuid
 *                     country_code:
 *                       type: string
 *                     country_name:
 *                       type: string
 *                     total_regulations:
 *                       type: integer
 *                     allowed_categories:
 *                       type: integer
 *                     restricted_categories:
 *                       type: integer
 *                     prohibited_categories:
 *                       type: integer
 *                     licensing_requirements:
 *                       type: integer
 *                     insurance_requirements:
 *                       type: integer
 *                     compliance_breakdown:
 *                       type: object
 *                       properties:
 *                         LOW:
 *                           type: integer
 *                         MEDIUM:
 *                           type: integer
 *                         HIGH:
 *                           type: integer
 *                         CRITICAL:
 *                           type: integer
 *                     most_restrictive_categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category_id:
 *                             type: string
 *                             format: uuid
 *                           category_name:
 *                             type: string
 *                           compliance_level:
 *                             type: string
 *                           requires_license:
 *                             type: boolean
 *                           mandatory_insurance:
 *                             type: boolean
 *                     documentation_requirements:
 *                       type: array
 *                       items:
 *                         type: string
 *       404:
 *         description: No regulations found for this country
 *       500:
 *         description: Internal server error
 */
router.get('/country/:countryId/overview', CategoryRegulationController.getCountryRegulationOverview);

/**
 * @swagger
 * /api/v1/category-regulations/category/{categoryId}/overview:
 *   get:
 *     summary: Get category regulation overview
 *     description: Get comprehensive overview of all regulations for a specific category
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *     responses:
 *       200:
 *         description: Category regulation overview retrieved successfully
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
 *                     category_id:
 *                       type: string
 *                       format: uuid
 *                     category_name:
 *                       type: string
 *                     total_regulations:
 *                       type: integer
 *                     countries_allowed:
 *                       type: integer
 *                     countries_restricted:
 *                       type: integer
 *                     countries_prohibited:
 *                       type: integer
 *                     global_compliance_level:
 *                       type: string
 *                       enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                     licensing_countries:
 *                       type: array
 *                       items:
 *                         type: string
 *                     insurance_countries:
 *                       type: array
 *                       items:
 *                         type: string
 *                     most_restrictive_countries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           country_id:
 *                             type: string
 *                             format: uuid
 *                           country_code:
 *                             type: string
 *                           compliance_level:
 *                             type: string
 *                           restrictions:
 *                             type: array
 *                             items:
 *                               type: string
 *                     common_requirements:
 *                       type: object
 *                       properties:
 *                         min_age_range:
 *                           type: object
 *                           properties:
 *                             min:
 *                               type: integer
 *                             max:
 *                               type: integer
 *                         max_rental_days_range:
 *                           type: object
 *                           properties:
 *                             min:
 *                               type: integer
 *                             max:
 *                               type: integer
 *                         common_documents:
 *                           type: array
 *                           items:
 *                             type: string
 *       404:
 *         description: No regulations found for this category
 *       500:
 *         description: Internal server error
 */
router.get('/category/:categoryId/overview', CategoryRegulationController.getCategoryRegulationOverview);

/**
 * @swagger
 * /api/v1/category-regulations/category/{categoryId}:
 *   get:
 *     summary: Get regulations by category
 *     description: Get all regulations for a specific category
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *       - name: page
 *         in: query
 *         description: Page number
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Items per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - name: sort_by
 *         in: query
 *         description: Sort field
 *         schema:
 *           type: string
 *           default: created_at
 *       - name: sort_order
 *         in: query
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Regulations retrieved successfully
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
 *                     $ref: '#/components/schemas/CategoryRegulation'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Internal server error
 */
router.get('/category/:categoryId', CategoryRegulationController.getRegulationsByCategory);

/**
 * @swagger
 * /api/v1/category-regulations/country/{countryId}:
 *   get:
 *     summary: Get regulations by country
 *     description: Get all regulations for a specific country
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CountryId'
 *       - name: page
 *         in: query
 *         description: Page number
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: Items per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - name: sort_by
 *         in: query
 *         description: Sort field
 *         schema:
 *           type: string
 *           default: created_at
 *       - name: sort_order
 *         in: query
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Regulations retrieved successfully
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
 *                     $ref: '#/components/schemas/CategoryRegulation'
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Internal server error
 */
router.get('/country/:countryId', CategoryRegulationController.getRegulationsByCountry);

/**
 * @swagger
 * /api/v1/category-regulations/category/{categoryId}/country/{countryId}:
 *   get:
 *     summary: Find regulation for category-country combination
 *     description: Find the specific regulation for a category-country combination
 *     tags: [Category Regulations]
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryId'
 *       - $ref: '#/components/parameters/CountryId'
 *     responses:
 *       200:
 *         description: Regulation found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoryRegulation'
 *       404:
 *         description: No regulation found for this category-country combination
 *       500:
 *         description: Internal server error
 */
router.get('/category/:categoryId/country/:countryId', CategoryRegulationController.findRegulationForCategoryCountry);

export default router;
