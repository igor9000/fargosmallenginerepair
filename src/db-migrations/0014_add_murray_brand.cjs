exports.up = async function(knex) {
	await knex('brands').insert([
		{
			name: 'Murray',
			logo: 'murray.png'
		}
	]);
};

exports.down = async function(knex) {
	await knex('brands')
		.where({ slug: 'murray', logo: 'murray.png' })
		.del();
};
