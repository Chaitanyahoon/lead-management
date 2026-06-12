const transporter = require('../config/mailer');

/**
 * Send an email notifying an agent that a new lead was assigned.
 * Fire-and-forget — failures are logged but never thrown.
 *
 * @param {{ agentEmail: string, agentName: string, leadName: string, leadId: string }} params
 */
const sendLeadAssignmentEmail = async ({ agentEmail, agentName, leadName, leadId }) => {
  try {
    const subject = `New Lead Assigned: ${leadName}`;

    const text = [
      `Hi ${agentName},`,
      '',
      `A new lead has been assigned to you.`,
      '',
      `Lead Name: ${leadName}`,
      `Lead ID: ${leadId}`,
      '',
      'Log in to the Lead Management System to view details.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a73e8; margin-top: 0;">New Lead Assigned to You</h2>
        <p>Hi <strong>${agentName}</strong>,</p>
        <p>A new lead has been assigned to you.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Lead Name</td>
            <td style="padding: 8px 0; font-weight: bold;">${leadName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Lead ID</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 13px;">${leadId}</td>
          </tr>
        </table>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
        <p style="color: #888; font-size: 13px;">Log in to the Lead Management System to view details.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: agentEmail,
      subject,
      text,
      html,
    });

    console.log(`📧 Lead assignment email sent to ${agentEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send lead assignment email to ${agentEmail}:`, err.message);
  }
};

/**
 * Send a welcome email after user registration.
 * Fire-and-forget — failures are logged but never thrown.
 *
 * @param {{ userEmail: string, userName: string, role: string }} params
 */
const sendWelcomeEmail = async ({ userEmail, userName, role }) => {
  try {
    const subject = 'Welcome to Lead Management System';

    const text = [
      `Hi ${userName},`,
      '',
      'Your account has been created successfully.',
      `Role: ${role}`,
      '',
      'Login URL: http://localhost:3000/login',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #1a73e8; margin-top: 0;">Welcome to Lead Management System</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your account has been created successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #666;">Role</td>
            <td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${role}</td>
          </tr>
        </table>
        <a href="http://localhost:3000/login"
           style="display: inline-block; padding: 10px 24px; background: #1a73e8; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 8px;">
          Log In
        </a>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0 16px;" />
        <p style="color: #888; font-size: 13px;">If you did not create this account, please ignore this email.</p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject,
      text,
      html,
    });

    console.log(`📧 Welcome email sent to ${userEmail}`);
  } catch (err) {
    console.error(`❌ Failed to send welcome email to ${userEmail}:`, err.message);
  }
};

module.exports = { sendLeadAssignmentEmail, sendWelcomeEmail };
