const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");

const app = express();

const db = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	waitForConnections: true,
	connectionLimit: 10
});

const port = process.env.PORT || 3000;
const dist = path.join(__dirname, "dist");

app.use(express.json());

async function sendEmail({ to, replyTo, subject, text }) {
  const response = await fetch(
	"http://127.0.0.1:2525/api/email/send",
	{
	  method: "POST",
	  headers: {
		"content-type": "application/json"
	  },
	  body: JSON.stringify({
		to: [to],
		replyTo,
		subject,
		text
	  }),
	  signal: AbortSignal.timeout(30000)
	}
  );

  let result;

  try {
	result = await response.json();
  } catch {
	throw new Error(`Email gateway returned HTTP ${response.status}`);
  }

  if (!response.ok || !result.success) {
	throw new Error(result.error || `Email gateway returned HTTP ${response.status}`);
  }

  return result;
}

app.post("/api/contact", async (req, res) => {
  const { name, email, message, productName, productType, productSku } = req.body;

  if (!name || !email || !message) {
	return res.status(400).json({
	  error: "Missing required fields"
	});
  }

  const productInfo = productName && productType && productSku ? `\nProduct Name: ${productName}\nProduct SKU: ${productSku}\nProduct Type: ${productType}\n` : '';

  const recipient = process.env.CONTACT_FORM_RECIPIENT_EMAIL;

  if (!recipient) {
	console.error("CONTACT_FORM_RECIPIENT_EMAIL is not configured");

	return res.status(500).json({
	  error: "Email recipient not configured"
	});
  }

  try {
	const result = await sendEmail({
	  to: recipient,
	  replyTo: email,
	  subject: `Website contact from ${name}`,
	  text: `Name: ${name}
Email: ${email}
${productInfo}
${message}`
	});

	console.log("Contact form email sent:", result.messageId);

	res.json({
	  success: true
	});
  } catch (error) {
	console.error("Contact form email error:", error);

	res.status(500).json({
	  error: "Unable to send email"
	});
  }
});




// inventory list
app.get('/api/inventory', async (req, res) => {
	try {
		const { featured } = req.query;

		let whereClause = 'WHERE i.active = 1';
		let orderClause = 'ORDER BY it.name, i.price DESC';
		let limitClause = '';

		if (featured === 'true') {
			whereClause += ' AND i.featured = 1';
			orderClause = 'ORDER BY RANDOM()';
			limitClause = 'LIMIT 3';
		}

		const [rows] = await db.query(`
			SELECT
				i.id,
				i.sku,
				i.name,
				i.description,
				i.price,
				it.id AS type_id,
				it.name AS type_name,
				it.description AS type_description,
				imgs.url AS image_url,
				b.name AS brand_name,
				b.logo AS brand_logo
			FROM inventory i
			INNER JOIN inventory_types it
				ON i.inventory_type_id = it.id
			LEFT JOIN inventory_images imgs
				ON imgs.inventory_id = i.id
				AND imgs.is_primary = 1
			LEFT JOIN brands b
				ON i.brand_id = b.id
			${whereClause}
			${orderClause}
			${limitClause}
		`);

		res.json(rows);
	} catch (error) {
		console.error('Inventory database error:', error);
		res.status(500).json({ error: 'Unable to load inventory' });
	}
});


// inventory item details
app.get('/api/inventory/:sku', async (req, res) => {
	try {
		const { sku } = req.params;

		const [rows] = await db.query(`
			SELECT
				i.id,
				i.sku,
				i.name,
				i.description,
				i.price,
				it.id AS type_id,
				it.singular_name AS type_name,
				it.description AS type_description,
				b.name AS brand_name,
				b.logo AS brand_logo
			FROM inventory i
			INNER JOIN inventory_types it
				ON i.inventory_type_id = it.id
			LEFT JOIN brands b
				ON i.brand_id = b.id
			WHERE i.sku = ?
				AND i.active = 1
			LIMIT 1
		`, [sku]);

		if (rows.length === 0) {
			return res.status(404).json({
				error: 'Inventory item not found'
			});
		}

		const item = rows[0];

		const [images] = await db.query(`
			SELECT
				id,
				url,
				sort_order,
				is_primary
			FROM inventory_images
			WHERE inventory_id = ?
			ORDER BY sort_order
		`, [item.id]);

		item.images = images;

		res.json(item);

	} catch (error) {
		console.error('Inventory item database error:', error);

		res.status(500).json({
			error: 'Unable to load inventory item'
		});
	}
});






app.use(express.static(dist));

app.use((req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on ${port}`);
});