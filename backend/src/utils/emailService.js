import nodemailer from "nodemailer";

// Create a reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a confirmation email with a 6-digit code to the user.
 * @param {string} to - The recipient email address.
 * @param {string} code - The 6-digit confirmation code.
 */
export const sendConfirmationEmail = async (to, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: "Confirm your Degree Plan Assistant account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1E88E5;">Degree Plan Assistant</h2>
        <p>Hello 👋,</p>
        <p>Thank you for signing up! To complete your registration, please use the confirmation code below:</p>
        <h1 style="color: #1E88E5; letter-spacing: 2px;">${code}</h1>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn’t request this, you can safely ignore this message.</p>
        <hr />
        <p style="font-size: 12px; color: #888;">This email was sent automatically by the Degree Plan Assistant System.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Confirmation email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error.message);
    throw new Error("Failed to send confirmation email");
  }
};
