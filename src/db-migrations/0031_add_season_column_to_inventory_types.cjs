exports.up = async function(knex) {
	await knex.schema.alterTable('inventory_types', (table) => {
		table.string('season', 20).notNullable().defaultTo('all');
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory_types', (table) => {
		table.dropColumn('season');
	});
};
