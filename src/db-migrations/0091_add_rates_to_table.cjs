
exports.up = async function(knex) {
	const charges = [
		{
			name: 'Sales Tax',
			slug: 'sales-tax',
			calculation_type: 'percentage',
			unit: '%',
			value: '7.7500'
		},
		{
			name: 'Shop Materials',
			slug: 'shop-materials',
			calculation_type: 'percentage',
			unit: '%',
			value: '5.7100'
		},
		{
			name: 'Engine Oil',
			slug: 'engine-oil',
			calculation_type: 'unit_price',
			unit: 'oz',
			value: '0.2100'
		}
	];

	for (const charge of charges) {
		await knex('standard_charges')
			.insert({
				name: charge.name,
				slug: charge.slug,
				calculation_type: charge.calculation_type,
				unit: charge.unit,
				active: true
			})
			.onConflict('slug')
			.ignore();

		const existing = await knex('standard_charges')
			.where({ slug: charge.slug })
			.first('id');

		if (charge.value === null) continue;

		await knex('standard_charge_versions')
			.insert({
				standard_charge_id: existing.id,
				value: charge.value,
				effective_date: knex.raw('CURRENT_DATE()')
			})
			.onConflict(['standard_charge_id', 'effective_date'])
			.ignore();
	}
};

exports.down = async function(knex) {
	await knex.transaction(async trx => {
		const slugs = [
			'sales-tax',
			'shop-materials',
			'engine-oil'
		];

		const charges = await trx('standard_charges')
			.whereIn('slug', slugs)
			.select('id');

		const ids = charges.map(charge => charge.id);

		if (!ids.length) return;

		await trx('standard_charge_versions')
			.whereIn('standard_charge_id', ids)
			.del();

		await trx('standard_charges')
			.whereIn('id', ids)
			.del();
	});
};


