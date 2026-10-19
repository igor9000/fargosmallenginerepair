exports.up = async function(knex) {
	await knex.schema.alterTable('service_tickets', table => {
		table.enu('status', [
			'new',
			'diagnostic_complete',
			'services_complete',
			'paid'
		])
			.notNullable()
			.defaultTo('new');
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('service_tickets', table => {
		table.dropColumn('status');
	});
};
