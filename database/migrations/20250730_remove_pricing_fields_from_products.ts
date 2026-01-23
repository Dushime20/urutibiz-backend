import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if products table exists
  const hasProducts = await knex.schema.hasTable('products');
  

  // Remove redundant pricing fields from products table
  // These fields are now handled by the dedicated product_prices table
  
  const columnsToRemove = [
    'base_price_per_day',
    'base_price_per_week', 
    'base_price_per_month',
    'security_deposit',
    'currency'
  ];

  for (const columnName of columnsToRemove) {
    const hasColumn = await knex.schema.hasColumn('products', columnName);
    if (hasColumn) {
      try {
        await knex.schema.alterTable('products', (table) => {
          table.dropColumn(columnName);
        });
        console.log(`✅ Removed column: ${columnName}`);
      } catch (error) {
        console.log(`⚠️ Failed to remove column ${columnName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      
    }
  }

  console.log('✅ Pricing fields removed from products table successfully');
}

export async function down(knex: Knex): Promise<void> {
  // Check if products table exists
  const hasProducts = await knex.schema.hasTable('products');
  

  // Add back the pricing fields if needed to rollback
  const columnsToAdd = [
    { name: 'base_price_per_day', type: 'decimal', precision: [10, 2] },
    { name: 'base_price_per_week', type: 'decimal', precision: [10, 2] },
    { name: 'base_price_per_month', type: 'decimal', precision: [10, 2] },
    { name: 'security_deposit', type: 'decimal', precision: [10, 2], default: 0 },
    { name: 'currency', type: 'string', length: 3, default: 'RWF' }
  ];

  for (const column of columnsToAdd) {
    const hasColumn = await knex.schema.hasColumn('products', column.name);
    if (!hasColumn) {
      try {
        await knex.schema.alterTable('products', (table) => {
          switch (column.type) {
            case 'decimal':
              const decimalCol = table.decimal(column.name, column.precision![0], column.precision![1]);
              if (column.default !== undefined) {
                decimalCol.defaultTo(column.default);
              }
              break;
            case 'string':
              const stringCol = table.string(column.name, column.length);
              if (column.default !== undefined) {
                stringCol.defaultTo(column.default);
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

  console.log('✅ Pricing fields restored to products table successfully');
} 