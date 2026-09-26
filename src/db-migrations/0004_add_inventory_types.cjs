exports.up = async function(knex) {
	await knex('inventory_types').insert([
		{
			name: 'Lawn Mowers',
			description: 'Keep your yard looking sharp with a dependable, serviced mower ready for another season.'
		},
		{
			name: 'Snow Blowers',
			description: 'Be ready before the next storm with a reliable, serviced machine built to tackle winter.'
		},
		{
			name: 'Pressure Washers',
			description: 'Bring back the clean with powerful, dependable equipment ready for your next project.'
		},
		{
			name: 'Tillers',
			description: 'Get your garden ready for planting and break up tough soil with a garden tiller.'
		},
		{
			name: 'Edgers',
			description: 'Give your yard a clean, finished look thats sure to be the envy of the neighborhood.'
		},
		{
			name: 'Trimmers',
			description: 'Take care of the spots your mower can’t reach with a string trimmer.'
		},
		{
			name: 'Riding Mowers',
			description: 'Tackle bigger yards in less time with dependable, serviced equipment ready to work.'
		}
	]);
};

exports.down = async function(knex) {
	await knex('inventory_types')
		.whereIn('name', [
			'Lawn Mowers',
			'Snow Blowers',
			'Pressure Washers',
			'Tillers',
			'Edgers',
			'Trimmers',
			'Riding Mowers'
		])
		.del();
};