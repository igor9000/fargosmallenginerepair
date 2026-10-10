const types = [
	{ name: 'Lawn Mowers', singular_name: 'Lawn Mower' },
	{ name: 'Snow Blowers', singular_name: 'Snow Blower' },
	{ name: 'Pressure Washers', singular_name: 'Pressure Washer' },
	{ name: 'Tillers', singular_name: 'Tiller' },
	{ name: 'Edgers', singular_name: 'Edger' },
	{ name: 'Trimmers', singular_name: 'Trimmer' },
	{ name: 'Riding Mowers', singular_name: 'Riding Mower' }
]

exports.up = async function(knex) {
	for (const type of types) {
		await knex('inventory_types')
			.where('name', type.name)
			.update({ singular_name: type.singular_name })
	}
}

exports.down = async function(knex) {
	// await knex.schema.alterTable('inventory_types', (table) => {
	// 	table.dropColumn('singular_name')
	// })
	await knex('inventory_types')
	.whereIn('name', types.map(item => item.name))
	.update({
		singular_name: ''
	});
}
