exports.up = async function(knex) {
	await knex('inventory_types').insert([
		{
			name: 'Ice Augers',
			singular_name: 'Ice Auger',
			description: 'Get ready for ice fishing with an auger.'
		}
	]);
};

exports.down = async function(knex) {
	await knex('inventory_types')
		.whereIn('name', [
			'Ice Augers'
		])
		.del();
};
