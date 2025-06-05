// scrapers/mockScraper.js
const Event = require('../models/Event');

class MockScraper {
  constructor() {
    this.source = 'mock';
  }

  async scrape() {
    try {
      console.log('Starting Mock scraping for testing...');
      
      // Generate mock events for testing
      const mockEvents = this.generateMockEvents();
      
      console.log(`Generated ${mockEvents.length} mock events`);
      
      // Process and save events
      const savedEvents = [];
      for (const eventData of mockEvents) {
        try {
          const processedEvent = await this.processEventData(eventData);
          if (processedEvent) {
            savedEvents.push(processedEvent);
          }
        } catch (error) {
          console.error('Error processing mock event:', error);
        }
      }
      
      return savedEvents;
      
    } catch (error) {
      console.error('Mock scraping error:', error);
      return [];
    }
  }

  generateMockEvents() {
    const currentDate = new Date();
    const mockEvents = [];

    // Event templates
    const eventTemplates = [
      {
        title: "Sydney Tech Meetup - AI & Machine Learning",
        description: "Join us for an exciting evening discussing the latest trends in AI and machine learning. Network with fellow tech enthusiasts and learn from industry experts.",
        category: "Technology",
        venue: "The Sydney Startup Hub, 11 York Street, Sydney NSW",
        price: "Free",
        tags: ["networking", "workshop", "tech", "AI"]
      },
      {
        title: "Sydney Symphony Orchestra - Classical Night",
        description: "Experience a magical evening with Sydney's premier orchestra performing classical masterpieces from Mozart, Beethoven, and Chopin.",
        category: "Music",
        venue: "Sydney Opera House, Bennelong Point, Sydney NSW",
        price: "$45 - $120",
        tags: ["concert", "classical", "music"]
      },
      {
        title: "Business Networking Breakfast",
        description: "Connect with Sydney's business leaders over breakfast. Great opportunity for entrepreneurs and professionals to expand their network.",
        category: "Business",
        venue: "Hilton Sydney, 488 George Street, Sydney NSW",
        price: "$35",
        tags: ["networking", "business", "breakfast"]
      },
      {
        title: "Contemporary Art Exhibition Opening",
        description: "Discover emerging Australian artists in this curated contemporary art exhibition. Wine and canapés provided.",
        category: "Arts",
        venue: "Art Gallery of NSW, Art Gallery Road, The Domain NSW",
        price: "Free",
        tags: ["exhibition", "art", "opening"]
      },
      {
        title: "Sydney Harbour Bridge Climb",
        description: "Experience breathtaking 360-degree views of Sydney from the top of the iconic Harbour Bridge.",
        category: "Sports",
        venue: "BridgeClimb Sydney, 3 Cumberland Street, The Rocks NSW",
        price: "$174 - $388",
        tags: ["adventure", "tourism", "sports"]
      },
      {
        title: "Cooking Class - Modern Australian Cuisine",
        description: "Learn to cook modern Australian dishes with native ingredients. Hands-on class with professional chef.",
        category: "Food",
        venue: "Sydney Cooking School, 4 Glebe Point Road, Glebe NSW",
        price: "$95",
        tags: ["workshop", "cooking", "food"]
      },
      {
        title: "Yoga in the Park",
        description: "Start your weekend with a peaceful yoga session in the beautiful Royal Botanic Gardens. All levels welcome.",
        category: "Health",
        venue: "Royal Botanic Gardens, Mrs Macquaries Road, Sydney NSW",
        price: "Free",
        tags: ["yoga", "wellness", "outdoor"]
      },
      {
        title: "Digital Marketing Workshop",
        description: "Learn the latest digital marketing strategies and tools. Perfect for small business owners and marketing professionals.",
        category: "Education",
        venue: "University of Technology Sydney, 15 Broadway, Ultimo NSW",
        price: "$75",
        tags: ["workshop", "education", "marketing"]
      },
      {
        title: "Sydney Startup Pitch Night",
        description: "Watch innovative startups pitch their ideas to investors and vote for your favorite. Networking drinks included.",
        category: "Business",
        venue: "Tank Stream Labs, 15 Blue Street, North Sydney NSW",
        price: "$25",
        tags: ["startup", "networking", "pitch"]
      },
      {
        title: "Jazz Night at The Basement",
        description: "Enjoy smooth jazz performances by local and international artists in Sydney's premier jazz venue.",
        category: "Music",
        venue: "The Basement, 29 Reiby Place, Circular Quay NSW",
        price: "$30 - $50",
        tags: ["jazz", "music", "concert"]
      }
    ];

    // Generate events for the next 30 days
    for (let i = 0; i < 15; i++) {
      const template = eventTemplates[i % eventTemplates.length];
      const eventDate = new Date(currentDate);
      eventDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 30) + 1);
      
      const hours = Math.floor(Math.random() * 12) + 9; // 9 AM to 9 PM
      const minutes = Math.random() > 0.5 ? 0 : 30;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours > 12 ? hours - 12 : hours;
      
      mockEvents.push({
        title: template.title + (i > 9 ? ` #${Math.floor(i/10) + 1}` : ''),
        description: template.description,
        date: eventDate,
        time: `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`,
        venue: template.venue,
        price: template.price,
        category: template.category,
        imageUrl: `https://picsum.photos/400/300?random=${i}`,
        originalUrl: `https://www.eventbrite.com.au/e/sydney-tech-meetup-ai-machine-learning-${i + 1}`,
        tags: template.tags
      });
    }

    return mockEvents;
  }

  async processEventData(eventData) {
    try {
      // Parse price
      const priceInfo = this.parsePrice(eventData.price);
      
      // Parse venue
      const venueInfo = this.parseVenue(eventData.venue);

      const eventObj = {
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        venue: venueInfo,
        price: priceInfo,
        category: eventData.category,
        imageUrl: eventData.imageUrl,
        originalUrl: eventData.originalUrl,
        source: this.source,
        organizer: {
          name: 'Sydney Events Organizer',
          url: eventData.originalUrl
        },
        tags: eventData.tags || []
      };

      // Check if event already exists
      const existingEvent = await Event.findOne({ originalUrl: eventData.originalUrl });
      
      if (existingEvent) {
        // Update existing event
        Object.assign(existingEvent, eventObj);
        await existingEvent.save();
        console.log('Updated mock event:', eventData.title);
        return existingEvent;
      } else {
        // Create new event
        const newEvent = new Event(eventObj);
        await newEvent.save();
        console.log('Created new mock event:', eventData.title);
        return newEvent;
      }
      
    } catch (error) {
      console.error('Error processing mock event data:', error);
      return null;
    }
  }

  parsePrice(priceString) {
    if (!priceString || priceString.toLowerCase().includes('free')) {
      return { min: 0, max: 0, currency: 'AUD', isFree: true };
    }
    
    const priceRegex = /\$(\d+(?:\.\d{2})?)/g;
    const prices = [];
    let match;
    
    while ((match = priceRegex.exec(priceString)) !== null) {
      prices.push(parseFloat(match[1]));
    }
    
    if (prices.length > 0) {
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currency: 'AUD',
        isFree: false
      };
    }
    
    return { min: 0, max: 0, currency: 'AUD', isFree: true };
  }

  parseVenue(venueString) {
    if (!venueString) {
      return { name: 'TBA', address: '', city: 'Sydney', state: 'NSW', country: 'Australia' };
    }
    
    const parts = venueString.split(',');
    return {
      name: parts[0].trim(),
      address: venueString,
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia'
    };
  }
}

module.exports = MockScraper;