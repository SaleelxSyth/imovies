const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a movie title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    genre: {
      type: [String],
      required: [true, 'Please add at least one genre']
    },
    language: {
      type: String,
      required: [true, 'Please specify language'],
      trim: true
    },
    duration: {
      type: Number,
      required: [true, 'Please specify duration in minutes']
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    cast: {
      type: [String],
      default: []
    },
    director: {
      type: String,
      trim: true,
      default: ''
    },
    releaseDate: {
      type: Date,
      required: [true, 'Please specify release date']
    },
    posterUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'
    },
    trailerUrl: {
      type: String,
      default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    status: {
      type: String,
      enum: ['now_showing', 'upcoming', 'archived'],
      default: 'now_showing'
    }
  },
  {
    timestamps: true
  }
);

movieSchema.index({ title: 'text', genre: 'text', cast: 'text' }, { language_override: 'none' });
movieSchema.index({ language: 1, genre: 1, status: 1, releaseDate: -1 });

module.exports = mongoose.model('Movie', movieSchema);
