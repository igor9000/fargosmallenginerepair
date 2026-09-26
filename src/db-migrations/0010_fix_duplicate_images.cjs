exports.up = async function(knex) {
	await knex('inventory_images')
		.whereIn('id', [1, 2, 3, 4, 5, 6])
		.del();
};

exports.down = async function(knex) {
	await knex('inventory_images').insert([
		{
			id: 1,
			inventory_id: 1,
			url: 'MY-0012/MY-0012 (1).jpg',
			sort_order: 1,
			is_primary: true
		},
		{
			id: 2,
			inventory_id: 1,
			url: 'MY-0012/MY-0012 (2).jpg',
			sort_order: 2,
			is_primary: false
		},
		{
			id: 3,
			inventory_id: 1,
			url: 'MY-0012/MY-0012 (3).jpg',
			sort_order: 3,
			is_primary: false
		},
		{
			id: 4,
			inventory_id: 1,
			url: 'MY-0012/MY-0012 (4).jpg',
			sort_order: 4,
			is_primary: false
		},
		{
			id: 5,
			inventory_id: 1,
			url: 'MY-0012/MY-0012 (5).jpg',
			sort_order: 5,
			is_primary: false
		},
		{
			id: 6,
			inventory_id: 1,
			url: 'MY-0012/MY-0012 (6).jpg',
			sort_order: 6,
			is_primary: false
		}
	]);
};