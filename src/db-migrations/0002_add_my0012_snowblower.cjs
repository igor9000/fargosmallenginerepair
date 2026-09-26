exports.up = async function(knex) {
	await knex('products').insert({
		sku: 'MY-0012',
		name: 'Murray 5HP 24" Snow Blower',
		description: 'This Murray two-stage snowblower is a solid, budget-friendly option with a dependable 5HP engine. The 24” clearing width handles typical snowfall with ease, and the electric start makes cold mornings quick and hassle-free.\n\nFully serviced and ready to go!\n✅ Fresh oil change\n✅ New spark plug\n✅ New carburetor',
		price: 300.00
	});
};

exports.down = async function(knex) {
	await knex('products')
		.where({ sku: 'MY-0012' })
		.del();
};