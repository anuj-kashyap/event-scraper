// scrapers/runScraper.js
const EventbriteScraper = require('./eventbrite');
const MeetupScraper = require('./meetup');
const MockScraper = require('./mockScraper');
const Event = require('../models/Event');

async function runAllScrapers() {
  console.log('Starting scraping process...');
  const startTime = Date.now();
  
  // Include mock scraper for testing
  const scrapers = [
    new MockScraper(),
    new EventbriteScraper(),
    new MeetupScraper()
  ];
  
  let totalEvents = 0;
  let successfulScrapers = 0;
  
  for (const scraper of scrapers) {
    try {
      console.log(`\n--- Running ${scraper.constructor.name} ---`);
      const events = await scraper.scrape();
      totalEvents += events.length;
      
      if (events.length > 0) {
        successfulScrapers++;
        console.log(`✅ ${scraper.constructor.name} completed successfully: ${events.length} events processed`);
      } else {
        console.log(`⚠️ ${scraper.constructor.name} completed but found 0 events`);
      }
      
    } catch (error) {
      console.error(`❌ Error running ${scraper.constructor.name}:`, error.message);
    }
  }
  
  // Clean up old events (older than 1 day in the past)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  try {
    const deletedCount = await Event.deleteMany({ 
      date: { $lt: yesterday },
      isActive: true 
    });
    console.log(`\n🧹 Cleaned up ${deletedCount.deletedCount} old events`);
  } catch (error) {
    console.error('Error cleaning up old events:', error);
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log(`\n📊 Scraping Summary:`);
  console.log(`- Duration: ${duration.toFixed(2)} seconds`);
  console.log(`- Total events processed: ${totalEvents}`);
  console.log(`- Successful scrapers: ${successfulScrapers}/${scrapers.length}`);
  console.log(`- Success rate: ${((successfulScrapers/scrapers.length) * 100).toFixed(1)}%`);
  
  return {
    totalEvents,
    successfulScrapers,
    duration,
    success: successfulScrapers > 0
  };
}

// If this file is run directly
if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();
  
  // Connect to database
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sydney-events')
    .then(() => {
      console.log('Connected to MongoDB');
      return runAllScrapers();
    })
    .then((result) => {
      console.log('\n🎉 Scraping job completed successfully!');
      console.log('Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Scraping job failed:', error);
      process.exit(1);
    });
}

module.exports = runAllScrapers;