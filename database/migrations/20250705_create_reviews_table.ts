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

  // Check if table already exists
  const hasTable = await knex.schema.hasTable('reviews');
  
  if (!hasTable) {
    await knex.schema.createTable('reviews', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FKs to avoid ordering issues
      table.uuid('booking_id').notNullable().comment('Reference to the booking being reviewed');
      table.uuid('reviewer_id').notNullable().comment('User who wrote the review');
      table.uuid('reviewed_user_id').notNullable().comment('User being reviewed (owner or renter)');
    
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

    // Conditionally add FKs if referenced tables exist
    const hasBookings = await knex.schema.hasTable('bookings');
    const hasUsers = await knex.schema.hasTable('users');
    
    await knex.schema.alterTable('reviews', (table) => {
      if (hasBookings) {
        table.foreign('booking_id').references('bookings.id').onDelete('CASCADE');
      }
      if (hasUsers) {
        table.foreign('reviewer_id').references('users.id').onDelete('CASCADE');
        table.foreign('reviewed_user_id').references('users.id').onDelete('CASCADE');
      }
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
  }

  // Skip sample data seeding for now - referenced tables may not be seeded yet
  console.log('✅ Reviews table created (sample data skipped - referenced tables not yet seeded)');

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

  // Create a view for review moderation queue (fixed to use correct column names)
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
      CONCAT(u1.first_name, ' ', u1.last_name) as reviewer_name,
      CONCAT(u2.first_name, ' ', u2.last_name) as reviewed_user_name
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
