import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Delete existing entries
  await knex('administrative_divisions').del();

  // Generate UUIDs for administrative divisions
  const rwKigaliId = uuidv4();
  const rwSouthId = uuidv4();
  const rwWestId = uuidv4();
  const rwNorthId = uuidv4();
  const rwEastId = uuidv4();

  // Insert Rwanda administrative divisions
  await knex('administrative_divisions').insert([
    // Provinces (Level 1)
    {
      id: rwKigaliId,
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: null,
      level: 1,
      code: '01',
      name: 'Kigali City',
      local_name: 'Umujyi wa Kigali',
      type: 'province',
      population: 1350000,
      area_km2: 730,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: rwSouthId,
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: null,
      level: 1,
      code: '02',
      name: 'Southern Province',
      local_name: 'Intara y\'Amajyepfo',
      type: 'province',
      population: 2800000,
      area_km2: 5931,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: rwWestId,
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: null,
      level: 1,
      code: '03',
      name: 'Western Province',
      local_name: 'Intara y\'Iburengerazuba',
      type: 'province',
      population: 2500000,
      area_km2: 5883,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: rwNorthId,
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: null,
      level: 1,
      code: '04',
      name: 'Northern Province',
      local_name: 'Intara y\'Amajyaruguru',
      type: 'province',
      population: 2000000,
      area_km2: 3246,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: rwEastId,
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: null,
      level: 1,
      code: '05',
      name: 'Eastern Province',
      local_name: 'Intara y\'Iburasirazuba',
      type: 'province',
      population: 3000000,
      area_km2: 9458,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Districts (Level 2) - Kigali City
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwKigaliId,
      level: 2,
      code: '0101',
      name: 'Gasabo',
      local_name: 'Gasabo',
      type: 'district',
      population: 530000,
      area_km2: 430,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwKigaliId,
      level: 2,
      code: '0102',
      name: 'Kicukiro',
      local_name: 'Kicukiro',
      type: 'district',
      population: 320000,
      area_km2: 166,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwKigaliId,
      level: 2,
      code: '0103',
      name: 'Nyarugenge',
      local_name: 'Nyarugenge',
      type: 'district',
      population: 500000,
      area_km2: 134,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Districts (Level 2) - Southern Province
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwSouthId,
      level: 2,
      code: '0201',
      name: 'Huye',
      local_name: 'Huye',
      type: 'district',
      population: 350000,
      area_km2: 581,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwSouthId,
      level: 2,
      code: '0202',
      name: 'Muhanga',
      local_name: 'Muhanga',
      type: 'district',
      population: 320000,
      area_km2: 648,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Districts (Level 2) - Western Province
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwWestId,
      level: 2,
      code: '0301',
      name: 'Karongi',
      local_name: 'Karongi',
      type: 'district',
      population: 330000,
      area_km2: 991,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwWestId,
      level: 2,
      code: '0302',
      name: 'Rubavu',
      local_name: 'Rubavu',
      type: 'district',
      population: 400000,
      area_km2: 388,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Districts (Level 2) - Northern Province
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwNorthId,
      level: 2,
      code: '0401',
      name: 'Musanze',
      local_name: 'Musanze',
      type: 'district',
      population: 400000,
      area_km2: 528,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwNorthId,
      level: 2,
      code: '0402',
      name: 'Burera',
      local_name: 'Burera',
      type: 'district',
      population: 350000,
      area_km2: 645,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },

    // Districts (Level 2) - Eastern Province
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwEastId,
      level: 2,
      code: '0501',
      name: 'Kayonza',
      local_name: 'Kayonza',
      type: 'district',
      population: 350000,
      area_km2: 1937,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: uuidv4(),
      country_id: 'ba50a11b-f408-404f-88a9-9d975052c245',
      parent_id: rwEastId,
      level: 2,
      code: '0502',
      name: 'Rwamagana',
      local_name: 'Rwamagana',
      type: 'district',
      population: 320000,
      area_km2: 682,
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);

  console.log('✅ Administrative divisions seeded successfully');
}
