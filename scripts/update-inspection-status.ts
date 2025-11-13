/**
 * Script to update product inspection status from pending to in_progress
 * 
 * Usage:
 *   npx ts-node scripts/update-inspection-status.ts
 * 
 * Or with tsx:
 *   npx tsx scripts/update-inspection-status.ts
 */

import { getDatabase } from '../src/config/database';
import logger from '../src/utils/logger';

const INSPECTION_ID = 'ac5993bc-dd99-42f8-b017-b926ad405ea1';

async function updateInspectionStatus() {
  const db = getDatabase();
  
  try {
    logger.info(`🔄 Starting update for inspection: ${INSPECTION_ID}`);
    
    // Check if inspection exists
    const inspection = await db('product_inspections')
      .where('id', INSPECTION_ID)
      .first();
    
    if (!inspection) {
      logger.error(`❌ Inspection with ID ${INSPECTION_ID} not found`);
      process.exit(1);
    }
    
    logger.info(`📋 Current inspection status: ${inspection.status}`);
    logger.info(`📋 Inspection type: ${inspection.inspection_type || inspection.inspectionType}`);
    logger.info(`📋 Booking ID: ${inspection.booking_id || inspection.bookingId}`);
    
    // Check if status is already in_progress
    if (inspection.status === 'in_progress') {
      logger.warn(`⚠️  Inspection status is already 'in_progress'. No update needed.`);
      process.exit(0);
    }
    
    // Check if status is pending
    if (inspection.status !== 'pending') {
      logger.warn(`⚠️  Inspection status is '${inspection.status}', not 'pending'. Proceeding anyway...`);
    }
    
    // Update inspection status
    const updated = await db('product_inspections')
      .where('id', INSPECTION_ID)
      .update({
        status: 'in_progress',
        updated_at: db.fn.now()
      })
      .returning('*');
    
    if (!updated || updated.length === 0) {
      logger.error(`❌ Failed to update inspection status`);
      process.exit(1);
    }
    
    logger.info(`✅ Successfully updated inspection status to 'in_progress'`);
    logger.info(`📋 Updated inspection:`, {
      id: updated[0].id,
      status: updated[0].status,
      inspection_type: updated[0].inspection_type || updated[0].inspectionType,
      booking_id: updated[0].booking_id || updated[0].bookingId,
      updated_at: updated[0].updated_at || updated[0].updatedAt
    });
    
    // Check related tables and log their status
    const bookingId = inspection.booking_id || inspection.bookingId;
    if (bookingId) {
      const booking = await db('bookings')
        .where('id', bookingId)
        .first();
      
      if (booking) {
        logger.info(`📋 Related booking:`, {
          id: booking.id,
          booking_number: booking.booking_number,
          status: booking.status,
          start_date: booking.start_date,
          end_date: booking.end_date
        });
      }
    }
    
    // Check inspection items
    const items = await db('inspection_items')
      .where('inspection_id', INSPECTION_ID)
      .count('* as count')
      .first();
    
    const itemsCount = typeof items?.count === 'string' ? parseInt(items.count, 10) : (items?.count || 0);
    if (items && itemsCount > 0) {
      logger.info(`📋 Related inspection items: ${itemsCount} items found`);
    }
    
    // Check inspection photos
    const photos = await db('inspection_photos')
      .where('inspection_id', INSPECTION_ID)
      .count('* as count')
      .first();
    
    const photosCount = typeof photos?.count === 'string' ? parseInt(photos.count, 10) : (photos?.count || 0);
    if (photos && photosCount > 0) {
      logger.info(`📋 Related inspection photos: ${photosCount} photos found`);
    }
    
    // Check inspection disputes
    const disputes = await db('inspection_disputes')
      .where('inspection_id', INSPECTION_ID)
      .count('* as count')
      .first();
    
    const disputesCount = typeof disputes?.count === 'string' ? parseInt(disputes.count, 10) : (disputes?.count || 0);
    if (disputes && disputesCount > 0) {
      logger.info(`📋 Related inspection disputes: ${disputesCount} disputes found`);
    }
    
    logger.info(`✅ Update completed successfully`);
    
  } catch (error) {
    logger.error(`❌ Error updating inspection status:`, error);
    process.exit(1);
  } finally {
    // Close database connection
    await db.destroy();
  }
}

// Run the script
updateInspectionStatus()
  .then(() => {
    logger.info('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('❌ Script failed:', error);
    process.exit(1);
  });

