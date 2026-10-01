exports.up = async function(knex) {
	await knex('inventory_types')
		.whereIn('name', [
			'Trash Pumps'
		])
		.update({ season: 'All' });
};

exports.down = async function(knex) {
	await knex('inventory_types')
		.whereIn('name', [
			'Trash Pumps'
		])
		.update({ season: 'all' });
};