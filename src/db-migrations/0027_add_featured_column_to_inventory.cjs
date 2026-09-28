exports.up = async function(knex) {
	await knex.schema.alterTable('inventory', (table) => {
		table.boolean('featured').notNullable().defaultTo(false);
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory', (table) => {
		table.dropColumn('featured');
	});
};
