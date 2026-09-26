exports.up = async function(knex) {
	await knex.schema.createTable('inventory_types', table => {
		table.increments('id').primary();
		table.string('name', 255).notNullable().unique();
		table.text('description');
		table.timestamp('created_at').defaultTo(knex.fn.now());
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTable('inventory_types');
};