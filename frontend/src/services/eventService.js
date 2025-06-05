// src/services/eventService.js
import { eventsAPI } from './api';
import { format, isValid, parseISO } from 'date-fns';

/**
 * Event Service - Higher level business logic for event operations
 */
export class EventService {
  
  /**
   * Get events with smart defaults and error handling
   */
  static async getEvents(filters = {}) {
    try {
      // Apply smart defaults
      const defaultFilters = {
        page: 1,
        limit: 12,
        sortBy: 'date',
        sortOrder: 'asc',
        category: 'all'
      };

      const finalFilters = { ...defaultFilters, ...filters };

      // Remove 'all' category filter
      if (finalFilters.category === 'all') {
        delete finalFilters.category;
      }

      const response = await eventsAPI.getEvents(finalFilters);
      
      // Transform and validate the response
      return {
        ...response.data,
        events: response.data.events.map(event => EventService.transformEvent(event))
      };
    } catch (error) {
      console.error('EventService.getEvents error:', error);
      throw error;
    }
  }

  /**
   * Get a single event with enhanced data
   */
  static async getEvent(id) {
    try {
      const response = await eventsAPI.getEvent(id);
      return EventService.transformEvent(response.data);
    } catch (error) {
      console.error('EventService.getEvent error:', error);
      throw error;
    }
  }

  /**
   * Search events with intelligent query processing
   */
  static async searchEvents(query, filters = {}) {
    try {
      // Clean and process search query
      const cleanQuery = query.trim().toLowerCase();
      
      if (cleanQuery.length < 2) {
        throw new Error('Search query must be at least 2 characters');
      }

      const searchFilters = {
        search: cleanQuery,
        ...filters
      };

      return await EventService.getEvents(searchFilters);
    } catch (error) {
      console.error('EventService.searchEvents error:', error);
      throw error;
    }
  }

  /**
   * Get events by category with additional processing
   */
  static async getEventsByCategory(category, additionalFilters = {}) {
    try {
      const filters = {
        category: category,
        ...additionalFilters
      };

      return await EventService.getEvents(filters);
    } catch (error) {
      console.error('EventService.getEventsByCategory error:', error);
      throw error;
    }
  }

  /**
   * Get upcoming events for today/this week
   */
  static async getUpcomingEvents(timeframe = 'week', limit = 20) {
    try {
      const now = new Date();
      let endDate;

      switch (timeframe) {
        case 'today':
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'month':
          endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        default:
          endDate = new Date(now);
          endDate.setDate(endDate.getDate() + 7);
      }

      const filters = {
        startDate: now,
        endDate: endDate,
        limit: limit,
        sortBy: 'date',
        sortOrder: 'asc'
      };

      return await EventService.getEvents(filters);
    } catch (error) {
      console.error('EventService.getUpcomingEvents error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to event with validation and error handling
   */
  static async subscribeToEvent(email, eventId, originalUrl) {
    try {
      // Validate inputs
      if (!email || !eventId || !originalUrl) {
        throw new Error('Email, event ID, and original URL are required');
      }

      // Validate email format
      if (!EventService.isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate URL format
      if (!EventService.isValidUrl(originalUrl)) {
        throw new Error('Invalid event URL');
      }

      const response = await eventsAPI.subscribeAndRedirect({
        email: email.trim().toLowerCase(),
        eventId,
        originalUrl
      });

      return response.data;
    } catch (error) {
      console.error('EventService.subscribeToEvent error:', error);
      throw error;
    }
  }

  /**
   * Get event statistics with caching
   */
  static async getEventStats() {
    try {
      const response = await eventsAPI.getStats();
      return response.data;
    } catch (error) {
      console.error('EventService.getEventStats error:', error);
      // Return fallback stats
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        categoryCounts: []
      };
    }
  }

  /**
   * Get all categories with fallback
   */
  static async getCategories() {
    try {
      const response = await eventsAPI.getCategories();
      return response.data;
    } catch (error) {
      console.error('EventService.getCategories error:', error);
      // Return fallback categories
      return ['Technology', 'Business', 'Arts', 'Music', 'Sports', 'Food', 'Health', 'Education', 'Other'];
    }
  }

  /**
   * Transform raw event data to include computed properties
   */
  static transformEvent(event) {
    if (!event) return null;

    try {
      return {
        ...event,
        // Add computed properties
        formattedDate: EventService.formatEventDate(event.date),
        formattedPrice: EventService.formatEventPrice(event.price),
        isUpcoming: EventService.isUpcomingEvent(event.date),
        isPastEvent: EventService.isPastEvent(event.date),
        categoryColor: EventService.getCategoryColor(event.category),
        shortDescription: EventService.truncateText(event.description, 150),
        slug: EventService.createSlug(event.title),
        shareUrl: `${window.location.origin}/event/${event._id}`,
        mapUrl: EventService.createMapUrl(event.venue?.address)
      };
    } catch (error) {
      console.error('Error transforming event:', error);
      return event; // Return original event if transformation fails
    }
  }

  /**
   * Format event date for display
   */
  static formatEventDate(dateString) {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Date TBA';
      
      const now = new Date();
      const eventDate = new Date(date);
      
      // Check if event is today
      if (eventDate.toDateString() === now.toDateString()) {
        return 'Today';
      }
      
      // Check if event is tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (eventDate.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      }
      
      // Check if event is this week
      const weekFromNow = new Date(now);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      if (eventDate <= weekFromNow) {
        return format(date, 'EEEE, MMM do'); // "Monday, Jan 1st"
      }
      
      return format(date, 'EEEE, MMMM do, yyyy'); // Full date
    } catch (error) {
      return 'Date TBA';
    }
  }

  /**
   * Format event price for display
   */
  static formatEventPrice(price) {
    if (!price) return 'Price TBA';
    
    if (price.isFree) return 'Free';
    
    const currency = price.currency || 'AUD';
    
    if (price.min === price.max) {
      return `$${price.min} ${currency}`;
    }
    
    return `$${price.min} - $${price.max} ${currency}`;
  }

  /**
   * Check if event is upcoming (not started yet)
   */
  static isUpcomingEvent(dateString) {
    try {
      const eventDate = parseISO(dateString);
      return isValid(eventDate) && eventDate > new Date();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if event is in the past
   */
  static isPastEvent(dateString) {
    try {
      const eventDate = parseISO(dateString);
      return isValid(eventDate) && eventDate < new Date();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get category color for styling
   */
  static getCategoryColor(category) {
    const colors = {
      'Technology': '#3b82f6',
      'Business': '#10b981',
      'Arts': '#f59e0b',
      'Music': '#ef4444',
      'Sports': '#8b5cf6',
      'Food': '#f97316',
      'Health': '#06b6d4',
      'Education': '#84cc16',
      'Other': '#6b7280'
    };
    return colors[category] || colors['Other'];
  }

  /**
   * Truncate text to specified length
   */
  static truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Create URL-friendly slug from title
   */
  static createSlug(title) {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Create Google Maps URL from address
   */
  static createMapUrl(address) {
    if (!address) return null;
    return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  }

  /**
   * Validate email address
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate event sharing data
   */
  static getEventSharingData(event) {
    if (!event) return null;

    return {
      title: event.title,
      text: `Check out this event: ${event.title}`,
      url: `${window.location.origin}/event/${event._id}`
    };
  }

  /**
   * Check if browser supports native sharing
   */
  static canShare() {
    return 'share' in navigator;
  }
}

export default EventService;