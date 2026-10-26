const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    gateway: {
      type: String,
      default: 'Razorpay'
    },
    orderId: {
      type: String,
      required: true
    },
    paymentId: {
      type: String,
      default: ''
    },
    signature: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['created', 'success', 'failed', 'refunded', 'expired', 'cancelled'],
      default: 'created',
      index: true
    },
    qrToken: {
      type: String,
      sparse: true,
      index: true
    },
    tokenExpiresAt: {
      type: Date,
      default: null
    },
    tokenUsed: {
      type: Boolean,
      default: false
    },
    refundId: {
      type: String,
      default: ''
    },
    logs: [
      {
        event: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        metadata: mongoose.Schema.Types.Mixed
      }
    ]
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ orderId: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
