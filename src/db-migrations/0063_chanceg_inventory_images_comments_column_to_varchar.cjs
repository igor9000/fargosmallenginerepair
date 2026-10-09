exports.up = async function(knex) {
    const tooLong = await knex('inventory_images')
        .whereRaw('CHAR_LENGTH(`comment`) > ?', [255])
        .first('id');

    if (tooLong) {
        throw new Error('Existing comments exceed 255 characters');
    }

    await knex.schema.alterTable('inventory_images', (table) => {
        table.string('comment', 255)
            .notNullable()
            .defaultTo('')
            .alter();
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('inventory_images', (table) => {
        table.text('comment')
            .notNullable()
            .alter();
    });
};
