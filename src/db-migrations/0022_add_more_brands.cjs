const brands = [
	{
		name: 'Toro',
		logo: 'toro.png'
	},{
		name: 'Husqvarna',
		logo: 'husqvarna.png'
	},{
		name: 'Ranch King',
		logo: 'ranchking.png'
	},{
		name: 'Lawn Boy',
		logo: 'lawnboy.png'
	},{
		name: 'Snapper',
		logo: 'snapper.png'
	},{
		name: 'Cub Cadet',
		logo: 'cubcadet.png'
	},{
		name: 'Yard Force',
		logo: 'yardforce.png'
	},{
		name: 'Brute',
		logo: 'brute.png'
	},{
		name: 'Yard Machines',
		logo: 'yardmachines.png'
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
