const inventoryKey = { sku: 'HO-0005' };

const values = [
	{ slug: 'type', value: 'Trash Pump' },
	{ slug: 'fuel-type', value: 'Gas' },
	// { slug: 'stage', value: 'Two-stage' },
	// { slug: 'clearing-width', value: '24' },
	// { slug: 'cutting-width', value: '21' },
	{ slug: 'capacity', value: '357' },
	// { slug: 'horsepower', value: '5' },
	{ slug: 'engine-size', value: '240' },
	{ slug: 'engine-brand', value: 'Honda' },
	// { slug: 'self-propelled', value: 'Yes' },
	// { slug: 'drive-type', value: 'FWD' },
	// { slug: 'bagger-included', value: 'Yes' },
	{ slug: 'start-type', value: 'Recoil' },
	{ slug: 'warranty', value: '30 days' },
];

exports.up = async function (knex) {
	const items = await knex('inventory')
		.where(inventoryKey)
		.select('id');

	if (items.length !== 1) {
		throw new Error('Expected exactly one inventory item: MY-0012');
	}

	const attributes = await knex('inventory_attributes')
		.whereIn('slug', values.map(({ slug }) => slug))
		.select('id', 'slug');

	const attributeIds = new Map(
		attributes.map(({ id, slug }) => [slug, id])
	);

	const rows = values.map(({ slug, value }) => {
		if (!attributeIds.has(slug)) {
			throw new Error(`Missing inventory attribute: ${slug}`);
		}

		return {
			inventory_id: items[0].id,
			attribute_id: attributeIds.get(slug),
			value,
		};
	});

	await knex('inventory_attribute_values').insert(rows);
};

exports.down = async function (knex) {
	await knex('inventory_attribute_values')
		.whereIn(
			'inventory_id',
			knex('inventory').where(inventoryKey).select('id')
		)
		.whereIn(
			'attribute_id',
			knex('inventory_attributes')
				.whereIn('slug', values.map(({ slug }) => slug))
				.select('id')
		)
		.del();
};
