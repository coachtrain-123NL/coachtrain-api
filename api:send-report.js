{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import sgMail from '@sendgrid/mail';\
sgMail.setApiKey(process.env.SENDGRID_API_KEY);\
\
export default async function handler(req, res) \{\
  // --- CORS: alleen jouw site toestaan ---\
  const origin = req.headers.origin;\
  const allowed = ['https://www.decoachtrain.nl', 'https://decoachtrain.nl'];\
  if (allowed.includes(origin)) \{\
    res.setHeader('Access-Control-Allow-Origin', origin);\
    res.setHeader('Vary', 'Origin');\
  \}\
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');\
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');\
\
  if (req.method === 'OPTIONS') \{\
    return res.status(200).end();\
  \}\
  if (req.method !== 'POST') \{\
    return res.status(405).json(\{ error: 'Method not allowed' \});\
  \}\
\
  try \{\
    const \{ to, name, pdfBase64 \} = req.body || \{\};\
    if (!to || !pdfBase64) \{\
      return res.status(400).json(\{ error: 'Missing "to" or "pdfBase64"' \});\
    \}\
\
    const from = process.env.FROM_EMAIL;\
    if (!from) return res.status(500).json(\{ error: 'FROM_EMAIL missing' \});\
\
    const base64 = pdfBase64.replace(/^data:application\\/pdf;base64,/, '');\
\
    const msg = \{\
      to,\
      from,\
      subject: 'Je resultaten \'96 De Coachtrain',\
      text: `Beste $\{name || 'deelnemer'\}, in de bijlage vind je jouw resultaten in PDF.`,\
      html: `<p>Beste $\{name || 'deelnemer'\},</p>\
             <p>In de bijlage vind je jouw resultaten (Driehoek, Spiral, conclusies & acties).</p>\
             <p>\'97 De Coachtrain</p>`,\
      attachments: [\{\
        content: base64,\
        filename: `Resultaten-DeCoachtrain-$\{(name || 'rapport').replace(/[^\\w-]+/g,'_')\}.pdf`,\
        type: 'application/pdf',\
        disposition: 'attachment'\
      \}]\
    \};\
\
    if (process.env.BCC_EMAIL) msg.bcc = process.env.BCC_EMAIL;\
    if (process.env.REPLY_TO) msg.replyTo = process.env.REPLY_TO;\
\
    await sgMail.send(msg);\
    return res.status(200).json(\{ ok: true \});\
  \} catch (err) \{\
    console.error('send-report error', err);\
    return res.status(500).json(\{ error: 'Mail send failed' \});\
  \}\
\}\
}