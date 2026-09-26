exports.up = async function(knex) {
	await knex.schema.createTable('products', table => {
		table.increments('id').primary();
		table.string('sku', 255).notNullable();
		table.string('name', 255).notNullable();
		table.text('description');
		table.decimal('price', 10, 2);
		table.timestamp('created_at').defaultTo(knex.fn.now());
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTable('products');
};