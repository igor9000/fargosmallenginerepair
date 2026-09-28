/*
Lawn Mowers
Snow Blowers
Pressure Washers
Tillers
Edgers
Trimmers
Riding Mowers
Trash Pumps
*/

/*
Brute
Craftsman
Cub Cadet
Honda
Husqvarna
John Deere
Lawn Boy
Murray
Poulan Pro
Ranch King
Snapper
Toro
Troy-Bilt
Weed Eater
Yard Force
Yard Machines
Yard-Man
*/

const imageUrls = 
{
	'HO-0005': [
		'HO-0005 (1).jpg',
		'HO-0005 (2).jpg',
		'HO-0005 (3).jpg',
		'HO-0005 (4).jpg',
		'HO-0005 (5).jpg'
	]
};


const products = [{
	sku: 'HO-0005',
	name: '350 GPM Trash Pump w/ Honda Engine',
	description: 'SAVE $900 vs BUYING NEW! This Tsurumi EPT3-80HA 3" trash pump is powered by a reliable Honda GX240 engine and built tough for demanding jobs. Perfect for construction, agriculture, or flood control, it handles solids and debris with ease. Starts easy and runs smooth—ready to work.',
	price: 180.00,
	inventory_type: 'Trash Pumps',
	active: 1,
	brand: 'Honda'
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
