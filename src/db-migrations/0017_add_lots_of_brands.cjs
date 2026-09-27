const brands = [
	{
		name: 'Craftsman',
		logo: 'craftsman.png'
	},
	{
		name: 'John Deere',
		logo: 'johndeere.png'
	},
	{
		name: 'Honda',
		logo: 'honda.png'
	},
	{
		name: 'Troy-Bilt',
		logo: 'troybilt.png'
	},
	{
		name: 'Weed Eater',
		logo: 'weedeater.png'
	},
	{
		name: 'Poulan Pro',
		logo: 'poulanpro.png'
	},
	{
		name: 'Yard-Man',
		logo: 'yardman.png'
	}
]


exports.up = async function(knex) {
	await knex('brands').insert(brands);
};

exports.down = async function(knex) {
	for (const brand of brands) {
		await knex('brands')
			.where(brand)
			.del();
	}
};
