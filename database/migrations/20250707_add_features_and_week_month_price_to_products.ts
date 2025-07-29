import { Knex } from 'knex';

exports.up = function(knex: Knex) {
  return knex.schema.alterTable('products', function(table: Knex.TableBuilder) {
    table.specificType('features', 'text[]');
    table.decimal('weekly_price');
    table.decimal('monthly_price');
  });
};

exports.down = function(knex: Knex) {
  return knex.schema.alterTable('products', function(table: Knex.TableBuilder) {
    table.dropColumn('features');
    table.dropColumn('weekly_price');
    table.dropColumn('monthly_price');
  });
}; 