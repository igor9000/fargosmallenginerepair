exports.up = async function(knex) {
    await knex.schema.alterTable('inventory_images', (table) => {
        table.enu('media_type', ['image', 'video'])
            .notNullable()
            .defaultTo('image');

        table.string('poster_url', 255).nullable();
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('inventory_images', (table) => {
        table.dropColumn('media_type');
        table.dropColumn('poster_url');
    });
};
