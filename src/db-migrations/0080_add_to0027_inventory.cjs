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
Briggs & Stratton
Brute
Craftsman
Cub Cadet
Honda
Husqvarna
John Deere
Lawn-Boy
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

const sku = 'TO-0027';
const name = 'Toro 21" Personal Pace Recycler Mower';

function generateSlug(str) {
  return str
    .toLowerCase()
    .replace(/["“”]/g, 'in')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const products = [
  {
    sku,
    name,
    slug: generateSlug(name),
    description: 'This Toro is a great choice for any yard. It has a powerful 190cc Briggs & Stratton engine which is ready to tackle taller grass. The Personal Pace system adjusts automatically to how fast you walk, making mowing smooth and effortless. It’s fully serviced and ready to keep your yard looking great.',
    price: 100.00,
    inventory_type: 'Lawn Mowers',
    active: 1,
    featured: 0,
    brand: 'Toro',

    images: [
      {
        url: `${sku} (1).jpg`,
        // comment: 'A nice looking product'
      },
      {
        url: `${sku} (2).jpg`,
        // comment: 'A nice looking product'
      },
      {
        url: `${sku} (3).jpg`,
        // comment: 'A nice looking product'
      },
      {
        url: `${sku} (4).jpg`,
        // comment: 'A nice looking product'
      },
      {
        url: `${sku} (5).jpg`,
        // comment: 'A nice looking product'
      },
      {
        url: `${sku} (6).jpg`,
        // comment: 'A nice looking product'
      },
      {
        url: `${sku}.mov`,
        media_type: 'video',
        poster_url: `${sku}-poster.png`,
        // comment: 'A nice looking product'
      }
    ],

    attributes: [
		{ slug: 'type', value: 'Lawn Mower' },
		{ slug: 'fuel-type', value: 'Gas' },
		// { slug: 'stage', value: 'Two-stage' },
		// { slug: 'clearing-width', value: '26' },
    { slug: 'cutting-width', value: '21' },
    { slug: 'cutting-type', value: 'Recycler' },
		// { slug: 'capacity', value: '357' },
		{ slug: 'horsepower', value: '6' },
		{ slug: 'engine-size', value: '190' },
		{ slug: 'engine-brand', value: 'Briggs & Stratton' },
		{ slug: 'self-propelled', value: 'Yes' },
    { slug: 'drive-type', value: 'RWD' },
    { slug: 'drive-features', value: 'Personal Pace' },
		{ slug: 'bagger-included', value: 'Yes' },
		{ slug: 'start-type', value: 'Recoil' },
		{ slug: 'warranty', value: '30 days' },
    ]
  }
];

exports.up = async function(knex) {
  await knex.transaction(async (trx) => {
    for (const product of products) {

      // 1. Resolve brand
      const brand = await trx('brands')
        .where({ name: product.brand })
        .first();

      if (!brand) {
        throw new Error(`Brand not found: ${product.brand}`);
      }

      // 2. Resolve inventory type
      const inventoryType = await trx('inventory_types')
        .where({ name: product.inventory_type })
        .first();

      if (!inventoryType) {
        throw new Error(
          `Inventory type not found: ${product.inventory_type}`
        );
      }

      // 3. Insert product
      const {
        brand: brandName,
        inventory_type: inventoryTypeName,
        images = [],
        attributes = [],
        ...inventory
      } = product;

      const [inventoryId] = await trx('inventory')
        .insert({
          ...inventory,
          brand_id: brand.id,
          inventory_type_id: inventoryType.id
        });

      // 4. Insert images
      if (images.length > 0) {
        const imageRows = images.map((image, index) => ({
          inventory_id: inventoryId,
          url: image.url,
          comment: image.comment ?? '',
          media_type: image.media_type ?? 'image',
          poster_url: image.poster_url ?? '',
          sort_order: index + 1,
          is_primary: index === 0
        }));

        await trx('inventory_images').insert(imageRows);
      }

      // 5. Resolve and insert attributes
      if (attributes.length > 0) {
        const attributeDefinitions =
          await trx('inventory_attributes')
            .whereIn(
              'slug',
              attributes.map(({ slug }) => slug)
            )
            .select('id', 'slug');

        const attributeIds = new Map(
          attributeDefinitions.map(
            ({ id, slug }) => [slug, id]
          )
        );

        const attributeRows = attributes.map(
          ({ slug, value }) => {
            if (!attributeIds.has(slug)) {
              throw new Error(
                `Missing inventory attribute: ${slug}`
              );
            }

            return {
              inventory_id: inventoryId,
              attribute_id: attributeIds.get(slug),
              value
            };
          }
        );

        await trx('inventory_attribute_values')
          .insert(attributeRows);
      }
    }
  });
};

exports.down = async function(knex) {
  await knex.transaction(async (trx) => {
    for (const product of [...products].reverse()) {

      const item = await trx('inventory')
        .where({ sku: product.sku })
        .first();

      if (!item) continue;

      // Remove children before parent
      await trx('inventory_attribute_values')
        .where({ inventory_id: item.id })
        .del();

      await trx('inventory_images')
        .where({ inventory_id: item.id })
        .del();

      await trx('inventory')
        .where({ id: item.id })
        .del();
    }
  });
};
