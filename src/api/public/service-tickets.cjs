
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

	router.get('/:ticketNumber/:token', async (req, res, next) => {
		const { ticketNumber, token } = req.params;

		res.set('Cache-Control', 'no-store');
		res.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
		res.set('Referrer-Policy', 'no-referrer');

		if (
			!/^[1-9]\d{0,9}$/.test(ticketNumber) ||
			Number(ticketNumber) > 4294967295 ||
			!token ||
			!/^[a-zA-Z0-9]{6}$/.test(token)
		) {
			return res.status(404).json({
				error: 'Service ticket not found'
			});
		}

		try {
			const [rows] = await db.query(`
				SELECT
					id,
					ticket_number,
					token,
					status,
					description,
					diagnostic_notes,
					service_notes,
					quoted_total,
					created_at,
					completed_at
				FROM service_tickets
				WHERE ticket_number = ?
					AND token = ?
				LIMIT 1
			`, [Number(ticketNumber), token]);

			if (!rows.length) {
				return res.status(404).json({
					error: 'Service ticket not found'
				});
			}

			const ticket = rows[0];

			const publishedStatuses = [
				'diagnostic_complete',
				'services_complete',
				'paid'
			];

			if (!publishedStatuses.includes(ticket.status)) {
				return res.status(404).json({
					error: 'Service ticket not available'
				});
			}

			const showService = [
				'services_complete',
				'paid'
			].includes(ticket.status);

			const categories = showService
				? ['diagnostic', 'service']
				: ['diagnostic'];

			const [media] = await db.query(`
				SELECT
					filename,
					media_type,
					poster_filename,
					comment,
					category
				FROM service_ticket_media
				WHERE service_ticket_id = ?
					AND category IN (?)
				ORDER BY sort_order, id
			`, [ticket.id, categories]);

			function mediaUrl(filename) {
				if (!filename) return null;

				const folder =
					`${ticket.ticket_number}-${ticket.token}`;

				return 'https://media.fargosmallenginerepair.com/service/' +
					encodeURIComponent(folder) + '/' +
					encodeURIComponent(filename);
			}

			function serializeMedia(category) {
				return media
					.filter(item => item.category === category)
					.map(item => ({
						media_type: item.media_type,
						comment: item.comment,
						url: mediaUrl(item.filename),
						poster_url: item.media_type === 'video'
							? mediaUrl(item.poster_filename)
							: null
					}));
			}

			const result = {
				ticket_number: ticket.ticket_number,
				status: ticket.status,
				description: ticket.description,
				diagnostic: {
					notes: ticket.diagnostic_notes,
					media: serializeMedia('diagnostic')
				},
				quoted_total: ticket.quoted_total,
				created_at: ticket.created_at
			};

			if (showService) {
				result.service = {
					notes: ticket.service_notes,
					media: serializeMedia('service')
				};
				result.completed_at = ticket.completed_at;
			}

			if (ticket.status === 'services_complete') {
				result.amount_due = ticket.quoted_total;
			}


			if (showService && ticket.quoted_total != null) {
				const [items] = await db.query(`
					SELECT
						description,
						quantity,
						unit,
						unit_price,
						amount
					FROM service_ticket_charges
					WHERE service_ticket_id = ?
						AND category IN ('part', 'standard')
					ORDER BY sort_order, id
				`, [ticket.id]);

				const [rates] = await db.query(`
					SELECT c.slug, v.value
					FROM standard_charges c
					JOIN standard_charge_versions v
						ON v.id = (
							SELECT v2.id
							FROM standard_charge_versions v2
							WHERE v2.standard_charge_id = c.id
								AND v2.effective_date <= CURRENT_DATE()
							ORDER BY v2.effective_date DESC, v2.id DESC
							LIMIT 1
						)
					WHERE c.slug IN ('shop-materials', 'sales-tax')
						AND c.active = 1
				`);

				const rateMap = new Map(
					rates.map(rate => [rate.slug, rate.value])
				);

				if (!rateMap.has('shop-materials') ||
					!rateMap.has('sales-tax')) {
					throw new Error('Billing rates are unavailable');
				}

				const toCents = value =>
					BigInt(String(Number(value).toFixed(2)).replace('.', ''));

				const fromCents = cents =>
					`${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;

				const percentage = (cents, rate) => {
					const scaled = BigInt(
						String(Number(rate).toFixed(4)).replace('.', '')
					);

					return (cents * scaled + 500000n) / 1000000n;
				};

				const total = toCents(ticket.quoted_total);

				const entered = items.reduce(
					(sum, item) => sum + toCents(item.amount),
					0n
				);

				const [[taxableResult]] = await db.query(`
					SELECT COALESCE(SUM(amount), 0) AS taxable_amount
					FROM service_ticket_charges
					WHERE service_ticket_id = ?
						AND category IN ('part', 'standard')
						AND taxable = 1
				`, [ticket.id]);

				const salesTax = percentage(
					toCents(taxableResult.taxable_amount),
					rateMap.get('sales-tax')
				);

				const shopMaterials = percentage(
					total,
					rateMap.get('shop-materials')
				);

				const labor = total - entered - shopMaterials - salesTax;

				if (labor < 0n) {
					throw new Error('Service ticket billing exceeds total');
				}

				result.billing = {
					items,
					labor: fromCents(labor),
					shop_materials: fromCents(shopMaterials),
					sales_tax: fromCents(salesTax),
					subtotal_before_tax: fromCents(total - salesTax),
					total: fromCents(total)
				};
			}


			return res.json(result);
		} catch (err) {
			next(err);
		}
	});

	return router;
};
