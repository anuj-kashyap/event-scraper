// src/services/index.js

/**
 * Central export file for all services
 * This allows for clean imports throughout the application
 */

// API Services
export { eventsAPI, healthAPI, default as api } from './api';

// Business Logic Services
export { EventService } from './eventService';

// Storage Services
export { StorageService, EventsStorageService } from './storageService';

// Utility Services
export {
  DateUtils,
  URLUtils,
  TextUtils,
  ValidationUtils,
  BrowserUtils,
  PerformanceUtils,
  EventUtils,
  Utils
} from './utils';

/**
 * Service Registry - For dependency injection and testing
 */
export class ServiceRegistry {
  static services = new Map();

  static register(name, service) {
    ServiceRegistry.services.set(name, service);
  }

  static get(name) {
    return ServiceRegistry.services.get(name);
  }

  static has(name) {
    return ServiceRegistry.services.has(name);
  }

  static unregister(name) {
    return ServiceRegistry.services.delete(name);
  }

  static clear() {
    ServiceRegistry.services.clear();
  }

  static list() {
    return Array.from(ServiceRegistry.services.keys());
  }
}

// Register default services
ServiceRegistry.register('events', EventService);
ServiceRegistry.register('storage', EventsStorageService);
ServiceRegistry.register('utils', Utils);

/**
 * Service Configuration
 */
export const ServiceConfig = {
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
    retries: 3
  },
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100
  },
  features: {
    offline: false,
    analytics: false,
    notifications: false
  }
};

/**
 * Service Health Checker
 */
export class ServiceHealthChecker {
  static async checkAPIHealth() {
    try {
      const response = await healthAPI.checkHealth();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        latency: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  static checkStorageHealth() {
    try {
      const isAvailable = StorageService.isLocalStorageAvailable();
      const storageInfo = EventsStorageService.getStorageInfo();
      
      return {
        status: isAvailable ? 'healthy' : 'unavailable',
        timestamp: new Date().toISOString(),
        info: storageInfo
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  static async runHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'healthy'
    };

    try {
      // Check API health
      results.api = await ServiceHealthChecker.checkAPIHealth();
      
      // Check Storage health
      results.storage = ServiceHealthChecker.checkStorageHealth();
      
      // Check Browser features
      results.browser = {
        status: 'healthy',
        features: {
          localStorage: BrowserUtils.supportsFeature('localStorage'),
          webShare: BrowserUtils.supportsFeature('webShare'),
          clipboard: BrowserUtils.supportsFeature('clipboard'),
          geolocation: BrowserUtils.supportsFeature('geolocation')
        }
      };

      // Determine overall health
      const healthStatuses = [results.api.status, results.storage.status, results.browser.status];
      if (healthStatuses.includes('unhealthy') || healthStatuses.includes('error')) {
        results.overall = 'degraded';
      }
      if (healthStatuses.every(status => status === 'unhealthy' || status === 'error')) {
        results.overall = 'unhealthy';
      }

    } catch (error) {
      results.overall = 'error';
      results.error = error.message;
    }

    return results;
  }
}

/**
 * Initialize services
 */
export const initializeServices = async () => {
  console.log('🚀 Initializing Sydney Events services...');
  
  try {
    // Update last visit
    EventsStorageService.updateLastVisit();
    
    // Check if new user
    const isNewUser = EventsStorageService.isNewUser();
    if (isNewUser) {
      console.log('👋 Welcome! First time visitor detected.');
    }

    // Run health check
    const healthCheck = await ServiceHealthChecker.runHealthCheck();
    console.log('🏥 Services health check:', healthCheck);

    // Log storage info
    const storageInfo = EventsStorageService.getStorageInfo();
    console.log('💾 Storage info:', storageInfo);

    return {
      success: true,
      isNewUser,
      health: healthCheck,
      storage: storageInfo
    };
  } catch (error) {
    console.error('❌ Error initializing services:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export commonly used services for convenience
export {
  EventService as Events,
  EventsStorageService as Storage,
  Utils
};