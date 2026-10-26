const request = require('supertest');
const { app } = require('../index');
const { setupTestDB } = require('./setup');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Seat = require('../models/Seat');
const { createShow } = require('../services/showService');
const { generateToken } = require('../services/authService');

setupTestDB();

describe('Booking Lifecycle & Payment Verification Flow', () => {
  let userToken, userId, showId;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Cinema Fan',
      email: 'fan@example.com',
      password: 'Password@123',
      role: 'user'
    });
    userId = user._id.toString();
    userToken = generateToken(user._id, user.role);

    const movie = await Movie.create({
      title: 'Interstellar Voyage',
      description: 'Cosmic journey',
      genre: ['Sci-Fi'],
      language: 'English',
      duration: 160,
      releaseDate: new Date('2026-05-01')
    });

    const theatre = await Theatre.create({
      name: 'Luxe Multiplex',
      city: 'Bengaluru',
      location: 'Koramangala',
      screens: [{ name: 'Audi 1', rows: 4, seatsPerRow: 6 }]
    });

    // Show date 3 days in future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];

    const show = await createShow({
      movie: movie._id,
      theatre: theatre._id,
      screenName: 'Audi 1',
      date: dateStr,
      startTime: '20:00',
      pricing: { regular: 200, premium: 300, recliner: 450 }
    });
    showId = show._id.toString();
  });

  it('should complete full booking flow: lock seats -> create pending booking -> pay -> confirm seats booked', async () => {
    const chosenSeats = ['A1', 'A2'];

    // 1. Lock seats
    const lockRes = await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ seats: chosenSeats });

    expect(lockRes.status).toBe(200);

    // 2. Create pending booking
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ showId, seats: chosenSeats });

    expect(bookingRes.status).toBe(201);
    expect(bookingRes.body.data.bookingCode).toBeDefined();
    expect(bookingRes.body.data.status).toBe('pending');
    const bookingId = bookingRes.body.data._id;

    // 3. Create payment order
    const orderRes = await request(app)
      .post('/api/payments/create-order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingId });

    expect(orderRes.status).toBe(200);
    const orderId = orderRes.body.data.id;

    // 4. Verify payment (in mock mode)
    const verifyRes = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderId,
        paymentId: 'pay_test_12345',
        signature: 'mock_sig',
        bookingId
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.booking.status).toBe('confirmed');

    // 5. Verify database seat statuses are now 'booked'
    const bookedSeats = await Seat.find({
      show: showId,
      seatNumber: { $in: chosenSeats }
    });
    expect(bookedSeats.length).toBe(2);
    bookedSeats.forEach((seat) => {
      expect(seat.status).toBe('booked');
    });

    // 6. Retrieve User's bookings
    const myBookingsRes = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(myBookingsRes.status).toBe(200);
    expect(myBookingsRes.body.data.length).toBe(1);
    expect(myBookingsRes.body.data[0]._id).toBe(bookingId);

    // 7. Cancel booking (eligible for 100% refund since show is 3 days ahead)
    const cancelRes = await request(app)
      .put(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Change of plans' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.refundEligible).toBe(true);

    // 8. Verify seats are released back to 'available'
    const releasedSeats = await Seat.find({
      show: showId,
      seatNumber: { $in: chosenSeats }
    });
    releasedSeats.forEach((seat) => {
      expect(seat.status).toBe('available');
    });
  });
});
