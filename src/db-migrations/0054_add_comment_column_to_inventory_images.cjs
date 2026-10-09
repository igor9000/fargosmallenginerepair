exports.up = async function(knex) {
	await knex.schema.alterTable('inventory_images', (table) => {
		table.text('comment').notNullable().defaultTo('');
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory_images', (table) => {
		table.dropColumn('comment');
	});
};
