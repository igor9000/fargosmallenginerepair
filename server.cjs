const express = require("express");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();

const port = process.env.PORT || 3000;
const dist = path.join(__dirname, "dist");

// Allow JSON request bodies from your Vue contact form
app.use(express.json());

// Contact form API
app.post("/api/contact", async (req, res) => {
	const { name, email, message } = req.body;

	if (!name || !email || !message) {
		return res.status(400).json({ error: "Missing fields" });
	}

	try {
		console.log("SMTP config:", {
			host: process.env.SMTP_HOST,
			user: process.env.SMTP_USER,
			passwordConfigured: !!process.env.SMTP_PASSWORD
		});
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: 587,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD
			}
		});

		await transporter.sendMail({
			from: process.env.SMTP_USER,
			to: "adam@fargosmallenginerepair.com",
			replyTo: email,
			subject: `Website contact from ${name}`,
			text: `
Name: ${name}
Email: ${email}

${message}
			`
		});

		res.json({ success: true });
	} catch (error) {
		console.error("Contact form email error:", error);

		res.status(500).json({
			error: "Unable to send email"
		});
	}
});

// Serve the built Vue site
app.use(express.static(dist));

// Vue Router fallback
// IMPORTANT: this stays AFTER /api/contact
app.use((req, res) => {
	res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
	console.log(`Server listening on ${port}`);
});