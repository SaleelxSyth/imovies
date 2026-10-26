const request = require('supertest');
const { app } = require('../index');
const { setupTestDB } = require('./setup');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const { createShow } = require('../services/showService');
const { generateToken } = require('../services/authService');

setupTestDB();

describe('QR Payment Flow & Seat Lock Release', () => {
  let userToken, userId, showId;

  beforeEach(async () => {
    process.env.PAYMENT_MODE = 'qr';

    const user = await User.create({
      name: 'Indore Moviegoer',
      email: 'moviegoer@indore.com',
      password: 'Password@123',
      role: 'user'
    });
    userId = user._id.toString();
    userToken = generateToken(user._id, user.role);

    const movie = await Movie.create({
      title: 'Stree 2',
      description: 'Chanderi horror comedy',
      genre: ['Horror', 'Comedy'],
      language: 'Hindi',
      duration: 145,
      releaseDate: new Date('2024-08-15')
    });

    const theatre = await Theatre.create({
      name: 'PVR Orbit Mall Indore',
      city: 'Indore',
      location: 'A.B. Road, Indore',
      screens: [{ name: 'IMAX Screen', rows: 4, seatsPerRow: 6 }]
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const dateStr = futureDate.toISOString().split('T')[0];

    const show = await createShow({
      movie: movie._id,
      theatre: theatre._id,
      screenName: 'IMAX Screen',
      date: dateStr,
      startTime: '19:00',
      pricing: { regular: 200, premium: 300, recliner: 450 }
    });
    showId = show._id.toString();
  });

  it('should generate a QR payment token, allow public confirmation, and mark seats booked', async () => {
    const seats = ['A1', 'A2'];

    // 1. Lock seats
    await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seats })
      .expect(200);

    // 2. Create pending booking
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showId, seats })
      .expect(201);

    const bookingId = bookingRes.body.data._id;
    expect(bookingRes.body.data.status).toBe('pending');

    // 3. Request Payment Order in QR mode
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId })
      .expect(200);

    expect(orderRes.body.data.paymentMode).toBe('qr');
    expect(orderRes.body.data.token).toBeDefined();
    const token = orderRes.body.data.token;

    // 4. Public endpoint can retrieve payment details WITHOUT auth
    const payInfoRes = await request(app)
      .get(`/api/payments/pay-info/${token}`)
      .expect(200);

    expect(payInfoRes.body.success).toBe(true);
    expect(payInfoRes.body.status).toBe('active');
    expect(payInfoRes.body.data.movieTitle).toBe('Stree 2');
    expect(payInfoRes.body.data.seats).toEqual(seats);

    // 5. Public endpoint confirms payment (phone scan confirmation)
    const confirmRes = await request(app)
      .post(`/api/payments/public-confirm/${token}`)
      .expect(200);

    expect(confirmRes.body.success).toBe(true);

    // 6. Verify booking is now confirmed
    const updatedBooking = await Booking.findById(bookingId);
    expect(updatedBooking.status).toBe('confirmed');

    // 7. Verify seats are now booked
    const bookedSeats = await Seat.find({ show: showId, seatNumber: { $in: seats } });
    expect(bookedSeats.every((s) => s.status === 'booked')).toBe(true);

    // 8. Re-using the same token fails
    const reusedRes = await request(app)
      .get(`/api/payments/pay-info/${token}`)
      .expect(200);

    expect(reusedRes.body.status).toBe('used');
  });

  it('should expire payment and release locked seats if timed out or cancelled', async () => {
    const seats = ['B1', 'B2'];

    // 1. Lock seats
    await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seats })
      .expect(200);

    // 2. Create pending booking
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showId, seats })
      .expect(201);

    const bookingId = bookingRes.body.data._id;

    // 3. Create payment order
    await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId })
      .expect(200);

    // 4. Expire payment session
    await request(app)
      .post(`/api/payments/expire/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    // 5. Booking must be cancelled
    const updatedBooking = await Booking.findById(bookingId);
    expect(updatedBooking.status).toBe('cancelled');

    // 6. Seats must be released back to 'available'
    const releasedSeats = await Seat.find({ show: showId, seatNumber: { $in: seats } });
    expect(releasedSeats.every((s) => s.status === 'available')).toBe(true);
  });
});
