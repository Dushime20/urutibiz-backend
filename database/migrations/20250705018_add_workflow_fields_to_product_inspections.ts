import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_inspections');
  
  if (hasTable) {
    // Add new workflow fields for owner/renter pre-inspection workflow
    await knex.schema.alterTable('product_inspections', (table) => {
      // Owner Pre-Inspection fields
      table.jsonb('owner_pre_inspection_data').comment('Owner pre-inspection data (photos, condition, notes, GPS location)');
      table.boolean('owner_pre_inspection_confirmed').defaultTo(false).comment('Whether owner has confirmed their pre-inspection');
      table.timestamp('owner_pre_inspection_confirmed_at').comment('When owner confirmed pre-inspection');
      
      // Renter Pre-Review fields
      table.boolean('renter_pre_review_accepted').defaultTo(false).comment('Whether renter has accepted owner pre-inspection');
      table.timestamp('renter_pre_review_accepted_at').comment('When renter accepted pre-inspection');
      table.boolean('renter_discrepancy_reported').defaultTo(false).comment('Whether renter has reported discrepancies');
      table.jsonb('renter_discrepancy_data').comment('Renter discrepancy report data (issues, photos, notes)');
      
      // Renter Post-Inspection fields
      table.jsonb('renter_post_inspection_data').comment('Renter post-inspection data (return photos, condition, notes, GPS location)');
      table.boolean('renter_post_inspection_confirmed').defaultTo(false).comment('Whether renter has confirmed their post-inspection');
      table.timestamp('renter_post_inspection_confirmed_at').comment('When renter confirmed post-inspection');
      
      // Owner Post-Review fields
      table.boolean('owner_post_review_accepted').defaultTo(false).comment('Whether owner has accepted renter post-inspection');
      table.timestamp('owner_post_review_accepted_at').comment('When owner accepted post-inspection');
      table.boolean('owner_dispute_raised').defaultTo(false).comment('Whether owner has raised a dispute');
      table.timestamp('owner_dispute_raised_at').comment('When owner raised dispute');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_inspections');
  
  if (hasTable) {
    await knex.schema.alterTable('product_inspections', (table) => {
      table.dropColumn('owner_pre_inspection_data');
      table.dropColumn('owner_pre_inspection_confirmed');
      table.dropColumn('owner_pre_inspection_confirmed_at');
      table.dropColumn('renter_pre_review_accepted');
      table.dropColumn('renter_pre_review_accepted_at');
      table.dropColumn('renter_discrepancy_reported');
      table.dropColumn('renter_discrepancy_data');
      table.dropColumn('renter_post_inspection_data');
      table.dropColumn('renter_post_inspection_confirmed');
      table.dropColumn('renter_post_inspection_confirmed_at');
      table.dropColumn('owner_post_review_accepted');
      table.dropColumn('owner_post_review_accepted_at');
      table.dropColumn('owner_dispute_raised');
      table.dropColumn('owner_dispute_raised_at');
    });
  }
}

