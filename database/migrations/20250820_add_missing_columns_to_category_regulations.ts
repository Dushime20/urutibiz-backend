import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if category_regulations table exists
  const hasTable = await knex.schema.hasTable('category_regulations');
  

  // Add missing columns to category_regulations table (only if they don't exist)
  const columnsToAdd = [
    { name: 'max_liability_amount', type: 'decimal', precision: [10, 2] },
    { name: 'requires_background_check', type: 'boolean', default: false },
    { name: 'prohibited_activities', type: 'text' },
    { name: 'seasonal_restrictions', type: 'jsonb', default: '{}' },
    { name: 'documentation_required', type: 'jsonb', default: '[]' },
    { name: 'compliance_level', type: 'enum', values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' }
  ];

  for (const column of columnsToAdd) {
    const hasColumn = await knex.schema.hasColumn('category_regulations', column.name);
    if (!hasColumn) {
      try {
        await knex.schema.alterTable('category_regulations', (table) => {
          switch (column.type) {
            case 'decimal':
              table.decimal(column.name, column.precision![0], column.precision![1]);
              break;
            case 'boolean':
              const booleanCol = table.boolean(column.name);
              if (column.default !== undefined) {
                booleanCol.defaultTo(column.default);
              }
              break;
            case 'text':
              table.text(column.name);
              break;
            case 'jsonb':
              const jsonbCol = table.jsonb(column.name);
              if (column.default !== undefined) {
                jsonbCol.defaultTo(column.default);
              }
              break;
            case 'enum':
              const enumCol = table.enum(column.name, column.values!);
              if (column.default !== undefined) {
                enumCol.defaultTo(column.default);
              }
              break;
          }
        });
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        console.log(`⚠️ Failed to add column ${column.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      
    }
  }

  // Add indexes for better performance (only if they don't exist)
  const indexesToAdd = [
    { columns: ['max_liability_amount'], name: 'idx_category_regulations_max_liability' },
    { columns: ['requires_background_check'], name: 'idx_category_regulations_background_check' },
    { columns: ['compliance_level'], name: 'idx_category_regulations_compliance_level' }
  ];

  for (const index of indexesToAdd) {
    try {
      await knex.schema.alterTable('category_regulations', (table) => {
        table.index(index.columns, index.name);
      });
      console.log(`✅ Added index: ${index.name}`);
    } catch (error) {
      console.log(`⚠️ Index ${index.name} already exists or failed to add`);
    }
  }

  console.log('✅ Category regulations table updated successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Check if category_regulations table exists
  const hasTable = await knex.schema.hasTable('category_regulations');
  

  // Remove the columns we added (only if they exist)
  const columnsToRemove = [
    'max_liability_amount',
    'requires_background_check',
    'prohibited_activities',
    'seasonal_restrictions',
    'documentation_required',
    'compliance_level'
  ];

  for (const columnName of columnsToRemove) {
    const hasColumn = await knex.schema.hasColumn('category_regulations', columnName);
    if (hasColumn) {
      try {
        await knex.schema.alterTable('category_regulations', (table) => {
          table.dropColumn(columnName);
        });
        console.log(`✅ Removed column: ${columnName}`);
      } catch (error) {
        console.log(`⚠️ Failed to remove column ${columnName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      
    }
  }

  console.log('✅ Category regulations table reverted successfully');
}
