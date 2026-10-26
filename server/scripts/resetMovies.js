const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { connectDB } = require('../config/db');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { createShow } = require('../services/showService');

const placeholderPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';

const moviesCatalogue = [
  // NOW SHOWING (10 movies)
  {
    title: 'Drishyam 3 (a.k.a. Drishyam: The Conclusion)',
    description: 'Vijay Salgaonkar faces his ultimate test as unresolved past events resurface, leading to a high-stakes legal and psychological struggle to protect his family.',
    genre: ['Crime', 'Thriller'],
    language: 'Hindi',
    duration: 155,
    rating: 4.8,
    ratingCount: 1,
    cast: ['Ajay Devgn', 'Tabu', 'Shriya Saran', 'Jaideep Ahlawat'],
    director: 'Abhishek Pathak',
    releaseDate: new Date('2026-10-02'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Udta Teer',
    description: 'An unpredictable series of humorous misunderstandings and eccentric choices turns an everyday man\'s peaceful routine completely upside down.',
    genre: ['Comedy', 'Drama'],
    language: 'Hindi',
    duration: 135,
    rating: 4.4,
    ratingCount: 1,
    cast: ['Ayushmann Khurrana'],
    director: 'TBA',
    releaseDate: new Date('2026-10-09'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Prahaar: The Untold Story of Ujjwal Nikam',
    description: 'A compelling courtroom drama tracing the landmark trials and tireless dedication of legendary special public prosecutor Ujjwal Nikam.',
    genre: ['Drama', 'Biopic'],
    language: 'Hindi',
    duration: 150,
    rating: 4.7,
    ratingCount: 1,
    cast: ['Rajkummar Rao'],
    director: 'TBA',
    releaseDate: new Date('2026-10-16'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Nayyi Navelli',
    description: 'A young woman navigates fresh beginnings, contemporary familial dynamics, and self-discovery in urban India.',
    genre: ['Drama', 'Family'],
    language: 'Hindi',
    duration: 130,
    rating: 4.3,
    ratingCount: 1,
    cast: ['Yami Gautam'],
    director: 'TBA',
    releaseDate: new Date('2026-10-16'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Tu Hai Meri Kiran',
    description: 'A heartfelt romantic musical about serendipitous encounters, longing, and enduring devotion across changing seasons.',
    genre: ['Romance'],
    language: 'Hindi',
    duration: 138,
    rating: 4.2,
    ratingCount: 1,
    cast: ['TBA'],
    director: 'TBA',
    releaseDate: new Date('2026-10-23'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Dongri: Gangster\'s Paradise',
    description: 'A gritty underworld chronicle capturing the territorial rivalries and tactical law enforcement maneuvers on the streets of Dongri.',
    genre: ['Crime', 'Action'],
    language: 'Hindi',
    duration: 146,
    rating: 4.5,
    ratingCount: 1,
    cast: ['TBA'],
    director: 'TBA',
    releaseDate: new Date('2026-10-09'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Jailer 2',
    description: 'Retired jailer Tiger Muthuvel Pandian returns to confront an international crime syndicate threatening peace and justice.',
    genre: ['Action'],
    language: 'Tamil',
    duration: 165,
    rating: 4.9,
    ratingCount: 1,
    cast: ['Rajinikanth'],
    director: 'Nelson Dilipkumar',
    releaseDate: new Date('2026-10-15'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Vishwambhara',
    description: 'A mythological warrior journeys across celestial realms to protect cosmic balance against encroaching darkness.',
    genre: ['Fantasy', 'Action'],
    language: 'Telugu',
    duration: 162,
    rating: 4.6,
    ratingCount: 1,
    cast: ['TBA'],
    director: 'TBA',
    releaseDate: new Date('2026-10-16'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Bail',
    description: 'A resolute protector takes a courageous stand against systemic injustice and powerful adversaries to defend the innocent.',
    genre: ['Action', 'Drama'],
    language: 'Kannada',
    duration: 144,
    rating: 4.6,
    ratingCount: 1,
    cast: ['Shiva Rajkumar', 'Sanjana Anand', 'Dheekshith Shetty'],
    director: 'TBA',
    releaseDate: new Date('2026-10-02'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },
  {
    title: 'Clayface',
    description: 'A tragic former actor undergoes a grotesque transformation into a shape-shifting entity in a dark, atmospheric psychological thriller.',
    genre: ['Superhero', 'Horror'],
    language: 'English',
    duration: 128,
    rating: 4.4,
    ratingCount: 1,
    cast: ['TBA'],
    director: 'TBA',
    releaseDate: new Date('2026-10-23'),
    posterUrl: placeholderPoster,
    status: 'now_showing'
  },

  // COMING SOON (5 movies)
  {
    title: 'Ramayana: Part One',
    description: 'A monumental cinematic retelling of the timeless epic chronicling Lord Rama\'s virtues, devotion, and supreme trial of righteousness.',
    genre: ['Mythology', 'Epic'],
    language: 'Hindi',
    duration: 180,
    rating: 0,
    ratingCount: 0,
    cast: ['Ranbir Kapoor', 'Sai Pallavi', 'Yash'],
    director: 'Nitesh Tiwari',
    releaseDate: new Date('2026-11-08'),
    posterUrl: placeholderPoster,
    status: 'upcoming'
  },
  {
    title: 'Fauzi',
    description: 'A period military action spectacle celebrating the unwavering courage, sacrifice, and loyalty of an elite soldier.',
    genre: ['Action'],
    language: 'Hindi/Telugu',
    duration: 160,
    rating: 0,
    ratingCount: 0,
    cast: ['Prabhas'],
    director: 'TBA',
    releaseDate: new Date('2026-12-03'),
    posterUrl: placeholderPoster,
    status: 'upcoming'
  },
  {
    title: 'Ranger',
    description: 'An adventurous expedition into deep wildlife territory where dedicated forest defenders protect nature from illicit exploitation.',
    genre: ['Action-Adventure'],
    language: 'Hindi',
    duration: 152,
    rating: 0,
    ratingCount: 0,
    cast: ['Ajay Devgn', 'Sanjay Dutt', 'Tamannaah Bhatia'],
    director: 'TBA',
    releaseDate: new Date('2026-12-04'),
    posterUrl: placeholderPoster,
    status: 'upcoming'
  },
  {
    title: 'King',
    description: 'A high-octane action saga following a battle-hardened mentor guiding a new generation through treacherous underworld corridors.',
    genre: ['Action'],
    language: 'Hindi',
    duration: 158,
    rating: 0,
    ratingCount: 0,
    cast: ['Shah Rukh Khan'],
    director: 'TBA',
    releaseDate: new Date('2026-12-24'),
    posterUrl: placeholderPoster,
    status: 'upcoming'
  },
  {
    title: 'Mahavatar',
    description: 'An epic historical narrative chronicling the formidable legend and martial prowess of warrior sage Chiranjeevi Parashurama.',
    genre: ['Mythological Action'],
    language: 'Hindi',
    duration: 170,
    rating: 0,
    ratingCount: 0,
    cast: ['Vicky Kaushal'],
    director: 'TBA',
    releaseDate: new Date('2026-12-25'),
    posterUrl: placeholderPoster,
    status: 'upcoming'
  }
];

const resetMovies = async () => {
  try {
    console.log('=== Starting iMovies Movie Catalogue Reset ===');

    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    // 1. Delete ALL existing movies, shows, seats, bookings and payments
    // (Do NOT delete users or theatres)
    console.log('Clearing old movies, shows, seats, bookings, and payments...');
    await Promise.all([
      Movie.deleteMany({}),
      Show.deleteMany({}),
      Seat.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({})
    ]);

    // 2. Insert the 15 movies
    console.log('Inserting 15 real movie titles (10 now showing, 5 upcoming)...');
    const createdMovies = await Movie.insertMany(moviesCatalogue);
    console.log(`Successfully added ${createdMovies.length} movies to the database.`);

    const nowShowingMovies = createdMovies.filter((m) => m.status === 'now_showing');

    // 3. Find existing theatres
    const theatres = await Theatre.find();
    console.log(`Found ${theatres.length} existing theatre(s) across cities.`);

    if (theatres.length === 0) {
      console.warn('No theatres found in database. Please ensure theatres exist to create shows.');
    }

    // 4. Create shows for next 7 days across ALL existing theatres and screens
    // 2-3 shows per day per screen, rotating across now_showing movies
    console.log('Generating shows and seat maps for the next 7 days for now_showing movies...');
    const today = new Date();
    const timeSlots = ['10:30', '15:15', '20:00']; // 3 shows per day per screen
    let showCount = 0;
    let movieRotationIndex = 0;

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const showDateObj = new Date(today);
      showDateObj.setDate(showDateObj.getDate() + dayOffset);
      const dateString = showDateObj.toISOString().split('T')[0];

      for (const theatre of theatres) {
        for (const screen of theatre.screens) {
          for (const startTime of timeSlots) {
            const movieForShow = nowShowingMovies[movieRotationIndex % nowShowingMovies.length];
            movieRotationIndex++;

            await createShow({
              movie: movieForShow._id,
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

    // Count total seats generated
    const totalSeats = await Seat.countDocuments();

    // 5. Print summary
    console.log('\n========================================================');
    console.log('  iMovies Movie Catalogue Reset Complete!');
    console.log('========================================================');
    console.log(`Movies Added:    ${createdMovies.length} total`);
    console.log(` - Now Showing:  ${nowShowingMovies.length} titles`);
    console.log(` - Coming Soon:   ${createdMovies.length - nowShowingMovies.length} titles`);
    console.log(`Theatres Active: ${theatres.length}`);
    console.log(`Shows Created:   ${showCount} shows across 7 days`);
    console.log(`Seats Generated: ${totalSeats} total seat instances`);
    console.log('========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Reset movies failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  resetMovies();
}

module.exports = { resetMovies };
