exports.up = async function(knex) {
	await knex.schema.alterTable('service_tickets', table => {
		table.enu('status', [
			'new',
			'pickup_scheduled',
			'diagnostic_complete',
			'services_complete',
			'paid'
		])
			.notNullable()
			.defaultTo('new')
			.alter();
	});
};

exports.down = async function(knex) {
	await knex('service_tickets')
		.where('status', 'pickup_scheduled')
		.update({ status: 'new' });

	await knex.schema.alterTable('service_tickets', table => {
		table.enu('status', [
			'new',
			'diagnostic_complete',
			'services_complete',
			'paid'
		])
			.notNullable()
			.defaultTo('new')
			.alter();
	});
};
