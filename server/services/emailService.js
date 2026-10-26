const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT || '587', 10),
      secure: EMAIL_PORT === '465',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
  }
  return transporter;
};

const sendBookingEmail = async ({ toEmail, userName, booking, show, movie, theatre }) => {
  const t = getTransporter();

  const formattedDate = show.date;
  const formattedTime = show.startTime;
  const seatList = booking.seats.join(', ');

  const subject = `Your iMovies Ticket Confirmation - ${booking.bookingCode}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
      <h1 style="color: #f59e0b; margin-bottom: 4px;">🎬 iMovies Booking Confirmed!</h1>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Thank you for booking with iMovies. Here is your digital cinema ticket:</p>
      
      <div style="background: #1e293b; padding: 18px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b;">
        <h2 style="margin-top: 0; color: #fff;">${movie.title}</h2>
        <p style="margin: 4px 0;"><strong>Booking Code:</strong> <span style="color: #38bdf8; font-weight: bold; font-size: 16px;">${booking.bookingCode}</span></p>
        <p style="margin: 4px 0;"><strong>Theatre:</strong> ${theatre.name}, ${theatre.city} (${show.screenName})</p>
        <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${formattedDate} at ${formattedTime}</p>
        <p style="margin: 4px 0;"><strong>Seats:</strong> ${seatList}</p>
        <p style="margin: 4px 0;"><strong>Total Paid:</strong> ₹${booking.totalAmount}</p>
      </div>

      <p style="color: #94a3b8; font-size: 13px;">Please arrive 15 minutes before showtime and present your booking code or QR code at the entrance.</p>
      <p style="color: #cbd5e1; margin-top: 24px;">Enjoy the movie!<br/><strong>The iMovies Team</strong></p>
    </div>
  `;

  if (t) {
    try {
      await t.sendMail({
        from: process.env.EMAIL_FROM || 'iMovies Cinema <tickets@imovies.com>',
        to: toEmail,
        subject,
        html: htmlContent
      });
      logger.info(`[Email Sent] Ticket confirmation sent to ${toEmail} for booking ${booking.bookingCode}`);
      return true;
    } catch (err) {
      logger.warn(`[Email Failed] Failed sending ticket email: ${err.message}. Ticket details logged.`);
    }
  }

  logger.info(`[Email Service Simulation] To: ${toEmail} | Subject: ${subject} | Booking: ${booking.bookingCode} | Seats: ${seatList}`);
  return false;
};

const sendCancellationEmail = async ({ toEmail, userName, booking, refundAmount }) => {
  const t = getTransporter();
  const subject = `iMovies Booking Cancelled - ${booking.bookingCode}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
      <h2 style="color: #ef4444;">Booking Cancellation Notice</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Your booking <strong>${booking.bookingCode}</strong> has been cancelled.</p>
      <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
      <p style="color: #94a3b8; font-size: 13px;">Refunds are processed back to your original payment method within 3-5 business days.</p>
      <p style="color: #cbd5e1; margin-top: 24px;">Regards,<br/><strong>The iMovies Team</strong></p>
    </div>
  `;

  if (t) {
    try {
      await t.sendMail({
        from: process.env.EMAIL_FROM || 'iMovies Cinema <tickets@imovies.com>',
        to: toEmail,
        subject,
        html: htmlContent
      });
      logger.info(`[Email Sent] Cancellation notice sent to ${toEmail}`);
      return true;
    } catch (err) {
      logger.warn(`[Email Failed] Failed sending cancellation email: ${err.message}`);
    }
  }

  logger.info(`[Email Service Simulation] Cancellation To: ${toEmail} | Booking: ${booking.bookingCode} | Refund: ₹${refundAmount}`);
  return false;
};

module.exports = {
  sendBookingEmail,
  sendCancellationEmail
};
