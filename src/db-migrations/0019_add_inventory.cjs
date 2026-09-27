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
	'CM-0056': [
		'CM-0056 (1).jpg',
		'CM-0056 (6).jpg',
		'CM-0056 (4).jpg',
		'CM-0056 (5).jpg',
		'CM-0056 (2).jpg',
		'CM-0056 (3).jpg'
	],
	'HO-0011': [
		'HO-0011 (1).jpg',
		'HO-0011 (2).jpg',
		'HO-0011 (3).jpg',
		'HO-0011 (4).jpg',
		'HO-0011 (5).jpg',
		'HO-0011 (6).jpg'
	],
	'YM-0014': [
		'YM-0014 (1).jpg',
		'YM-0014 (6).jpg',
		'YM-0014 (5).jpg',
		'YM-0014 (4).jpg',
		'YM-0014 (3).jpg',
		'YM-0014 (2).jpg'
	],
	'WE-0004': [
		'WE-0004 (1).jpg',
		'WE-0004 (2).jpg',
		'WE-0004 (3).jpg',
		'WE-0004 (4).jpg',
		'WE-0004 (5).jpg',
		'WE-0004 (6).jpg'
	],
	'CM-0045': [
		'CM-0045 (1).jpg',
		'CM-0045 (6).jpg',
		'CM-0045 (4).jpg',
		'CM-0045 (5).jpg',
		'CM-0045 (3).jpg',
		'CM-0045 (2).jpg'
	],
	'PP-0015': [
		'PP-0015 (1).jpg',
		'PP-0015 (6).jpg',
		'PP-0015 (4).jpg',
		'PP-0015 (5).jpg',
		'PP-0015 (3).jpg',
		'PP-0015 (2).jpg'
	]
};


const products = [{
	sku: 'CM-0056',
	name: 'Craftsman Self Propelled Mower w/ Electric Start',
	description: 'This self-propelled mower is powered by a large 190cc Briggs & Stratton engine with electric start and a 21" cutting deck.',
	price: 250.00,
	inventory_type_id: 1,
	active: 1,
	brand_id: 2
},{
	sku: 'HO-0011',
	name: 'Honda QuadraCut Self Propelled Mower w/ Bag',
	description: 'This Honda HRR216 features the legendary GCV160 engine and Honda’s variable speed Smart Drive self-propel system.',
	price: 300.00,
	inventory_type_id: 1,
	active: 1,
	brand_id: 4
},{
	sku: 'YM-0014',
	name: 'Yard-Man 21" Mower with Bag',
	description: 'Featuring a powerful 6.5 HP engine with lots of power. Easy to start, smooth to operate, and ready to handle your lawn all summer long.',
	price: 200.00,
	inventory_type_id: 1,
	active: 1,
	brand_id: 8
},{
	sku: 'WE-0004',
	name: 'Weed Eater 22" Push Mower',
	description: 'A great budget friendly option thats lightweight and cuts well.',
	price: 100.00,
	inventory_type_id: 1,
	active: 1,
	brand_id: 6
},{
	sku: 'CM-0045',
	name: 'Craftsman Self Propelled Mower w/ Electric Start',
	description: 'This self-propelled mower is powered by a large 190cc Briggs & Stratton engine with electric start and a 21" cutting deck and a bag.',
	price: 300.00,
	inventory_type_id: 1,
	active: 1,
	brand_id: 2
},{
	sku: 'PP-0015',
	name: 'Poulan Pro 21" Lawn Mower',
	description: 'A lightweight and easy to maneuver mower for small lawns and touch up work after a rider.',
	price: 140.00,
	inventory_type_id: 1,
	active: 1,
	brand_id: 7
}];

exports.up = async function(knex) {
	await knex.transaction(async (trx) => {
		for (const product of products) {
			const [inventoryId] = await trx('inventory')
				.insert(product);

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
	for (const product of products) {
		await knex('inventory')
			.where('sku', product.sku)
			.del();
	}
};