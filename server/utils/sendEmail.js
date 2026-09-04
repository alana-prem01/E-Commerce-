const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromName = process.env.FROM_NAME || 'E-Commerce Jewellery';
    const fromEmail = process.env.FROM_EMAIL || 'codingspace1234@gmail.com';

    if (!smtpUser || !smtpPass) {
        console.warn('[sendEmail] WARNING: SMTP_USER or SMTP_PASS environment variable is missing.');
    }

    // 1. Try Brevo REST API if BREVO_API_KEY is defined
    if (process.env.BREVO_API_KEY) {
        try {
            const fetchModule = await import('node-fetch');
            const fetchFn = fetchModule.default || globalThis.fetch;
            const res = await fetchFn('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: fromName, email: fromEmail },
                    to: [{ email: options.email }],
                    subject: options.subject,
                    textContent: options.message,
                    htmlContent: options.html || `<p>${options.message ? options.message.replace(/\n/g, '<br>') : ''}</p>`
                })
            });
            if (res.ok) {
                console.log(`[sendEmail] Email sent via Brevo REST API to ${options.email}`);
                return;
            }
        } catch (e) {
            console.warn('[sendEmail] REST API failed, falling back to SMTP:', e.message);
        }
    }

    // 2. Nodemailer SMTP Transporter (Supports Port 465 SSL & 587 STARTTLS)
    const createTransporter = (port, secure) => nodemailer.createTransport({
        host: smtpHost,
        port: port,
        secure: secure,
        auth: { user: smtpUser, pass: smtpPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
    });

    const mailData = {
        from: `"${fromName.replace(/"/g, '')}" <${fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `<p>${options.message ? options.message.replace(/\n/g, '<br>') : ''}</p>`
    };

    try {
        // Try Port 465 (SSL - Serverless friendly)
        const transporter465 = createTransporter(465, true);
        await transporter465.sendMail(mailData);
        console.log(`[sendEmail] Email sent via SMTP Port 465 to ${options.email}`);
    } catch (err465) {
        console.warn('[sendEmail] Port 465 failed, trying Port 587:', err465.message);
        // Fallback Port 587 (TLS)
        const transporter587 = createTransporter(587, false);
        await transporter587.sendMail(mailData);
        console.log(`[sendEmail] Email sent via SMTP Port 587 to ${options.email}`);
    }
};

module.exports = sendEmail;
