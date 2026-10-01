exports.up = async function(knex) {
	await knex.schema.alterTable('inventory', (table) => {
		table.string('slug', 255).notNullable().defaultTo('');
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory', (table) => {
		table.dropColumn('slug');
	});
};
