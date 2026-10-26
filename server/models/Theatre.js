const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rows: {
    type: Number,
    required: true,
    default: 6
  },
  seatsPerRow: {
    type: Number,
    required: true,
    default: 10
  },
  layout: {
    type: String,
    default: 'standard'
  },
  seatTypes: [
    {
      rowPrefix: String, // e.g., 'A', 'B' -> regular, 'E' -> recliner
      type: {
        type: String,
        enum: ['regular', 'premium', 'recliner'],
        default: 'regular'
      }
    }
  ]
});

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide theatre name'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please provide theatre city'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Please provide address or location'],
      trim: true
    },
    screens: [screenSchema]
  },
  {
    timestamps: true
  }
);

theatreSchema.index({ city: 1, name: 1 });

module.exports = mongoose.model('Theatre', theatreSchema);
