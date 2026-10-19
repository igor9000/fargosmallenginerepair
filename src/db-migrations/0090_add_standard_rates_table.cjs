
exports.up = async function(knex) {
	await knex.schema.createTable('standard_charges', table => {
		table.increments('id').unsigned().primary();

		table.string('name', 100).notNullable();
		table.string('slug', 100).notNullable().unique();

		table.enu('calculation_type', ['percentage', 'unit_price'])
			.notNullable();

		table.string('unit', 30).nullable();

		table.boolean('active')
			.notNullable()
			.defaultTo(true);

		table.timestamps(true, true);
	});

	await knex.schema.createTable('standard_charge_versions', table => {
		table.increments('id').unsigned().primary();

		table.integer('standard_charge_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('standard_charges')
			.onDelete('RESTRICT');

		table.decimal('value', 12, 4)
			.notNullable();

		table.date('effective_date')
			.notNullable();

		table.timestamp('created_at')
			.notNullable()
			.defaultTo(knex.fn.now());

		table.unique(
			['standard_charge_id', 'effective_date'],
			'scv_charge_date_unique'
		);
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTableIfExists('standard_charge_versions');
	await knex.schema.dropTableIfExists('standard_charges');
};
