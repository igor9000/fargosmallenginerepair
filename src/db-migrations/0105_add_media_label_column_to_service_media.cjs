exports.up = async function (knex) {
    await knex.schema.alterTable('service_ticket_media', (table) => {
        table.string('media_label', 50)
            .nullable()
            .defaultTo(null);
    });
};

exports.down = async function (knex) {
    await knex.schema.alterTable('service_ticket_media', (table) => {
        table.dropColumn('media_label');
    });
};
