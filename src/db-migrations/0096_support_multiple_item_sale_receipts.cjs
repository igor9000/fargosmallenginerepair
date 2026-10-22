
exports.up = async function(knex) {
	await knex.schema.createTable('inventory_sale_items', table => {
		table.increments('id').unsigned().primary();

		table.integer('inventory_sale_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('inventory_sales')
			.onDelete('CASCADE');

		// Each physical inventory item can be sold only once.
		table.integer('inventory_id')
			.unsigned()
			.notNullable()
			.unique()
			.references('id')
			.inTable('inventory')
			.onDelete('RESTRICT');

		// Actual selling price, with tax extracted.
		table.decimal('subtotal', 10, 2)
			.unsigned()
			.notNullable();

		table.decimal('sales_tax', 10, 2)
			.unsigned()
			.notNullable();

		table.decimal('total', 10, 2)
			.unsigned()
			.notNullable();

		table.integer('sort_order')
			.unsigned()
			.notNullable()
			.defaultTo(0);

		table.index(['inventory_sale_id', 'sort_order']);
	});

	// Preserve every existing one-item sale.
	await knex.raw(`
		INSERT INTO inventory_sale_items (
			inventory_sale_id,
			inventory_id,
			subtotal,
			sales_tax,
			total,
			sort_order
		)
		SELECT
			id,
			inventory_id,
			subtotal,
			sales_tax,
			total,
			0
		FROM inventory_sales
	`);

	// Remove the old one-item-per-sale relationship.
	await knex.schema.alterTable('inventory_sales', table => {
		table.dropForeign('inventory_id');
	});

	await knex.schema.alterTable('inventory_sales', table => {
		table.dropUnique('inventory_id');
	});

	await knex.schema.alterTable('inventory_sales', table => {
		table.dropColumn('inventory_id');
	});
};

exports.down = async function(knex) {
	// Reverting cannot represent multiple items on one sale.
	const multiple = await knex('inventory_sale_items')
		.select('inventory_sale_id')
		.groupBy('inventory_sale_id')
		.havingRaw('COUNT(*) > 1')
		.first();

	if (multiple) {
		throw new Error(
			'Cannot revert: some sales contain multiple items'
		);
	}

	await knex.schema.alterTable('inventory_sales', table => {
		table.integer('inventory_id').unsigned().nullable();
	});

	await knex.raw(`
		UPDATE inventory_sales s
		JOIN inventory_sale_items si
			ON si.inventory_sale_id = s.id
		SET s.inventory_id = si.inventory_id
	`);

	await knex.schema.alterTable('inventory_sales', table => {
		table.integer('inventory_id')
			.unsigned()
			.notNullable()
			.alter();

		table.unique('inventory_id');

		table.foreign('inventory_id')
			.references('id')
			.inTable('inventory')
			.onDelete('RESTRICT');
	});

	await knex.schema.dropTable('inventory_sale_items');
};
