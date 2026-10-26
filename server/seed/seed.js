const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const { createShow } = require('../services/showService');

const seedData = async (shouldExit = true) => {
  try {
    console.log('--- Starting iMovies Database Seed ---');
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    // Clean existing collections
    console.log('Clearing old collections...');
    await Promise.all([
      User.deleteMany({}),
      Movie.deleteMany({}),
      Theatre.deleteMany({}),
      Show.deleteMany({}),
      Seat.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // 1. Seed Users
    console.log('Seeding users...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@imovies.com',
      password: 'Admin@123',
      phone: '+91 9876543210',
      role: 'admin'
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'User@123',
      phone: '+91 9876543211',
      role: 'user'
    });

    const user2 = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      password: 'User@123',
      phone: '+91 9876543212',
      role: 'user'
    });

    console.log('Users created: Admin (admin@imovies.com), John, Sarah');

    // 2. Seed Movies (5 Indian films)
    console.log('Seeding movies...');
    const moviesData = [
      {
        title: 'Kalki 2898-AD',
        description: 'Set in a dystopian future, a bounty hunter discovers he is destined to be the final avatar of Vishnu — Kalki — who must rise to defeat the tyrannical Supreme Yaskin and save humanity.',
        genre: ['Sci-Fi', 'Action', 'Mythology'],
        language: 'Hindi/Telugu',
        duration: 181,
        rating: 4.7,
        ratingCount: 1,
        cast: ['Prabhas', 'Deepika Padukone', 'Amitabh Bachchan', 'Kamal Haasan'],
        director: 'Nag Ashwin',
        releaseDate: new Date('2024-06-27'),
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=Yp1Q5IFsuks',
        status: 'now_showing'
      },
      {
        title: 'Stree 2',
        description: 'The men of Chanderi are haunted once again — this time by a headless entity called "Sarkata" that abducts women. Only the enigmatic Stree can fight this new evil, aided by her unlikely band of friends.',
        genre: ['Horror', 'Comedy', 'Thriller'],
        language: 'Hindi',
        duration: 145,
        rating: 4.8,
        ratingCount: 1,
        cast: ['Rajkummar Rao', 'Shraddha Kapoor', 'Aparshakti Khurana', 'Pankaj Tripathi'],
        director: 'Amar Kaushik',
        releaseDate: new Date('2024-08-15'),
        posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=O1JMbReKIBU',
        status: 'now_showing'
      },
      {
        title: 'Singham Again',
        description: 'The fearless ACP Bajirao Singham returns for an epic face-off against Lanka — an underworld don with supernatural powers — in a crossover that unites every hero of Rohit Shetty\'s cop universe.',
        genre: ['Action', 'Drama'],
        language: 'Hindi',
        duration: 157,
        rating: 4.4,
        ratingCount: 1,
        cast: ['Ajay Devgn', 'Kareena Kapoor Khan', 'Ranveer Singh', 'Deepika Padukone', 'Akshay Kumar'],
        director: 'Rohit Shetty',
        releaseDate: new Date('2024-11-01'),
        posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=1LKFhHsKkKA',
        status: 'now_showing'
      },
      {
        title: 'Bhool Bhulaiyaa 3',
        description: 'Rooh Baba is summoned once more when a family\'s haunted ancestral haveli awakens a new demonic spirit. The madcap exorcist must outwit both the supernatural and a cunning human conspiracy.',
        genre: ['Horror', 'Comedy', 'Mystery'],
        language: 'Hindi',
        duration: 155,
        rating: 4.3,
        ratingCount: 1,
        cast: ['Kartik Aaryan', 'Vidya Balan', 'Madhuri Dixit', 'Triptii Dimri'],
        director: 'Anees Bazmee',
        releaseDate: new Date('2024-11-01'),
        posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=SWoSgUF-Z9k',
        status: 'now_showing'
      },
      {
        title: 'Pushpa: The Rule',
        description: 'Pushpa Raj\'s red-sandalwood smuggling empire faces its greatest threat when SP Bhanwar Singh Shekawat returns, more ruthless than ever, vowing to bring the outlaw king to his knees.',
        genre: ['Action', 'Drama', 'Crime'],
        language: 'Hindi/Telugu',
        duration: 183,
        rating: 4.6,
        ratingCount: 1,
        cast: ['Allu Arjun', 'Rashmika Mandanna', 'Fahadh Faasil', 'Sunil'],
        director: 'Sukumar',
        releaseDate: new Date('2024-12-05'),
        posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        trailerUrl: 'https://www.youtube.com/watch?v=Q0YIiVBnGNg',
        status: 'now_showing'
      }
    ];

    const createdMovies = await Movie.insertMany(moviesData);
    console.log(`Created ${createdMovies.length} movies.`);

    // 3. Seed Theatres (Indore)
    console.log('Seeding theatres...');
    const theatresData = [
      {
        name: 'PVR Orbit Mall Indore',
        city: 'Indore',
        location: 'Orbit Mall, A.B. Road, Vijay Nagar, Indore',
        screens: [
          {
            name: 'IMAX Screen',
            rows: 6,
            seatsPerRow: 10,
            layout: 'standard',
            seatTypes: [
              { rowPrefix: 'A', type: 'regular' },
              { rowPrefix: 'B', type: 'regular' },
              { rowPrefix: 'C', type: 'premium' },
              { rowPrefix: 'D', type: 'premium' },
              { rowPrefix: 'E', type: 'recliner' },
              { rowPrefix: 'F', type: 'recliner' }
            ]
          },
          {
            name: 'Screen 2',
            rows: 6,
            seatsPerRow: 10,
            layout: 'standard',
            seatTypes: [
              { rowPrefix: 'A', type: 'regular' },
              { rowPrefix: 'B', type: 'regular' },
              { rowPrefix: 'C', type: 'regular' },
              { rowPrefix: 'D', type: 'premium' },
              { rowPrefix: 'E', type: 'premium' },
              { rowPrefix: 'F', type: 'recliner' }
            ]
          }
        ]
      },
      {
        name: 'INOX Treasure Island Indore',
        city: 'Indore',
        location: 'Treasure Island Mall, M.G. Road, Indore',
        screens: [
          {
            name: 'Screen 1',
            rows: 6,
            seatsPerRow: 8,
            layout: 'standard',
            seatTypes: [
              { rowPrefix: 'A', type: 'regular' },
              { rowPrefix: 'B', type: 'regular' },
              { rowPrefix: 'C', type: 'premium' },
              { rowPrefix: 'D', type: 'premium' },
              { rowPrefix: 'E', type: 'recliner' },
              { rowPrefix: 'F', type: 'recliner' }
            ]
          },
          {
            name: 'Screen 2',
            rows: 6,
            seatsPerRow: 8,
            layout: 'standard',
            seatTypes: [
              { rowPrefix: 'A', type: 'regular' },
              { rowPrefix: 'B', type: 'regular' },
              { rowPrefix: 'C', type: 'regular' },
              { rowPrefix: 'D', type: 'premium' },
              { rowPrefix: 'E', type: 'premium' },
              { rowPrefix: 'F', type: 'recliner' }
            ]
          }
        ]
      }
    ];

    const createdTheatres = await Theatre.insertMany(theatresData);
    console.log(`Created ${createdTheatres.length} theatres with multiple screens.`);

    // 4. Seed Shows for the next 7 days with automatically generated seats
    console.log('Seeding shows and generating seats...');
    const nowShowingMovies = createdMovies.filter((m) => m.status === 'now_showing');
    const today = new Date();
    const timeSlots = ['10:00', '14:30', '19:00'];

    let showCount = 0;
    let movieIndex = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDateObj = new Date(today);
      showDateObj.setDate(showDateObj.getDate() + dayOffset);
      const dateString = showDateObj.toISOString().split('T')[0];

      for (const theatre of createdTheatres) {
        for (const screen of theatre.screens) {
          for (const startTime of timeSlots) {
            const movie = nowShowingMovies[movieIndex % nowShowingMovies.length];
            movieIndex++;

            await createShow({
              movie: movie._id,
              theatre: theatre._id,
              screenName: screen.name,
              date: dateString,
              startTime: startTime,
              endTime: '23:30',
              pricing: {
                regular: 200,
                premium: 280,
                recliner: 450
              },
              status: 'active'
            });
            showCount++;
          }
        }
      }
    }

    console.log(`Created ${showCount} shows across 7 days with automatic seat maps.`);

    // 5. Seed Reviews
    console.log('Seeding sample reviews...');
    await Review.create({
      user: user1._id,
      movie: createdMovies[0]._id,
      rating: 5,
      comment: 'Kalki 2898-AD is a visual spectacle! Prabhas and Amitabh Bachchan are outstanding. A must-watch in IMAX.',
      isApproved: true
    });

    await Review.create({
      user: user2._id,
      movie: createdMovies[1]._id,
      rating: 5,
      comment: 'Stree 2 is the perfect blend of horror and comedy. Shraddha and Rajkummar nail it again!',
      isApproved: true
    });

    await Review.create({
      user: user1._id,
      movie: createdMovies[2]._id,
      rating: 4,
      comment: 'Singham Again is a fun cop-universe crossover. The action sequences are brilliant.',
      isApproved: true
    });

    user1.favorites = [createdMovies[0]._id, createdMovies[1]._id];
    await user1.save();

    console.log('========================================================');
    console.log('  iMovies Database Seeded Successfully!');
    console.log('  Admin Credentials: admin@imovies.com / Admin@123');
    console.log('  User 1:            john@example.com / User@123');
    console.log('  User 2:            sarah@example.com / User@123');
    console.log('========================================================');

    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Seed process failed:', error);
    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = { seedData };
