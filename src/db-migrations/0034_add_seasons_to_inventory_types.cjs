exports.up = async function(knex) {
	await knex('inventory_types')
		.whereIn('name', [
			'Lawn Mowers',
			'Riding Mowers',
			'Pressure Washers',
			'Tillers',
			'Edgers',
			'Trimmers',
			'Brush Cutters'
		])
		.update({ season: 'Summer' });

	await knex('inventory_types')
		.whereIn('name', [
			'Generators'
		])
		.update({ season: 'All' });

	await knex('inventory_types')
		.whereIn('name', [
			'Snow Blowers',
			'Ice Augers'
		])
		.update({ season: 'Winter' });
};

exports.down = async function(knex) {
	await knex('inventory_types')
		.update({ season: '' });
};