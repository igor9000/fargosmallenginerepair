exports.up = async function(knex) {
	await knex.schema.alterTable('inventory', table => {
		table
			.integer('brand_id')
			.unsigned()
			.references('id')
			.inTable('brands')
			.onDelete('RESTRICT');
	});
};

exports.down = async function(knex) {
    await knex.schema.alterTable('inventory', table => {
        table.dropForeign('brand_id');
    });
	
	await knex.schema.alterTable('inventory', table => {
		table.dropColumn('brand_id');
	});
};
