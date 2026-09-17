const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Hostinger SMTP Transporter Yapılandırması
// Canlı ortamda (Production) kimlik bilgileri ortam değişkenleri (Cloud Secrets / process.env) üzerinden alınır.
const smtpUser = process.env.SMTP_USER || 'info@odivon.com';
const smtpPass = process.env.SMTP_PASS || '123654Dg$#';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // SSL port 465
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

/**
 * Firestore 'mail' koleksiyonuna yeni bir belge eklendiğinde tetiklenir.
 * Hostinger SMTP sunucusu üzerinden e-postayı alıcıya ulaştırır ve durumu 'sent' olarak günceller.
 */
exports.sendMailOnFirestore = onDocumentCreated('mail/{docId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const mailData = snap.data();
  if (mailData.status && mailData.status !== 'pending') return;

  try {
    const to = Array.isArray(mailData.to) ? mailData.to.join(', ') : mailData.to;
    const subject = mailData.message?.subject || mailData.subject || 'Odivon FARM Bildirimi';
    const html = mailData.message?.html || mailData.html;
    const text = mailData.message?.text || mailData.text;

    const info = await transporter.sendMail({
      from: mailData.from || '"Odivon Çiftlik Yönetimi" <info@odivon.com>',
      to,
      replyTo: mailData.replyTo || 'info@odivon.com',
      subject,
      text,
      html,
    });

    await snap.ref.update({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      messageId: info.messageId,
    });
    console.log(`[SMTP] E-posta başarıyla gönderildi: ${to} (MessageId: ${info.messageId})`);
  } catch (err) {
    console.error('[SMTP Error] E-posta gönderimi başarısız oldu:', err);
    await snap.ref.update({
      status: 'error',
      error: err.message || String(err),
      failedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});
