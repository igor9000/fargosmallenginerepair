exports.up = async function(knex) {
	await knex.schema.createTable('service_ticket_media', table => {
		table.increments('id').unsigned().primary();

		table.integer('service_ticket_id')
			.unsigned()
			.notNullable()
			.references('id')
			.inTable('service_tickets')
			.onDelete('CASCADE');

		table.string('filename', 255).notNullable();

		table.enu('media_type', ['image', 'video'])
			.notNullable()
			.defaultTo('image');

		table.string('poster_filename', 255).nullable();

		table.text('comment').nullable();

		table.enu('category', ['diagnostic', 'service'])
			.notNullable();

		table.integer('sort_order')
			.unsigned()
			.notNullable()
			.defaultTo(0);

		table.timestamp('created_at')
			.notNullable()
			.defaultTo(knex.fn.now());

		table.index(['service_ticket_id', 'sort_order']);
	});
};

exports.down = async function(knex) {
	await knex.schema.dropTableIfExists('service_ticket_media');
};
