exports.up = async function(knex) {
	await knex('inventory_types').insert([
		{
			name: 'Generators',
			singular_name: 'Generator',
			description: 'Portable electric power for the job site or the next big storm.'
		}
	]);
};

exports.down = async function(knex) {
	await knex('inventory_types')
		.whereIn('name', [
			'Generators'
		])
		.del();
};
