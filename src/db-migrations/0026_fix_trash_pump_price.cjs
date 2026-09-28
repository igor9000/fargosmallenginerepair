exports.up = async function(knex) {
	await knex('inventory_items')
		.where('sku', 'HO-0005')
		.update({
			price: 800.00
		});
};

exports.down = async function(knex) {
	await knex('inventory_items')
		.where('sku', 'HO-0005')
		.update({
			price: 800.00
		});
};