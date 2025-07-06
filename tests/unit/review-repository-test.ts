// =====================================================
// REVIEW REPOSITORY TESTS
// =====================================================

import { ReviewRepository } from '../src/repositories/ReviewRepository';
import { 
  CreateReviewData, 
  UpdateReviewData, 
  ReviewFilters,
  ModerationStatus 
} from '../src/types/review.types';

/**
 * Test suite for ReviewRepository
 */
class ReviewRepositoryTest {
  private repository: ReviewRepository;

  constructor() {
    this.repository = new ReviewRepository();
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Review Repository Tests...\n');

    try {
      // Clear repository before testing
      await this.repository.clearAll();
      
      await this.testBasicCrud();
      await this.testFiltering();
      await this.testRelationships();
      await this.testModeration();
      await this.testAnalytics();
      await this.testEdgeCases();

      console.log('✅ All Review Repository tests passed!');
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  /**
   * Test basic CRUD operations
   */
  private async testBasicCrud(): Promise<void> {
    console.log('📝 Testing Basic CRUD Operations...');

    // Test Create
    const reviewData: CreateReviewData = {
      bookingId: 'booking-001',
      reviewerId: 'reviewer-001',
      reviewedUserId: 'owner-001',
      overallRating: 5,
      communicationRating: 4,
      conditionRating: 5,
      valueRating: 4,
      title: 'Excellent experience!',
      comment: 'The camera was in perfect condition and the owner was very responsive.'
    };

    const createdReview = await this.repository.create(reviewData);
    console.log('  ✓ Create review');
    
    if (!createdReview.id || typeof createdReview.id !== 'string') {
      throw new Error('Created review should have a valid ID');
    }

    // Test Read
    const foundReview = await this.repository.findById(createdReview.id);
    console.log('  ✓ Find review by ID');
    
    if (!foundReview || foundReview.id !== createdReview.id) {
      throw new Error('Should find the created review');
    }

    // Test Update
    const updateData: UpdateReviewData = {
      overallRating: 4,
      comment: 'Updated comment: Good experience overall.'
    };

    const updatedReview = await this.repository.update(createdReview.id, updateData);
    console.log('  ✓ Update review');
    
    if (!updatedReview || updatedReview.overallRating !== 4) {
      throw new Error('Review should be updated with new rating');
    }

    // Test Delete
    const deleted = await this.repository.hardDelete(createdReview.id);
    console.log('  ✓ Delete review');
    
    if (!deleted) {
      throw new Error('Should successfully delete review');
    }

    const deletedReview = await this.repository.findById(createdReview.id);
    if (deletedReview) {
      throw new Error('Deleted review should not be found');
    }

    console.log('  ✅ Basic CRUD tests passed\n');
  }

  /**
   * Test filtering functionality
   */
  private async testFiltering(): Promise<void> {
    console.log('🔍 Testing Filtering...');

    // Create test reviews
    const reviews = await Promise.all([
      this.repository.create({
        bookingId: 'booking-filter-001',
        reviewerId: 'reviewer-filter-001',
        reviewedUserId: 'owner-filter-001',
        overallRating: 5,
        title: 'Amazing product!',
        comment: 'Loved it!'
      }),
      this.repository.create({
        bookingId: 'booking-filter-002',
        reviewerId: 'reviewer-filter-002',
        reviewedUserId: 'owner-filter-001',
        overallRating: 3,
        title: 'Average experience',
        comment: 'It was okay.'
      }),
      this.repository.create({
        bookingId: 'booking-filter-003',
        reviewerId: 'reviewer-filter-001',
        reviewedUserId: 'owner-filter-002',
        overallRating: 4,
        title: 'Good quality',
        comment: 'Pretty good overall.'
      })
    ]);

    // Test filter by reviewer
    const reviewerFilter: ReviewFilters = { reviewerId: 'reviewer-filter-001' };
    const reviewerResults = await this.repository.findAll(reviewerFilter);
    console.log('  ✓ Filter by reviewer');
    
    if (reviewerResults.length !== 2) {
      throw new Error(`Expected 2 reviews by reviewer, got ${reviewerResults.length}`);
    }

    // Test filter by reviewed user
    const reviewedUserFilter: ReviewFilters = { reviewedUserId: 'owner-filter-001' };
    const reviewedUserResults = await this.repository.findAll(reviewedUserFilter);
    console.log('  ✓ Filter by reviewed user');
    
    if (reviewedUserResults.length !== 2) {
      throw new Error(`Expected 2 reviews for user, got ${reviewedUserResults.length}`);
    }

    // Test filter by rating
    const ratingFilter: ReviewFilters = { overallRating: [4, 5] };
    const ratingResults = await this.repository.findAll(ratingFilter);
    console.log('  ✓ Filter by rating');
    
    if (ratingResults.length !== 2) {
      throw new Error(`Expected 2 reviews with ratings 4-5, got ${ratingResults.length}`);
    }

    // Test rating range
    const rangeFilter: ReviewFilters = { overallRatingMin: 4 };
    const rangeResults = await this.repository.findAll(rangeFilter);
    console.log('  ✓ Filter by rating range');
    
    if (rangeResults.length !== 2) {
      throw new Error(`Expected 2 reviews with rating >= 4, got ${rangeResults.length}`);
    }

    // Clean up
    for (const review of reviews) {
      await this.repository.hardDelete(review.id);
    }

    console.log('  ✅ Filtering tests passed\n');
  }

  /**
   * Test relationship methods
   */
  private async testRelationships(): Promise<void> {
    console.log('🔗 Testing Relationships...');

    // Create test reviews
    const reviews = await Promise.all([
      this.repository.create({
        bookingId: 'booking-rel-001',
        reviewerId: 'reviewer-rel-001',
        reviewedUserId: 'owner-rel-001',
        overallRating: 5
      }),
      this.repository.create({
        bookingId: 'booking-rel-001',
        reviewerId: 'reviewer-rel-002',
        reviewedUserId: 'owner-rel-001',
        overallRating: 4
      }),
      this.repository.create({
        bookingId: 'booking-rel-002',
        reviewerId: 'reviewer-rel-001',
        reviewedUserId: 'owner-rel-002',
        overallRating: 3
      })
    ]);

    // Test findByBookingId
    const bookingReviews = await this.repository.findByBookingId('booking-rel-001');
    console.log('  ✓ Find by booking ID');
    
    if (bookingReviews.length !== 2) {
      throw new Error(`Expected 2 reviews for booking, got ${bookingReviews.length}`);
    }

    // Test findByReviewerId
    const reviewerReviews = await this.repository.findByReviewerId('reviewer-rel-001');
    console.log('  ✓ Find by reviewer ID');
    
    if (reviewerReviews.length !== 2) {
      throw new Error(`Expected 2 reviews by reviewer, got ${reviewerReviews.length}`);
    }

    // Test findByReviewedUserId
    const userReviews = await this.repository.findByReviewedUserId('owner-rel-001');
    console.log('  ✓ Find by reviewed user ID');
    
    if (userReviews.length !== 2) {
      throw new Error(`Expected 2 reviews for user, got ${userReviews.length}`);
    }

    // Clean up
    for (const review of reviews) {
      await this.repository.hardDelete(review.id);
    }

    console.log('  ✅ Relationship tests passed\n');
  }

  /**
   * Test moderation functionality
   */
  private async testModeration(): Promise<void> {
    console.log('⚖️ Testing Moderation...');

    // Create test reviews with different moderation statuses
    const baseReviews = await Promise.all([
      this.repository.create({
        bookingId: 'booking-mod-001',
        reviewerId: 'reviewer-mod-001',
        reviewedUserId: 'owner-mod-001',
        overallRating: 5
      }),
      this.repository.create({
        bookingId: 'booking-mod-002',
        reviewerId: 'reviewer-mod-002',
        reviewedUserId: 'owner-mod-001',
        overallRating: 2
      }),
      this.repository.create({
        bookingId: 'booking-mod-003',
        reviewerId: 'reviewer-mod-003',
        reviewedUserId: 'owner-mod-001',
        overallRating: 4
      })
    ]);

    // Update moderation statuses
    const reviews = await Promise.all([
      this.repository.update(baseReviews[0].id, { moderationStatus: 'pending' }),
      this.repository.update(baseReviews[1].id, { 
        moderationStatus: 'flagged' as ModerationStatus, 
        isFlagged: true 
      }),
      this.repository.update(baseReviews[2].id, { moderationStatus: 'approved' })
    ]);

    // Test moderation queue
    const queue = await this.repository.getModerationQueue();
    console.log('  ✓ Get moderation queue');
    
    if (queue.length !== 2) {
      throw new Error(`Expected 2 items in moderation queue, got ${queue.length}`);
    }

    // Verify flagged item comes first
    if (!queue[0].isFlagged) {
      throw new Error('Flagged review should be first in queue');
    }

    // Test moderation status update
    const moderatedReview = await this.repository.update(reviews[0]!.id, {
      moderationStatus: 'approved' as ModerationStatus,
      moderatedBy: 'moderator-001',
      moderatedAt: new Date()
    });
    console.log('  ✓ Update moderation status');
    
    if (!moderatedReview || moderatedReview.moderationStatus !== 'approved') {
      throw new Error('Review moderation status should be updated');
    }

    // Verify queue is reduced
    const updatedQueue = await this.repository.getModerationQueue();
    if (updatedQueue.length !== 1) {
      throw new Error(`Expected 1 item in updated queue, got ${updatedQueue.length}`);
    }

    // Clean up
    for (const review of reviews) {
      if (review) {
        await this.repository.hardDelete(review.id);
      }
    }

    console.log('  ✅ Moderation tests passed\n');
  }

  /**
   * Test analytics functionality
   */
  private async testAnalytics(): Promise<void> {
    console.log('📊 Testing Analytics...');

    // Create test reviews for analytics
    const baseAnalyticsReviews = await Promise.all([
      this.repository.create({
        bookingId: 'booking-analytics-001',
        reviewerId: 'reviewer-analytics-001',
        reviewedUserId: 'user-analytics-001',
        overallRating: 5,
        communicationRating: 5,
        conditionRating: 4,
        valueRating: 5
      }),
      this.repository.create({
        bookingId: 'booking-analytics-002',
        reviewerId: 'reviewer-analytics-002',
        reviewedUserId: 'user-analytics-001',
        overallRating: 4,
        communicationRating: 4,
        conditionRating: 4,
        valueRating: 4
      }),
      this.repository.create({
        bookingId: 'booking-analytics-003',
        reviewerId: 'reviewer-analytics-003',
        reviewedUserId: 'user-analytics-001',
        overallRating: 3
      })
    ]);

    // Update the reviews with moderation status and responses
    const reviews = await Promise.all([
      this.repository.update(baseAnalyticsReviews[0].id, { 
        moderationStatus: 'approved',
        response: 'Thank you!'
      }),
      this.repository.update(baseAnalyticsReviews[1].id, { 
        moderationStatus: 'approved'
      }),
      this.repository.update(baseAnalyticsReviews[2].id, { 
        moderationStatus: 'flagged',
        isFlagged: true
      })
    ]);

    // Test user analytics
    const userAnalytics = await this.repository.getUserAnalytics('user-analytics-001');
    console.log('  ✓ Get user analytics');
    
    if (!userAnalytics) {
      throw new Error('User analytics should not be null');
    }
    
    if (userAnalytics.totalReviews !== 3) {
      throw new Error(`Expected 3 total reviews, got ${userAnalytics.totalReviews}`);
    }
    
    if (userAnalytics.approvedReviews !== 2) {
      throw new Error(`Expected 2 approved reviews, got ${userAnalytics.approvedReviews}`);
    }
    
    if (userAnalytics.flaggedReviews !== 1) {
      throw new Error(`Expected 1 flagged review, got ${userAnalytics.flaggedReviews}`);
    }
    
    if (userAnalytics.responsesCount !== 1) {
      throw new Error(`Expected 1 response, got ${userAnalytics.responsesCount}`);
    }

    // Test system stats
    const stats = await this.repository.getReviewStats();
    console.log('  ✓ Get review stats');
    
    if (stats.totalReviews < 3) {
      throw new Error(`Expected at least 3 reviews in stats, got ${stats.totalReviews}`);
    }
    
    if (typeof stats.averageRating !== 'number') {
      throw new Error('Average rating should be a number');
    }
    
    if (!stats.ratingDistribution || typeof stats.ratingDistribution !== 'object') {
      throw new Error('Rating distribution should be an object');
    }

    // Clean up
    for (const review of reviews) {
      if (review) {
        await this.repository.hardDelete(review.id);
      }
    }

    console.log('  ✅ Analytics tests passed\n');
  }

  /**
   * Test edge cases and error conditions
   */
  private async testEdgeCases(): Promise<void> {
    console.log('🔬 Testing Edge Cases...');

    // Test non-existent ID
    const nonExistent = await this.repository.findById('non-existent-id');
    console.log('  ✓ Handle non-existent ID');
    
    if (nonExistent !== null) {
      throw new Error('Non-existent review should return null');
    }

    // Test update non-existent
    const updateResult = await this.repository.update('non-existent-id', { overallRating: 3 });
    console.log('  ✓ Handle update non-existent');
    
    if (updateResult !== null) {
      throw new Error('Update non-existent should return null');
    }

    // Test delete non-existent
    const deleteResult = await this.repository.hardDelete('non-existent-id');
    console.log('  ✓ Handle delete non-existent');
    
    if (deleteResult !== false) {
      throw new Error('Delete non-existent should return false');
    }

    // Test empty filters
    const emptyFilterResults = await this.repository.findAll({});
    console.log('  ✓ Handle empty filters');
    
    if (!Array.isArray(emptyFilterResults)) {
      throw new Error('Empty filters should return array');
    }

    // Test invalid rating ranges
    const invalidRangeResults = await this.repository.findAll({
      overallRatingMin: 5,
      overallRatingMax: 1 // Invalid range
    });
    console.log('  ✓ Handle invalid rating range');
    
    if (!Array.isArray(invalidRangeResults)) {
      throw new Error('Invalid range should return empty array');
    }

    console.log('  ✅ Edge case tests passed\n');
  }
}

/**
 * Run the test suite
 */
async function runTests(): Promise<void> {
  const tester = new ReviewRepositoryTest();
  await tester.runAllTests();
}

// Export for use in other test files
export { ReviewRepositoryTest, runTests };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('\n🎉 All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Tests failed:', error.message);
      process.exit(1);
    });
}
