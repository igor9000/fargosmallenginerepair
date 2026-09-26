exports.up = async function(knex) {
	await knex.schema.renameTable('products', 'inventory');
};

exports.down = async function(knex) {
	await knex.schema.renameTable('inventory', 'products');
};
