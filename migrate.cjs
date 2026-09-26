const path = require('path');
const knex = require('knex');

const db = knex({
	client: 'mysql2',

	connection: {
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	},

	migrations: {
		directory: '/src/db-migrations',
		extension: 'cjs'
	}
});

async function migrate() {
	try {
		const [batch, migrations] = await db.migrate.latest();

		if (migrations.length) {
			console.log(`Migration batch ${batch} completed:`);
			migrations.forEach(m => console.log(`  ${m}`));
		} else {
			console.log('Database already up to date.');
		}
	} catch (err) {
		console.error('Database migration failed:', err);
		process.exitCode = 1;
	} finally {
		await db.destroy();
	}
}

migrate();