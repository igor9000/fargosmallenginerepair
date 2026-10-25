
exports.up = async function(knex) {
    await knex.schema.alterTable('inventory_images', table => {
        table.boolean('is_active')
            .notNullable()
            .defaultTo(true);
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('inventory_images', table => {
        table.dropColumn('is_active');
    });
};
