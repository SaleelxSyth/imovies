const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Please associate a movie with this show']
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Please associate a theatre with this show']
    },
    screenName: {
      type: String,
      required: [true, 'Please provide screen name']
    },
    date: {
      type: String, // format: YYYY-MM-DD
      required: [true, 'Please provide show date (YYYY-MM-DD)']
    },
    startTime: {
      type: String, // format: HH:mm
      required: [true, 'Please provide start time (HH:mm)']
    },
    endTime: {
      type: String, // format: HH:mm
      default: ''
    },
    pricing: {
      regular: {
        type: Number,
        required: true,
        default: 180
      },
      premium: {
        type: Number,
        required: true,
        default: 250
      },
      recliner: {
        type: Number,
        required: true,
        default: 400
      }
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

showSchema.index({ movie: 1, theatre: 1, date: 1 });
showSchema.index({ date: 1, startTime: 1 });

module.exports = mongoose.model('Show', showSchema);
