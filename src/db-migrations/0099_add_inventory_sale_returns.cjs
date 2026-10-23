
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const randomLetter = `SUBSTRING('${alphabet}',
	1 + MOD(ORD(RANDOM_BYTES(1)), 52), 1)`;

const tokenExpression =
	`CONCAT(${Array(6).fill(randomLetter).join(', ')})`;

exports.up = async function(knex) {
	// One record per return/refund transaction.
	await knex.schema.createTable('inventory_sale_returns', table => {
		table.increments('id').unsigned().primary();

		table.integer('inventory_sale_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('inventory_sales')
			.onDelete('RESTRICT');

		// Private customer-facing refund receipt.
		table.specificType(
			'token',
			'VARCHAR(6) CHARACTER SET ascii COLLATE ascii_bin'
		)
			.notNullable()
			.unique()
			.defaultTo(knex.raw(`(${tokenExpression})`));

		table.timestamp('return_date')
			.notNullable()
			.defaultTo(knex.fn.now());

		table.string('refund_method', 30)
			.notNullable()
			.defaultTo('Not Specified');

		table.string('refund_reference', 100).nullable();

		table.text('reason').nullable();
		table.text('notes').nullable();

		// Financial totals for the entire refund.
		table.decimal('refund_subtotal', 10, 2)
			.unsigned()
			.notNullable();

		table.decimal('refund_sales_tax', 10, 2)
			.unsigned()
			.notNullable();

		table.decimal('refund_total', 10, 2)
			.unsigned()
			.notNullable();

		table.timestamp('created_at')
			.notNullable()
			.defaultTo(knex.fn.now());

		table.index(['inventory_sale_id', 'return_date']);
	});

	// Equipment involved in each return/refund.
	await knex.schema.createTable('inventory_sale_return_items', table => {
		table.increments('id').unsigned().primary();

		table.integer('inventory_sale_return_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('inventory_sale_returns')
			.onDelete('CASCADE');

		// Points to the ORIGINAL sale line item.
		table.integer('inventory_sale_item_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('inventory_sale_items')
			.onDelete('RESTRICT');

		// A refund does not necessarily mean equipment
		// was physically returned.
		table.boolean('physically_returned')
			.notNullable()
			.defaultTo(false);

		table.decimal('refund_subtotal', 10, 2)
			.unsigned()
			.notNullable();

		table.decimal('refund_sales_tax', 10, 2)
			.unsigned()
			.notNullable();

		table.decimal('refund_total', 10, 2)
			.unsigned()
			.notNullable();

		table.index('inventory_sale_item_id');
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTableIfExists(
		'inventory_sale_return_items'
	);

	await knex.schema.dropTableIfExists(
		'inventory_sale_returns'
	);
};
