exports.up = async function(knex) {
	await knex('brands').insert([
		{
			name: 'Briggs & Stratton',
			logo: 'briggs-stratton.png'
		}
	]);
};

exports.down = async function(knex) {
	await knex('brands')
		.where({ name: 'Briggs & Stratton', logo: 'briggs-stratton.png' })
		.del();
};
