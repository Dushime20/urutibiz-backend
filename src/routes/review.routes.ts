// =====================================================
// REVIEW ROUTES
// =====================================================

import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { requireAuth } from '@/middleware/auth.middleware';

const router = Router();
const reviewController = new ReviewController();

// Authenticated shortcuts for current user (declare BEFORE param routes)
router.get('/mine/written', requireAuth, reviewController.getMyWrittenReviews);
router.get('/mine/received', requireAuth, reviewController.getMyReceivedReviews);

// Create a new review (requires authentication)
router.post('/', requireAuth, reviewController.createReview);

// Get reviews for a specific product (must be before /:id route to avoid conflicts)
router.get('/product/:productId', reviewController.getReviewsByProduct);

// Get review by ID
router.get('/:id', requireAuth, reviewController.getReviewById);

// Update a review
router.put('/:id', requireAuth, reviewController.updateReview);

// Delete a review
router.delete('/:id', requireAuth, reviewController.deleteReview);

// Get reviews by reviewer (user who wrote the reviews)
router.get('/reviewer/:reviewerId', reviewController.getReviewsByReviewer);

// Get reviews for user (user being reviewed)
router.get('/user/:userId', reviewController.getReviewsForUser);

// Get reviews for a specific booking
router.get('/booking/:bookingId', reviewController.getReviewsForBooking);

// Add response to a review
router.post('/:id/response', requireAuth, reviewController.addReviewResponse);

// Get moderation queue (admin only)
router.get('/moderation/queue', requireAuth, reviewController.getModerationQueue);

// Moderate a review (admin only)
router.put('/moderation/:id', requireAuth, reviewController.moderateReview);

// Bulk moderate reviews (admin only)
router.put('/moderation/bulk', requireAuth, reviewController.bulkModerateReviews);

// Get user review analytics
router.get('/analytics/user/:userId', reviewController.getUserReviewAnalytics);

// Get review statistics
router.get('/stats', reviewController.getReviewStats);

export default router;
