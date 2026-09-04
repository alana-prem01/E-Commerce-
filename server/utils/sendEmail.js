const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromName = process.env.FROM_NAME || 'E-Commerce Jewellery';
    const fromEmail = process.env.FROM_EMAIL || 'codingspace1234@gmail.com';

    if (!smtpUser || !smtpPass) {
        console.warn('SMTP credentials (SMTP_USER / SMTP_PASS) missing in environment variables.');
    }

    // Create a transporter using Brevo (Sendinblue) SMTP relay
    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Define email options
    const mailOptions = {
        from: `"${fromName.replace(/"/g, '')}" <${fromEmail}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || `<p>${options.message ? options.message.replace(/\n/g, '<br>') : ''}</p>`
    };

    // Send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
