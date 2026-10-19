exports.up = async function(knex) {
	await knex.schema.alterTable('service_tickets', table => {
		table.text('diagnostic_notes').nullable();
		table.text('service_notes').nullable();
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('service_tickets', table => {
		table.dropColumn('diagnostic_notes');
		table.dropColumn('service_notes');
	});
};
