exports.up = async function(knex) {
	const murray = await knex('brands')
		.where({ name: 'Murray' })
		.first();

	await knex('inventory')
		.where({ sku: 'MY-0012' })
		.update({ brand_id: murray.id });
};

exports.down = async function(knex) {
	await knex('inventory')
		.where({ sku: 'MY-0012' })
		.update({ brand_id: null });
};
