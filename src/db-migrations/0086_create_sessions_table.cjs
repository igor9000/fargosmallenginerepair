exports.up = async function(knex) {
  await knex.schema.createTable('sessions', table => {
    table.string('session_id', 128)
      .collate('utf8mb4_bin')
      .primary();

    table.specificType('expires', 'INT UNSIGNED')
      .notNullable();

    table.specificType('data', 'MEDIUMTEXT')
      .collate('utf8mb4_bin')
      .nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sessions');
};
