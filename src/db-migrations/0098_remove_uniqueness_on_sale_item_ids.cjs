
exports.up = async function(knex) {
	// Add a regular index first because the foreign key
	// still needs an index on inventory_id.
	await knex.schema.alterTable('inventory_sale_items', table => {
		table.index(
			'inventory_id',
			'inventory_sale_items_inventory_id_idx'
		);
	});

	// Allow one inventory item to appear in multiple sales.
	await knex.schema.alterTable('inventory_sale_items', table => {
		table.dropUnique('inventory_id');
	});
};

exports.down = async function(knex) {
	// Cannot restore uniqueness if an item was sold twice.
	const duplicate = await knex('inventory_sale_items')
		.select('inventory_id')
		.groupBy('inventory_id')
		.havingRaw('COUNT(*) > 1')
		.first();

	if (duplicate) {
		throw new Error(
			'Cannot restore uniqueness: inventory items have multiple sales'
		);
	}

	await knex.schema.alterTable('inventory_sale_items', table => {
		table.unique('inventory_id');
	});

	await knex.schema.alterTable('inventory_sale_items', table => {
		table.dropIndex(
			'inventory_id',
			'inventory_sale_items_inventory_id_idx'
		);
	});
};
