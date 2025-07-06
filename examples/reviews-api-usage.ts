// =====================================================
// REVIEWS API USAGE EXAMPLES
// =====================================================

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// =====================================================
// BASIC REVIEW OPERATIONS
// =====================================================

/**
 * Create a new review
 */
async function createReview() {
  try {
    const reviewData = {
      bookingId: 'booking-123',
      reviewerId: 'user-456', 
      reviewedUserId: 'user-789',
      overallRating: 5,
      communicationRating: 4,
      conditionRating: 5,
      valueRating: 4,
      title: 'Excellent rental experience!',
      comment: 'The camera was in perfect condition and exactly as described. The owner was very responsive and helpful throughout the rental period. Highly recommended!'
    };

    const response = await axios.post(`${API_BASE_URL}/reviews`, reviewData);
    console.log('Review created:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error creating review:', error.response?.data || error.message);
  }
}

/**
 * Get a review by ID
 */
async function getReview(reviewId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/reviews/${reviewId}`);
    console.log('Review details:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting review:', error.response?.data || error.message);
  }
}

/**
 * Update a review
 */
async function updateReview(reviewId: string) {
  try {
    const updates = {
      overallRating: 4,
      comment: 'Updated review: The camera was good but had some minor scratches that weren\'t mentioned in the description.'
    };

    const response = await axios.put(`${API_BASE_URL}/reviews/${reviewId}`, updates);
    console.log('Review updated:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error updating review:', error.response?.data || error.message);
  }
}

/**
 * Delete a review (within 24 hours)
 */
async function deleteReview(reviewId: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/reviews/${reviewId}`);
    console.log('Review deleted:', response.data);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting review:', error.response?.data || error.message);
  }
}

// =====================================================
// SEARCH AND FILTERING
// =====================================================

/**
 * Search reviews with filters
 */
async function searchReviews() {
  try {
    const params = {
      page: 1,
      limit: 10,
      overallRatingMin: 4,
      moderationStatus: 'approved',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const response = await axios.get(`${API_BASE_URL}/reviews`, { params });
    console.log('Search results:', response.data);
    return {
      reviews: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    console.error('Error searching reviews:', error.response?.data || error.message);
  }
}

/**
 * Get reviews for a specific user
 */
async function getUserReviews(userId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/reviews/user/${userId}`);
    console.log(`Reviews for user ${userId}:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting user reviews:', error.response?.data || error.message);
  }
}

/**
 * Get reviews for a booking
 */
async function getBookingReviews(bookingId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/reviews/booking/${bookingId}`);
    console.log(`Reviews for booking ${bookingId}:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting booking reviews:', error.response?.data || error.message);
  }
}

// =====================================================
// REVIEW RESPONSES
// =====================================================

/**
 * Add a response to a review
 */
async function addReviewResponse(reviewId: string) {
  try {
    const responseData = {
      response: 'Thank you for the honest feedback! I\'ve noted your comments about the scratches and will update the item description. I appreciate your business and hope to work with you again in the future.'
    };

    const response = await axios.post(`${API_BASE_URL}/reviews/${reviewId}/response`, responseData);
    console.log('Response added:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error adding response:', error.response?.data || error.message);
  }
}

// =====================================================
// MODERATION (ADMIN/MODERATOR ONLY)
// =====================================================

/**
 * Get moderation queue
 */
async function getModerationQueue() {
  try {
    const response = await axios.get(`${API_BASE_URL}/reviews/moderation/queue`, {
      headers: {
        'Authorization': 'Bearer MODERATOR_TOKEN' // Replace with actual token
      }
    });
    console.log('Moderation queue:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting moderation queue:', error.response?.data || error.message);
  }
}

/**
 * Moderate a review
 */
async function moderateReview(reviewId: string, action: 'approved' | 'rejected' | 'flagged') {
  try {
    const moderationData = {
      action,
      notes: action === 'rejected' ? 'Content violates community guidelines' : 'Review meets standards'
    };

    const response = await axios.post(`${API_BASE_URL}/reviews/${reviewId}/moderate`, moderationData, {
      headers: {
        'Authorization': 'Bearer MODERATOR_TOKEN' // Replace with actual token
      }
    });
    console.log('Review moderated:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error moderating review:', error.response?.data || error.message);
  }
}

/**
 * Bulk moderate reviews
 */
async function bulkModerateReviews() {
  try {
    const actions = [
      {
        reviewId: 'review-001',
        action: 'approved'
      },
      {
        reviewId: 'review-002', 
        action: 'rejected',
        notes: 'Inappropriate language'
      },
      {
        reviewId: 'review-003',
        action: 'approved'
      }
    ];

    const response = await axios.post(`${API_BASE_URL}/reviews/moderation/bulk`, { actions }, {
      headers: {
        'Authorization': 'Bearer MODERATOR_TOKEN' // Replace with actual token
      }
    });
    console.log('Bulk moderation results:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error bulk moderating:', error.response?.data || error.message);
  }
}

// =====================================================
// ANALYTICS
// =====================================================

/**
 * Get user review analytics
 */
async function getUserAnalytics(userId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/reviews/analytics/user/${userId}`);
    console.log(`Analytics for user ${userId}:`, response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting user analytics:', error.response?.data || error.message);
  }
}

/**
 * Get system review statistics
 */
async function getReviewStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/reviews/analytics/stats`);
    console.log('Review statistics:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting review stats:', error.response?.data || error.message);
  }
}

/**
 * Get filtered review statistics
 */
async function getFilteredStats() {
  try {
    const params = {
      createdAfter: '2024-01-01',
      moderationStatus: 'approved',
      overallRatingMin: 4
    };

    const response = await axios.get(`${API_BASE_URL}/reviews/analytics/stats`, { params });
    console.log('Filtered statistics:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting filtered stats:', error.response?.data || error.message);
  }
}

// =====================================================
// ADVANCED FILTERING EXAMPLES
// =====================================================

/**
 * Complex search with multiple filters
 */
async function advancedSearch() {
  try {
    const params = {
      page: 1,
      limit: 20,
      search: 'camera excellent',
      overallRatingMin: 4,
      overallRatingMax: 5,
      moderationStatus: 'approved',
      hasResponse: true,
      sentimentScoreMin: 0.5,
      toxicityScoreMax: 0.2,
      createdAfter: '2024-01-01',
      sortBy: 'overallRating',
      sortOrder: 'desc'
    };

    const response = await axios.get(`${API_BASE_URL}/reviews`, { params });
    console.log('Advanced search results:', response.data);
    return {
      reviews: response.data.data,
      pagination: response.data.pagination
    };
  } catch (error) {
    console.error('Error in advanced search:', error.response?.data || error.message);
  }
}

/**
 * Get flagged reviews for manual review
 */
async function getFlaggedReviews() {
  try {
    const params = {
      isFlagged: true,
      moderationStatus: 'pending',
      sortBy: 'aiToxicityScore',
      sortOrder: 'desc'
    };

    const response = await axios.get(`${API_BASE_URL}/reviews`, { params });
    console.log('Flagged reviews:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('Error getting flagged reviews:', error.response?.data || error.message);
  }
}

// =====================================================
// EXAMPLE WORKFLOW
// =====================================================

/**
 * Complete review workflow example
 */
async function exampleWorkflow() {
  console.log('=== Review System Example Workflow ===');

  // 1. Create a review
  console.log('\n1. Creating a review...');
  const newReview = await createReview();
  if (!newReview) return;

  // 2. Get the review details
  console.log('\n2. Getting review details...');
  await getReview(newReview.id);

  // 3. Add a response
  console.log('\n3. Adding a response...');
  await addReviewResponse(newReview.id);

  // 4. Search for reviews
  console.log('\n4. Searching reviews...');
  await searchReviews();

  // 5. Get user analytics
  console.log('\n5. Getting user analytics...');
  await getUserAnalytics(newReview.reviewedUserId);

  // 6. Get system statistics
  console.log('\n6. Getting system statistics...');
  await getReviewStats();

  // 7. Moderate the review (admin function)
  console.log('\n7. Moderating review...');
  await moderateReview(newReview.id, 'approved');

  console.log('\n=== Workflow Complete ===');
}

// =====================================================
// ERROR HANDLING EXAMPLES
// =====================================================

/**
 * Example of handling common errors
 */
async function errorHandlingExamples() {
  console.log('=== Error Handling Examples ===');

  // Trying to create duplicate review
  try {
    const duplicateReview = {
      bookingId: 'booking-123',
      reviewerId: 'user-456',
      reviewedUserId: 'user-789',
      overallRating: 3
    };
    await axios.post(`${API_BASE_URL}/reviews`, duplicateReview);
  } catch (error) {
    console.log('Expected error for duplicate review:', error.response?.data?.error);
  }

  // Trying to review yourself
  try {
    const selfReview = {
      bookingId: 'booking-456',
      reviewerId: 'user-789',
      reviewedUserId: 'user-789', // Same user
      overallRating: 5
    };
    await axios.post(`${API_BASE_URL}/reviews`, selfReview);
  } catch (error) {
    console.log('Expected error for self review:', error.response?.data?.error);
  }

  // Invalid rating
  try {
    const invalidRating = {
      bookingId: 'booking-789',
      reviewerId: 'user-123',
      reviewedUserId: 'user-456',
      overallRating: 6 // Invalid rating
    };
    await axios.post(`${API_BASE_URL}/reviews`, invalidRating);
  } catch (error) {
    console.log('Expected error for invalid rating:', error.response?.data?.error);
  }

  console.log('=== Error Handling Complete ===');
}

// =====================================================
// EXPORT FUNCTIONS FOR TESTING
// =====================================================

export {
  createReview,
  getReview,
  updateReview,
  deleteReview,
  searchReviews,
  getUserReviews,
  getBookingReviews,
  addReviewResponse,
  getModerationQueue,
  moderateReview,
  bulkModerateReviews,
  getUserAnalytics,
  getReviewStats,
  getFilteredStats,
  advancedSearch,
  getFlaggedReviews,
  exampleWorkflow,
  errorHandlingExamples
};

// Run example workflow if this file is executed directly
if (require.main === module) {
  exampleWorkflow()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Workflow failed:', error);
      process.exit(1);
    });
}
