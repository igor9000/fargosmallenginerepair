exports.up = async function(knex) {
	await knex.schema.createTable('brands', table => {
		table.increments('id').primary();
		table.string('name', 255).notNullable().unique();
		table.string('logo', 255).notNullable().unique();
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTable('brands');
};
