// src/services/api.js
import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL  || 'http://localhost:5000/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for logging and adding auth tokens if needed
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method?.toUpperCase()} request to ${config.url}`);
    
    // Add auth token if available (for future use)
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received for ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      console.warn('Rate limit exceeded. Please try again later.');
    } else if (error.code === 'ECONNABORTED') {
      // Handle timeout
      console.error('Request timeout. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

// Events API endpoints
export const eventsAPI = {
  // Get all events with optional filtering and pagination
  getEvents: async (params = {}) => {
    try {
      // Clean up parameters - remove empty values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, value]) => {
          return value !== null && value !== undefined && value !== '';
        })
      );

      // Format dates if they exist
      if (cleanParams.startDate instanceof Date) {
        cleanParams.startDate = cleanParams.startDate.toISOString();
      }
      if (cleanParams.endDate instanceof Date) {
        cleanParams.endDate = cleanParams.endDate.toISOString();
      }

      const response = await api.get('/events', { params: cleanParams });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch events');
    }
  },

  // Get single event by ID
  getEvent: async (id) => {
    try {
      if (!id) {
        throw new Error('Event ID is required');
      }
      const response = await api.get(`/events/${id}`);
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Event not found');
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch event details');
    }
  },

  // Get all available event categories
  getCategories: async () => {
    try {
      const response = await api.get('/events/meta/categories');
      return response;
    } catch (error) {
      console.warn('Failed to fetch categories, using fallback');
      // Return fallback categories if API fails
      return { 
        data: ['Technology', 'Business', 'Arts', 'Music', 'Sports', 'Food', 'Health', 'Education', 'Other'] 
      };
    }
  },

  // Get events statistics (total events, upcoming events, etc.)
  getStats: async () => {
    try {
      const response = await api.get('/events/meta/stats');
      return response;
    } catch (error) {
      console.warn('Failed to fetch stats:', error.message);
      // Return empty stats if API fails
      return { 
        data: { 
          totalEvents: 0, 
          upcomingEvents: 0, 
          categoryCounts: [] 
        } 
      };
    }
  },

  // Subscribe to event notifications and get redirect URL
  subscribeAndRedirect: async (data) => {
    try {
      // Validate required fields
      if (!data.email || !data.eventId || !data.originalUrl) {
        throw new Error('Email, event ID, and original URL are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await api.post('/events/subscribe-and-redirect', data);
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process subscription');
    }
  },

  // Search events (convenience method)
  searchEvents: async (searchTerm, filters = {}) => {
    try {
      const params = {
        search: searchTerm,
        ...filters
      };
      return await eventsAPI.getEvents(params);
    } catch (error) {
      throw new Error(error.message || 'Failed to search events');
    }
  },

  // Get events by category (convenience method)
  getEventsByCategory: async (category, additionalParams = {}) => {
    try {
      const params = {
        category: category,
        ...additionalParams
      };
      return await eventsAPI.getEvents(params);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch events by category');
    }
  },

  // Get upcoming events (convenience method)
  getUpcomingEvents: async (limit = 20) => {
    try {
      const params = {
        limit: limit,
        sortBy: 'date',
        sortOrder: 'asc',
        startDate: new Date()
      };
      return await eventsAPI.getEvents(params);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch upcoming events');
    }
  }
};

// Health check endpoint
export const healthAPI = {
  checkHealth: async () => {
    try {
      const response = await api.get('/health');
      return response;
    } catch (error) {
      throw new Error('API health check failed');
    }
  }
};

// Export the configured axios instance for direct use if needed
export default api;