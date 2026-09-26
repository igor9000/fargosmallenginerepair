exports.up = async function(knex) {
	await knex.schema.createTable('inventory_images', table => {
		table.increments('id').primary();

		table
			.integer('inventory_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('inventory')
			.onDelete('CASCADE');

		table.string('url', 1024).notNullable();
		table.integer('sort_order').notNullable().defaultTo(0);
		table.boolean('is_primary').notNullable().defaultTo(false);
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTable('inventory_images');
};
