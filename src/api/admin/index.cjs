
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');

module.exports = function({ db, loadInventoryDetails }) {
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


	// Lock IDs and prevent duplicates between sales and tickets

	const EXTERNAL_ID_LOCK = 'fms_external_record_id';

	function validExternalNumber(value) {
		return /^[1-9]\d*$/.test(String(value ?? '')) &&
			Number(value) <= 4294967295;
	}

	async function findExternalNumber(connection, number, kind, excludeId = 0) {
		const [rows] = await connection.query(`
			SELECT 'service ticket' AS kind
			FROM service_tickets
			WHERE ticket_number = ?
				AND id <> ?

			UNION ALL

			SELECT 'sale' AS kind
			FROM inventory_sales
			WHERE sale_number = ?
				AND id <> ?

			LIMIT 1
		`, [
			number,
			kind === 'service' ? excludeId : 0,
			number,
			kind === 'sale' ? excludeId : 0
		]);

		return rows[0] ?? null;
	}

	async function assertExternalNumberAvailable(
		connection, number, kind, excludeId = 0
	) {
		const match = await findExternalNumber(
			connection, number, kind, excludeId
		);

		if (match) {
			throw billingError(
				`Number ${number} is already used by a ${match.kind}`,
				409
			);
		}
	}

	async function acquireExternalIdLock(connection) {
		const [[row]] = await connection.query(
			'SELECT GET_LOCK(?, 10) AS acquired',
			[EXTERNAL_ID_LOCK]
		);

		if (Number(row.acquired) !== 1) {
			throw billingError(
				'Number validation is busy. Please try again.',
				503
			);
		}
	}

	async function releaseExternalIdConnection(connection, locked) {
		if (locked) {
			try {
				const [[row]] = await connection.query(
					'SELECT RELEASE_LOCK(?) AS released',
					[EXTERNAL_ID_LOCK]
				);

				if (Number(row.released) !== 1) {
					throw new Error('Could not release external ID lock');
				}
			} catch (err) {
				console.error('External ID lock release failed:', err);
				connection.destroy();
				return;
			}
		}

		connection.release();
	}

	router.get('/external-ids/next', async (req, res, next) => {
		try {
			const [[row]] = await db.query(`
				SELECT GREATEST(
					(SELECT COALESCE(MAX(ticket_number), 0)
						FROM service_tickets),
					(SELECT COALESCE(MAX(sale_number), 0)
						FROM inventory_sales)
				) AS current_max
			`);

			const nextNumber = Number(row.current_max) + 1;

			if (nextNumber > 4294967295) {
				return res.status(409).json({
					error: 'External record number range exhausted'
				});
			}

			res.set('Cache-Control', 'no-store');
			res.json({ nextNumber });
		} catch (err) {
			next(err);
		}
	});

	router.get('/external-ids/check', async (req, res, next) => {
		const { number, kind, excludeId = '0' } = req.query;

		if (
			!validExternalNumber(number) ||
			!['service', 'sale'].includes(kind) ||
			!(excludeId === '0' || validExternalNumber(excludeId))
		) {
			return res.status(400).json({
				error: 'Invalid external number check'
			});
		}

		try {
			const match = await findExternalNumber(
				db,
				Number(number),
				kind,
				Number(excludeId)
			);

			res.set('Cache-Control', 'no-store');
			res.json({
				available: !match,
				usedBy: match?.kind ?? null
			});
		} catch (err) {
			next(err);
		}
	});
























	router.use((req, res, next) => {
		if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
			return requireSameOrigin(req, res, next);
		}
		next();
	});






async function assertInventoryCanBeListed(connection, inventoryId) {
	const [sales] = await connection.query(`
		SELECT
			si.id,
			EXISTS (
				SELECT 1
				FROM inventory_sale_return_items ri
				JOIN inventory_sale_returns r
					ON r.id = ri.inventory_sale_return_id
				WHERE ri.inventory_sale_item_id = si.id
					AND r.inventory_sale_id = si.inventory_sale_id
					AND ri.physically_returned = 1
			) AS physically_returned
		FROM inventory_sale_items si
		JOIN inventory_sales s
			ON s.id = si.inventory_sale_id
		WHERE si.inventory_id = ?
		ORDER BY s.id DESC, si.id DESC
		LIMIT 1
	`, [inventoryId]);

	if (sales.length && !Number(sales[0].physically_returned)) {
		const err = new Error(
			'This equipment was sold and has not been recorded as physically returned. It cannot be reactivated.'
		);
		err.status = 409;
		throw err;
	}
}

	router.get('/inventory-preview/:sku', requireAdmin, (req, res) => {
		res.set('Cache-Control', 'private, no-store');
		return loadInventoryDetails(req, res, true);
	});

	// inventory	
	router.get('/inventory', requireAdmin, async (req, res) => {
		try {
			const [rows] = await db.query(`
				SELECT
					i.id,
					i.sku,
					i.name,
					i.slug,
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

	
router.patch('/inventory/:id', requireSameOrigin, requireAdmin,
	async (req, res, next) => {
		let connection;

		try {
			const id = Number(req.params.id);
			const {
				name, price, active, pending,
				featured, clearance
			} = req.body ?? {};

			if (
				!Number.isSafeInteger(id) || id < 1 ||
				typeof name !== 'string' ||
				!name.trim() ||
				name.length > 255 ||
				!['number', 'string'].includes(typeof price) ||
				price === '' ||
				!Number.isFinite(Number(price)) ||
				Number(price) < 0 ||
				Number(price) > 99999999.99 ||
				![active, pending, featured, clearance].every(
					value => typeof value === 'boolean'
				)
			) {
				return res.status(400).json({
					error: 'Invalid inventory data'
				});
			}

			connection = await db.getConnection();
			await connection.beginTransaction();

			const [existing] = await connection.query(
				'SELECT id FROM inventory WHERE id = ? FOR UPDATE',
				[id]
			);

			if (!existing.length) {
				const err = new Error('Inventory item not found');
				err.status = 404;
				throw err;
			}

			if (active) {
				await assertInventoryCanBeListed(connection, id);
			}

			await connection.query(`
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

			await connection.commit();
			res.json({ success: true });
		} catch (err) {
			if (connection) {
				try {
					await connection.rollback();
				} catch (rollbackError) {
					console.error('Inventory rollback failed:', rollbackError);
				}
			}

			if (err.status) {
				return res.status(err.status).json({
					error: err.message
				});
			}

			next(err);
		} finally {
			if (connection) connection.release();
		}
	}
);


	router.get('/inventory/options', async (req, res, next) => {
		try {
			const [[brands], [types], [attributes]] = await Promise.all([
				db.query('SELECT id, name FROM brands ORDER BY name'),
				db.query('SELECT id, name FROM inventory_types ORDER BY name'),
				db.query(`
					SELECT id, name, slug, data_type, unit, sort_order
					FROM inventory_attributes
					ORDER BY sort_order, name
				`)
			]);

			res.json({ brands, types, attributes });
		} catch (err) {
			next(err);
		}
	});




	router.post('/inventory', async (req, res, next) => {
		let connection;

		try {
			const {
				sku, name, description, price, slug,
				inventory_type_id, brand_id,
				active, pending, featured, clearance,
				images = [], attributes = []
			} = req.body ?? {};

			const validId = value =>
				Number.isSafeInteger(Number(value)) && Number(value) > 0;

			const validFlag = value => typeof value === 'boolean';

			const validFilename = value =>
				typeof value === 'string' &&
				value.length > 0 &&
				value.length <= 255 &&
				!/[\\/]/.test(value) &&
				value !== '.' &&
				value !== '..';

			if (
				typeof sku !== 'string' || !sku.trim() || sku.length > 255 ||
				typeof name !== 'string' || !name.trim() || name.length > 255 ||
				typeof description !== 'string' ||
				typeof slug !== 'string' || slug.length > 255 ||
				!validId(inventory_type_id) ||
				(brand_id !== null && !validId(brand_id)) ||
				(price !== null && (
					!(/^\d{1,8}(\.\d{1,2})?$/.test(String(price)))
				)) ||
				![active, pending, featured, clearance].every(validFlag) ||
				!Array.isArray(images) ||
				!Array.isArray(attributes) ||
				images.length > 50 ||
				attributes.length > 100
			) {
				return res.status(400).json({ error: 'Invalid inventory data' });
			}

			// Validate media before touching the database.
			const primaryImages = images.filter(image => image.is_primary);

			const activeImages = images.filter(image =>
				image.media_type === 'image' && image.is_active
			);

			if (
				primaryImages.length > 1 ||
				images.some(image =>
					!validFilename(image.url) ||
					!['image', 'video'].includes(image.media_type) ||
					typeof image.is_active !== 'boolean' ||
					typeof image.is_primary !== 'boolean' ||
					typeof image.comment !== 'string' ||
					image.comment.length > 255 ||
					(image.poster_url != null &&
						image.poster_url !== '' &&
						!validFilename(image.poster_url)) ||
					(image.is_primary &&
						(image.media_type !== 'image' || !image.is_active))
				)
			) {
				return res.status(400).json({ error: 'Invalid media data' });
			}

			if (activeImages.length && primaryImages.length !== 1) {
				return res.status(400).json({
					error: 'Select one active primary image'
				});
			}


			// Validate attribute IDs and text values.
			const attributeIds = new Set();

			for (const attribute of attributes) {
				if (
					!validId(attribute.id) ||
					typeof attribute.value !== 'string' ||
					attribute.value.length > 10000 ||
					attributeIds.has(Number(attribute.id))
				) {
					return res.status(400).json({
						error: 'Invalid attribute data'
					});
				}

				attributeIds.add(Number(attribute.id));
			}

			connection = await db.getConnection();
			await connection.beginTransaction();

			// Verify the submitted attributes actually exist.
			if (attributeIds.size) {
				const ids = [...attributeIds];

				const [definitions] = await connection.query(
					'SELECT id, data_type FROM inventory_attributes WHERE id IN (?)',
					[ids]
				);

				if (definitions.length !== ids.length) {
					const err = new Error('Unknown inventory attribute');
					err.status = 400;
					throw err;
				}

				const definitionsById = new Map(
					definitions.map(row => [Number(row.id), row])
				);

				for (const attribute of attributes) {
					const type = definitionsById.get(Number(attribute.id)).data_type;
					const value = attribute.value.trim();

					if (
						(type === 'number' &&
							(!value || !Number.isFinite(Number(value)))) ||
						(type === 'boolean' &&
							!['true', 'false'].includes(value))
					) {
						const err = new Error('Invalid attribute value');
						err.status = 400;
						throw err;
					}
				}
			}

			// 1. Create the inventory item.
			const [result] = await connection.query(`
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

			const inventoryId = result.insertId;

			// 2. Save media filenames in the specified order.
			for (const [index, image] of images.entries()) {
				await connection.query(`
					INSERT INTO inventory_images (
						inventory_id, url, sort_order,
						is_primary, is_active, comment, media_type, poster_url
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`, [
					inventoryId,
					image.url,
					index + 1,
					Number(image.is_primary),
					Number(image.is_active),
					image.comment,
					image.media_type,
					image.poster_url || null
				]);
			}

			// 3. Save nonempty attribute values.
			for (const attribute of attributes) {
				if (!attribute.value.trim()) continue;

				await connection.query(`
					INSERT INTO inventory_attribute_values (
						inventory_id, attribute_id, value
					) VALUES (?, ?, ?)
				`, [
					inventoryId,
					Number(attribute.id),
					attribute.value.trim()
				]);
			}

			await connection.commit();

			res.status(201).json({ id: inventoryId });
		} catch (err) {
			if (connection) await connection.rollback();

			if (err.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({
					error: 'SKU already exists'
				});
			}

			if (err.code === 'ER_NO_REFERENCED_ROW_2') {
				return res.status(400).json({
					error: 'Invalid brand, type, or attribute'
				});
			}

			if (err.status === 400) {
				return res.status(400).json({ error: err.message });
			}

			next(err);
		} finally {
			if (connection) connection.release();
		}
	});


	router.get('/inventory/:id', async (req, res, next) => {
		try {
			const id = Number(req.params.id);

			if (!Number.isSafeInteger(id) || id < 1) {
				return res.status(400).json({ error: 'Invalid inventory ID' });
			}

			const [[items], [images], [attributes]] = await Promise.all([
				db.query('SELECT * FROM inventory WHERE id = ?', [id]),
				db.query(`
					SELECT id, url, comment, media_type,
						poster_url, sort_order, is_primary, is_active
					FROM inventory_images
					WHERE inventory_id = ?
					ORDER BY sort_order, id
				`, [id]),
				db.query(`
					SELECT attribute_id AS id, value
					FROM inventory_attribute_values
					WHERE inventory_id = ?
				`, [id])
			]);

			if (!items.length) {
				return res.status(404).json({ error: 'Inventory item not found' });
			}

			res.json({
				item: items[0],
				images,
				attributes
			});
		} catch (err) {
			next(err);
		}
	});


	router.put('/inventory/:id', async (req, res, next) => {
		let connection;

		try {
			const id = Number(req.params.id);
			const {
				sku, name, description, price, slug,
				inventory_type_id, brand_id,
				active, pending, featured, clearance,
				images, attributes
			} = req.body ?? {};

			const validId = value =>
				Number.isSafeInteger(Number(value)) && Number(value) > 0;

			const validFilename = value =>
				typeof value === 'string' &&
				value.length > 0 &&
				value.length <= 255 &&
				!/[\\/]/.test(value) &&
				value !== '.' &&
				value !== '..';

			const validPrice = value =>
				value === null ||
				(typeof value === 'string' || typeof value === 'number') &&
				/^\d{1,8}(\.\d{1,2})?$/.test(String(value));

			if (
				!validId(id) ||
				typeof sku !== 'string' || !sku.trim() || sku.length > 255 ||
				typeof name !== 'string' || !name.trim() || name.length > 255 ||
				typeof description !== 'string' ||
				typeof slug !== 'string' || slug.length > 255 ||
				!validPrice(price) ||
				!validId(inventory_type_id) ||
				(brand_id !== null && !validId(brand_id)) ||
				![active, pending, featured, clearance].every(
					value => typeof value === 'boolean'
				) ||
				!Array.isArray(images) || images.length > 50 ||
				!Array.isArray(attributes) || attributes.length > 100
			) {
				return res.status(400).json({ error: 'Invalid inventory data' });
			}

			const primaryImages = images.filter(image => image.is_primary);

			const activeImages = images.filter(image =>
				image.media_type === 'image' && image.is_active
			);

			if (
				primaryImages.length > 1 ||
				images.some(image =>
					!validFilename(image.url) ||
					!['image', 'video'].includes(image.media_type) ||
					typeof image.is_active !== 'boolean' ||
					typeof image.is_primary !== 'boolean' ||
					typeof image.comment !== 'string' ||
					image.comment.length > 255 ||
					(image.poster_url != null &&
						image.poster_url !== '' &&
						!validFilename(image.poster_url)) ||
					(image.is_primary &&
						(image.media_type !== 'image' || !image.is_active))
				)
			) {
				return res.status(400).json({ error: 'Invalid media data' });
			}

			if (activeImages.length && primaryImages.length !== 1) {
				return res.status(400).json({
					error: 'Select one active primary image'
				});
			}


			const attributeIds = new Set();

			for (const attribute of attributes) {
				if (
					!validId(attribute.id) ||
					typeof attribute.value !== 'string' ||
					attribute.value.length > 10000 ||
					attributeIds.has(Number(attribute.id))
				) {
					return res.status(400).json({ error: 'Invalid attribute data' });
				}

				attributeIds.add(Number(attribute.id));
			}

			connection = await db.getConnection();
			await connection.beginTransaction();

			const [existing] = await connection.query(
				'SELECT id FROM inventory WHERE id = ? FOR UPDATE',
				[id]
			);

			if (!existing.length) {
				const err = new Error('Inventory item not found');
				err.status = 404;
				throw err;
			}

			if (active) {
				await assertInventoryCanBeListed(connection, id);
			}

			if (attributeIds.size) {
				const [definitions] = await connection.query(
					'SELECT id, data_type FROM inventory_attributes WHERE id IN (?)',
					[[...attributeIds]]
				);

				if (definitions.length !== attributeIds.size) {
					const err = new Error('Unknown inventory attribute');
					err.status = 400;
					throw err;
				}

				const types = new Map(
					definitions.map(row => [Number(row.id), row.data_type])
				);

				for (const attribute of attributes) {
					const value = attribute.value.trim();
					const type = types.get(Number(attribute.id));

					if (
						(type === 'number' && value &&
							!Number.isFinite(Number(value))) ||
						(type === 'boolean' && value &&
							!['true', 'false'].includes(value))
					) {
						const err = new Error('Invalid attribute value');
						err.status = 400;
						throw err;
					}
				}
			}

			await connection.query(`
				UPDATE inventory SET
					sku = ?, name = ?, description = ?, price = ?,
					slug = ?, inventory_type_id = ?, brand_id = ?,
					active = ?, pending = ?, featured = ?, clearance = ?
				WHERE id = ?
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
				Number(clearance),
				id
			]);

			// Replace media records, not physical files.
			await connection.query(
				'DELETE FROM inventory_images WHERE inventory_id = ?',
				[id]
			);

			for (const [index, image] of images.entries()) {
				await connection.query(`
					INSERT INTO inventory_images (
						inventory_id, url, sort_order,
						is_primary, is_active, comment, media_type, poster_url
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				`, [
					id,
					image.url,
					index + 1,
					Number(image.is_primary),
					Number(image.is_active),
					image.comment,
					image.media_type,
					image.poster_url || null
				]);
			}

			// Replace existing attribute values.
			await connection.query(
				'DELETE FROM inventory_attribute_values WHERE inventory_id = ?',
				[id]
			);

			for (const attribute of attributes) {
				if (!attribute.value.trim()) continue;

				await connection.query(`
					INSERT INTO inventory_attribute_values (
						inventory_id, attribute_id, value
					) VALUES (?, ?, ?)
				`, [
					id,
					Number(attribute.id),
					attribute.value.trim()
				]);
			}

			await connection.commit();
			res.json({ success: true, id });
		} catch (err) {
			if (connection) {
				try {
					await connection.rollback();
				} catch (rollbackError) {
					console.error('Inventory rollback failed:', rollbackError);
				}
			}

			if (err.code === 'ER_DUP_ENTRY') {
				return res.status(409).json({ error: 'SKU already exists' });
			}

			if (err.code === 'ER_NO_REFERENCED_ROW_2') {
				return res.status(400).json({ error: 'Invalid brand or type' });
			}

			if (err.status) {
				return res.status(err.status).json({ error: err.message });
			}

			next(err);
		} finally {
			if (connection) connection.release();
		}
	});

























	// Customer validation shared by create and update.
	function validateCustomer(body) {
		const fields = [
			'first_name', 'last_name', 'address_1', 'city',
			'state', 'zip', 'phone', 'email', 'notes'
		];

		const limits = {
			first_name: 255,
			last_name: 255,
			address_1: 255,
			city: 255,
			state: 2,
			zip: 10,
			phone: 32,
			email: 255
		};

		if (!body || typeof body !== 'object' || Array.isArray(body)) {
			return { error: 'Invalid customer data' };
		}

		const externalId = String(body.external_id ?? '');

		if (
			!/^[1-9]\d*$/.test(externalId) ||
			Number(externalId) > 4294967295
		) {
			return { error: 'External ID must be a positive unsigned integer' };
		}

		const customer = {
			external_id: Number(externalId)
		};

		for (const field of fields) {
			const value = body[field];

			if (value !== null && value !== undefined &&
				typeof value !== 'string') {
				return { error: `Invalid ${field}` };
			}

			const trimmed = (value ?? '').trim();

			if (limits[field] && trimmed.length > limits[field]) {
				return { error: `${field} is too long` };
			}

			customer[field] = trimmed || null;
		}

		if (!customer.first_name) {
			return { error: 'First name is required' };
		}

		if (customer.state && !/^[A-Za-z]{2}$/.test(customer.state)) {
			return { error: 'State must be a two-letter abbreviation' };
		}

		if (customer.email &&
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
			return { error: 'Invalid email address' };
		}

		return { customer };
	}

	const customerColumns = [
		'external_id', 'first_name', 'last_name',
		'address_1', 'city', 'state', 'zip',
		'phone', 'email', 'notes'
	];

	function handleCustomerError(err, res, next) {
		if (err.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({
				error: 'A customer with that external ID already exists'
			});
		}

		next(err);
	}

	// List customers.
	router.get('/customers', async (req, res, next) => {
		try {
			const [rows] = await db.query(`
				SELECT id, external_id, first_name, last_name,
					address_1, city, state, zip, phone, email,
					notes, created_at
				FROM customers
				ORDER BY last_name, first_name, id
			`);

			res.json(rows);
		} catch (err) {
			next(err);
		}
	});

	// Load one customer.
	router.get('/customers/:id', async (req, res, next) => {
		try {
			const id = Number(req.params.id);

			if (!Number.isSafeInteger(id) || id < 1) {
				return res.status(400).json({ error: 'Invalid customer ID' });
			}

			const [rows] = await db.query(
				'SELECT * FROM customers WHERE id = ?',
				[id]
			);

			if (!rows.length) {
				return res.status(404).json({ error: 'Customer not found' });
			}

			res.json(rows[0]);
		} catch (err) {
			next(err);
		}
	});

	// Create customer.
	router.post('/customers', async (req, res, next) => {
		const { customer, error } = validateCustomer(req.body);

		if (error) {
			return res.status(400).json({ error });
		}

		try {
			const placeholders = customerColumns.map(() => '?').join(', ');

			const [result] = await db.query(
				`INSERT INTO customers (${customerColumns.join(', ')})
					VALUES (${placeholders})`,
				customerColumns.map(field => customer[field])
			);

			res.status(201).json({ id: result.insertId });
		} catch (err) {
			handleCustomerError(err, res, next);
		}
	});

	// Update customer, including external_id.
	router.put('/customers/:id', async (req, res, next) => {
		const id = Number(req.params.id);

		if (!Number.isSafeInteger(id) || id < 1) {
			return res.status(400).json({ error: 'Invalid customer ID' });
		}

		const { customer, error } = validateCustomer(req.body);

		if (error) {
			return res.status(400).json({ error });
		}

		try {
			const assignments = customerColumns
				.map(field => `${field} = ?`)
				.join(', ');

			const [result] = await db.query(
				`UPDATE customers SET ${assignments} WHERE id = ?`,
				[
					...customerColumns.map(field => customer[field]),
					id
				]
			);

			if (!result.affectedRows) {
				return res.status(404).json({ error: 'Customer not found' });
			}

			res.json({ success: true, id });
		} catch (err) {
			handleCustomerError(err, res, next);
		}
	});





















	// Validate data shared by create and update.
	function validateServiceTicket(body) {
		if (!body || typeof body !== 'object' || Array.isArray(body)) {
			return { error: 'Invalid service ticket data' };
		}

		const validUnsignedId = value =>
			/^[1-9]\d*$/.test(String(value ?? '')) &&
			Number(value) <= 4294967295;

		if (!validUnsignedId(body.ticket_number)) {
			return { error: 'Ticket number must be a positive unsigned integer' };
		}

		if (!validUnsignedId(body.customer_id)) {
			return { error: 'Select a valid customer' };
		}

		for (const field of ['description', 'diagnostic_notes', 'service_notes']) {
			if (
				body[field] !== null &&
				body[field] !== undefined &&
				typeof body[field] !== 'string'
			) {
				return { error: `Invalid ${field}` };
			}
		}

		if (![
			'new',
			'pickup_scheduled',
			'diagnostic_complete',
			'services_complete',
			'paid'
		].includes(body.status)) {
			return { error: 'Invalid ticket status' };
		}

		return {
			ticket: {
				ticket_number: Number(body.ticket_number),
				customer_id: Number(body.customer_id),
				description: body.description?.trim() || null,
				diagnostic_notes: body.diagnostic_notes?.trim() || null,
				service_notes: body.service_notes?.trim() || null,
				status: body.status
			}
		};
	}

	function handleServiceTicketError(err, res, next) {
		if (err.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({
				error: 'Ticket number already exists'
			});
		}

		if (err.code === 'ER_NO_REFERENCED_ROW_2') {
			return res.status(400).json({
				error: 'Selected customer does not exist'
			});
		}

		if (err.status) {
			return res.status(err.status).json({
				error: err.message
			});
		}
		next(err);
	}

	// List tickets with customer details.
	router.get('/service-tickets', async (req, res, next) => {
		try {
			const [rows] = await db.query(`
				SELECT
					t.id,
					t.ticket_number,
					t.customer_id,
					t.token,
					t.description,
					t.status,
					t.created_at,
					t.completed_at,
					c.external_id AS customer_external_id,
					c.first_name,
					c.last_name
				FROM service_tickets t
				INNER JOIN customers c ON c.id = t.customer_id
				ORDER BY t.created_at DESC, t.id DESC
			`);

			res.json(rows);
		} catch (err) {
			next(err);
		}
	});

	// Fetch one ticket.
	router.get('/service-tickets/:id', async (req, res, next) => {
		try {
			const id = Number(req.params.id);

			if (!Number.isSafeInteger(id) || id < 1) {
				return res.status(400).json({ error: 'Invalid ticket ID' });
			}

			const [[tickets], [media]] = await Promise.all([
				db.query(
					'SELECT * FROM service_tickets WHERE id = ?',
					[id]
				),
				db.query(`
					SELECT id, filename, media_type,
						poster_filename, comment, category, sort_order
					FROM service_ticket_media
					WHERE service_ticket_id = ?
					ORDER BY sort_order, id
				`, [id])
			]);

			if (!tickets.length) {
				return res.status(404).json({ error: 'Ticket not found' });
			}

			res.json({
				...tickets[0],
				media
			});
		} catch (err) {
			next(err);
		}
	});


	// Create ticket.
	router.post('/service-tickets', async (req, res, next) => {
		const { ticket, error } = validateServiceTicket(req.body);
		const media = req.body?.media ?? [];

		if (error) {
			return res.status(400).json({ error });
		}

		const mediaError = validateServiceMedia(media);

		if (mediaError) {
			return res.status(400).json({ error: mediaError });
		}

		let connection;
		let numberLock = false;

		try {
			connection = await db.getConnection();
			await acquireExternalIdLock(connection);
			numberLock = true;

			await connection.beginTransaction();

			await assertExternalNumberAvailable(
				connection, ticket.ticket_number, 'service'
			);
			
			const [result] = await connection.query(`
				INSERT INTO service_tickets (
					ticket_number,
					customer_id,
					description,
					diagnostic_notes,
					service_notes,
					status,
					completed_at
				) VALUES (?, ?, ?, ?, ?, ?, ?)
			`, [
				ticket.ticket_number,
				ticket.customer_id,
				ticket.description,
				ticket.diagnostic_notes,
				ticket.service_notes,
				ticket.status,
				ticket.status === 'services_complete'
					? new Date()
					: null
			]);

			await insertServiceMedia(connection, result.insertId, media);

			await connection.commit();

			res.status(201).json({ id: result.insertId });
		} catch (err) {
			if (connection) {
				try {
					await connection.rollback();
				} catch (rollbackError) {
					console.error('Ticket rollback failed:', rollbackError);
				}
			}

			handleServiceTicketError(err, res, next);
		} finally {
			if (connection) {
				await releaseExternalIdConnection(connection, numberLock);
			}
		}
	});



	//update ticket
	router.put('/service-tickets/:id', async (req, res, next) => {
		const id = Number(req.params.id);

		if (!Number.isSafeInteger(id) || id < 1) {
			return res.status(400).json({ error: 'Invalid ticket ID' });
		}

		const { ticket, error } = validateServiceTicket(req.body);
		const media = req.body?.media;

		if (error) {
			return res.status(400).json({ error });
		}

		// PUT replaces the complete media collection.
		const mediaError = validateServiceMedia(media);

		if (mediaError) {
			return res.status(400).json({ error: mediaError });
		}

		let connection;
		let numberLock = false;

		try {
			connection = await db.getConnection();
			await acquireExternalIdLock(connection);
			numberLock = true;

			await connection.beginTransaction();
			await assertExternalNumberAvailable(
				connection, ticket.ticket_number, 'service', id
			);

			const [existing] = await connection.query(
				'SELECT id FROM service_tickets WHERE id = ? FOR UPDATE',
				[id]
			);

			if (!existing.length) {
				await connection.rollback();
				return res.status(404).json({ error: 'Ticket not found' });
			}
		
			await connection.query(`
				UPDATE service_tickets
				SET
					ticket_number = ?,
					customer_id = ?,
					description = ?,
					diagnostic_notes = ?,
					service_notes = ?,
					status = ?,
					completed_at = CASE
						WHEN ? IN ('new', 'pickup_scheduled', 'diagnostic_complete') THEN NULL
						WHEN completed_at IS NULL THEN CURRENT_TIMESTAMP
						ELSE completed_at
					END
				WHERE id = ?
			`, [
				ticket.ticket_number,
				ticket.customer_id,
				ticket.description,
				ticket.diagnostic_notes,
				ticket.service_notes,
				ticket.status,
				ticket.status,
				id
			]);

			await connection.query(
				'DELETE FROM service_ticket_media WHERE service_ticket_id = ?',
				[id]
			);

			await insertServiceMedia(connection, id, media);

			await connection.commit();

			res.json({ success: true, id });
		} catch (err) {
			if (connection) {
				try {
					await connection.rollback();
				} catch (rollbackError) {
					console.error('Ticket rollback failed:', rollbackError);
				}
			}

			handleServiceTicketError(err, res, next);
		} finally {
			if (connection) {
				await releaseExternalIdConnection(connection, numberLock);
			}
		}
	});











	function validateServiceMedia(media) {
		if (!Array.isArray(media) || media.length > 100) {
			return 'Invalid media list';
		}

		const validFilename = value =>
			typeof value === 'string' &&
			value.trim().length > 0 &&
			value.length <= 255 &&
			value !== '.' &&
			value !== '..' &&
			!/[\\/]/.test(value);

		for (const entry of media) {
			if (!entry || typeof entry !== 'object' ||
				Array.isArray(entry) ||
				!validFilename(entry.filename) ||
				!['diagnostic', 'service'].includes(entry.category) ||
				!['image', 'video'].includes(entry.media_type) ||
				(entry.poster_filename != null &&
					entry.poster_filename !== '' &&
					!validFilename(entry.poster_filename)) ||
				(entry.comment != null &&
					typeof entry.comment !== 'string') ||
				(entry.comment?.length ?? 0) > 10000
			) {
				return 'Invalid service ticket media';
			}
		}

		return null;
	}

	async function insertServiceMedia(connection, ticketId, media) {
		for (const [index, entry] of media.entries()) {
			await connection.query(`
				INSERT INTO service_ticket_media (
					service_ticket_id,
					filename,
					media_type,
					poster_filename,
					comment,
					category,
					sort_order
				) VALUES (?, ?, ?, ?, ?, ?, ?)
			`, [
				ticketId,
				entry.filename.trim(),
				entry.media_type,
				entry.media_type === 'video'
					? entry.poster_filename?.trim() || null
					: null,
				entry.comment?.trim() || null,
				entry.category,
				index + 1
			]);
		}
	}












	// Standard charge validation helpers.
	function validChargeId(value) {
		return /^[1-9]\d*$/.test(String(value)) &&
			Number(value) <= 4294967295;
	}

	function validEffectiveDate(value) {
		if (typeof value !== 'string' ||
			!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return false;
		}

		const [year, month, day] = value.split('-').map(Number);
		const date = new Date(0);

		date.setUTCFullYear(year, month - 1, day);
		date.setUTCHours(0, 0, 0, 0);

		return date.getUTCFullYear() === year &&
			date.getUTCMonth() === month - 1 &&
			date.getUTCDate() === day;
	}

	function validChargeValue(value) {
		return (typeof value === 'string' ||
			typeof value === 'number') &&
			/^\d{1,8}(\.\d{1,4})?$/.test(String(value));
	}

	function handleChargeError(err, res, next) {
		if (err.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({
				error: 'Charge or effective date already exists'
			});
		}

		next(err);
	}

	// List standard charges with their currently effective rates.
	router.get('/standard-charges', async (req, res, next) => {
		try {
			const [rows] = await db.query(`
				SELECT
					c.id,
					c.name,
					c.slug,
					c.calculation_type,
					c.unit,
					c.active,
					v.id AS version_id,
					v.value AS current_value,
					DATE_FORMAT(v.effective_date, '%Y-%m-%d')
						AS effective_date
				FROM standard_charges c
				LEFT JOIN standard_charge_versions v
					ON v.id = (
						SELECT v2.id
						FROM standard_charge_versions v2
						WHERE v2.standard_charge_id = c.id
							AND v2.effective_date <= CURRENT_DATE()
						ORDER BY v2.effective_date DESC, v2.id DESC
						LIMIT 1
					)
				ORDER BY c.name, c.id
			`);

			res.json(rows);
		} catch (err) {
			next(err);
		}
	});

	// Load one standard charge and its version history.
	router.get('/standard-charges/:id', async (req, res, next) => {
		const id = Number(req.params.id);

		if (!validChargeId(req.params.id)) {
			return res.status(400).json({ error: 'Invalid charge ID' });
		}

		try {
			const [[charges], [versions]] = await Promise.all([
				db.query(
					'SELECT * FROM standard_charges WHERE id = ?',
					[id]
				),
				db.query(`
					SELECT
						id,
						value,
						DATE_FORMAT(effective_date, '%Y-%m-%d')
							AS effective_date,
						created_at
					FROM standard_charge_versions
					WHERE standard_charge_id = ?
					ORDER BY effective_date DESC, id DESC
				`, [id])
			]);

			if (!charges.length) {
				return res.status(404).json({
					error: 'Standard charge not found'
				});
			}

			res.json({
				...charges[0],
				versions
			});
		} catch (err) {
			next(err);
		}
	});

	// Create a standard charge definition.
	router.post('/standard-charges', async (req, res, next) => {
		const {
			name, slug, calculation_type, unit,
			active = true
		} = req.body ?? {};

		if (
			typeof name !== 'string' ||
			!name.trim() ||
			name.length > 100 ||
			typeof slug !== 'string' ||
			!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
			slug.length > 100 ||
			!['percentage', 'unit_price'].includes(calculation_type) ||
			(unit != null && (
				typeof unit !== 'string' ||
				unit.length > 30
			)) ||
			typeof active !== 'boolean'
		) {
			return res.status(400).json({
				error: 'Invalid standard charge data'
			});
		}

		try {
			const [result] = await db.query(`
				INSERT INTO standard_charges (
					name, slug, calculation_type, unit, active
				) VALUES (?, ?, ?, ?, ?)
			`, [
				name.trim(),
				slug,
				calculation_type,
				unit?.trim() || null,
				Number(active)
			]);

			res.status(201).json({
				id: result.insertId
			});
		} catch (err) {
			handleChargeError(err, res, next);
		}
	});

	// Create a new effective-dated rate version.
	router.post('/standard-charges/:id/versions', async (req, res, next) => {
		const id = Number(req.params.id);
		const { value, effective_date } = req.body ?? {};

		if (!validChargeId(req.params.id)) {
			return res.status(400).json({ error: 'Invalid charge ID' });
		}

		if (
			!validChargeValue(value) ||
			!validEffectiveDate(effective_date)
		) {
			return res.status(400).json({
				error: 'Invalid rate or effective date'
			});
		}

		try {
			const [charges] = await db.query(
				'SELECT id FROM standard_charges WHERE id = ?',
				[id]
			);

			if (!charges.length) {
				return res.status(404).json({
					error: 'Standard charge not found'
				});
			}

			const [result] = await db.query(`
				INSERT INTO standard_charge_versions (
					standard_charge_id,
					value,
					effective_date
				) VALUES (?, ?, ?)
			`, [
				id,
				String(value),
				effective_date
			]);

			res.status(201).json({
				id: result.insertId,
				standard_charge_id: id
			});
		} catch (err) {
			handleChargeError(err, res, next);
		}
	});











	// Exact decimal arithmetic: all prices are rounded to cents.
	function scaledDecimal(value) {
		const text = String(value);
		if (!/^\d{1,8}(\.\d{1,4})?$/.test(text)) {
			throw Object.assign(new Error('Invalid decimal value'), {
				status: 400
			});
		}

		const [whole, fraction = ''] = text.split('.');
		return BigInt(whole) * 10000n +
			BigInt(fraction.padEnd(4, '0'));
	}

	function roundDivide(numerator, denominator) {
		return (numerator + denominator / 2n) / denominator;
	}

	function money(cents) {
		const negative = cents < 0n;
		const absolute = negative ? -cents : cents;

		return `${negative ? '-' : ''}${absolute / 100n}.${String(
			absolute % 100n
		).padStart(2, '0')}`;
	}

	function centsForLine(quantity, unitPrice) {
		// quantity and price both have four decimal places.
		return roundDivide(
			scaledDecimal(quantity) * scaledDecimal(unitPrice),
			1000000n
		);
	}

	function percentageOfCents(cents, rate) {
		return roundDivide(
			cents * scaledDecimal(rate),
			1000000n
		);
	}

	function includedTaxCents(grossCents, rate) {
		const scaledRate = scaledDecimal(rate);

		return roundDivide(
			grossCents * scaledRate,
			1000000n + scaledRate
		);
	}

	function billingError(message, status = 400) {
		return Object.assign(new Error(message), { status });
	}

	function validBillingId(value) {
		return /^[1-9]\d*$/.test(String(value)) &&
			Number(value) <= 4294967295;
	}

	function validateBilling(body) {
		if (!body || typeof body !== 'object' ||
			Array.isArray(body) ||
			body.billing_method !== 'quoted_total' ||
			!Array.isArray(body.items) ||
			body.items.length > 100 ||
			!/^\d{1,8}(\.\d{1,2})?$/.test(
				String(body.quoted_total ?? '')
			)) {
			throw billingError('Invalid billing data');
		}

		for (const item of body.items) {
			if (!item || typeof item !== 'object' ||
				Array.isArray(item) ||
				!['part', 'standard'].includes(item.category) ||
				!item.quantity ||
				!scaledDecimal(item.quantity)) {
				throw billingError('Invalid billing line item');
			}

			if (item.category === 'part') {
				if (
					typeof item.description !== 'string' ||
					!item.description.trim() ||
					item.description.length > 255 ||
					!['string', 'number'].includes(typeof item.unit_price) ||
					typeof item.taxable !== 'boolean' ||
					(item.unit != null && (
						typeof item.unit !== 'string' ||
						item.unit.length > 30
					))
				) {
					throw billingError('Invalid part');
				}

				scaledDecimal(item.unit_price);
			} else if (!validBillingId(item.standard_charge_id)) {
				throw billingError('Invalid standard charge ID');
			}
		}
	}

	// Resolve versions effective today. Future rates are excluded.
	async function loadBillingRates(connection) {
		const [rows] = await connection.query(`
			SELECT
				c.id,
				c.name,
				c.slug,
				c.unit,
				c.calculation_type,
				c.active,
				v.id AS version_id,
				v.value
			FROM standard_charges c
			LEFT JOIN standard_charge_versions v
				ON v.id = (
					SELECT v2.id
					FROM standard_charge_versions v2
					WHERE v2.standard_charge_id = c.id
						AND v2.effective_date <= CURRENT_DATE()
					ORDER BY v2.effective_date DESC, v2.id DESC
					LIMIT 1
				)
		`);

		return new Map(rows.map(row => [Number(row.id), row]));
	}

	function requireRate(rates, slug) {
		const rate = [...rates.values()].find(row => row.slug === slug);

		if (!rate || !rate.active || rate.value == null) {
			throw billingError(
				`No active rate configured for ${slug}`,
				409
			);
		}

		return rate;
	}

	function calculateBilling(quotedTotal, items, rates) {
		const quotedCents = scaledDecimal(quotedTotal) / 100n;
		const taxRate = requireRate(rates, 'sales-tax');
		const shopRate = requireRate(rates, 'shop-materials');

		if (
			taxRate.calculation_type !== 'percentage' ||
			shopRate.calculation_type !== 'percentage'
		) {
			throw billingError('Invalid tax or shop materials configuration', 409);
		}

		const resolved = [];
		let enteredCents = 0n;
		let taxableCents = 0n;

		for (const item of items) {
			let description;
			let unit;
			let rate;
			let versionId = null;
			let standardChargeId = null;
			let taxable;

			if (item.category === 'standard') {
				const definition = rates.get(Number(item.standard_charge_id));

				if (!definition || !definition.active ||
					definition.value == null ||
					definition.calculation_type !== 'unit_price' ||
					['sales-tax', 'shop-materials'].includes(definition.slug)) {
					throw billingError('Invalid or unavailable standard charge', 400);
				}

				description = definition.name;
				unit = definition.unit;
				rate = definition.value;
				versionId = definition.version_id;
				standardChargeId = definition.id;

				// Current business rules: oil is taxable.
				// Tax classification needs its own catalog metadata later.
				taxable = definition.slug === 'engine-oil';
			} else {
				description = item.description.trim();
				unit = item.unit?.trim() || null;
				rate = item.unit_price;
				taxable = item.taxable;
			}

			const amountCents = centsForLine(item.quantity, rate);

			enteredCents += amountCents;
			if (taxable) taxableCents += amountCents;

			resolved.push({
				category: item.category,
				description,
				quantity: String(item.quantity),
				unit,
				unit_price: String(rate),
				amount: money(amountCents),
				taxable,
				standard_charge_id: standardChargeId,
				standard_charge_version_id: versionId
			});
		}

		const materialsCents = percentageOfCents(
			quotedCents,
			shopRate.value
		);

		// These parts prices already INCLUDE sales tax.
		const taxCents = percentageOfCents(taxableCents, taxRate.value);

		// Tax is not deducted twice; it is included in enteredCents.
		const laborCents = quotedCents - enteredCents - materialsCents - taxCents;

		if (laborCents < 0n) {
			throw billingError(
				'Parts and shop materials exceed the quoted total',
				400
			);
		}

		return {
			billing_method: 'quoted_total',
			quoted_total: money(quotedCents),
			items: resolved,
			automatic: {
				shop_materials: money(materialsCents),
				shop_materials_rate: String(shopRate.value),
				shop_materials_version_id: shopRate.version_id,
				sales_tax: money(taxCents),
				sales_tax_rate: String(taxRate.value),
				sales_tax_version_id: taxRate.version_id,
				labor: money(laborCents)
			},
			totals: {
				taxable_gross: money(taxableCents),
				subtotal_before_tax: money(quotedCents - taxCents),
				included_tax: money(taxCents),
				customer_total: money(quotedCents)
			}
		};
	}



	// Load a ticket's billing data and calculate current amounts.
	router.get('/service-tickets/:id/billing', async (req, res, next) => {
		if (!validBillingId(req.params.id)) {
			return res.status(400).json({ error: 'Invalid ticket ID' });
		}

		try {
			const id = Number(req.params.id);

			const [[tickets], [items], rates] = await Promise.all([
				db.query(`
					SELECT id, billing_method, quoted_total, completed_at
					FROM service_tickets
					WHERE id = ?
				`, [id]),
				db.query(`
					SELECT category, description, quantity, unit,
						unit_price, taxable, standard_charge_id,
						standard_charge_version_id, amount
					FROM service_ticket_charges
					WHERE service_ticket_id = ?
					ORDER BY sort_order, id
				`, [id]),
				loadBillingRates(db)
			]);

			if (!tickets.length) {
				return res.status(404).json({ error: 'Ticket not found' });
			}

			const ticket = tickets[0];

			if (ticket.quoted_total == null) {
				return res.json({
					billing_method: ticket.billing_method,
					quoted_total: null,
					items
				});
			}

			const enteredItems = items.filter(item =>
				['part', 'standard'].includes(item.category)
			);

			res.json(calculateBilling(
				ticket.quoted_total,
				enteredItems,
				rates
			));
		} catch (err) {
			if (err.status) {
				return res.status(err.status).json({ error: err.message });
			}

			next(err);
		}
	});

	// Save the entered charges for an open service ticket.
	router.put('/service-tickets/:id/billing', async (req, res, next) => {
		if (!validBillingId(req.params.id)) {
			return res.status(400).json({ error: 'Invalid ticket ID' });
		}

		try {
			validateBilling(req.body);
		} catch (err) {
			return res.status(err.status || 400).json({
				error: err.message
			});
		}

		const id = Number(req.params.id);
		let connection;

		try {
			connection = await db.getConnection();
			await connection.beginTransaction();

			const [tickets] = await connection.query(`
				SELECT id, completed_at
				FROM service_tickets
				WHERE id = ?
				FOR UPDATE
			`, [id]);

			if (!tickets.length) {
				throw billingError('Ticket not found', 404);
			}

			if (tickets[0].completed_at) {
				throw billingError('Completed tickets cannot be repriced', 409);
			}

			const rates = await loadBillingRates(connection);

			const calculated = calculateBilling(
				req.body.quoted_total,
				req.body.items,
				rates
			);

			await connection.query(`
				UPDATE service_tickets
				SET billing_method = ?, quoted_total = ?
				WHERE id = ?
			`, [
				'quoted_total',
				calculated.quoted_total,
				id
			]);

			await connection.query(`
				DELETE FROM service_ticket_charges
				WHERE service_ticket_id = ?
			`, [id]);

			for (const [index, item] of calculated.items.entries()) {
				await connection.query(`
					INSERT INTO service_ticket_charges (
						service_ticket_id,
						standard_charge_id,
						category,
						description,
						quantity,
						unit,
						unit_price,
						amount,
						standard_charge_version_id,
						taxable,
						sort_order
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`, [
					id,
					item.standard_charge_id,
					item.category,
					item.description,
					item.quantity,
					item.unit,
					item.unit_price,
					item.amount,
					// Open tickets must resolve the latest rate.
					null,
					Number(item.taxable),
					index + 1
				]);
			}

			await connection.commit();

			res.json({
				success: true,
				...calculated
			});
		} catch (err) {
			if (connection) {
				try {
					await connection.rollback();
				} catch (rollbackError) {
					console.error('Billing rollback failed:', rollbackError);
				}
			}

			if (err.status) {
				return res.status(err.status).json({
					error: err.message
				});
			}

			next(err);
		} finally {
			if (connection) connection.release();
		}
	});




























// Inventory Sales: common validation and calculations.

function validSaleId(value) {
	return /^[1-9]\d*$/.test(String(value)) &&
		Number(value) <= 4294967295;
}

function validSaleAmount(value) {
	return /^\d{1,8}(\.\d{1,2})?$/.test(String(value)) &&
		Number(value) > 0;
}

function validateInventorySale(body) {
	if (
		!body ||
		!validSaleId(body.sale_number) ||
		!validSaleId(body.customer_id) ||
		!Array.isArray(body.items) ||
		body.items.length < 1 ||
		body.items.length > 100 ||
		typeof (body.notes ?? '') !== 'string' ||
		String(body.notes ?? '').length > 10000
	) {
		throw billingError('Invalid inventory sale data');
	}

	const ids = new Set();

	for (const item of body.items) {
		if (
			!item ||
			!validSaleId(item.inventory_id) ||
			!validSaleAmount(item.total)
		) {
			throw billingError('Invalid equipment or selling price');
		}

		const id = Number(item.inventory_id);

		if (ids.has(id)) {
			throw billingError('Equipment appears more than once');
		}

		ids.add(id);
	}

	return {
		sale_number: Number(body.sale_number),
		customer_id: Number(body.customer_id),
		notes: (body.notes ?? '').trim() || null,
		items: body.items.map(item => ({
			inventory_id: Number(item.inventory_id),
			total: String(item.total)
		}))
	};
}

function calculateInventorySale(items, taxRate) {
	let subtotal = 0n;
	let salesTax = 0n;
	let total = 0n;

	const lines = items.map((item, index) => {
		const lineTotal = scaledDecimal(item.total) / 100n;
		const lineTax = includedTaxCents(lineTotal, taxRate);
		const lineSubtotal = lineTotal - lineTax;

		subtotal += lineSubtotal;
		salesTax += lineTax;
		total += lineTotal;

		return {
			inventory_id: item.inventory_id,
			subtotal: money(lineSubtotal),
			sales_tax: money(lineTax),
			total: money(lineTotal),
			sort_order: index
		};
	});

	// Maximum supported by DECIMAL(10,2).
	if (total > 9999999999n) {
		throw billingError('Sale total is too large');
	}

	return {
		lines,
		subtotal: money(subtotal),
		sales_tax: money(salesTax),
		total: money(total)
	};
}

function handleInventorySaleError(err, res, next) {
	if (err.code === 'ER_DUP_ENTRY') {
		return res.status(409).json({
			error: 'Sale number or equipment is already assigned'
		});
	}

	if (err.status) {
		return res.status(err.status).json({
			error: err.message
		});
	}

	next(err);
}


// List sales with their equipment
router.get('/inventory-sales', async (req, res, next) => {
	try {
		const [[sales], [items]] = await Promise.all([
			db.query(`
				SELECT
					s.*,
					c.external_id AS customer_external_id,
					c.first_name,
					c.last_name,
					(
						SELECT COALESCE(SUM(r.refund_total), 0)
						FROM inventory_sale_returns r
						WHERE r.inventory_sale_id = s.id
					) AS refunded_total,
					(
						SELECT COUNT(DISTINCT ri.inventory_sale_item_id)
						FROM inventory_sale_return_items ri
						JOIN inventory_sale_returns r
							ON r.id = ri.inventory_sale_return_id
						WHERE r.inventory_sale_id = s.id
							AND ri.physically_returned = 1
					) AS returned_item_count
				FROM inventory_sales s
				JOIN customers c ON c.id = s.customer_id
				ORDER BY s.sale_date DESC, s.id DESC
			`),
			db.query(`
				SELECT
					si.inventory_sale_id,
					si.inventory_id,
					si.subtotal,
					si.sales_tax,
					si.total,
					i.sku,
					i.name
				FROM inventory_sale_items si
				JOIN inventory i ON i.id = si.inventory_id
				ORDER BY si.inventory_sale_id,
					si.sort_order, si.id
			`)
		]);

		const salesById = new Map();

		for (const sale of sales) {
			sale.items = [];
			salesById.set(Number(sale.id), sale);
		}

		for (const item of items) {
			salesById.get(Number(item.inventory_sale_id))
				?.items.push(item);
		}

		res.json(sales);
	} catch (err) {
		next(err);
	}
});



// Load a single sale for editing.
router.get('/inventory-sales/:id', async (req, res, next) => {
	if (!validSaleId(req.params.id)) {
		return res.status(400).json({
			error: 'Invalid sale ID'
		});
	}

	try {
		const [[sales], [items]] = await Promise.all([
			db.query(`
				SELECT *
				FROM inventory_sales
				WHERE id = ?
			`, [Number(req.params.id)]),

			db.query(`
				SELECT
					inventory_id,
					subtotal,
					sales_tax,
					total
				FROM inventory_sale_items
				WHERE inventory_sale_id = ?
				ORDER BY sort_order, id
			`, [Number(req.params.id)])
		]);

		if (!sales.length) {
			return res.status(404).json({
				error: 'Sale not found'
			});
		}

		res.json({
			...sales[0],
			items
		});
	} catch (err) {
		next(err);
	}
});


// Create or update a sale in one database transaction.
async function saveInventorySale(req, res, next, saleId = null) {
	let input;

	try {
		input = validateInventorySale(req.body);
	} catch (err) {
		return res.status(err.status || 400).json({
			error: err.message
		});
	}

	let connection;
	let numberLock = false;

	try {
		connection = await db.getConnection();
		await acquireExternalIdLock(connection);
		numberLock = true;

		await connection.beginTransaction();

		await assertExternalNumberAvailable(
			connection,
			input.sale_number,
			'sale',
			saleId ?? 0
		);

		let existingSale = null;
		let oldIds = [];

		if (saleId !== null) {
			const [rows] = await connection.query(`
				SELECT id, tax_rate
				FROM inventory_sales
				WHERE id = ?
				FOR UPDATE
			`, [saleId]);

			if (!rows.length) {
				throw billingError('Sale not found', 404);
			}

			existingSale = rows[0];

			const [oldItems] = await connection.query(`
				SELECT inventory_id
				FROM inventory_sale_items
				WHERE inventory_sale_id = ?
			`, [saleId]);

			oldIds = oldItems.map(item =>
				Number(item.inventory_id)
			);
		}

		const [customers] = await connection.query(`
			SELECT id
			FROM customers
			WHERE id = ?
		`, [input.customer_id]);

		if (!customers.length) {
			throw billingError('Customer not found', 404);
		}

		const newIds = input.items.map(item => item.inventory_id);
		const oldIdSet = new Set(oldIds);
		const newIdSet = new Set(newIds);

		// Lock all affected equipment in a stable order.
		const allIds = [...new Set([...oldIds, ...newIds])]
			.sort((a, b) => a - b);

		const [inventory] = await connection.query(`
			SELECT id, active
			FROM inventory
			WHERE id IN (?)
			ORDER BY id
			FOR UPDATE
		`, [allIds]);

		if (inventory.length !== allIds.length) {
			throw billingError('Equipment not found', 404);
		}

		// Already-sold items belonging to this sale are allowed.
		// Newly-added items must be active.
		for (const item of inventory) {
			const id = Number(item.id);

			if (
				newIdSet.has(id) &&
				!oldIdSet.has(id) &&
				Number(item.active) !== 1
			) {
				throw billingError(
					'Selected equipment is not available',
					409
				);
			}
		}

		// Existing sales retain their original tax rate.
		// New sales use the currently effective rate.
		let taxRate;

		if (existingSale) {
			taxRate = String(existingSale.tax_rate);
		} else {
			const rates = await loadBillingRates(connection);
			const rate = requireRate(rates, 'sales-tax');

			if (rate.calculation_type !== 'percentage') {
				throw billingError(
					'Invalid sales tax configuration',
					409
				);
			}

			taxRate = String(rate.value);
		}

		const calculated = calculateInventorySale(
			input.items,
			taxRate
		);

		let id = saleId;

		if (existingSale) {
			const [recordedReturns] = await connection.query(`
				SELECT id
				FROM inventory_sale_returns
				WHERE inventory_sale_id = ?
				LIMIT 1
			`, [id]);

			if (recordedReturns.length) {
				throw billingError(
					'This sale has refund history and cannot be edited using the standard sale editor',
					409
				);
			}

			await connection.query(`
				UPDATE inventory_sales
				SET
					sale_number = ?,
					customer_id = ?,
					subtotal = ?,
					sales_tax = ?,
					total = ?,
					notes = ?
				WHERE id = ?
			`, [
				input.sale_number,
				input.customer_id,
				calculated.subtotal,
				calculated.sales_tax,
				calculated.total,
				input.notes,
				id
			]);

			await connection.query(`
				DELETE FROM inventory_sale_items
				WHERE inventory_sale_id = ?
			`, [id]);
		} else {
			const [result] = await connection.query(`
				INSERT INTO inventory_sales (
					sale_number,
					customer_id,
					subtotal,
					tax_rate,
					sales_tax,
					total,
					notes
				) VALUES (?, ?, ?, ?, ?, ?, ?)
			`, [
				input.sale_number,
				input.customer_id,
				calculated.subtotal,
				taxRate,
				calculated.sales_tax,
				calculated.total,
				input.notes
			]);

			id = result.insertId;
		}

		for (const line of calculated.lines) {
			await connection.query(`
				INSERT INTO inventory_sale_items (
					inventory_sale_id,
					inventory_id,
					subtotal,
					sales_tax,
					total,
					sort_order
				) VALUES (?, ?, ?, ?, ?, ?)
			`, [
				id,
				line.inventory_id,
				line.subtotal,
				line.sales_tax,
				line.total,
				line.sort_order
			]);
		}

		// Equipment removed from this sale can become available
		// only if no other sale references it.
		const removedIds = oldIds.filter(
			oldId => !newIdSet.has(oldId)
		);

		if (removedIds.length) {
			await connection.query(`
				UPDATE inventory i
				SET i.active = 1
				WHERE i.id IN (?)
					AND NOT EXISTS (
						SELECT 1
						FROM inventory_sale_items si
						WHERE si.inventory_id = i.id
							AND si.inventory_sale_id <> ?
					)
			`, [removedIds, id]);
		}

		// Every equipment item now on this sale is inactive.
		await connection.query(`
			UPDATE inventory
			SET active = 0, pending = 0
			WHERE id IN (?)
		`, [newIds]);

		const [saved] = await connection.query(`
			SELECT id, sale_number, token
			FROM inventory_sales
			WHERE id = ?
		`, [id]);

		await connection.commit();

		res.status(existingSale ? 200 : 201).json({
			success: true,
			...saved[0],
			...calculated,
			tax_rate: taxRate
		});
	} catch (err) {
		if (connection) {
			try {
				await connection.rollback();
			} catch (rollbackError) {
				console.error(
					'Inventory sale rollback failed:',
					rollbackError
				);
			}
		}

		handleInventorySaleError(err, res, next);
	} finally {
		if (connection) {
			await releaseExternalIdConnection(connection, numberLock);
		}
	}
}


router.post('/inventory-sales', (req, res, next) => {
	return saveInventorySale(req, res, next);
});

router.put('/inventory-sales/:id', (req, res, next) => {
	if (!validSaleId(req.params.id)) {
		return res.status(400).json({
			error: 'Invalid sale ID'
		});
	}

	return saveInventorySale(
		req,
		res,
		next,
		Number(req.params.id)
	);
});

















// ------------------------------------------------------------
// Inventory Sale Returns / Refunds
// ------------------------------------------------------------

function refundCents(value) {
	if (!/^\d{1,8}(\.\d{1,2})?$/.test(String(value))) {
		throw billingError('Invalid refund amount');
	}

	return scaledDecimal(value) / 100n;
}

function centsFromDb(value) {
	return scaledDecimal(String(value)) / 100n;
}

// Information needed to record a refund against a sale.
router.get('/inventory-sales/:id/refund-options', async (req, res, next) => {
	if (!validBillingId(req.params.id)) {
		return res.status(400).json({ error: 'Invalid sale ID' });
	}

	const id = Number(req.params.id);

	try {
		const [sales] = await db.query(`
			SELECT id, sale_number, total, tax_rate, sale_date
			FROM inventory_sales
			WHERE id = ?
		`, [id]);

		if (!sales.length) {
			return res.status(404).json({ error: 'Sale not found' });
		}

		const [items] = await db.query(`
			SELECT
				si.id,
				si.inventory_id,
				i.sku,
				i.name,
				si.subtotal,
				si.sales_tax,
				si.total,
				COALESCE(x.refunded_total, 0) AS refunded_total,
				COALESCE(x.refunded_sales_tax, 0) AS refunded_sales_tax,
				COALESCE(x.physically_returned, 0) AS physically_returned
			FROM inventory_sale_items si
			JOIN inventory i ON i.id = si.inventory_id
			LEFT JOIN (
				SELECT
					ri.inventory_sale_item_id,
					SUM(ri.refund_total) AS refunded_total,
					SUM(ri.refund_sales_tax) AS refunded_sales_tax,
					MAX(ri.physically_returned) AS physically_returned
				FROM inventory_sale_return_items ri
				JOIN inventory_sale_returns r
					ON r.id = ri.inventory_sale_return_id
				WHERE r.inventory_sale_id = ?
				GROUP BY ri.inventory_sale_item_id
			) x ON x.inventory_sale_item_id = si.id
			WHERE si.inventory_sale_id = ?
			ORDER BY si.sort_order, si.id
		`, [id, id]);

		const [history] = await db.query(`
			SELECT
				id,
				token,
				return_date,
				refund_total,
				refund_method,
				refund_reference,
				reason
			FROM inventory_sale_returns
			WHERE inventory_sale_id = ?
			ORDER BY return_date DESC, id DESC
		`, [id]);

		res.json({
			sale: sales[0],
			items,
			history
		});
	} catch (err) {
		next(err);
	}
});


// Record a return/refund.
// Financial amounts are calculated server-side.
router.post('/inventory-sales/:id/returns', async (req, res, next) => {
	if (!validBillingId(req.params.id)) {
		return res.status(400).json({ error: 'Invalid sale ID' });
	}

	const saleId = Number(req.params.id);
	const body = req.body ?? {};

	if (
		!Array.isArray(body.items) ||
		body.items.length < 1 ||
		body.items.length > 100 ||
		typeof (body.reason ?? '') !== 'string' ||
		(body.reason ?? '').length > 10000 ||
		typeof (body.notes ?? '') !== 'string' ||
		(body.notes ?? '').length > 10000 ||
		typeof (body.refund_method ?? 'Not Specified') !== 'string' ||
		(body.refund_method ?? '').length > 30 ||
		typeof (body.refund_reference ?? '') !== 'string' ||
		(body.refund_reference ?? '').length > 100
	) {
		return res.status(400).json({
			error: 'Invalid refund information'
		});
	}

	const selected = [];
	const seen = new Set();

	try {
		for (const item of body.items) {
			if (
				!item ||
				!validBillingId(item.inventory_sale_item_id) ||
				typeof item.physically_returned !== 'boolean'
			) {
				throw billingError('Invalid refund item');
			}

			const lineId = Number(item.inventory_sale_item_id);

			if (seen.has(lineId)) {
				throw billingError('Duplicate refund item');
			}

			seen.add(lineId);

			const amount = refundCents(item.refund_total);

			if (amount === 0n && !item.physically_returned) {
				throw billingError(
					'A refund line must refund money or record a physical return'
				);
			}

			selected.push({
				lineId,
				amount,
				physicallyReturned: item.physically_returned
			});
		}
	} catch (err) {
		return res.status(err.status || 400).json({
			error: err.message
		});
	}

	let connection;

	try {
		connection = await db.getConnection();
		await connection.beginTransaction();

		// Serializes refunds and sale edits for this sale.
		const [sales] = await connection.query(`
			SELECT id, tax_rate
			FROM inventory_sales
			WHERE id = ?
			FOR UPDATE
		`, [saleId]);

		if (!sales.length) {
			throw billingError('Sale not found', 404);
		}

		const [saleLines] = await connection.query(`
			SELECT id, subtotal, sales_tax, total
			FROM inventory_sale_items
			WHERE inventory_sale_id = ?
			ORDER BY id
			FOR UPDATE
		`, [saleId]);

		const lineMap = new Map(
			saleLines.map(line => [Number(line.id), line])
		);

		// Sum all previously recorded refunds for this sale.
		const [previous] = await connection.query(`
			SELECT
				ri.inventory_sale_item_id,
				SUM(ri.refund_subtotal) AS refunded_subtotal,
				SUM(ri.refund_sales_tax) AS refunded_tax,
				SUM(ri.refund_total) AS refunded_total,
				MAX(ri.physically_returned) AS physically_returned
			FROM inventory_sale_return_items ri
			JOIN inventory_sale_returns r
				ON r.id = ri.inventory_sale_return_id
			WHERE r.inventory_sale_id = ?
			GROUP BY ri.inventory_sale_item_id
		`, [saleId]);

		const previousMap = new Map(
			previous.map(row => [
				Number(row.inventory_sale_item_id),
				row
			])
		);

		const calculated = [];
		let totalSubtotal = 0n;
		let totalTax = 0n;
		let totalRefund = 0n;

		for (const input of selected) {
			const original = lineMap.get(input.lineId);

			if (!original) {
				throw billingError(
					'Equipment does not belong to this sale',
					400
				);
			}

			const prior = previousMap.get(input.lineId);

			const originalSubtotal = centsFromDb(original.subtotal);
			const originalTax = centsFromDb(original.sales_tax);
			const originalTotal = centsFromDb(original.total);

			const spentSubtotal = prior
				? centsFromDb(prior.refunded_subtotal) : 0n;
			const spentTax = prior
				? centsFromDb(prior.refunded_tax) : 0n;
			const spentTotal = prior
				? centsFromDb(prior.refunded_total) : 0n;

			const remainingSubtotal = originalSubtotal - spentSubtotal;
			const remainingTax = originalTax - spentTax;
			const remainingTotal = originalTotal - spentTotal;

			if (
				remainingSubtotal < 0n ||
				remainingTax < 0n ||
				remainingTotal < 0n ||
				remainingSubtotal + remainingTax !== remainingTotal
			) {
				throw billingError(
					'Existing refund amounts are inconsistent',
					409
				);
			}

			if (input.amount > remainingTotal) {
				throw billingError(
					'Refund exceeds the remaining equipment balance',
					409
				);
			}

			if (
				input.physicallyReturned &&
				Number(prior?.physically_returned ?? 0) === 1
			) {
				throw billingError(
					'This equipment has already been marked returned for this sale',
					409
				);
			}

			// Use the original tax rate, not today's tax rate.
			let tax = input.amount === remainingTotal
				? remainingTax
				: includedTaxCents(
					input.amount,
					sales[0].tax_rate
				);

			// Bound the rounding to the original remaining
			// subtotal and tax. Final refunds consume exactly
			// the remaining stored amounts.
			const minimumTax = input.amount > remainingSubtotal
				? input.amount - remainingSubtotal : 0n;

			const maximumTax = input.amount < remainingTax
				? input.amount : remainingTax;

			if (tax < minimumTax) tax = minimumTax;
			if (tax > maximumTax) tax = maximumTax;

			const subtotal = input.amount - tax;

			calculated.push({
				lineId: input.lineId,
				physicallyReturned: input.physicallyReturned,
				subtotal: money(subtotal),
				tax: money(tax),
				total: money(input.amount)
			});

			totalSubtotal += subtotal;
			totalTax += tax;
			totalRefund += input.amount;
		}

		const [result] = await connection.query(`
			INSERT INTO inventory_sale_returns (
				inventory_sale_id,
				refund_method,
				refund_reference,
				reason,
				notes,
				refund_subtotal,
				refund_sales_tax,
				refund_total
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`, [
			saleId,
			body.refund_method?.trim() || 'Not Specified',
			body.refund_reference?.trim() || null,
			body.reason?.trim() || null,
			body.notes?.trim() || null,
			money(totalSubtotal),
			money(totalTax),
			money(totalRefund)
		]);

		for (const line of calculated) {
			await connection.query(`
				INSERT INTO inventory_sale_return_items (
					inventory_sale_return_id,
					inventory_sale_item_id,
					physically_returned,
					refund_subtotal,
					refund_sales_tax,
					refund_total
				) VALUES (?, ?, ?, ?, ?, ?)
			`, [
				result.insertId,
				line.lineId,
				line.physicallyReturned ? 1 : 0,
				line.subtotal,
				line.tax,
				line.total
			]);
		}

		const [saved] = await connection.query(`
			SELECT id, token, return_date
			FROM inventory_sale_returns
			WHERE id = ?
		`, [result.insertId]);

		await connection.commit();

		res.status(201).json({
			success: true,
			...saved[0],
			refund_subtotal: money(totalSubtotal),
			refund_sales_tax: money(totalTax),
			refund_total: money(totalRefund)
		});
	} catch (err) {
		if (connection) {
			try {
				await connection.rollback();
			} catch (rollbackError) {
				console.error(
					'Refund rollback failed:',
					rollbackError
				);
			}
		}

		if (err.code === 'ER_DUP_ENTRY') {
			return res.status(409).json({
				error: 'Refund conflict; please retry'
			});
		}

		if (err.status) {
			return res.status(err.status).json({
				error: err.message
			});
		}

		next(err);
	} finally {
		if (connection) connection.release();
	}
});















	return router;
};
