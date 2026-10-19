
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

			if (
				primaryImages.length > 1 ||
				images.some(image =>
					!validFilename(image.url) ||
					!['image', 'video'].includes(image.media_type) ||
					typeof image.comment !== 'string' ||
					image.comment.length > 255 ||
					(image.poster_url != null &&
						image.poster_url !== '' &&
						!validFilename(image.poster_url)) ||
					(image.is_primary && image.media_type !== 'image')
				)
			) {
				return res.status(400).json({ error: 'Invalid media data' });
			}

			if (
				images.some(image => image.media_type === 'image') &&
				primaryImages.length !== 1
			) {
				return res.status(400).json({
					error: 'Select one primary image'
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
						is_primary, comment, media_type, poster_url
					) VALUES (?, ?, ?, ?, ?, ?, ?)
				`, [
					inventoryId,
					image.url,
					index + 1,
					Number(image.is_primary),
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
						poster_url, sort_order, is_primary
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

			if (
				images.some(image =>
					!validFilename(image.url) ||
					!['image', 'video'].includes(image.media_type) ||
					typeof image.comment !== 'string' ||
					image.comment.length > 255 ||
					(image.poster_url != null &&
						image.poster_url !== '' &&
						!validFilename(image.poster_url)) ||
					(image.is_primary && image.media_type !== 'image')
				) ||
				primaryImages.length > 1 ||
				(images.some(image => image.media_type === 'image') &&
					primaryImages.length !== 1)
			) {
				return res.status(400).json({ error: 'Invalid media data' });
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
						inventory_id, url, sort_order, is_primary,
						comment, media_type, poster_url
					) VALUES (?, ?, ?, ?, ?, ?, ?)
				`, [
					id,
					image.url,
					index + 1,
					Number(image.is_primary),
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

		if (typeof body.completed !== 'boolean') {
			return { error: 'Invalid completion status' };
		}

		return {
			ticket: {
				ticket_number: Number(body.ticket_number),
				customer_id: Number(body.customer_id),
				description: body.description?.trim() || null,
				diagnostic_notes: body.diagnostic_notes?.trim() || null,
				service_notes: body.service_notes?.trim() || null,
				completed: body.completed
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

			const [rows] = await db.query(
				'SELECT * FROM service_tickets WHERE id = ?',
				[id]
			);

			if (!rows.length) {
				return res.status(404).json({ error: 'Ticket not found' });
			}

			res.json(rows[0]);
		} catch (err) {
			next(err);
		}
	});

	// Create ticket.
	router.post('/service-tickets', async (req, res, next) => {
		const { ticket, error } = validateServiceTicket(req.body);

		if (error) {
			return res.status(400).json({ error });
		}

		try {
			const [result] = await db.query(`
				INSERT INTO service_tickets (
					ticket_number,
					customer_id,
					description,
					diagnostic_notes,
					service_notes,
					completed_at
				) VALUES (?, ?, ?, ?, ?, ?)
			`, [
				ticket.ticket_number,
				ticket.customer_id,
				ticket.description,
				ticket.diagnostic_notes,
				ticket.service_notes,
				ticket.completed ? new Date() : null
			]);

			res.status(201).json({ id: result.insertId });
		} catch (err) {
			handleServiceTicketError(err, res, next);
		}
	});

	// Update ticket.
	router.put('/service-tickets/:id', async (req, res, next) => {
		const id = Number(req.params.id);

		if (!Number.isSafeInteger(id) || id < 1) {
			return res.status(400).json({ error: 'Invalid ticket ID' });
		}

		const { ticket, error } = validateServiceTicket(req.body);

		if (error) {
			return res.status(400).json({ error });
		}

		try {
			const [result] = await db.query(`
				UPDATE service_tickets
				SET
					ticket_number = ?,
					customer_id = ?,
					description = ?,
					diagnostic_notes = ?,
					service_notes = ?,
					completed_at = CASE
						WHEN ? = 0 THEN NULL
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
				Number(ticket.completed),
				id
			]);

			if (!result.affectedRows) {
				return res.status(404).json({ error: 'Ticket not found' });
			}

			res.json({ success: true, id });
		} catch (err) {
			handleServiceTicketError(err, res, next);
		}
	});

















	return router;
};
