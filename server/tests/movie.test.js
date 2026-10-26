const request = require('supertest');
const { app } = require('../index');
const { setupTestDB } = require('./setup');
const User = require('../models/User');
const Movie = require('../models/Movie');
const jwt = require('jsonwebtoken');

setupTestDB();

describe('Movie Catalog & Filtering API', () => {
  let adminToken;

  beforeEach(async () => {
    const admin = await User.create({
      name: 'Admin Test',
      email: 'admin@test.com',
      password: 'AdminPassword123',
      role: 'admin'
    });

    adminToken = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || 'test_jwt_secret_key_12345');

    await Movie.insertMany([
      {
        title: 'Cyberpunk Odyssey',
        description: 'Futuristic sci-fi film',
        genre: ['Sci-Fi', 'Action'],
        language: 'English',
        duration: 140,
        rating: 4.8,
        ratingCount: 5,
        cast: ['Actor One', 'Actor Two'],
        director: 'Director A',
        releaseDate: new Date('2026-05-01'),
        status: 'now_showing'
      },
      {
        title: 'Tokyo Stories',
        description: 'Drama set in Japan',
        genre: ['Drama'],
        language: 'Japanese',
        duration: 110,
        rating: 4.2,
        ratingCount: 3,
        cast: ['Actor Three'],
        director: 'Director B',
        releaseDate: new Date('2026-06-01'),
        status: 'now_showing'
      },
      {
        title: 'Upcoming Marvels',
        description: 'Future superhero release',
        genre: ['Action', 'Adventure'],
        language: 'English',
        duration: 150,
        rating: 0,
        ratingCount: 0,
        releaseDate: new Date('2026-12-01'),
        status: 'upcoming'
      }
    ]);
  });

  it('should list all movies with pagination', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.pagination.total).toBe(3);
  });

  it('should filter movies by genre', async () => {
    const res = await request(app).get('/api/movies?genre=Sci-Fi');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Cyberpunk Odyssey');
  });

  it('should filter movies by language', async () => {
    const res = await request(app).get('/api/movies?language=Japanese');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Tokyo Stories');
  });

  it('should search movies by query keyword', async () => {
    const res = await request(app).get('/api/movies?search=Odyssey');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Cyberpunk Odyssey');
  });

  it('should allow admin to create a new movie', async () => {
    const newMovie = {
      title: 'Neon Nights',
      description: 'A neo-noir thriller',
      genre: ['Thriller', 'Crime'],
      language: 'English',
      duration: 125,
      releaseDate: '2026-07-15',
      status: 'now_showing'
    };

    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newMovie);

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Neon Nights');
  });
});
