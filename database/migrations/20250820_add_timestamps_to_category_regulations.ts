import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// created_at
	if (!(await knex.schema.hasColumn('category_regulations', 'created_at'))) {
		await knex.schema.alterTable('category_regulations', (table) => {
			timestampColumn(table, knex, 'created_at', true);
		});
	}

	// updated_at
	if (!(await knex.schema.hasColumn('category_regulations', 'updated_at'))) {
		await knex.schema.alterTable('category_regulations', (table) => {
			timestampColumn(table, knex, 'updated_at', true);
		});
	}

	// deleted_at (for paranoid deletes)
	if (!(await knex.schema.hasColumn('category_regulations', 'deleted_at'))) {
		await knex.schema.alterTable('category_regulations', (table) => {
			table.timestamp('deleted_at', { useTz: true }).nullable();
		});
	}
}

export async function down(knex: Knex): Promise<void> {
	if (await knex.schema.hasColumn('category_regulations', 'deleted_at')) {
		await knex.schema.alterTable('category_regulations', (table) => {
			table.dropColumn('deleted_at');
		});
	}
	if (await knex.schema.hasColumn('category_regulations', 'updated_at')) {
		await knex.schema.alterTable('category_regulations', (table) => {
			table.dropColumn('updated_at');
		});
	}
	if (await knex.schema.hasColumn('category_regulations', 'created_at')) {
		await knex.schema.alterTable('category_regulations', (table) => {
			table.dropColumn('created_at');
		});
	}
}

function timestampColumn(table: Knex.CreateTableBuilder | Knex.AlterTableBuilder, knex: Knex, name: string, notNullWithDefaultNow = false) {
	const col = table.timestamp(name, { useTz: true });
	if (notNullWithDefaultNow) {
		col.notNullable().defaultTo(knex.fn.now());
	}
	return col;
}
