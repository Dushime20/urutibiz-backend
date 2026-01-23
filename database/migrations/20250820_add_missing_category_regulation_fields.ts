import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create ENUM types if they don't exist
  await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regulation_type') THEN
        CREATE TYPE regulation_type AS ENUM ('LICENSING','PERMITTING','COMPLIANCE','SAFETY','ENVIRONMENTAL','OTHER');
      END IF;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regulation_priority') THEN
        CREATE TYPE regulation_priority AS ENUM ('LOW','MEDIUM','HIGH','CRITICAL');
      END IF;
    END $$;
  `);

  await knex.raw(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enforcement_level') THEN
        CREATE TYPE enforcement_level AS ENUM ('LENIENT','MODERATE','STRICT','VERY_STRICT');
      END IF;
    END $$;
  `);

  // Add missing columns to category_regulations table - check each one first
  const tableExists = await knex.schema.hasTable('category_regulations');
  if (!tableExists) {
    
    return;
  }

  // Check and add each column individually to avoid conflicts
  if (!(await knex.schema.hasColumn('category_regulations', 'title'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.text('title').nullable();
    });
  }

  if (!(await knex.schema.hasColumn('category_regulations', 'description'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.text('description').nullable();
    });
  }

  if (!(await knex.schema.hasColumn('category_regulations', 'requirements'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.specificType('requirements', 'TEXT[]').defaultTo('{}');
    });
  }

  if (!(await knex.schema.hasColumn('category_regulations', 'penalties'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.specificType('penalties', 'TEXT[]').defaultTo('{}');
    });
  }

  if (!(await knex.schema.hasColumn('category_regulations', 'compliance_deadline'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.date('compliance_deadline').nullable();
    });
  }

  if (!(await knex.schema.hasColumn('category_regulations', 'is_active'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.boolean('is_active').defaultTo(true);
    });
  }

  if (!(await knex.schema.hasColumn('category_regulations', 'regulation_type'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.specificType('regulation_type', 'regulation_type').nullable();
    });
  }

  if (!(await knex.schema.hasColumn('category_regulations', 'priority'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.specificType('priority', 'regulation_priority').nullable();
    });
  }

  if (!(await knex.schema.hasColumn('category_regulations', 'enforcement_level'))) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.specificType('enforcement_level', 'enforcement_level').nullable();
    });
  }

  // Add indexes for better performance (only if they don't exist)
  try {
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_category_regs_title ON category_regulations (title)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_category_regs_is_active ON category_regulations (is_active)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_category_regs_deadline ON category_regulations (compliance_deadline)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_category_regs_type ON category_regulations (regulation_type)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_category_regs_priority ON category_regulations (priority)');
    await knex.raw('CREATE INDEX IF NOT EXISTS idx_category_regs_enforcement ON category_regulations (enforcement_level)');
  } catch (error) {
    console.log('Some indexes may already exist, continuing...');
  }
}

export async function down(knex: Knex): Promise<void> {
  // Remove indexes
  try {
    await knex.raw('DROP INDEX IF EXISTS idx_category_regs_enforcement');
    await knex.raw('DROP INDEX IF EXISTS idx_category_regs_priority');
    await knex.raw('DROP INDEX IF EXISTS idx_category_regs_type');
    await knex.raw('DROP INDEX IF EXISTS idx_category_regs_deadline');
    await knex.raw('DROP INDEX IF EXISTS idx_category_regs_is_active');
    await knex.raw('DROP INDEX IF EXISTS idx_category_regs_title');
  } catch (error) {
    console.log('Some indexes may not exist, continuing...');
  }

  // Remove columns if they exist
  if (await knex.schema.hasColumn('category_regulations', 'enforcement_level')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('enforcement_level');
    });
  }

  if (await knex.schema.hasColumn('category_regulations', 'priority')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('priority');
    });
  }

  if (await knex.schema.hasColumn('category_regulations', 'regulation_type')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('regulation_type');
    });
  }

  if (await knex.schema.hasColumn('category_regulations', 'is_active')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('is_active');
    });
  }

  if (await knex.schema.hasColumn('category_regulations', 'compliance_deadline')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('compliance_deadline');
    });
  }

  if (await knex.schema.hasColumn('category_regulations', 'penalties')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('penalties');
    });
  }

  if (await knex.schema.hasColumn('category_regulations', 'requirements')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('requirements');
    });
  }

  if (await knex.schema.hasColumn('category_regulations', 'description')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('description');
    });
  }

  if (await knex.schema.hasColumn('category_regulations', 'title')) {
    await knex.schema.alterTable('category_regulations', (table) => {
      table.dropColumn('title');
    });
  }

  // Drop ENUM types
  await knex.raw(`
    DROP TYPE IF EXISTS enforcement_level;
    DROP TYPE IF EXISTS regulation_priority;
    DROP TYPE IF EXISTS regulation_type;
  `);
}
