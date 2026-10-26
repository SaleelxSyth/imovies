const request = require('supertest');
const { app } = require('../index');
const { setupTestDB } = require('./setup');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const { createShow } = require('../services/showService');
const { generateToken } = require('../services/authService');

setupTestDB();

describe('Real-Time Seat Management & Concurrency Test', () => {
  let user1Token, user2Token, showId;

  beforeEach(async () => {
    // 1. Create two users
    const u1 = await User.create({
      name: 'Buyer One',
      email: 'buyer1@example.com',
      password: 'Password@123',
      role: 'user'
    });
    user1Token = generateToken(u1._id, u1.role);

    const u2 = await User.create({
      name: 'Buyer Two',
      email: 'buyer2@example.com',
      password: 'Password@123',
      role: 'user'
    });
    user2Token = generateToken(u2._id, u2.role);

    // 2. Create Movie & Theatre
    const movie = await Movie.create({
      title: 'Matrix Awakening',
      description: 'Sci-fi classic',
      genre: ['Sci-Fi', 'Action'],
      language: 'English',
      duration: 136,
      releaseDate: new Date('2026-05-01')
    });

    const theatre = await Theatre.create({
      name: 'Grand Cinema',
      city: 'Mumbai',
      location: 'South Mumbai',
      screens: [
        {
          name: 'Screen 1',
          rows: 4,
          seatsPerRow: 6
        }
      ]
    });

    // 3. Create Show (seats auto-generated)
    const show = await createShow({
      movie: movie._id,
      theatre: theatre._id,
      screenName: 'Screen 1',
      date: '2026-06-15',
      startTime: '19:00',
      pricing: { regular: 200, premium: 300, recliner: 500 }
    });
    showId = show._id.toString();
  });

  it('should prevent double booking: exactly ONE user succeeds when locking the same seat concurrently', async () => {
    const targetSeat = 'A1';

    // Fire two requests concurrently at the same microsecond
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/shows/${showId}/seats/lock`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ seats: [targetSeat] }),
      request(app)
        .post(`/api/shows/${showId}/seats/lock`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ seats: [targetSeat] })
    ]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    const winner = res1.status === 200 ? res1 : res2;
    const loser = res1.status === 409 ? res1 : res2;

    expect(winner.body.success).toBe(true);
    expect(loser.body.success).toBe(false);
    expect(loser.body.message).toContain('already reserved by another user');
  });

  it('should reject locking more than 8 seats in a single request', async () => {
    const nineSeats = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'B1', 'B2', 'B3'];

    const res = await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seats: nineSeats });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('cannot book more than 8 seats');
  });

  it('should allow user to unlock their own seats', async () => {
    await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seats: ['B1', 'B2'] });

    const unlockRes = await request(app)
      .post(`/api/shows/${showId}/seats/unlock`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ seats: ['B1', 'B2'] });

    expect(unlockRes.status).toBe(200);

    // Another user should now be able to lock them
    const res2 = await request(app)
      .post(`/api/shows/${showId}/seats/lock`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ seats: ['B1', 'B2'] });

    expect(res2.status).toBe(200);
  });
});
