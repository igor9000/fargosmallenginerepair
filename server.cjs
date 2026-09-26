const express = require("express");
const path = require("path");

const app = express();

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
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      error: "Missing required fields"
    });
  }

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

app.use(express.static(dist));

app.use((req, res) => {
  res.sendFile(path.join(dist, "index.html"));
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on ${port}`);
});