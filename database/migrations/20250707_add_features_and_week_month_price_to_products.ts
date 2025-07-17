exports.up = function(knex) {
  return knex.schema.alterTable('products', function(table) {
    table.jsonb('features').defaultTo('[]');
    table.decimal('base_price_per_week', 10, 2);
    table.decimal('base_price_per_month', 10, 2);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('products', function(table) {
    table.dropColumn('features');
    table.dropColumn('base_price_per_week');
    table.dropColumn('base_price_per_month');
  });
}; 