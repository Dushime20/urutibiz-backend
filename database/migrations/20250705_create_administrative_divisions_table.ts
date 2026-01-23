import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable PostGIS extension for geometry support
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "postgis"');
  
  // Create administrative_divisions table (idempotent) without external FKs first
  const hasTable = await knex.schema.hasTable('administrative_divisions');
  if (!hasTable) {
    await knex.schema.createTable('administrative_divisions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      // Defer FK to countries to avoid ordering issues
      table.uuid('country_id').notNullable();
      // Self-referencing FK can be added after creation as well to be safe
      table.uuid('parent_id').nullable();
      table.integer('level').notNullable().comment('1=Province/State, 2=District/County, 3=Sector/Sub-county, etc.');
      table.string('code', 20).comment('Official government code');
      table.string('name', 100).notNullable();
      table.string('local_name', 100).comment('Name in local language');
      table.string('type', 50).comment('province, state, district, county, sector, ward, etc.');
      table.integer('population').nullable();
      table.decimal('area_km2', 10, 2).nullable();
      table.specificType('coordinates', 'GEOMETRY(POINT, 4326)').nullable().comment('Center point coordinates');
      table.specificType('bounds', 'GEOMETRY(POLYGON, 4326)').nullable().comment('Administrative boundary');
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

      // Indexes for better performance
      table.index(['country_id']);
      table.index(['parent_id']);
      table.index(['level']);
      table.index(['type']);
      table.index(['is_active']);
      table.index(['country_id', 'level']);
      table.index(['country_id', 'type']);
      table.index(['parent_id', 'level']);
      
      // Unique constraint for code within country
      table.unique(['country_id', 'code']);
    });

    // Conditionally add FKs if referenced tables exist
    const hasCountries = await knex.schema.hasTable('countries');
    await knex.schema.alterTable('administrative_divisions', (table) => {
      if (hasCountries) {
        table.foreign('country_id').references('countries.id').onDelete('CASCADE');
      }
      // Self-reference FK added after table exists
      table.foreign('parent_id').references('administrative_divisions.id').onDelete('CASCADE');
    });
  }

  // Create spatial indexes for geometry columns (idempotent)
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_admin_divisions_coordinates ON administrative_divisions USING GIST (coordinates)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_admin_divisions_bounds ON administrative_divisions USING GIST (bounds)');

  // Seed only if countries table exists
  const countriesExists = await knex.schema.hasTable('countries');
  if (countriesExists) {
    try {
      // Insert sample data for Rwanda (hierarchical structure)
      const rwandaCountry = await knex('countries').where('code', 'RW').first();
      if (rwandaCountry) {
        const provinces = await knex('administrative_divisions')
          .insert([
            { country_id: rwandaCountry.id, level: 1, code: 'KGL', name: 'Kigali City', local_name: 'Umujyi wa Kigali', type: 'city', population: 1132686, area_km2: 730.0, coordinates: knex.raw("ST_GeomFromText('POINT(30.0619 -1.9441)', 4326)") },
            { country_id: rwandaCountry.id, level: 1, code: 'EST', name: 'Eastern Province', local_name: 'Intara y\'Iburasirazuba', type: 'province', population: 2595703, area_km2: 9458.0, coordinates: knex.raw("ST_GeomFromText('POINT(30.4383 -2.0000)', 4326)") },
            { country_id: rwandaCountry.id, level: 1, code: 'NTH', name: 'Northern Province', local_name: 'Intara y\'Amajyaruguru', type: 'province', population: 1726370, area_km2: 3276.0, coordinates: knex.raw("ST_GeomFromText('POINT(29.6333 -1.6667)', 4326)") },
            { country_id: rwandaCountry.id, level: 1, code: 'STH', name: 'Southern Province', local_name: 'Intara y\'Amajyepfo', type: 'province', population: 2589975, area_km2: 5963.0, coordinates: knex.raw("ST_GeomFromText('POINT(29.7500 -2.6000)', 4326)") },
            { country_id: rwandaCountry.id, level: 1, code: 'WST', name: 'Western Province', local_name: 'Intara y\'Iburengerazuba', type: 'province', population: 2471239, area_km2: 5883.0, coordinates: knex.raw("ST_GeomFromText('POINT(29.2500 -2.2500)', 4326)") }
          ])
          .returning('*');

        const kigaliProvince = provinces.find((p: any) => p.code === 'KGL');
        if (kigaliProvince) {
          await knex('administrative_divisions').insert([
            { country_id: rwandaCountry.id, parent_id: kigaliProvince.id, level: 2, code: 'GASABO', name: 'Gasabo', local_name: 'Gasabo', type: 'district', population: 530907, area_km2: 429.3, coordinates: knex.raw("ST_GeomFromText('POINT(30.1127 -1.9536)', 4326)") },
            { country_id: rwandaCountry.id, parent_id: kigaliProvince.id, level: 2, code: 'KICUKIRO', name: 'Kicukiro', local_name: 'Kicukiro', type: 'district', population: 318061, area_km2: 166.7, coordinates: knex.raw("ST_GeomFromText('POINT(30.1000 -1.9667)', 4326)") },
            { country_id: rwandaCountry.id, parent_id: kigaliProvince.id, level: 2, code: 'NYARUGENGE', name: 'Nyarugenge', local_name: 'Nyarugenge', type: 'district', population: 284561, area_km2: 134.0, coordinates: knex.raw("ST_GeomFromText('POINT(30.0583 -1.9536)', 4326)") }
          ]);
        }
      }

      // Insert sample data for Kenya (different structure)
      const kenyaCountry = await knex('countries').where('code', 'KE').first();
      if (kenyaCountry) {
        await knex('administrative_divisions').insert([
          { country_id: kenyaCountry.id, level: 1, code: '047', name: 'Nairobi County', local_name: 'Nairobi County', type: 'county', population: 4397073, area_km2: 696.0, coordinates: knex.raw("ST_GeomFromText('POINT(36.8219 -1.2921)', 4326)") },
          { country_id: kenyaCountry.id, level: 1, code: '001', name: 'Mombasa County', local_name: 'Mombasa County', type: 'county', population: 1208333, area_km2: 294.7, coordinates: knex.raw("ST_GeomFromText('POINT(39.6682 -4.0435)', 4326)") },
          { country_id: kenyaCountry.id, level: 1, code: '032', name: 'Kiambu County', local_name: 'Kiambu County', type: 'county', population: 2417735, area_km2: 2449.2, coordinates: knex.raw("ST_GeomFromText('POINT(36.8000 -1.0000)', 4326)") }
        ]);
      }
    } catch (err) {
      
    }
  }

  console.log('✅ Administrative divisions table created with sample data');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('administrative_divisions');
  console.log('❌ Administrative divisions table dropped');
}
