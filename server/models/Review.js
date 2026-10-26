const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

// Static method to recalculate average rating for a movie
reviewSchema.statics.calculateAverageRating = async function (movieId) {
  const stats = await this.aggregate([
    {
      $match: { movie: movieId, isApproved: true }
    },
    {
      $group: {
        _id: '$movie',
        avgRating: { $avg: '$rating' },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  const Movie = mongoose.model('Movie');
  if (stats.length > 0) {
    await Movie.findByIdAndUpdate(movieId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      ratingCount: stats[0].ratingCount
    });
  } else {
    await Movie.findByIdAndUpdate(movieId, {
      rating: 0,
      ratingCount: 0
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.movie);
});

reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    doc.constructor.calculateAverageRating(doc.movie);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
