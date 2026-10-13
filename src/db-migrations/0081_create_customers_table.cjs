exports.up = async function(knex) {
	await knex.schema.createTable('customers', table => {
		table.increments('id').primary();
		table.integer('external_id').unsigned().notNullable().unique();
		table.string('first_name', 255).notNullable();
		table.string('last_name', 255).notNullable();
		table.string('address_1', 255);
		table.string('city', 255);
		table.string('state', 2);
		table.string('zip', 10);
		table.string('phone', 32);
		table.string('email', 255);
		table.text('notes');
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTable('customers');
};
