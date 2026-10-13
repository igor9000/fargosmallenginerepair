const updates = [
	{
		sku: 'CM-0057',
		description: 'This Craftsman 5.5 HP 24-inch two-stage snow thrower is a classic gas-powered snow-clearing machine great for residential driveways and sidewalks.'
	}
];

exports.up = async function(knex) {
	for (const item of updates) {
		await knex('inventory')
			.where('sku', item.sku)
			.update({
				description: item.description
			});
	}
};

exports.down = async function(knex) {
	await knex('inventory')
		.whereIn('sku', updates.map(item => item.sku))
		.update({
			description: ''
		});
};
