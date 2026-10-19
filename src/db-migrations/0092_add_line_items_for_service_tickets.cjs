
exports.up = async function(knex) {
	await knex.schema.alterTable('service_tickets', table => {
		table.enu('billing_method', [
			'quoted_total',
			'itemized',
			'flat_rate'
		])
			.notNullable()
			.defaultTo('quoted_total');

		table.decimal('quoted_total', 10, 2)
			.unsigned()
			.nullable();
	});

	await knex.schema.createTable('service_ticket_charges', table => {
		table.increments('id').unsigned().primary();

		table.integer('service_ticket_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('service_tickets')
			.onDelete('CASCADE');

		table.integer('standard_charge_id')
			.unsigned()
			.nullable()
			.references('id')
			.inTable('standard_charges')
			.onDelete('RESTRICT');

		table.enu('category', [
			'labor',
			'part',
			'standard'
		]).notNullable();

		table.string('description', 255).notNullable();

		table.decimal('quantity', 12, 4)
			.unsigned()
			.notNullable()
			.defaultTo(1);

		table.string('unit', 30).nullable();

		table.decimal('unit_price', 12, 4)
			.unsigned()
			.nullable();

		table.decimal('amount', 10, 2)
			.nullable();

		table.integer('standard_charge_version_id')
			.unsigned()
			.nullable()
			.references('id')
			.inTable('standard_charge_versions')
			.onDelete('RESTRICT');

		table.boolean('taxable')
			.notNullable()
			.defaultTo(false);

		table.integer('sort_order')
			.unsigned()
			.notNullable()
			.defaultTo(0);

		table.timestamps(true, true);

		table.index(
			['service_ticket_id', 'sort_order'],
			'stc_ticket_order_idx'
		);
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTableIfExists('service_ticket_charges');

	await knex.schema.alterTable('service_tickets', table => {
		table.dropColumn('billing_method');
		table.dropColumn('quoted_total');
	});
};
