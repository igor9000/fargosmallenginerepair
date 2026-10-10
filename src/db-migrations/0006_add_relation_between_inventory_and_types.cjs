exports.up = async function(knex) {
	// 1. Add the column as nullable first
	await knex.schema.alterTable('inventory', table => {
		table
			.integer('inventory_type_id')
			.unsigned()
			.references('id')
			.inTable('inventory_types')
			.onDelete('RESTRICT');
	});

	// 2. Assign the existing snow blower
	const snowBlowerType = await knex('inventory_types')
		.where({ name: 'Snow Blowers' })
		.first();

	await knex('inventory')
		.where({ sku: 'MY-0012' })
		.update({
			inventory_type_id: snowBlowerType.id
		});

	// 3. Now require every inventory item to have a type
	await knex.schema.alterTable('inventory', table => {
		table
			.integer('inventory_type_id')
			.unsigned()
			.notNullable()
			.alter();
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory', table => {
        table.dropForeign('inventory_type_id');
    });

	await knex.schema.alterTable('inventory', table => {
		table.dropColumn('inventory_type_id');
	});
};