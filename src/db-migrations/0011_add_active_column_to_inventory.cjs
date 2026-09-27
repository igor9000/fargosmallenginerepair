exports.up = async function(knex) {
	await knex.schema.alterTable('inventory', table => {
		table
			.boolean('active')
			.notNullable()
			.defaultTo(true);
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory', table => {
		table.dropColumn('active');
	});
};