// =====================================================
// REVIEW ROUTES
// =====================================================

import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';

const router = Router();
const reviewController = new ReviewController();

// =====================================================
// REVIEW CRUD OPERATIONS
// =====================================================

/**
 * @route POST /api/reviews
 * @desc Create a new review
 * @access Private
 * @body {CreateReviewData}
 * 
 * @example
 * POST /api/reviews
 * {
 *   "bookingId": "booking-123",
 *   "reviewerId": "user-456",
 *   "reviewedUserId": "user-789",
 *   "overallRating": 5,
 *   "communicationRating": 4,
 *   "conditionRating": 5,
 *   "valueRating": 4,
 *   "title": "Great experience!",
 *   "comment": "The item was exactly as described and the owner was very responsive."
 * }
 */
router.post('/', reviewController.createReview);

/**
 * @route GET /api/reviews/:id
 * @desc Get review by ID
 * @access Public
 * 
 * @example
 * GET /api/reviews/review-123
 */
router.get('/:id', reviewController.getReviewById);

/**
 * @route PUT /api/reviews/:id
 * @desc Update a review
 * @access Private (reviewer only)
 * @body {UpdateReviewData}
 * 
 * @example
 * PUT /api/reviews/review-123
 * {
 *   "overallRating": 4,
 *   "comment": "Updated review comment"
 * }
 */
router.put('/:id', reviewController.updateReview);

/**
 * @route DELETE /api/reviews/:id
 * @desc Delete a review
 * @access Private (reviewer only, within 24 hours)
 * 
 * @example
 * DELETE /api/reviews/review-123
 */
router.delete('/:id', reviewController.deleteReview);

// =====================================================
// REVIEW SEARCH AND FILTERING
// =====================================================

/**
 * @route GET /api/reviews
 * @desc Find reviews with filters and pagination
 * @access Public
 * @query {ReviewSearchParams}
 * 
 * @example
 * GET /api/reviews?page=1&limit=10&overallRating=5&moderationStatus=approved
 * GET /api/reviews?reviewedUserId=user-123&sortBy=createdAt&sortOrder=desc
 * GET /api/reviews?search=great%20experience&overallRatingMin=4
 */
router.get('/', reviewController.findReviews);

// =====================================================
// REVIEW RELATIONSHIPS
// =====================================================

/**
 * @route GET /api/reviews/booking/:bookingId
 * @desc Get all reviews for a specific booking
 * @access Public
 * 
 * @example
 * GET /api/reviews/booking/booking-123
 */
router.get('/booking/:bookingId', reviewController.getReviewsForBooking);

/**
 * @route GET /api/reviews/reviewer/:reviewerId
 * @desc Get all reviews by a specific reviewer
 * @access Public
 * 
 * @example
 * GET /api/reviews/reviewer/user-456
 */
router.get('/reviewer/:reviewerId', reviewController.getReviewsByReviewer);

/**
 * @route GET /api/reviews/user/:userId
 * @desc Get all reviews for a specific user (being reviewed)
 * @access Public
 * 
 * @example
 * GET /api/reviews/user/user-789
 */
router.get('/user/:userId', reviewController.getReviewsForUser);

// =====================================================
// REVIEW RESPONSES
// =====================================================

/**
 * @route POST /api/reviews/:id/response
 * @desc Add a response to a review
 * @access Private (reviewed user only)
 * @body {response: string}
 * 
 * @example
 * POST /api/reviews/review-123/response
 * {
 *   "response": "Thank you for the great review! It was a pleasure working with you."
 * }
 */
router.post('/:id/response', reviewController.addReviewResponse);

// =====================================================
// MODERATION ROUTES
// =====================================================

/**
 * @route GET /api/reviews/moderation/queue
 * @desc Get moderation queue (flagged and pending reviews)
 * @access Private (moderators only)
 * 
 * @example
 * GET /api/reviews/moderation/queue
 */
router.get('/moderation/queue', reviewController.getModerationQueue);

/**
 * @route POST /api/reviews/:id/moderate
 * @desc Moderate a review (approve/reject/flag)
 * @access Private (moderators only)
 * @body {ModerationAction}
 * 
 * @example
 * POST /api/reviews/review-123/moderate
 * {
 *   "action": "approved",
 *   "notes": "Review meets community guidelines"
 * }
 */
router.post('/:id/moderate', reviewController.moderateReview);

/**
 * @route POST /api/reviews/moderation/bulk
 * @desc Bulk moderate multiple reviews
 * @access Private (moderators only)
 * @body {actions: ModerationAction[]}
 * 
 * @example
 * POST /api/reviews/moderation/bulk
 * {
 *   "actions": [
 *     {
 *       "reviewId": "review-123",
 *       "action": "approved"
 *     },
 *     {
 *       "reviewId": "review-456",
 *       "action": "rejected",
 *       "notes": "Violates community guidelines"
 *     }
 *   ]
 * }
 */
router.post('/moderation/bulk', reviewController.bulkModerateReviews);

// =====================================================
// ANALYTICS ROUTES
// =====================================================

/**
 * @route GET /api/reviews/analytics/user/:userId
 * @desc Get review analytics for a specific user
 * @access Public
 * 
 * @example
 * GET /api/reviews/analytics/user/user-789
 * 
 * Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "userId": "user-789",
 *     "totalReviews": 25,
 *     "approvedReviews": 23,
 *     "avgOverallRating": 4.6,
 *     "avgCommunicationRating": 4.8,
 *     "responsesCount": 18,
 *     "verifiedReviewsCount": 20
 *   }
 * }
 */
router.get('/analytics/user/:userId', reviewController.getUserReviewAnalytics);

/**
 * @route GET /api/reviews/analytics/stats
 * @desc Get review statistics and trends
 * @access Public
 * @query Optional filters (same as /api/reviews)
 * 
 * @example
 * GET /api/reviews/analytics/stats
 * GET /api/reviews/analytics/stats?createdAfter=2024-01-01&moderationStatus=approved
 * 
 * Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "totalReviews": 1250,
 *     "averageRating": 4.3,
 *     "ratingDistribution": {
 *       "1": 25,
 *       "2": 50,
 *       "3": 125,
 *       "4": 400,
 *       "5": 650
 *     },
 *     "moderationStatusBreakdown": {
 *       "approved": 1100,
 *       "pending": 100,
 *       "rejected": 30,
 *       "flagged": 20
 *     },
 *     "responseRate": 0.72,
 *     "monthlyTrends": [...]
 *   }
 * }
 */
router.get('/analytics/stats', reviewController.getReviewStats);

// =====================================================
// ROUTE ORDER NOTICE
// =====================================================
/*
 * IMPORTANT: Route order matters in Express!
 * 
 * More specific routes (like /moderation/queue, /analytics/stats) 
 * must be defined BEFORE parameterized routes (like /:id)
 * 
 * Current order:
 * 1. POST /             (create review)
 * 2. GET /              (search reviews)  
 * 3. GET /booking/:bookingId
 * 4. GET /reviewer/:reviewerId
 * 5. GET /user/:userId
 * 6. GET /moderation/queue
 * 7. POST /moderation/bulk
 * 8. GET /analytics/user/:userId
 * 9. GET /analytics/stats
 * 10. GET /:id          (get review by id)
 * 11. PUT /:id          (update review)
 * 12. DELETE /:id       (delete review)
 * 13. POST /:id/response
 * 14. POST /:id/moderate
 */

export default router;
