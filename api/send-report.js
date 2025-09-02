// api/send-report.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // CORS (optioneel: pas origins aan jouw domein)
  const origin = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, name, html, pdfBase64, subject } = req.body || {};
    if (!to || !html) {
      return res.status(400).json({ error: "Missing 'to' or 'html' in body" });
    }

    const FROM_EMAIL = process.env.FROM_EMAIL;
    if (!FROM_EMAIL) {
      return res.status(500).json({ error: "FROM_EMAIL missing" });
    }
    
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: Number(process.env.SMTP_PORT || 465),
     secure: String(process.env.SMTP_PORT || "465") === "465", 
     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
    
    const attachments = [];
    if (pdfBase64) {
      attachments.push({
        filename: `DeCoachtrain-${(name || "rapport")
          .replace(/[^\w\-]/g, "_")}.pdf`,
        content: Buffer.from(pdfBase64, "base64"),
        contentType: "application/pdf",
        encoding: "base64",
      });
    }

    const mail = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      bcc: process.env.BCC_EMAIL || undefined,
      replyTo: FROM_EMAIL,
      subject: subject || "Je resultaten – De Coachtrain",
      html:
        html ||
        `<p>Beste ${name || ""},</p>
         <p>In de bijlage vind je je resultaten (Dynamische Driehoek, Spiral, conclusie & acties).</p>
         <p>— De Coachtrain</p>`,
      attachments,
    });

    return res.status(200).json({ ok: true, id: mail.messageId });
  } catch (err) {
    console.error("send-report error:", err);
    return res.status(500).json({ error: "Mail send failed" });
  }
}
