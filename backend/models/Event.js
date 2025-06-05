// models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  time: {
    type: String,
    required: true
  },
  venue: {
    name: String,
    address: String,
    city: {
      type: String,
      default: 'Sydney'
    },
    state: {
      type: String,
      default: 'NSW'
    },
    country: {
      type: String,
      default: 'Australia'
    }
  },
  price: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'AUD'
    },
    isFree: {
      type: Boolean,
      default: false
    }
  },
  category: {
    type: String,
    enum: ['Music', 'Arts', 'Sports', 'Technology', 'Business', 'Food', 'Health', 'Education', 'Other'],
    default: 'Other'
  },
  imageUrl: String,
  originalUrl: {
    type: String,
    required: true,
    unique: true
  },
  source: {
    type: String,
    required: true,
    enum: ['eventbrite', 'meetup', 'facebook', 'mock', 'other']
  },
  organizer: {
    name: String,
    url: String
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
EventSchema.index({ date: 1, isActive: 1 });
EventSchema.index({ category: 1, date: 1 });
EventSchema.index({ originalUrl: 1 }, { unique: true });

// Update the updatedAt field before saving
EventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', EventSchema);