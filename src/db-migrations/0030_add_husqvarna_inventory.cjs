/*
Lawn Mowers
Snow Blowers
Pressure Washers
Tillers
Edgers
Trimmers
Riding Mowers
Trash Pumps
Brush Cutters
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
	'HQ-0014': [
		'HQ-0014 (1).jpg',
		'HQ-0014 (2).jpg',
		'HQ-0014 (3).jpg'
	],'HQ-0017': [
		'HQ-0017 (1).jpg',
		'HQ-0017 (2).jpg',
		'HQ-0017 (3).jpg',
		'HQ-0017 (4).jpg',
		'HQ-0017 (5).jpg'
	]
};


const products = [{
	sku: 'HQ-0014',
	name: 'NEW Husqvarna 525ES 25cc Edger',
	description: 'NEW right out of the box! Simple and easy to start, this edger has a powerful 25cc engine capable of cutting through tough clay soil in the Red River valley. This Husqvarna is fresh and ready to work all summer long.',
	price: 200.00,
	inventory_type: 'Edgers',
	active: 1,
	brand: 'Husqvarna'
},{
	sku: 'HQ-0017',
	name: 'NEW Husqvarna 336FR 34.6-cc 2-Cycle 18.5-in Straight Shaft Gas Brush Cutter',
	description: 'NEW right out of the box! Simple and easy to start, this brush cutter has a powerful 35cc engine capable of cutting through all kinds of tough brush. It comes with 3 different tool heads, weed trimmer, 3-blade grass cutter, and circular saw blade. With those attachments, it\'ll handle anything form small branches, shrubs, tall grass and weeds, to basic trimming. This Husqvarna brush cutter is ready for all types of heavy duty work.',
	price: 320.00,
	inventory_type: 'Brush Cutters',
	active: 1,
	brand: 'Husqvarna'
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
