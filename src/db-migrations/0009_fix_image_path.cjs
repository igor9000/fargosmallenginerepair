exports.up = async function(knex) {
	const item = await knex('inventory')
		.where({ sku: 'MY-0012' })
		.first();

	if (!item) {
		throw new Error('Inventory item MY-0012 not found');
	}

	await knex('inventory_images').insert([
		{
			inventory_id: item.id,
			url: 'MY-0012 (1).jpg',
			sort_order: 1,
			is_primary: true
		},
		{
			inventory_id: item.id,
			url: 'MY-0012 (2).jpg',
			sort_order: 2,
			is_primary: false
		},
		{
			inventory_id: item.id,
			url: 'MY-0012 (3).jpg',
			sort_order: 3,
			is_primary: false
		},
		{
			inventory_id: item.id,
			url: 'MY-0012 (4).jpg',
			sort_order: 4,
			is_primary: false
		},
		{
			inventory_id: item.id,
			url: 'MY-0012 (5).jpg',
			sort_order: 5,
			is_primary: false
		},
		{
			inventory_id: item.id,
			url: 'MY-0012 (6).jpg',
			sort_order: 6,
			is_primary: false
		}
	]);
};

exports.down = async function(knex) {
	const item = await knex('inventory')
		.where({ sku: 'MY-0012' })
		.first();

	if (!item) {
		return;
	}

	await knex('inventory_images')
		.where({ inventory_id: item.id })
		.del();
};