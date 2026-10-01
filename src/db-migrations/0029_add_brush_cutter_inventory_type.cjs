exports.up = async function(knex) {
	await knex('inventory_types').insert([
		{
			name: 'Brush Cutters',
			singular_name: 'Brush Cutter',
			description: 'Shop brush cutters designed to handle vegetation that ordinary string trimmers can’t.'
		}
	]);
};

exports.down = async function(knex) {
	await knex('inventory_types')
		.whereIn('name', [
			'Brush Cutters'
		])
		.del();
};
