import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create verification_document_types table
  await knex.schema.createTable('verification_document_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('country_id').notNullable().references('id').inTable('countries').onDelete('CASCADE');
    table.string('document_type', 50).notNullable().comment('national_id, passport, driving_license, voter_id, etc.');
    table.string('local_name', 100).comment('Local name for the document in country language');
    table.boolean('is_required').defaultTo(false).comment('Required for verification in this country');
    table.string('validation_regex', 500).comment('Regex pattern for document number validation');
    table.string('format_example', 100).comment('Example of valid document format');
    table.text('description').comment('Description of the document type');
    table.integer('min_length').comment('Minimum length of document number');
    table.integer('max_length').comment('Maximum length of document number');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    // Indexes for better performance
    table.index(['country_id']);
    table.index(['document_type']);
    table.index(['is_required']);
    table.index(['is_active']);
    table.index(['country_id', 'is_required']);
    table.index(['country_id', 'is_active']);
    
    // Unique constraint for document type within country
    table.unique(['country_id', 'document_type']);
  });

  // Insert sample data for different countries
  // Get country IDs first
  const countries = await knex('countries').select('id', 'code').whereIn('code', ['RW', 'KE', 'UG', 'TZ', 'BI']);
  
  if (countries.length > 0) {
    const documentTypes: any[] = [];
    
    // Rwanda document types
    const rwanda = countries.find(c => c.code === 'RW');
    if (rwanda) {
      documentTypes.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: rwanda.id,
          document_type: 'national_id',
          local_name: 'Indangamuntu',
          is_required: true,
          validation_regex: '^1\\d{15}$',
          format_example: '1199780123456789',
          description: 'Rwandan National Identity Card',
          min_length: 16,
          max_length: 16,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: rwanda.id,
          document_type: 'passport',
          local_name: 'Passeport',
          is_required: false,
          validation_regex: '^P[A-Z]\\d{7}$',
          format_example: 'PA1234567',
          description: 'Rwandan Passport',
          min_length: 9,
          max_length: 9,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: rwanda.id,
          document_type: 'driving_license',
          local_name: 'Uruhushya rwo gutwara',
          is_required: false,
          validation_regex: '^\\d{8}$',
          format_example: '12345678',
          description: 'Rwandan Driving License',
          min_length: 8,
          max_length: 8,
          is_active: true
        }
      );
    }

    // Kenya document types
    const kenya = countries.find(c => c.code === 'KE');
    if (kenya) {
      documentTypes.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: kenya.id,
          document_type: 'national_id',
          local_name: 'National ID',
          is_required: true,
          validation_regex: '^\\d{8}$',
          format_example: '12345678',
          description: 'Kenyan National Identity Card',
          min_length: 8,
          max_length: 8,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: kenya.id,
          document_type: 'passport',
          local_name: 'Passport',
          is_required: false,
          validation_regex: '^[A-Z]\\d{7}$',
          format_example: 'A1234567',
          description: 'Kenyan Passport',
          min_length: 8,
          max_length: 8,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: kenya.id,
          document_type: 'driving_license',
          local_name: 'Driving License',
          is_required: false,
          validation_regex: '^\\d{8}$',
          format_example: '12345678',
          description: 'Kenyan Driving License',
          min_length: 8,
          max_length: 8,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: kenya.id,
          document_type: 'voter_id',
          local_name: 'Voter ID',
          is_required: false,
          validation_regex: '^\\d{8}$',
          format_example: '12345678',
          description: 'Kenyan Voter Registration Card',
          min_length: 8,
          max_length: 8,
          is_active: true
        }
      );
    }

    // Uganda document types
    const uganda = countries.find(c => c.code === 'UG');
    if (uganda) {
      documentTypes.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: uganda.id,
          document_type: 'national_id',
          local_name: 'National ID',
          is_required: true,
          validation_regex: '^[A-Z]{2}\\d{13}$',
          format_example: 'CM1234567890123',
          description: 'Ugandan National Identity Card',
          min_length: 15,
          max_length: 15,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: uganda.id,
          document_type: 'passport',
          local_name: 'Passport',
          is_required: false,
          validation_regex: '^[A-Z]\\d{7}$',
          format_example: 'B1234567',
          description: 'Ugandan Passport',
          min_length: 8,
          max_length: 8,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: uganda.id,
          document_type: 'voter_id',
          local_name: 'Voter ID',
          is_required: false,
          validation_regex: '^\\d{9}$',
          format_example: '123456789',
          description: 'Ugandan Voter Registration Card',
          min_length: 9,
          max_length: 9,
          is_active: true
        }
      );
    }

    // Tanzania document types
    const tanzania = countries.find(c => c.code === 'TZ');
    if (tanzania) {
      documentTypes.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: tanzania.id,
          document_type: 'national_id',
          local_name: 'Kitambulisho cha Taifa',
          is_required: true,
          validation_regex: '^\\d{20}$',
          format_example: '12345678901234567890',
          description: 'Tanzanian National Identity Card',
          min_length: 20,
          max_length: 20,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: tanzania.id,
          document_type: 'passport',
          local_name: 'Pasipoti',
          is_required: false,
          validation_regex: '^[A-Z]\\d{7}$',
          format_example: 'T1234567',
          description: 'Tanzanian Passport',
          min_length: 8,
          max_length: 8,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: tanzania.id,
          document_type: 'voter_id',
          local_name: 'Kitambulisho cha Mpiga Kura',
          is_required: false,
          validation_regex: '^\\d{8}$',
          format_example: '12345678',
          description: 'Tanzanian Voter Registration Card',
          min_length: 8,
          max_length: 8,
          is_active: true
        }
      );
    }

    // Burundi document types
    const burundi = countries.find(c => c.code === 'BI');
    if (burundi) {
      documentTypes.push(
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: burundi.id,
          document_type: 'national_id',
          local_name: 'Indangamuntu',
          is_required: true,
          validation_regex: '^\\d{11}$',
          format_example: '12345678901',
          description: 'Burundian National Identity Card',
          min_length: 11,
          max_length: 11,
          is_active: true
        },
        {
          id: knex.raw('uuid_generate_v4()'),
          country_id: burundi.id,
          document_type: 'passport',
          local_name: 'Passeport',
          is_required: false,
          validation_regex: '^[A-Z]\\d{7}$',
          format_example: 'B1234567',
          description: 'Burundian Passport',
          min_length: 8,
          max_length: 8,
          is_active: true
        }
      );
    }

    // Insert all document types
    if (documentTypes.length > 0) {
      await knex('verification_document_types').insert(documentTypes);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('verification_document_types');
}
