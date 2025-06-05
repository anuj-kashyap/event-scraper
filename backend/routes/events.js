// routes/events.js
const express = require('express');
const Event = require('../models/Event');
const router = express.Router();

// Only require nodemailer if email is configured
let nodemailer;
try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    nodemailer = require('nodemailer');
  }
} catch (error) {
  console.log('Nodemailer not available, email features disabled');
}

// Get all events with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = { isActive: true };
    
    // Add date filter (only future events by default)
    const now = new Date();
    query.date = { $gte: startDate ? new Date(startDate) : now };
    
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }

    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'venue.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const events = await Event.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .exec();

    const total = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(total / options.limit),
      currentPage: options.page,
      total,
      hasNext: options.page < Math.ceil(total / options.limit),
      hasPrev: options.page > 1
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
});

// Get event categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Event.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

router.post('/subscribe-and-redirect', async (req, res) => {
  try {
    const { email, eventId, originalUrl } = req.body;

    if (!email || !eventId || !originalUrl) {
      return res.status(400).json({ message: 'Email, event ID, and original URL are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Determine the correct redirect URL based on event source
    let finalRedirectUrl = originalUrl;
    
    // Handle different event sources
    if (event.source === 'mock') {
      // For mock events, create a demo page URL or use a placeholder
      finalRedirectUrl = `https://example.com/demo-ticket-page?event=${encodeURIComponent(event.title)}&email=${encodeURIComponent(email)}`;
    } else if (event.source === 'eventbrite') {
      // Ensure Eventbrite URLs are properly formatted
      if (!originalUrl.startsWith('http')) {
        finalRedirectUrl = `https://www.eventbrite.com${originalUrl}`;
      }
    } else if (event.source === 'meetup') {
      // Ensure Meetup URLs are properly formatted
      if (!originalUrl.startsWith('http')) {
        finalRedirectUrl = `https://www.meetup.com${originalUrl}`;
      }
    }

    // Validate the final URL
    try {
      new URL(finalRedirectUrl);
    } catch (urlError) {
      console.error('Invalid URL detected:', finalRedirectUrl);
      // Fallback to a safe URL
      finalRedirectUrl = `https://example.com/event-info?title=${encodeURIComponent(event.title)}`;
    }

    // Try to send welcome email if configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        const isDemo = event.source === 'mock' || finalRedirectUrl.includes('example.com');
        
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: `Thanks for your interest in: ${event.title}`,
          html: `
            <h2>Thanks for your interest!</h2>
            <p>You've expressed interest in: <strong>${event.title}</strong></p>
            <p>Date: ${event.date.toLocaleDateString()}</p>
            <p>Venue: ${event.venue.name}</p>
            ${isDemo ? 
              '<p><strong>Note:</strong> This is a demo event for testing purposes.</p>' : 
              '<p>You\'re being redirected to get your tickets!</p>'
            }
            <br>
            <p>Stay tuned for more amazing events in Sydney!</p>
            ${isDemo ? '' : `<p><a href="${finalRedirectUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Tickets</a></p>`}
          `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email} for event: ${event.title}`);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the request if email fails
      }
    } else {
      console.log('Email not configured, skipping email send');
    }

    // Log the subscription for tracking
    console.log(`New subscription: ${email} for event: ${event.title} (${event.source})`);
    console.log(`Redirect URL: ${finalRedirectUrl}`);

    // Return success with additional info
    res.json({ 
      message: 'Subscription successful', 
      redirectUrl: finalRedirectUrl,
      eventSource: event.source,
      isDemo: event.source === 'mock' || finalRedirectUrl.includes('example.com'),
      emailSent: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    });

  } catch (error) {
    console.error('Error processing subscription:', error);
    res.status(500).json({ 
      message: 'Error processing subscription', 
      error: error.message 
    });
  }
});

router.get('/meta/stats', async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments({ isActive: true });
    const upcomingEvents = await Event.countDocuments({ 
      isActive: true, 
      date: { $gte: new Date() } 
    });
    
    const categoryCounts = await Event.aggregate([
      { $match: { isActive: true, date: { $gte: new Date() } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalEvents,
      upcomingEvents,
      categoryCounts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

module.exports = router;