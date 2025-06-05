// scrapers/eventbrite.js
const puppeteer = require('puppeteer');
const Event = require('../models/Event');

class EventbriteScraper {
  constructor() {
    this.baseUrl = 'https://www.eventbrite.com.au/d/australia--sydney/events/';
    this.source = 'eventbrite';
  }

  async scrape() {
    let browser;
    try {
      console.log('Starting Eventbrite scraping...');
      
      browser = await puppeteer.launch({
        headless: 'true',
        args: [
          '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--proxy-server="direct://"',
    '--proxy-bypass-list=*'
        ]
      });
      
      const page = await browser.newPage();
      
      // Set realistic browser headers
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });
      
      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });
      
      console.log('Navigating to Eventbrite...');
      
      // Navigate to Eventbrite Sydney events with better error handling
      await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      console.log('Page loaded, waiting for content...');
      
      // Wait for page to load and try multiple selectors
      const eventSelectors = [
        '[data-testid="event-card"]',
        '.search-event-card',
        '.event-card',
        '.eds-event-card',
        '[class*="event"]',
        'article',
        '.event-listing'
      ];
      
      let foundSelector = null;
      
      for (const selector of eventSelectors) {
        try {
          console.log(`Trying selector: ${selector}`);
          await page.waitForSelector(selector, { timeout: 5000 });
          foundSelector = selector;
          console.log(`Found events with selector: ${selector}`);
          break;
        } catch (error) {
          console.log(`Selector ${selector} not found, trying next...`);
        }
      }
      
      if (!foundSelector) {
        console.log('No event cards found with any selector. Taking screenshot for debugging...');
        await page.screenshot({ path: 'eventbrite-debug.png', fullPage: true });
        
        // Get page content for debugging
        const pageContent = await page.content();
        console.log('Page title:', await page.title());
        console.log('Page URL:', page.url());
        
        // Check if we hit a captcha or similar
        const hasProtection = await page.evaluate(() => {
          return document.body.innerHTML.includes('captcha') || 
                 document.body.innerHTML.includes('protection') ||
                 document.body.innerHTML.includes('blocked');
        });
        
        if (hasProtection) {
          console.log('Detected protection mechanism on Eventbrite');
        }
        
        throw new Error('No event cards found on the page');
      }
      
      // Scroll to load more events
      await this.autoScroll(page);
      
      // Extract event data with the found selector
      const events = await page.evaluate((selector) => {
        const eventCards = document.querySelectorAll(selector);
        const extractedEvents = [];
        
        console.log(`Found ${eventCards.length} event cards`);
        
        eventCards.forEach((card, index) => {
          try {
            // Try multiple title selectors
            const titleSelectors = [
              '[data-testid="event-title"]',
              '.event-title',
              'h2 a',
              'h3 a', 
              '.eds-event-card__formatted-name--is-clamped',
              '.event-card__clamp-line--one',
              'a[data-spec="event-title"]'
            ];
            
            let titleElement = null;
            for (const titleSel of titleSelectors) {
              titleElement = card.querySelector(titleSel);
              if (titleElement) break;
            }
            
            // Try multiple date selectors
            const dateSelectors = [
              '[data-testid="event-datetime"]',
              '.event-date',
              '[data-spec="event-datetime"]',
              '.eds-event-card__sub-content time',
              '.event-card__date'
            ];
            
            let dateElement = null;
            for (const dateSel of dateSelectors) {
              dateElement = card.querySelector(dateSel);
              if (dateElement) break;
            }
            
            // Try multiple link selectors
            const linkSelectors = [
              'a[href*="/e/"]',
              'a[href*="eventbrite"]',
              'a'
            ];
            
            let linkElement = null;
            for (const linkSel of linkSelectors) {
              linkElement = card.querySelector(linkSel);
              if (linkElement && linkElement.href) break;
            }
            
            if (titleElement && linkElement) {
              const venue = card.querySelector('[data-testid="event-location"], .event-venue, .eds-event-card__sub-content div')?.textContent?.trim() || '';
              const price = card.querySelector('[data-testid="event-price"], .event-price, .eds-event-card__formatted-price')?.textContent?.trim() || '';
              const image = card.querySelector('img')?.src || '';
              const description = card.querySelector('.event-description, .eds-event-card__primary-content, p')?.textContent?.trim() || titleElement.textContent.trim();
              
              extractedEvents.push({
                title: titleElement.textContent.trim(),
                date: dateElement ? dateElement.textContent.trim() : '',
                venue: venue,
                price: price,
                imageUrl: image,
                originalUrl: linkElement.href,
                description: description
              });
            }
          } catch (err) {
            console.error(`Error extracting event ${index}:`, err);
          }
        });
        
        return extractedEvents;
      }, foundSelector);
      
      console.log(`Found ${events.length} events from Eventbrite`);
      
      // Process and save events
      const savedEvents = [];
      for (const eventData of events) {
        try {
          if (eventData.title && eventData.originalUrl) {
            const processedEvent = await this.processEventData(eventData);
            if (processedEvent) {
              savedEvents.push(processedEvent);
            }
          }
        } catch (error) {
          console.error('Error processing event:', error);
        }
      }
      
      return savedEvents;
      
    } catch (error) {
      console.error('Eventbrite scraping error:', error);
      return [];
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async autoScroll(page) {
    try {
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if(totalHeight >= scrollHeight - window.innerHeight){
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
      
      // Wait a bit for new content to load
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('Auto scroll failed:', error.message);
    }
  }

  async processEventData(eventData) {
    try {
      // Parse date - be more flexible
      const eventDate = this.parseDate(eventData.date);
      if (!eventDate) {
        console.log('Skipping event with invalid date:', eventData.title);
        return null;
      }
      
      // Don't skip past events for testing - adjust this later
      // if (eventDate < new Date()) {
      //   return null;
      // }

      // Parse price
      const priceInfo = this.parsePrice(eventData.price);
      
      // Extract venue information
      const venueInfo = this.parseVenue(eventData.venue);
      
      // Determine category based on title and description
      const category = this.categorizeEvent(eventData.title, eventData.description);

      const eventObj = {
        title: eventData.title,
        description: eventData.description,
        date: eventDate,
        time: this.extractTime(eventData.date),
        venue: venueInfo,
        price: priceInfo,
        category: category,
        imageUrl: eventData.imageUrl,
        originalUrl: eventData.originalUrl,
        source: this.source,
        organizer: {
          name: 'Eventbrite Organizer',
          url: eventData.originalUrl
        },
        tags: this.extractTags(eventData.title, eventData.description)
      };

      // Check if event already exists
      const existingEvent = await Event.findOne({ originalUrl: eventData.originalUrl });
      
      if (existingEvent) {
        // Update existing event
        Object.assign(existingEvent, eventObj);
        await existingEvent.save();
        console.log('Updated event:', eventData.title);
        return existingEvent;
      } else {
        // Create new event
        const newEvent = new Event(eventObj);
        await newEvent.save();
        console.log('Created new event:', eventData.title);
        return newEvent;
      }
      
    } catch (error) {
      console.error('Error processing event data:', error);
      return null;
    }
  }

  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Clean the date string
      let cleanDate = dateString.replace(/\s+/g, ' ').trim();
      
      // Handle various date formats from Eventbrite
      const patterns = [
        /(\w+),?\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})/,  // "Mon, Jan 15, 2024"
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,            // "Jan 15, 2024"
        /(\d{1,2})\s+(\w+)\s+(\d{4})/,              // "15 Jan 2024"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,            // "15/01/2024"
        /(\d{4})-(\d{1,2})-(\d{1,2})/               // "2024-01-15"
      ];
      
      for (const pattern of patterns) {
        const match = cleanDate.match(pattern);
        if (match) {
          let year, month, day;
          
          if (pattern.source.includes('\\w+')) {
            // Text month
            const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                              'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            
            if (match.length === 5) {
              // With day name
              const monthName = match[2].toLowerCase().substring(0, 3);
              month = monthNames.indexOf(monthName);
              day = parseInt(match[3]);
              year = parseInt(match[4]);
            } else {
              // Without day name
              const monthName = match[1].toLowerCase().substring(0, 3);
              month = monthNames.indexOf(monthName);
              day = parseInt(match[2]);
              year = parseInt(match[3]);
            }
            
            if (month !== -1) {
              return new Date(year, month, day);
            }
          } else {
            // Numeric date
            if (pattern.source.includes('\\/')) {
              // DD/MM/YYYY format
              day = parseInt(match[1]);
              month = parseInt(match[2]) - 1;
              year = parseInt(match[3]);
            } else {
              // YYYY-MM-DD format
              year = parseInt(match[1]);
              month = parseInt(match[2]) - 1;
              day = parseInt(match[3]);
            }
            
            return new Date(year, month, day);
          }
        }
      }
      
      // Fallback to Date parsing
      const fallbackDate = new Date(cleanDate);
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate;
      }
      
      console.log('Could not parse date:', dateString);
      return null;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  }

  extractTime(dateString) {
    if (!dateString) return '00:00';
    
    const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
    const match = dateString.match(timeRegex);
    return match ? match[0] : '00:00';
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
    
    return {
      name: venueString.split(',')[0].trim(),
      address: venueString,
      city: 'Sydney',
      state: 'NSW',
      country: 'Australia'
    };
  }

  categorizeEvent(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('music') || text.includes('concert') || text.includes('band')) return 'Music';
    if (text.includes('art') || text.includes('gallery') || text.includes('exhibition')) return 'Arts';
    if (text.includes('sport') || text.includes('fitness') || text.includes('run')) return 'Sports';
    if (text.includes('tech') || text.includes('coding') || text.includes('startup')) return 'Technology';
    if (text.includes('business') || text.includes('networking') || text.includes('conference')) return 'Business';
    if (text.includes('food') || text.includes('cooking') || text.includes('restaurant')) return 'Food';
    if (text.includes('health') || text.includes('wellness') || text.includes('yoga')) return 'Health';
    if (text.includes('education') || text.includes('workshop') || text.includes('course')) return 'Education';
    
    return 'Other';
  }

  extractTags(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    const tags = [];
    
    const keywords = ['networking', 'workshop', 'conference', 'exhibition', 'festival', 'seminar', 'meetup'];
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return tags;
  }
}

module.exports = EventbriteScraper;