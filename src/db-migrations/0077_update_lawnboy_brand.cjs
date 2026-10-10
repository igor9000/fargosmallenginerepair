exports.up = async function(knex) {
  await knex('brands')
    .where({ name: 'Lawn Boy' })
    .update({
      name: 'Lawn-Boy'
    });
};

exports.down = async function(knex) {
  await knex('brands')
    .where({ name: 'Lawn-Boy' })
    .update({
      name: 'Lawn Boy'
    });
};

