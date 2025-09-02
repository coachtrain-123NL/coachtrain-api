// api/send-report.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { to, name, html, pdfBase64, subject } = req.body || {};
    if (!to || !html) return res.status(400).json({ error: "Missing 'to' or 'html' in body" });

    const FROM_EMAIL = process.env.FROM_EMAIL;
    if (!FROM_EMAIL) return res.status(500).json({ error: "FROM_EMAIL missing" });

    const port = Number(process.env.SMTP_PORT || 587);
    const isSMTPS = port === 465; // 465 = SMTPS, 587 = STARTTLS

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: isSMTPS,                 // true bij 465, false bij 587
      requireTLS: !isSMTPS,            // STARTTLS afdwingen bij 587
      auth: {
        user: process.env.SMTP_USER,   // volledige mailbox, bv. info@decoachtrain.nl
        pass: process.env.SMTP_PASS
      }
      // evt.: tls: { ciphers: 'TLS_AES_256_GCM_SHA384' }  // normaal niet nodig
    });

    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: `DeCoachtrain-${(name || "rapport").replace(/[^\w\-]/g, "_")}.pdf`,
        content: Buffer.from(pdfBase64, "base64"),
        contentType: "application/pdf",
        encoding: "base64",
      });
    }

    const mail = await transporter.sendMail({
      from: `De Coachtrain <${FROM_EMAIL}>`,
      to,
      bcc: process.env.BCC_EMAIL || undefined,
      subject: subject || "Je resultaten – De Coachtrain",
      html: html || `<p>Beste ${name || ""},</p><p>In de bijlage vind je je resultaten.</p><p>— De Coachtrain</p>`,
      attachments,
    });

    return res.status(200).json({ ok: true, id: mail.messageId });
  } catch (err) {
    console.error("send-report error:", err);
    return res.status(500).json({ error: "Mail send failed" });
  }
}
