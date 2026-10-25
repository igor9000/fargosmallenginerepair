const brands = [
	{
		name: 'PowerSmart',
		logo: 'powersmart.png'
	}
]


exports.up = async function(knex) {
	await knex('brands').insert(brands);
};

exports.down = async function(knex) {
	await knex.transaction(async (trx) => {
		for (const brand of brands) {
			await trx('brands')
				.where('name', brand.name)
				.del();
		}
	});
};
