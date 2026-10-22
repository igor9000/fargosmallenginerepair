
const express = require('express');
const { rateLimit } = require('express-rate-limit');

module.exports = function({ db }) {
	const router = express.Router();

	router.use(rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 60,
		standardHeaders: 'draft-8',
		legacyHeaders: false
	}));

	
	router.get('/:saleNumber/:token', async (req, res, next) => {
		const { saleNumber, token } = req.params;

		res.set('Cache-Control', 'no-store');
		res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
		res.set('Referrer-Policy', 'no-referrer');

		if (
			!/^[1-9]\d{0,9}$/.test(saleNumber) ||
			Number(saleNumber) > 4294967295 ||
			!/^[a-zA-Z]{6}$/.test(token)
		) {
			return res.status(404).json({
				error: 'Inventory sale not found'
			});
		}

		try {
			const [sales] = await db.query(`
				SELECT
					id,
					sale_number,
					subtotal,
					tax_rate,
					sales_tax,
					total,
					payment_method,
					sale_date
				FROM inventory_sales
				WHERE sale_number = ?
					AND token = ?
				LIMIT 1
			`, [Number(saleNumber), token]);

			if (!sales.length) {
				return res.status(404).json({
					error: 'Inventory sale not found'
				});
			}

			const sale = sales[0];

			const [items] = await db.query(`
				SELECT
					i.sku,
					i.name AS inventory_name,
					si.subtotal,
					si.sales_tax,
					si.total
				FROM inventory_sale_items si
				JOIN inventory i
					ON i.id = si.inventory_id
				WHERE si.inventory_sale_id = ?
				ORDER BY si.sort_order, si.id
			`, [sale.id]);

			res.json({
				sale_number: sale.sale_number,
				subtotal: sale.subtotal,
				tax_rate: sale.tax_rate,
				sales_tax: sale.sales_tax,
				total: sale.total,
				payment_method: sale.payment_method,
				sale_date: sale.sale_date,
				items
			});
		} catch (err) {
			next(err);
		}
	});


	return router;
};
