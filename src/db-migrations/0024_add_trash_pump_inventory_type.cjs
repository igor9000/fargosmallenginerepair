exports.up = async function(knex) {
	await knex('inventory_types').insert([
		{
			name: 'Trash Pumps',
			singular_name: 'Trash Pump',
			description: 'Move water, debris, and sludge with a dependable trash pump.'
		}
	]);
};

exports.down = async function(knex) {
	await knex('inventory_types')
		.whereIn('name', [
			'Trash Pumps'
		])
		.del();
};
