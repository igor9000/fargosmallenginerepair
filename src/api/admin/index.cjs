
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');

module.exports = function({ db }) {
	const router = express.Router();

	if (!process.env.ADMIN_PASSWORD_HASH || !process.env.SESSION_SECRET) {
		throw new Error('Admin authentication is not configured');
	}

	const sessionStore = new MySQLStore({
		host: process.env.DB_HOST,
		port: Number(process.env.DB_PORT || 3306),
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		createDatabaseTable: false
	});

	router.use(session({
		name: 'fms_admin',
		secret: process.env.SESSION_SECRET,
		store: sessionStore,
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 8 * 60 * 60 * 1000
		}
	}));

	function requireAdmin(req, res, next) {
		if (req.session?.isAdmin === true) {
			return next();
		}

		return res.status(401).json({ error: 'Unauthorized' });
	}

	function requireSameOrigin(req, res, next) {
		const origin = req.get('origin');

		if (!process.env.APP_ORIGIN || origin !== process.env.APP_ORIGIN) {
			return res.status(403).json({ error: 'Forbidden' });
		}

		next();
	}

	const loginLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 5,
		standardHeaders: 'draft-8',
		legacyHeaders: false
	});

	// Public authentication endpoints
	router.post('/login', loginLimiter, requireSameOrigin, async (req, res, next) => {
		try {
			const password = req.body?.password;

			if (typeof password !== 'string' || password.length > 1024) {
				return res.status(400).json({ error: 'Invalid request' });
			}

			const valid = await bcrypt.compare(
				password,
				process.env.ADMIN_PASSWORD_HASH
			);

			if (!valid) {
				return res.status(401).json({ error: 'Invalid credentials' });
			}

			req.session.regenerate(err => {
				if (err) return next(err);

				req.session.isAdmin = true;

				req.session.save(err => {
					if (err) return next(err);
					res.json({ authenticated: true });
				});
			});
		} catch (err) {
			next(err);
		}
	});

	router.get('/session', requireAdmin, (req, res) => {
		res.json({ authenticated: true });
	});

	router.post('/logout', requireSameOrigin, requireAdmin, (req, res, next) => {
		req.session.destroy(err => {
			if (err) return next(err);

			res.clearCookie('fms_admin', { path: '/' });
			res.json({ authenticated: false });
		});
	});

	// Everything below requires authentication.
	router.use(requireAdmin);

	router.use((req, res, next) => {
		if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
			return requireSameOrigin(req, res, next);
		}
		next();
	});



// inventory	
router.get('/inventory', requireAdmin, async (req, res) => {
	try {
		const [rows] = await db.query(`
			SELECT
				i.id,
				i.sku,
				i.name,
				i.price,
				i.active,
				i.pending,
				i.featured,
				i.clearance,
				i.inventory_type_id,
				i.brand_id,
				it.name AS type_name,
				b.name AS brand_name
			FROM inventory i
			LEFT JOIN inventory_types it
				ON i.inventory_type_id = it.id
			LEFT JOIN brands b
				ON i.brand_id = b.id
			ORDER BY i.id DESC
		`);

		res.json(rows);
	} catch (error) {
		console.error('Admin inventory error:', error);
		res.status(500).json({ error: 'Unable to load inventory' });
	}
});

router.patch(
	'/inventory/:id',
	requireSameOrigin,
	requireAdmin,
	async (req, res) => {
		try {
			const id = Number(req.params.id);
			const { name, price, active, pending, featured, clearance } = req.body ?? {};

			if (!Number.isSafeInteger(id) || id < 1 ||
					typeof name !== 'string' || !name.trim() ||
					name.length > 255 ||
					(typeof price !== 'number' && typeof price !== 'string') ||
					price === '' || price === null ||
					!Number.isFinite(Number(price)) ||
					Number(price) < 0 || Number(price) > 99999999.99 ||
					![active, pending, featured, clearance].every(v =>
						typeof v === 'boolean'
					)) {
				return res.status(400).json({ error: 'Invalid inventory data' });
			}

			const [result] = await db.query(`
				UPDATE inventory
				SET name = ?,
						price = ?,
						active = ?,
						pending = ?,
						featured = ?,
						clearance = ?
				WHERE id = ?
			`, [
				name.trim(),
				Number(price),
				Number(active),
				Number(pending),
				Number(featured),
				Number(clearance),
				id
			]);

			if (!result.affectedRows) {
				return res.status(404).json({ error: 'Item not found' });
			}

			res.json({ success: true });
		} catch (error) {
			console.error('Inventory update error:', error);
			res.status(500).json({ error: 'Unable to update inventory' });
		}
	}
);


router.get('/inventory/options', async (req, res, next) => {
	try {
		const [brands] = await db.query(
			'SELECT id, name FROM brands ORDER BY name'
		);
		const [types] = await db.query(
			'SELECT id, name FROM inventory_types ORDER BY name'
		);

		res.json({ brands, types });
	} catch (err) {
		next(err);
	}
});

router.post('/inventory', async (req, res, next) => {
	try {
		const {
			sku, name, description, price, slug,
			inventory_type_id, brand_id,
			active, pending, featured, clearance
		} = req.body ?? {};

		const validId = value =>
			Number.isSafeInteger(Number(value)) && Number(value) > 0;

		const validFlag = value => typeof value === 'boolean';

		if (
			typeof sku !== 'string' || !sku.trim() || sku.length > 255 ||
			typeof name !== 'string' || !name.trim() || name.length > 255 ||
			typeof description !== 'string' ||
			typeof slug !== 'string' || slug.length > 255 ||
			!validId(inventory_type_id) ||
			(brand_id !== null && !validId(brand_id)) ||
			(price !== null && (
				price === '' || !/^\d{1,8}(\.\d{1,2})?$/.test(String(price))
			)) ||
			![active, pending, featured, clearance].every(validFlag)
		) {
			return res.status(400).json({ error: 'Invalid inventory data' });
		}

		const [result] = await db.query(`
			INSERT INTO inventory (
				sku, name, description, price, slug,
				inventory_type_id, brand_id,
				active, pending, featured, clearance
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, [
			sku.trim(),
			name.trim(),
			description,
			price,
			slug,
			Number(inventory_type_id),
			brand_id === null ? null : Number(brand_id),
			Number(active),
			Number(pending),
			Number(featured),
			Number(clearance)
		]);

		res.status(201).json({ id: result.insertId });
	} catch (err) {
		if (err.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({ error: 'SKU already exists' });
		}
		if (err.code === 'ER_NO_REFERENCED_ROW_2') {
			return res.status(400).json({ error: 'Invalid brand or type' });
		}
		next(err);
	}
});





	return router;
};
