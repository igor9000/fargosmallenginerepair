
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
			const [rows] = await db.query(`
				SELECT
					s.sale_number,
					s.subtotal,
					s.tax_rate,
					s.sales_tax,
					s.total,
					s.payment_method,
					s.sale_date,
					i.sku,
					i.name AS inventory_name,
					c.first_name,
					c.last_name
				FROM inventory_sales s
				INNER JOIN inventory i
					ON i.id = s.inventory_id
				INNER JOIN customers c
					ON c.id = s.customer_id
				WHERE s.sale_number = ?
					AND s.token = ?
				LIMIT 1
			`, [
				Number(saleNumber),
				token
			]);

			if (!rows.length) {
				return res.status(404).json({
					error: 'Inventory sale not found'
				});
			}

			res.json(rows[0]);
		} catch (err) {
			next(err);
		}
	});

	return router;
};
