// =====================================================
// VERIFICATION DOCUMENT TYPE ROUTES
// =====================================================

import { Router } from 'express';
import { VerificationDocumentTypeController } from '@/controllers/verificationDocumentType.controller';
import { requireRole } from '@/middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Verification Document Types
 *   description: Country-specific verification document type management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VerificationDocumentType:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier
 *         country_id:
 *           type: string
 *           format: uuid
 *           description: Country this document type belongs to
 *         document_type:
 *           type: string
 *           description: Type of document (national_id, passport, etc.)
 *         local_name:
 *           type: string
 *           description: Local name for the document in country language
 *         is_required:
 *           type: boolean
 *           description: Whether this document is required for verification
 *         validation_regex:
 *           type: string
 *           description: Regex pattern for document number validation
 *         format_example:
 *           type: string
 *           description: Example of valid document format
 *         description:
 *           type: string
 *           description: Description of the document type
 *         min_length:
 *           type: integer
 *           description: Minimum length of document number
 *         max_length:
 *           type: integer
 *           description: Maximum length of document number
 *         is_active:
 *           type: boolean
 *           description: Whether the document type is active
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required:
 *         - id
 *         - country_id
 *         - document_type
 *         - is_required
 *         - is_active
 *         - created_at
 *         - updated_at
 *     
 *     CreateVerificationDocumentTypeRequest:
 *       type: object
 *       properties:
 *         country_id:
 *           type: string
 *           format: uuid
 *           description: Country this document type belongs to
 *         document_type:
 *           type: string
 *           description: Type of document (national_id, passport, etc.)
 *         local_name:
 *           type: string
 *           description: Local name for the document in country language
 *         is_required:
 *           type: boolean
 *           description: Whether this document is required for verification
 *         validation_regex:
 *           type: string
 *           description: Regex pattern for document number validation
 *         format_example:
 *           type: string
 *           description: Example of valid document format
 *         description:
 *           type: string
 *           description: Description of the document type
 *         min_length:
 *           type: integer
 *           description: Minimum length of document number
 *         max_length:
 *           type: integer
 *           description: Maximum length of document number
 *         is_active:
 *           type: boolean
 *           description: Whether the document type is active
 *       required:
 *         - country_id
 *         - document_type
 *     
 *     UpdateVerificationDocumentTypeRequest:
 *       type: object
 *       properties:
 *         local_name:
 *           type: string
 *           description: Local name for the document in country language
 *         is_required:
 *           type: boolean
 *           description: Whether this document is required for verification
 *         validation_regex:
 *           type: string
 *           description: Regex pattern for document number validation
 *         format_example:
 *           type: string
 *           description: Example of valid document format
 *         description:
 *           type: string
 *           description: Description of the document type
 *         min_length:
 *           type: integer
 *           description: Minimum length of document number
 *         max_length:
 *           type: integer
 *           description: Maximum length of document number
 *         is_active:
 *           type: boolean
 *           description: Whether the document type is active
 */

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

/**
 * @swagger
 * /api/v1/verification-document-types:
 *   get:
 *     summary: Get all verification document types
 *     tags: [Verification Document Types]
 *     parameters:
 *       - in: query
 *         name: country_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by country ID
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *         description: Filter by document type
 *       - in: query
 *         name: is_required
 *         schema:
 *           type: boolean
 *         description: Filter by required status
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Verification document types retrieved successfully
 */
router.get('/', VerificationDocumentTypeController.getDocumentTypes);

/**
 * @swagger
 * /api/v1/verification-document-types/search:
 *   get:
 *     summary: Search verification document types
 *     tags: [Verification Document Types]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: country_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by country ID
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', VerificationDocumentTypeController.searchDocumentTypes);

/**
 * @swagger
 * /api/v1/verification-document-types/common:
 *   get:
 *     summary: Get common document types
 *     tags: [Verification Document Types]
 *     responses:
 *       200:
 *         description: Common document types retrieved successfully
 */
router.get('/common', VerificationDocumentTypeController.getCommonDocumentTypes);

/**
 * @swagger
 * /api/v1/verification-document-types/countries/{countryId}:
 *   get:
 *     summary: Get verification document types by country
 *     tags: [Verification Document Types]
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country document types retrieved successfully
 */
router.get('/countries/:countryId', VerificationDocumentTypeController.getDocumentTypesByCountry);

/**
 * @swagger
 * /api/v1/verification-document-types/countries/{countryId}/required:
 *   get:
 *     summary: Get required document types for a country
 *     tags: [Verification Document Types]
 *     parameters:
 *       - in: path
 *         name: countryId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Required document types retrieved successfully
 */
router.get('/countries/:countryId/required', VerificationDocumentTypeController.getRequiredDocuments);

/**
 * @swagger
 * /api/v1/verification-document-types/types/{documentType}:
 *   get:
 *     summary: Get all document types for a specific type across countries
 *     tags: [Verification Document Types]
 *     parameters:
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *         description: Document type name
 *     responses:
 *       200:
 *         description: Document types retrieved successfully
 */
router.get('/types/:documentType', VerificationDocumentTypeController.getDocumentTypesByType);

/**
 * @swagger
 * /api/v1/verification-document-types/validate:
 *   post:
 *     summary: Validate document number
 *     tags: [Verification Document Types]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country_id
 *               - document_type
 *               - document_number
 *             properties:
 *               country_id:
 *                 type: string
 *                 format: uuid
 *               document_type:
 *                 type: string
 *               document_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document validation result
 */
router.post('/validate', VerificationDocumentTypeController.validateDocument);

/**
 * @swagger
 * /api/v1/verification-document-types/{id}:
 *   get:
 *     summary: Get verification document type by ID
 *     tags: [Verification Document Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Verification document type ID
 *     responses:
 *       200:
 *         description: Verification document type retrieved successfully
 */
router.get('/:id', VerificationDocumentTypeController.getDocumentTypeById);

// =====================================================
// ADMIN-ONLY ROUTES (Requires admin role)
// =====================================================

/**
 * @swagger
 * /api/v1/verification-document-types:
 *   post:
 *     summary: Create a new verification document type
 *     tags: [Verification Document Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVerificationDocumentTypeRequest'
 *     responses:
 *       201:
 *         description: Verification document type created successfully
 */
router.post('/', requireRole(['admin']), VerificationDocumentTypeController.createDocumentType);

/**
 * @swagger
 * /api/v1/verification-document-types/{id}:
 *   put:
 *     summary: Update verification document type
 *     tags: [Verification Document Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Verification document type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateVerificationDocumentTypeRequest'
 *     responses:
 *       200:
 *         description: Verification document type updated successfully
 */
router.put('/:id', requireRole(['admin']), VerificationDocumentTypeController.updateDocumentType);

/**
 * @swagger
 * /api/v1/verification-document-types/{id}:
 *   delete:
 *     summary: Delete verification document type
 *     tags: [Verification Document Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Verification document type ID
 *     responses:
 *       200:
 *         description: Verification document type deleted successfully
 */
router.delete('/:id', requireRole(['admin']), VerificationDocumentTypeController.deleteDocumentType);

/**
 * @swagger
 * /api/v1/verification-document-types/stats:
 *   get:
 *     summary: Get verification document type statistics
 *     tags: [Verification Document Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: country_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by country ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats', requireRole(['admin']), VerificationDocumentTypeController.getDocumentTypeStats);

/**
 * @swagger
 * /api/v1/verification-document-types/bulk/status:
 *   patch:
 *     summary: Bulk activate/deactivate document types
 *     tags: [Verification Document Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - is_active
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Bulk status update completed
 */
router.patch('/bulk/status', requireRole(['admin']), VerificationDocumentTypeController.bulkUpdateStatus);

export default router;
