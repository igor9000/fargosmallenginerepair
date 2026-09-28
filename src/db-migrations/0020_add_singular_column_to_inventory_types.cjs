exports.up = async function(knex) {
	await knex.schema.alterTable('inventory_types', (table) => {
		table.string('singular_name', 255).nullable().after('name')
	})
}

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory_types', (table) => {
		table.dropColumn('singular_name')
	})
}
