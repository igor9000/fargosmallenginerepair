require('dotenv').config();
const knex=require('knex')({
	client:'mysql2',
	connection: {
		host:process.env.DB_HOST,
		user:process.env.DB_USER,
		password:process.env.DB_PASSWORD,
		database:process.env.DB_NAME
	}
});


knex.raw('SHOW TABLES').then(
		r=>console.table(r[0])
	).catch(console.error)
	.finally(()=>knex.destroy());



knex.raw('DESCRIBE inventory;').then(
		r=>console.table(r[0])
	).catch(console.error)
	.finally(()=>knex.destroy());
//jSm!-74W:5$R

	knex.raw('SELECT * FROM sessions;').then(
		r=>console.table(r[0])
	).catch(console.error)
	.finally(()=>knex.destroy());

/*
knex.raw('SELECT sku, pending, active FROM inventory;').then(
		r=>console.table(r[0])
	).catch(console.error)
	.finally(()=>knex.destroy());
*/

// knex.raw('SELECT * FROM knex_migrations WHERE name IN (\'0081_create_customers_table.cjs\', \'0082_create_service_tickets_table.cjs\');').then(
// 		r=>console.table(r[0])
// 	).catch(console.error)
// 	.finally(()=>knex.destroy());

// knex.raw('SELECT description FROM inventory where sku = \'CM-0057\';').then(
// 		r=>console.table(r[0])
// 	).catch(console.error)
// 	.finally(()=>knex.destroy());