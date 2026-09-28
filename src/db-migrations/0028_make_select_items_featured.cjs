exports.up = async function(knex) {
	await knex('inventory')
		.whereIn('sku', [
			'HO-0005',
			'MY-0012',
			'CM-0056'
		])
		.update({
			featured: true
		});
};

exports.down = async function(knex) {
	await knex('inventory')
		.whereIn('sku', [
			'HO-0005',
			'MY-0012',
			'CM-0056'
		])
		.update({
			featured: false
		});
};
