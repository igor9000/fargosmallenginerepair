const attributes = [
	{
		name: 'Type',
		slug: 'type',
		data_type: 'string',
		unit: null,
		sort_order: 10,
	},
	{
		name: 'Fuel Type',
		slug: 'fuel-type',
		data_type: 'string',
		unit: null,
		sort_order: 20,
	},
	{
		name: 'Stage',
		slug: 'stage',
		data_type: 'string',
		unit: null,
		sort_order: 30,
	},
	{
		name: 'Cutting Width',
		slug: 'cutting-width',
		data_type: 'number',
		unit: 'in',
		sort_order: 40,
	},
	{
		name: 'Clearing Width',
		slug: 'clearing-width',
		data_type: 'number',
		unit: 'in',
		sort_order: 40,
	},
	{
		name: 'Capacity',
		slug: 'capacity',
		data_type: 'number',
		unit: 'gpm',
		sort_order: 40,
	},
	{
		name: 'Horsepower',
		slug: 'horsepower',
		data_type: 'number',
		unit: 'hp',
		sort_order: 50,
	},
	{
		name: 'Engine Size',
		slug: 'engine-size',
		data_type: 'number',
		unit: 'cc',
		sort_order: 60,
	},
	{
		name: 'Engine Brand',
		slug: 'engine-brand',
		data_type: 'string',
		unit: null,
		sort_order: 70,
	},
	{
		name: 'Self Propelled',
		slug: 'self-propelled',
		data_type: 'string',
		unit: null,
		sort_order: 80,
	},
	{
		name: 'Drive Type',
		slug: 'drive-type',
		data_type: 'string',
		unit: null,
		sort_order: 90,
	},
	{
		name: 'Bagger Included',
		slug: 'bagger-included',
		data_type: 'string',
		unit: null,
		sort_order: 100,
	},
	{
		name: 'Start Type',
		slug: 'start-type',
		data_type: 'string',
		unit: null,
		sort_order: 110,
	},
	{
		name: 'Warranty',
		slug: 'warranty',
		data_type: 'string',
		unit: null,
		sort_order: 120,
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
