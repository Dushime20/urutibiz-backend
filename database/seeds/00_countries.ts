
import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
    // Check if Rwanda exists
    const rwanda = await knex('countries').where('code', 'RW').first();

    if (!rwanda) {
        console.log('🌍 Seeding Rwanda...');
        await knex('countries').insert({
            id: 'ba50a11b-f408-404f-88a9-9d975052c245',
            name: 'Rwanda',
            code: 'RW',
            phone_code: '+250',
            currency: 'RWF',
            currency_symbol: 'FRW',
            is_active: true,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
        });
    }
}
