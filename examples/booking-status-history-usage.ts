// =====================================================
// BOOKING STATUS HISTORY - USAGE EXAMPLES
// =====================================================

/**
 * This file demonstrates how to use the Booking Status History system
 * for tracking and analyzing booking status changes.
 */

import BookingStatusHistoryService from '../src/services/BookingStatusHistoryService';
import BookingsController from '../src/controllers/bookings.controller';

// Example 1: Manual Status Change Recording
async function recordManualStatusChange() {
  const result = await BookingStatusHistoryService.recordStatusChange(
    'booking-123',
    'pending',
    'confirmed',
    'owner-456',
    'Product verified and ready for rental',
    'Owner manually confirmed after inspection'
  );
  
  if (result.success) {
    console.log('Status change recorded:', result.data);
  } else {
    console.error('Failed to record status change:', result.error);
  }
}

// Example 2: Retrieving Booking Status History
async function getBookingHistory() {
  const bookingId = 'booking-123';
  
  const history = await BookingStatusHistoryService.getByBookingId(bookingId);
  
  if (history.success && history.data) {
    console.log(`Found ${history.data.length} status changes:`);
    
    history.data.forEach((change, index) => {
      console.log(`${index + 1}. ${change.oldStatus || 'created'} → ${change.newStatus}`);
      console.log(`   Changed by: ${change.changedBy}`);
      console.log(`   Reason: ${change.reason || 'No reason provided'}`);
      console.log(`   Date: ${change.createdAt}`);
      console.log('');
    });
  }
}

// Example 3: Status Analytics
async function getStatusAnalytics() {
  const bookingId = 'booking-123';
  
  const analytics = await BookingStatusHistoryService.getStatusAnalytics(bookingId);
  
  if (analytics.success && analytics.data) {
    const data = analytics.data;
    
    console.log('=== BOOKING STATUS ANALYTICS ===');
    console.log(`Total Status Changes: ${data.totalChanges}`);
    console.log('');
    
    console.log('Status Flow:');
    data.statusFlow.forEach((flow: any, index: number) => {
      console.log(`${index + 1}. ${flow.from || 'Initial'} → ${flow.to}`);
      console.log(`   Changed by: ${flow.changedBy}`);
      console.log(`   Date: ${flow.timestamp}`);
      console.log(`   Reason: ${flow.reason || 'No reason'}`);
      console.log('');
    });
    
    console.log('Time Spent in Each Status:');
    Object.entries(data.timeInStatus).forEach(([status, time]) => {
      const hours = Math.round((time as number) / (1000 * 60 * 60) * 100) / 100;
      console.log(`${status}: ${hours} hours`);
    });
    console.log('');
    
    console.log('Most Active Users:');
    Object.entries(data.frequentChangers).forEach(([userId, count]) => {
      console.log(`${userId}: ${count} changes`);
    });
  }
}

// Example 4: Global Statistics (Admin Only)
async function getGlobalStatistics() {
  const stats = await BookingStatusHistoryService.getGlobalStats();
  
  if (stats.success && stats.data) {
    const data = stats.data;
    
    console.log('=== GLOBAL STATUS STATISTICS ===');
    console.log(`Total Status Changes: ${data.totalChanges}`);
    console.log('');
    
    console.log('Status Distribution:');
    Object.entries(data.statusDistribution).forEach(([status, count]) => {
      console.log(`${status}: ${count} times`);
    });
    console.log('');
    
    console.log('Most Active Users:');
    Object.entries(data.frequentChangers).forEach(([userId, count]) => {
      console.log(`${userId}: ${count} changes`);
    });
  }
}

// Example 5: API Usage Examples

/**
 * GET /api/v1/bookings/:id/status-history
 * 
 * curl -X GET "http://localhost:3000/api/v1/bookings/booking-123/status-history" \
 *      -H "Authorization: Bearer YOUR_JWT_TOKEN"
 */

/**
 * GET /api/v1/bookings/:id/status-analytics
 * 
 * curl -X GET "http://localhost:3000/api/v1/bookings/booking-123/status-analytics" \
 *      -H "Authorization: Bearer YOUR_JWT_TOKEN"
 */

/**
 * GET /api/v1/bookings/status-stats (Admin only)
 * 
 * curl -X GET "http://localhost:3000/api/v1/bookings/status-stats" \
 *      -H "Authorization: Bearer ADMIN_JWT_TOKEN"
 */

// Example 6: Integration with Existing Booking Operations

async function exampleBookingFlow() {
  console.log('=== BOOKING LIFECYCLE WITH STATUS TRACKING ===');
  
  // 1. Create booking (automatically records 'pending' status)
  console.log('1. Creating booking...');
  // await BookingsController.createBooking(req, res);
  // Status History: null → 'pending'
  
  // 2. Owner confirms booking
  console.log('2. Owner confirming booking...');
  // await BookingsController.confirmBooking(req, res);
  // Status History: 'pending' → 'confirmed'
  
  // 3. Renter checks in
  console.log('3. Renter checking in...');
  // await BookingsController.checkIn(req, res);
  // Status History: 'confirmed' → 'in_progress'
  
  // 4. Renter checks out
  console.log('4. Renter checking out...');
  // await BookingsController.checkOut(req, res);
  // Status History: 'in_progress' → 'completed'
  
  console.log('Booking lifecycle completed with full audit trail!');
}

// Example 7: Error Handling

async function handleStatusHistoryErrors() {
  try {
    const result = await BookingStatusHistoryService.recordStatusChange(
      'invalid-booking-id',
      'pending',
      'confirmed',
      'user-123'
    );
    
    if (!result.success) {
      console.error('Status change failed:', result.error);
      // Handle the error appropriately
      // Note: Status history failures should not break main booking flow
    }
  } catch (error) {
    console.error('Unexpected error in status history:', error);
    // Log error but continue with main operation
  }
}

// Example 8: Filtering and Pagination

async function getFilteredStatusHistory() {
  const filters = {
    bookingId: 'booking-123',
    changedBy: 'user-456',
    newStatus: 'confirmed' as any,
    startDate: '2025-01-01',
    endDate: '2025-01-31'
  };
  
  const result = await BookingStatusHistoryService.getPaginatedHistory(
    filters,
    1, // page
    20, // limit
    'created_at', // sortBy
    'desc' // sortOrder
  );
  
  if (result.success && result.data) {
    console.log('Filtered Results:');
    console.log(`Total: ${result.data.pagination.total}`);
    console.log(`Page: ${result.data.pagination.page} of ${result.data.pagination.totalPages}`);
    
    result.data.data.forEach((record: any) => {
      console.log(`${record.oldStatus} → ${record.newStatus} by ${record.changedBy}`);
    });
  }
}

// Export examples for testing
export {
  recordManualStatusChange,
  getBookingHistory,
  getStatusAnalytics,
  getGlobalStatistics,
  exampleBookingFlow,
  handleStatusHistoryErrors,
  getFilteredStatusHistory
};
