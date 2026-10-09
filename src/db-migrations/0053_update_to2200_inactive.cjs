const updates = [
	{
		sku: 'TO-2200',
		active: '0'
	}
];

exports.up = async function(knex) {
	for (const item of updates) {
		await knex('inventory')
			.where('sku', item.sku)
			.update({
				active: item.active
			});
	}
};

exports.down = async function(knex) {
	await knex('inventory')
		.whereIn('sku', updates.map(item => item.sku))
		.update({
			active: '1'
		});
};
