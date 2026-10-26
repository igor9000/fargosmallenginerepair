
exports.up = async function(knex) {
	await knex.schema.alterTable('inventory_types', table => {
		table.string('slug', 255).nullable();
	});

	const types = await knex('inventory_types')
		.select('id', 'name');

	const usedSlugs = new Set();

	for (const type of types) {
		const slug = type.name
			.toLowerCase()
			.trim()
			.replace(/&/g, 'and')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');

		if (!slug || usedSlugs.has(slug)) {
			throw new Error(`Invalid or duplicate type slug: ${slug}`);
		}

		usedSlugs.add(slug);

		await knex('inventory_types')
			.where({ id: type.id })
			.update({ slug });
	}

	await knex.schema.alterTable('inventory_types', table => {
		table.string('slug', 255).notNullable().alter();
		table.unique('slug');
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('inventory_types', table => {
		table.dropColumn('slug');
	});
};
