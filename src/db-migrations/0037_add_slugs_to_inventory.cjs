const updates = [
	{
		sku: 'HQ-0014',
		slug: 'Husqvarna-525ES-Handheld-Gas-Lawn-Edger'
	},
	{
		sku: 'HQ-0017',
		slug: 'Husqvarna-336FR-34-6-cc-2-cycle-18-5-in-Straight-Shaft-Gas-Brush-Cutter'
	},
	{
		sku: 'MY-0012',
		slug: 'Murray-5HP-24-in-Two-Stage-Snow-Blower'
	},
	{
		sku: 'CM-0045',
		slug: 'Craftsman-190cc-21-in-Self-Propelled-Lawn-Mower-Electric-Start-With-Bag'
	},
	{
		sku: 'CM-0056',
		slug: 'Craftsman-190cc-21-in-Self-Propelled-Lawn-Mower-Electric-Start'
	},
	{
		sku: 'HO-0011',
		slug: 'Honda-HRR216-GCV160-Smart-Drive-21-in-Self-Propelled-Lawn-Mower-With-Bag'
	},
	{
		sku: 'YM-0014',
		slug: 'Yard-Man-6-5-HP-21-in-Lawn-Mower-With-Bag'
	},
	{
		sku: 'WE-0004',
		slug: 'Weed-Eater-22-in-Push-Lawn-Mower'
	},
	{
		sku: 'PP-0015',
		slug: 'Poulan-Pro-21-in-Lawn-Mower'
	},
	{
		sku: 'TO-2200',
		slug: 'Toro-Recycler-22-in-Personal-Pace-Self-Propelled-Lawn-Mower-With-Bag'
	},
	{
		sku: 'HO-0005',
		slug: 'Tsurumi-EPT3-80HA-3-in-350-GPM-Trash-Pump-Honda-GX240-Engine'
	}
];

exports.up = async function(knex) {
	for (const item of updates) {
		await knex('inventory')
			.where('sku', item.sku)
			.update({
				slug: item.slug
			});
	}
};

exports.down = async function(knex) {
	await knex('inventory')
		.whereIn('sku', updates.map(item => item.sku))
		.update({
			slug: null
		});
};
