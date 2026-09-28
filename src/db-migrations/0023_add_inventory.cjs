/*
1 Lawn Mowers
2 Snow Blowers
3 Pressure Washers
4 Tillers
5 Edgers
6 Trimmers
7 Riding Mowers
*/

/*
1 Murray
2 Craftsman
3 John Deere
4 Honda
5 Troy-Bilt
6 Weed Eater
7 Poulan Pro
8 Yard-Man
*/

const imageUrls = 
{
	'TO-2200': [
		'TO-2200 (1).jpg',
		'TO-2200 (6).jpg',
		'TO-2200 (4).jpg',
		'TO-2200 (5).jpg',
		'TO-2200 (2).jpg',
		'TO-2200 (3).jpg'
	]
};


const products = [{
	sku: 'TO-2200',
	name: 'Toro 22" Personal Pace Self-Propelled Mower w/ Bag',
	description: 'This Toro Recycler is a 22" Personal Pace self-propelled mower with a 190cc Briggs & Stratton engine. The Personal Pace system adjusts automatically to how fast you walk, making mowing smooth and effortless. It’s fully tuned up and ready to work.',
	price: 180.00,
	inventory_type: 'Lawn Mowers',
	active: 1,
	brand: 'Toro'
}];

exports.up = async function(knex) {
	await knex.transaction(async (trx) => {
		for (const product of products) {
			const brand = await trx('brands')
				.where('name', product.brand)
				.first();

			if (!brand) {
				throw new Error(`Brand not found: ${product.brand}`);
			}

			const inventoryType = await trx('inventory_types')
				.where('name', product.inventory_type)
				.first();

			if (!inventoryType) {
				throw new Error(
					`Inventory type not found: ${product.inventory_type}`
				);
			}

			const {
				brand: brandName,
				inventory_type: inventoryTypeName,
				...inventory
			} = product;

			const [inventoryId] = await trx('inventory')
				.insert({
					...inventory,
					brand_id: brand.id,
					inventory_type_id: inventoryType.id
				});

			const images = imageUrls[product.sku].map((url, index) => ({
				inventory_id: inventoryId,
				url,
				sort_order: index + 1,
				is_primary: index === 0 ? 1 : 0
			}));

			await trx('inventory_images').insert(images);
		}
	});
};

exports.down = async function(knex) {
	await knex.transaction(async (trx) => {
		for (const product of products) {
			await trx('inventory')
				.where('sku', product.sku)
				.del();
		}
	});
};
