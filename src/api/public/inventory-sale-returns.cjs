
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

	router.get('/:returnId/:token', async (req, res, next) => {
		const { returnId, token } = req.params;

		res.set('Cache-Control', 'no-store');
		res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
		res.set('Referrer-Policy', 'no-referrer');

		if (
			!/^[1-9]\d{0,9}$/.test(returnId) ||
			Number(returnId) > 4294967295 ||
			!/^[a-zA-Z]{6}$/.test(token)
		) {
			return res.status(404).json({
				error: 'Return receipt not found'
			});
		}

		try {
			const [rows] = await db.query(`
				SELECT
					r.id AS return_id,
					r.return_date,
					r.refund_subtotal,
					r.refund_sales_tax,
					r.refund_total,
					r.refund_method,
					s.sale_number,
					s.token AS sale_token,
					s.tax_rate
				FROM inventory_sale_returns r
				JOIN inventory_sales s
					ON s.id = r.inventory_sale_id
				WHERE r.id = ?
					AND r.token = ?
				LIMIT 1
			`, [Number(returnId), token]);

			if (!rows.length) {
				return res.status(404).json({
					error: 'Return receipt not found'
				});
			}

			const receipt = rows[0];

			const [items] = await db.query(`
				SELECT
					i.sku,
					i.name AS inventory_name,
					ri.physically_returned,
					ri.refund_subtotal,
					ri.refund_sales_tax,
					ri.refund_total
				FROM inventory_sale_return_items ri
				JOIN inventory_sale_items si
					ON si.id = ri.inventory_sale_item_id
				JOIN inventory i
					ON i.id = si.inventory_id
				WHERE ri.inventory_sale_return_id = ?
				ORDER BY ri.id
			`, [receipt.return_id]);

			res.json({
				...receipt,
				items
			});
		} catch (err) {
			next(err);
		}
	});

	return router;
};
