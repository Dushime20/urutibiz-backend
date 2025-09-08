import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Extend allowed values for type in handover_notifications and return_notifications
  await knex.raw(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'handover_notifications_type_check'
          AND table_name = 'handover_notifications'
      ) THEN
        ALTER TABLE handover_notifications DROP CONSTRAINT handover_notifications_type_check;
      END IF;
    END $$;

    ALTER TABLE handover_notifications
      ADD CONSTRAINT handover_notifications_type_check
      CHECK (type IN ('reminder','completion','handover','return'));
  `);

  await knex.raw(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'return_notifications_type_check'
          AND table_name = 'return_notifications'
      ) THEN
        ALTER TABLE return_notifications DROP CONSTRAINT return_notifications_type_check;
      END IF;
    END $$;

    ALTER TABLE return_notifications
      ADD CONSTRAINT return_notifications_type_check
      CHECK (type IN ('reminder','completion','handover','return'));
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Revert to original accepted values (reminder, completion)
  await knex.raw(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'handover_notifications_type_check'
          AND table_name = 'handover_notifications'
      ) THEN
        ALTER TABLE handover_notifications DROP CONSTRAINT handover_notifications_type_check;
      END IF;
    END $$;

    ALTER TABLE handover_notifications
      ADD CONSTRAINT handover_notifications_type_check
      CHECK (type IN ('reminder','completion'));
  `);

  await knex.raw(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'return_notifications_type_check'
          AND table_name = 'return_notifications'
      ) THEN
        ALTER TABLE return_notifications DROP CONSTRAINT return_notifications_type_check;
      END IF;
    END $$;

    ALTER TABLE return_notifications
      ADD CONSTRAINT return_notifications_type_check
      CHECK (type IN ('reminder','completion'));
  `);
}


