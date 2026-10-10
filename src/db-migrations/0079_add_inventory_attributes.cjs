const attributes = [
	{
		name: 'Cutting Type',
		slug: 'cutting-type',
		data_type: 'string',
		unit: null,
		sort_order: 45,
	},
	{
		name: 'Drive Features',
		slug: 'drive-features',
		data_type: 'string',
		unit: null,
		sort_order: 95,
	}
];

exports.up = async function (knex) {
	await knex('inventory_attributes').insert(attributes);
};

exports.down = async function (knex) {
	await knex('inventory_attributes')
		.whereIn('slug', attributes.map((attribute) => attribute.slug))
		.del();
};
