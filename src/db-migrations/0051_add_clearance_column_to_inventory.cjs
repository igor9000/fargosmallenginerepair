exports.up = async function(knex) {
	await knex.schema.alterTable('inventory', (table) => {
		table.tinyint('clearance', 1).notNullable().defaultTo('0');
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory', (table) => {
		table.dropColumn('clearance');
	});
};
