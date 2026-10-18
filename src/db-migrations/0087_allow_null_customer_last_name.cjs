exports.up = async function(knex) {
	await knex.schema.alterTable('customers', table => {
		table.string('last_name', 255).nullable().alter();
	});
};

exports.down = async function(knex) {
	await knex('customers')
		.whereNull('last_name')
		.update({ last_name: '' });

	await knex.schema.alterTable('customers', table => {
		table.string('last_name', 255).notNullable().alter();
	});
};
