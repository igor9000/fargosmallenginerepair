exports.up = async function (knex) {
	await knex.schema.createTable('inventory_attributes', (table) => {
		table.increments('id').primary();

		table.string('name', 100).notNullable();
		table.string('slug', 100).notNullable().unique();

		// text, number, boolean, etc.
		table.string('data_type', 20).notNullable().defaultTo('text');

		// hp, inches, cc, lbs, etc.
		table.string('unit', 50);
		table.integer('sort_order').notNullable().defaultTo(0);

		table.timestamps(true, true);
	});

	await knex.schema.createTable('inventory_attribute_values', (table) => {
		table.increments('id').primary();

		table
			.integer('inventory_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('inventory')
			.onDelete('CASCADE');

		table
			.integer('attribute_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('inventory_attributes')
			.onDelete('CASCADE');

		table.text('value').nullable();

		table.timestamps(true, true);

		table.unique(['inventory_id', 'attribute_id']);
		table.index('attribute_id');
	});
};

exports.down = async function (knex) {
	await knex.schema.dropTableIfExists('inventory_attribute_values');
	await knex.schema.dropTableIfExists('inventory_attributes');
};
