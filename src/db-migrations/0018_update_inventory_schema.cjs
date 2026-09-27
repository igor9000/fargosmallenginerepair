exports.up = async function(knex) {
	await knex.schema.alterTable('inventory', (table) => {
		table.unique('sku');
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory', (table) => {
		table.dropUnique('sku');
	});
};
