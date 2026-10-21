const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const randomLetter = `SUBSTRING('${alphabet}',
	1 + MOD(ORD(RANDOM_BYTES(1)), 52), 1)`;

const tokenExpression =
	`CONCAT(${Array(6).fill(randomLetter).join(', ')})`;


exports.up = async function(knex) {
	await knex.schema.createTable('inventory_sales', table => {
		table.increments('id').unsigned().primary();

		// Numeric ID assigned by the external system.
		table.integer('sale_number')
			.unsigned()
			.notNullable()
			.unique();

		// One inventory item can only be sold once.
		table.integer('inventory_id')
			.unsigned()
			.notNullable()
			.unique()
			.references('id')
			.inTable('inventory')
			.onDelete('RESTRICT');

		table.integer('customer_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('customers')
			.onDelete('RESTRICT');

		// Private customer receipt link.
		table.specificType(
			'token',
			'VARCHAR(6) CHARACTER SET ascii COLLATE ascii_bin'
		)
			.notNullable()
			.unique()
			.defaultTo(knex.raw(`(${tokenExpression})`));

		// All amounts saved at the time of sale.
		table.decimal('subtotal', 10, 2)
			.unsigned()
			.notNullable();

		table.decimal('tax_rate', 8, 4)
			.unsigned()
			.notNullable();

		table.decimal('sales_tax', 10, 2)
			.unsigned()
			.notNullable();

		// Final price, including sales tax.
		table.decimal('total', 10, 2)
			.unsigned()
			.notNullable();

		table.string('payment_method', 30)
			.notNullable()
			.defaultTo('Not Specified');
		table.timestamp('sale_date')
			.notNullable()
			.defaultTo(knex.fn.now());

		table.text('notes').nullable();

		table.timestamp('created_at')
			.notNullable()
			.defaultTo(knex.fn.now());

		table.index(['customer_id', 'sale_date']);
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTableIfExists('inventory_sales');
};
