import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create moderation_status enum if it doesn't exist
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create reviews table
  await knex.schema.createTable('reviews', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE').comment('Reference to the booking being reviewed');
    table.uuid('reviewer_id').notNullable().references('id').inTable('users').onDelete('CASCADE').comment('User who wrote the review');
    table.uuid('reviewed_user_id').notNullable().references('id').inTable('users').onDelete('CASCADE').comment('User being reviewed (owner or renter)');
    
    // Ratings (1-5 scale)
    table.integer('overall_rating').notNullable().comment('Overall rating from 1-5');
    table.integer('communication_rating').comment('Communication rating from 1-5');
    table.integer('condition_rating').comment('Equipment condition rating from 1-5');
    table.integer('value_rating').comment('Value for money rating from 1-5');
    table.integer('delivery_rating').comment('Delivery/pickup experience rating from 1-5');
    
    // Review content
    table.string('title', 255).comment('Review title/summary');
    table.text('comment').comment('Detailed review comment');
    
    // AI moderation and content analysis
    table.decimal('ai_sentiment_score', 4, 3).comment('AI sentiment analysis score (-1 to 1)');
    table.decimal('ai_toxicity_score', 4, 3).comment('AI toxicity detection score (0 to 1)');
    table.decimal('ai_helpfulness_score', 4, 3).comment('AI helpfulness score (0 to 1)');
    table.boolean('is_flagged').defaultTo(false).comment('Whether the review has been flagged for moderation');
    table.specificType('moderation_status', 'moderation_status').defaultTo('pending').comment('Current moderation status');
    table.text('moderation_notes').comment('Internal moderation notes');
    table.string('moderated_by').comment('Admin user who moderated the review');
    table.timestamp('moderated_at', { useTz: true }).comment('When the review was moderated');
    
    // Response from reviewed user
    table.text('response').comment('Response from the reviewed user');
    table.timestamp('response_date', { useTz: true }).comment('When the response was posted');
    
    // Additional metadata
    table.jsonb('metadata').comment('Additional review metadata (images, tags, etc.)');
    table.boolean('is_verified_booking').defaultTo(false).comment('Whether this is from a verified completed booking');
    table.string('review_type').comment('Type of review: owner_to_renter, renter_to_owner');
    
    // Audit fields
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.string('created_by').comment('User or system that created the review');
    table.string('updated_by').comment('User or system that last updated the review');

    // Indexes for performance
    table.index(['booking_id']);
    table.index(['reviewer_id']);
    table.index(['reviewed_user_id']);
    table.index(['overall_rating']);
    table.index(['moderation_status']);
    table.index(['is_flagged']);
    table.index(['created_at']);
    table.index(['ai_sentiment_score']);
    table.index(['ai_toxicity_score']);
    table.index(['review_type']);
    table.index(['is_verified_booking']);
    table.index(['reviewer_id', 'reviewed_user_id']);
    table.index(['reviewed_user_id', 'moderation_status']);
    table.index(['booking_id', 'reviewer_id']);
  });

  // Add check constraints
  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_overall_rating_range 
    CHECK (overall_rating BETWEEN 1 AND 5);
  `);

  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_communication_rating_range 
    CHECK (communication_rating IS NULL OR communication_rating BETWEEN 1 AND 5);
  `);

  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_condition_rating_range 
    CHECK (condition_rating IS NULL OR condition_rating BETWEEN 1 AND 5);
  `);

  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_value_rating_range 
    CHECK (value_rating IS NULL OR value_rating BETWEEN 1 AND 5);
  `);

  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_delivery_rating_range 
    CHECK (delivery_rating IS NULL OR delivery_rating BETWEEN 1 AND 5);
  `);

  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_ai_sentiment_score_range 
    CHECK (ai_sentiment_score IS NULL OR ai_sentiment_score BETWEEN -1 AND 1);
  `);

  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_ai_toxicity_score_range 
    CHECK (ai_toxicity_score IS NULL OR ai_toxicity_score BETWEEN 0 AND 1);
  `);

  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_ai_helpfulness_score_range 
    CHECK (ai_helpfulness_score IS NULL OR ai_helpfulness_score BETWEEN 0 AND 1);
  `);

  // Prevent users from reviewing themselves
  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT check_no_self_review 
    CHECK (reviewer_id != reviewed_user_id);
  `);

  // Ensure only one review per booking per reviewer
  await knex.raw(`
    ALTER TABLE reviews 
    ADD CONSTRAINT unique_review_per_booking_reviewer 
    UNIQUE (booking_id, reviewer_id);
  `);

  // Insert sample reviews for testing
  const users = await knex('users').select('id').limit(5);
  const bookings = await knex('bookings').select('id', 'renter_id', 'owner_id').limit(3);
  
  if (users.length >= 2 && bookings.length > 0) {
    const sampleReviews = [
      {
        booking_id: bookings[0].id,
        reviewer_id: bookings[0].renter_id || users[0].id,
        reviewed_user_id: bookings[0].owner_id || users[1].id,
        overall_rating: 5,
        communication_rating: 5,
        condition_rating: 5,
        value_rating: 4,
        delivery_rating: 5,
        title: 'Excellent camera equipment and service!',
        comment: 'The camera equipment was in perfect condition and exactly as described. The owner was very responsive and helpful throughout the rental process. Pickup was smooth and the equipment worked flawlessly during my photoshoot. Highly recommended!',
        ai_sentiment_score: 0.85,
        ai_toxicity_score: 0.02,
        ai_helpfulness_score: 0.92,
        moderation_status: 'approved',
        is_verified_booking: true,
        review_type: 'renter_to_owner',
        metadata: {
          rental_duration: '3 days',
          equipment_type: 'camera',
          experience_level: 'professional'
        },
        created_by: 'user',
        moderated_by: 'admin_system',
        moderated_at: knex.fn.now()
      },
      {
        booking_id: bookings[0].id,
        reviewer_id: bookings[0].owner_id || users[1].id,
        reviewed_user_id: bookings[0].renter_id || users[0].id,
        overall_rating: 4,
        communication_rating: 5,
        condition_rating: 4,
        value_rating: 4,
        delivery_rating: 4,
        title: 'Great renter, very careful with equipment',
        comment: 'The renter was punctual, communicative, and took excellent care of my camera equipment. Everything was returned in the same condition it was rented. Would definitely rent to them again.',
        ai_sentiment_score: 0.72,
        ai_toxicity_score: 0.01,
        ai_helpfulness_score: 0.78,
        moderation_status: 'approved',
        is_verified_booking: true,
        review_type: 'owner_to_renter',
        metadata: {
          return_condition: 'excellent',
          communication_quality: 'excellent'
        },
        created_by: 'user',
        moderated_by: 'admin_system',
        moderated_at: knex.fn.now()
      }
    ];

    // Only add more reviews if we have more users and bookings
    if (users.length >= 4 && bookings.length >= 2) {
      const additionalReviews = [
        {
          booking_id: bookings[1].id,
          reviewer_id: bookings[1].renter_id || users[2].id,
          reviewed_user_id: bookings[1].owner_id || users[3].id,
          overall_rating: 3,
          communication_rating: 2,
          condition_rating: 4,
          value_rating: 3,
          delivery_rating: 2,
          title: 'Equipment was good but communication could be better',
          comment: 'The equipment worked fine and was as described, but the owner was slow to respond to messages and pickup was delayed by 30 minutes without notice.',
          ai_sentiment_score: -0.15,
          ai_toxicity_score: 0.12,
          ai_helpfulness_score: 0.65,
          moderation_status: 'approved',
          is_verified_booking: true,
          review_type: 'renter_to_owner',
          metadata: {
            delay_minutes: 30,
            response_time: 'slow'
          },
          created_by: 'user',
          moderated_by: 'admin_system',
          moderated_at: knex.fn.now()
        },
        {
          booking_id: bookings[2]?.id || bookings[1].id,
          reviewer_id: users[4]?.id || users[3].id,
          reviewed_user_id: users[0].id,
          overall_rating: 1,
          communication_rating: 1,
          condition_rating: 2,
          value_rating: 1,
          delivery_rating: 1,
          title: 'Terrible experience, equipment was broken',
          comment: 'This was a horrible experience. The equipment was clearly damaged and the owner was completely unresponsive. Complete waste of money and ruined my event.',
          ai_sentiment_score: -0.92,
          ai_toxicity_score: 0.78,
          ai_helpfulness_score: 0.45,
          moderation_status: 'flagged',
          is_flagged: true,
          is_verified_booking: false,
          review_type: 'renter_to_owner',
          metadata: {
            equipment_issues: ['damaged_lens', 'battery_dead'],
            escalated: true
          },
          created_by: 'user',
          moderation_notes: 'Flagged for high toxicity score and unverified booking'
        }
      ];

      await knex('reviews').insert(additionalReviews);

      // Update the first additional review with a response
      await knex('reviews')
        .where({ booking_id: bookings[1].id, reviewer_id: bookings[1].renter_id || users[2].id })
        .update({
          response: 'Thank you for the feedback. I apologize for the delay and will work on improving my communication.',
          response_date: knex.raw("CURRENT_TIMESTAMP + INTERVAL '2 hours'")
        });
    }

    await knex('reviews').insert(sampleReviews);
  }

  // Create a view for review analytics
  await knex.raw(`
    CREATE VIEW review_analytics AS
    SELECT 
      reviewed_user_id,
      COUNT(*) as total_reviews,
      COUNT(CASE WHEN moderation_status = 'approved' THEN 1 END) as approved_reviews,
      COUNT(CASE WHEN is_flagged = true THEN 1 END) as flagged_reviews,
      ROUND(AVG(CASE WHEN moderation_status = 'approved' THEN overall_rating END), 2) as avg_overall_rating,
      ROUND(AVG(CASE WHEN moderation_status = 'approved' THEN communication_rating END), 2) as avg_communication_rating,
      ROUND(AVG(CASE WHEN moderation_status = 'approved' THEN condition_rating END), 2) as avg_condition_rating,
      ROUND(AVG(CASE WHEN moderation_status = 'approved' THEN value_rating END), 2) as avg_value_rating,
      ROUND(AVG(CASE WHEN moderation_status = 'approved' THEN delivery_rating END), 2) as avg_delivery_rating,
      ROUND(AVG(CASE WHEN moderation_status = 'approved' THEN ai_sentiment_score END), 3) as avg_sentiment_score,
      COUNT(CASE WHEN response IS NOT NULL THEN 1 END) as responses_count,
      MAX(created_at) as latest_review_date,
      COUNT(CASE WHEN is_verified_booking = true THEN 1 END) as verified_reviews_count
    FROM reviews
    GROUP BY reviewed_user_id;
  `);

  // Create a view for review moderation queue
  await knex.raw(`
    CREATE VIEW review_moderation_queue AS
    SELECT 
      r.id,
      r.booking_id,
      r.reviewer_id,
      r.reviewed_user_id,
      r.overall_rating,
      r.title,
      r.comment,
      r.ai_sentiment_score,
      r.ai_toxicity_score,
      r.ai_helpfulness_score,
      r.is_flagged,
      r.moderation_status,
      r.created_at,
      u1.name as reviewer_name,
      u2.name as reviewed_user_name
    FROM reviews r
    LEFT JOIN users u1 ON r.reviewer_id = u1.id
    LEFT JOIN users u2 ON r.reviewed_user_id = u2.id
    WHERE r.moderation_status IN ('pending', 'flagged')
    ORDER BY 
      CASE 
        WHEN r.is_flagged THEN 1 
        WHEN r.ai_toxicity_score > 0.5 THEN 2
        ELSE 3 
      END,
      r.created_at DESC;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP VIEW IF EXISTS review_moderation_queue;');
  await knex.raw('DROP VIEW IF EXISTS review_analytics;');
  await knex.schema.dropTableIfExists('reviews');
  await knex.raw('DROP TYPE IF EXISTS moderation_status;');
}
