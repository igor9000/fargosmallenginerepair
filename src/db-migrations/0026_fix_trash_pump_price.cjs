exports.up = async function(knex) {
	await knex('inventory')
		.where('sku', 'HO-0005')
		.update({
			price: 800.00
		});
};

exports.down = async function(knex) {
	await knex('inventory')
		.where('sku', 'HO-0005')
		.update({
			price: 800.00
		});
};