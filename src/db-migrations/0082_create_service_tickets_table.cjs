const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const randomLetter = `SUBSTRING('${alphabet}',
    1 + MOD(ORD(RANDOM_BYTES(1)), 52), 1)`;

const tokenExpression =
    `CONCAT(${Array(6).fill(randomLetter).join(', ')})`;



exports.up = async function(knex) {
	await knex.schema.createTable('service_tickets', table => {
		table.increments('id').primary();
		table.integer('ticket_number').unsigned().notNullable().unique();
		table.integer('customer_id').unsigned().notNullable()
            .references('id').inTable('customers');
        table.specificType(
		    'token',
			'VARCHAR(6) CHARACTER SET ascii COLLATE ascii_bin'
		)
		.notNullable()
		.unique()
		.defaultTo(knex.raw(`(${tokenExpression})`));
		table.text('description');
		table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
		table.timestamp('completed_at').nullable();
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTable('service_tickets');
};
