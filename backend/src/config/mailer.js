const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Gmail SMTP transporter.
 * Uses EMAIL_USER and EMAIL_PASS (App Password) from environment.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection on startup (non-blocking)
transporter.verify((err) => {
  if (err) {
    console.warn('⚠️  Mail transporter verification failed:', err.message);
    console.warn('   Email notifications will not work until credentials are configured.');
  } else {
    console.log('📧 Mail transporter is ready');
  }
});

module.exports = transporter;
