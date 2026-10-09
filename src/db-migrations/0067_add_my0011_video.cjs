const sku = 'MY-0011';

const videoUrl = 'MY-0011.mov';
const posterUrl = 'MY-0011-poster.png';

exports.up = async function(knex) {
    const item = await knex('inventory')
        .where({ sku })
        .first('id');

    if (!item) {
        throw new Error(`SKU ${sku} not found`);
    }

    const existing = await knex('inventory_images')
        .where({
            inventory_id: item.id,
            url: videoUrl
        })
        .first();

    if (existing) return;

    const result = await knex('inventory_images')
        .where({ inventory_id: item.id })
        .max('sort_order as max_order')
        .first();

    await knex('inventory_images').insert({
        inventory_id: item.id,
        url: videoUrl,
        poster_url: posterUrl,
        media_type: 'video',
        sort_order: Number(result.max_order ?? 0) + 1,
        is_primary: 0
    });
};

exports.down = async function(knex) {
    const item = await knex('inventory')
        .where({ sku })
        .first('id');

    if (!item) return;

    await knex('inventory_images')
        .where({
            inventory_id: item.id,
            url: videoUrl,
            media_type: 'video'
        })
        .del();
};
