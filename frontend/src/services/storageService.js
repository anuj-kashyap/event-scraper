// src/services/storageService.js

/**
 * Storage Service - Handle localStorage operations with error handling and fallbacks
 */
export class StorageService {
  
  /**
   * Check if localStorage is available
   */
  static isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Set item in localStorage with error handling
   */
  static setItem(key, value) {
    try {
      if (!StorageService.isLocalStorageAvailable()) {
        console.warn('localStorage is not available');
        return false;
      }

      const serializedValue = JSON.stringify({
        value,
        timestamp: Date.now(),
        version: '1.0'
      });

      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('Error setting localStorage item:', error);
      return false;
    }
  }

  /**
   * Get item from localStorage with error handling
   */
  static getItem(key, defaultValue = null) {
    try {
      if (!StorageService.isLocalStorageAvailable()) {
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      if (!item) {
        return defaultValue;
      }

      const parsedItem = JSON.parse(item);
      
      // Handle legacy items that aren't wrapped in our format
      if (!parsedItem.hasOwnProperty('value')) {
        return parsedItem;
      }

      return parsedItem.value;
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   */
  static removeItem(key) {
    try {
      if (!StorageService.isLocalStorageAvailable()) {
        return false;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing localStorage item:', error);
      return false;
    }
  }

  /**
   * Clear all localStorage items
   */
  static clear() {
    try {
      if (!StorageService.isLocalStorageAvailable()) {
        return false;
      }

      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Get item with expiration check
   */
  static getItemWithExpiry(key, defaultValue = null) {
    try {
      const item = StorageService.getItem(key);
      if (!item) {
        return defaultValue;
      }

      // Check if item has expiry
      if (item.expiry && Date.now() > item.expiry) {
        StorageService.removeItem(key);
        return defaultValue;
      }

      return item.data || item;
    } catch (error) {
      console.error('Error getting item with expiry:', error);
      return defaultValue;
    }
  }

  /**
   * Set item with expiration time
   */
  static setItemWithExpiry(key, value, expiryMinutes = 60) {
    try {
      const item = {
        data: value,
        expiry: Date.now() + (expiryMinutes * 60 * 1000)
      };

      return StorageService.setItem(key, item);
    } catch (error) {
      console.error('Error setting item with expiry:', error);
      return false;
    }
  }
}

/**
 * Specific storage keys and methods for the Sydney Events app
 */
export class EventsStorageService extends StorageService {
  
  // Storage keys
  static KEYS = {
    SEARCH_HISTORY: 'sydney_events_search_history',
    FAVORITE_EVENTS: 'sydney_events_favorites',
    USER_PREFERENCES: 'sydney_events_preferences',
    RECENT_CATEGORIES: 'sydney_events_recent_categories',
    EMAIL_SUBSCRIPTIONS: 'sydney_events_email_subscriptions',
    LAST_VISIT: 'sydney_events_last_visit',
    FILTER_PREFERENCES: 'sydney_events_filter_preferences'
  };

  /**
   * Search History Management
   */
  static getSearchHistory() {
    return StorageService.getItem(EventsStorageService.KEYS.SEARCH_HISTORY, []);
  }

  static addToSearchHistory(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return false;
      }

      const history = EventsStorageService.getSearchHistory();
      const cleanTerm = searchTerm.trim().toLowerCase();
      
      // Remove if already exists
      const filteredHistory = history.filter(term => term !== cleanTerm);
      
      // Add to beginning
      const newHistory = [cleanTerm, ...filteredHistory].slice(0, 10); // Keep only 10 items
      
      return StorageService.setItem(EventsStorageService.KEYS.SEARCH_HISTORY, newHistory);
    } catch (error) {
      console.error('Error adding to search history:', error);
      return false;
    }
  }

  static clearSearchHistory() {
    return StorageService.removeItem(EventsStorageService.KEYS.SEARCH_HISTORY);
  }

  /**
   * Favorite Events Management
   */
  static getFavoriteEvents() {
    return StorageService.getItem(EventsStorageService.KEYS.FAVORITE_EVENTS, []);
  }

  static addToFavorites(eventId) {
    try {
      const favorites = EventsStorageService.getFavoriteEvents();
      if (!favorites.includes(eventId)) {
        favorites.push(eventId);
        return StorageService.setItem(EventsStorageService.KEYS.FAVORITE_EVENTS, favorites);
      }
      return true;
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return false;
    }
  }

  static removeFromFavorites(eventId) {
    try {
      const favorites = EventsStorageService.getFavoriteEvents();
      const newFavorites = favorites.filter(id => id !== eventId);
      return StorageService.setItem(EventsStorageService.KEYS.FAVORITE_EVENTS, newFavorites);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return false;
    }
  }

  static isFavorite(eventId) {
    const favorites = EventsStorageService.getFavoriteEvents();
    return favorites.includes(eventId);
  }

  /**
   * User Preferences Management
   */
  static getUserPreferences() {
    return StorageService.getItem(EventsStorageService.KEYS.USER_PREFERENCES, {
      defaultView: 'grid', // grid or list
      itemsPerPage: 12,
      defaultSort: 'date',
      defaultSortOrder: 'asc',
      showPastEvents: false,
      emailNotifications: true,
      preferredCategories: []
    });
  }

  static updateUserPreferences(preferences) {
    try {
      const currentPrefs = EventsStorageService.getUserPreferences();
      const newPrefs = { ...currentPrefs, ...preferences };
      return StorageService.setItem(EventsStorageService.KEYS.USER_PREFERENCES, newPrefs);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  /**
   * Recent Categories Management
   */
  static getRecentCategories() {
    return StorageService.getItem(EventsStorageService.KEYS.RECENT_CATEGORIES, []);
  }

  static addToRecentCategories(category) {
    try {
      if (!category || category === 'all') {
        return false;
      }

      const recent = EventsStorageService.getRecentCategories();
      
      // Remove if already exists
      const filtered = recent.filter(cat => cat !== category);
      
      // Add to beginning
      const newRecent = [category, ...filtered].slice(0, 5); // Keep only 5 items
      
      return StorageService.setItem(EventsStorageService.KEYS.RECENT_CATEGORIES, newRecent);
    } catch (error) {
      console.error('Error adding to recent categories:', error);
      return false;
    }
  }

  /**
   * Email Subscriptions Management
   */
  static getEmailSubscriptions() {
    return StorageService.getItem(EventsStorageService.KEYS.EMAIL_SUBSCRIPTIONS, []);
  }

  static addEmailSubscription(eventId, email) {
    try {
      const subscriptions = EventsStorageService.getEmailSubscriptions();
      const subscription = {
        eventId,
        email,
        timestamp: Date.now()
      };
      
      // Remove existing subscription for same event
      const filtered = subscriptions.filter(sub => sub.eventId !== eventId);
      
      const newSubscriptions = [subscription, ...filtered].slice(0, 50); // Keep only 50 items
      
      return StorageService.setItem(EventsStorageService.KEYS.EMAIL_SUBSCRIPTIONS, newSubscriptions);
    } catch (error) {
      console.error('Error adding email subscription:', error);
      return false;
    }
  }

  static hasEmailSubscription(eventId) {
    const subscriptions = EventsStorageService.getEmailSubscriptions();
    return subscriptions.some(sub => sub.eventId === eventId);
  }

  /**
   * Last Visit Management
   */
  static updateLastVisit() {
    return StorageService.setItem(EventsStorageService.KEYS.LAST_VISIT, Date.now());
  }

  static getLastVisit() {
    return StorageService.getItem(EventsStorageService.KEYS.LAST_VISIT, null);
  }

  static isNewUser() {
    return !EventsStorageService.getLastVisit();
  }

  /**
   * Filter Preferences Management
   */
  static getFilterPreferences() {
    return StorageService.getItem(EventsStorageService.KEYS.FILTER_PREFERENCES, {
      lastUsedCategory: 'all',
      lastUsedSort: 'date',
      lastUsedSortOrder: 'asc',
      rememberFilters: true
    });
  }

  static updateFilterPreferences(preferences) {
    try {
      const current = EventsStorageService.getFilterPreferences();
      const updated = { ...current, ...preferences };
      return StorageService.setItem(EventsStorageService.KEYS.FILTER_PREFERENCES, updated);
    } catch (error) {
      console.error('Error updating filter preferences:', error);
      return false;
    }
  }

  /**
   * Clear all app data
   */
  static clearAllData() {
    try {
      Object.values(EventsStorageService.KEYS).forEach(key => {
        StorageService.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  static getStorageInfo() {
    try {
      if (!StorageService.isLocalStorageAvailable()) {
        return { available: false };
      }

      let totalSize = 0;
      const items = {};

      Object.entries(EventsStorageService.KEYS).forEach(([name, key]) => {
        const item = localStorage.getItem(key);
        const size = item ? item.length : 0;
        items[name] = { size, hasData: !!item };
        totalSize += size;
      });

      return {
        available: true,
        totalSize,
        items,
        formatted: {
          totalSize: `${(totalSize / 1024).toFixed(2)} KB`
        }
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { available: false, error: error.message };
    }
  }

  /**
   * Export user data for backup/transfer
   */
  static exportUserData() {
    try {
      const userData = {};
      
      Object.entries(EventsStorageService.KEYS).forEach(([name, key]) => {
        const data = StorageService.getItem(key);
        if (data !== null) {
          userData[name] = data;
        }
      });

      return {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: userData
      };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  }

  /**
   * Import user data from backup
   */
  static importUserData(userData) {
    try {
      if (!userData || !userData.data) {
        throw new Error('Invalid user data format');
      }

      let importedCount = 0;
      
      Object.entries(userData.data).forEach(([name, data]) => {
        const key = EventsStorageService.KEYS[name];
        if (key && StorageService.setItem(key, data)) {
          importedCount++;
        }
      });

      return {
        success: true,
        importedCount,
        totalCount: Object.keys(userData.data).length
      };
    } catch (error) {
      console.error('Error importing user data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user activity summary
   */
  static getUserActivitySummary() {
    try {
      const searchHistory = EventsStorageService.getSearchHistory();
      const favorites = EventsStorageService.getFavoriteEvents();
      const subscriptions = EventsStorageService.getEmailSubscriptions();
      const lastVisit = EventsStorageService.getLastVisit();
      const recentCategories = EventsStorageService.getRecentCategories();

      return {
        totalSearches: searchHistory.length,
        totalFavorites: favorites.length,
        totalSubscriptions: subscriptions.length,
        lastVisit: lastVisit ? new Date(lastVisit) : null,
        topCategories: recentCategories.slice(0, 3),
        isActiveUser: searchHistory.length > 5 || favorites.length > 3,
        daysSinceFirstVisit: lastVisit ? Math.floor((Date.now() - lastVisit) / (1000 * 60 * 60 * 24)) : 0
      };
    } catch (error) {
      console.error('Error getting user activity summary:', error);
      return {
        totalSearches: 0,
        totalFavorites: 0,
        totalSubscriptions: 0,
        lastVisit: null,
        topCategories: [],
        isActiveUser: false,
        daysSinceFirstVisit: 0
      };
    }
  }

  /**
   * Clean up old data (for maintenance)
   */
  static cleanupOldData(daysOld = 30) {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;

      // Clean old email subscriptions
      const subscriptions = EventsStorageService.getEmailSubscriptions();
      const recentSubscriptions = subscriptions.filter(sub => sub.timestamp > cutoffTime);
      
      if (recentSubscriptions.length !== subscriptions.length) {
        StorageService.setItem(EventsStorageService.KEYS.EMAIL_SUBSCRIPTIONS, recentSubscriptions);
        cleanedCount += subscriptions.length - recentSubscriptions.length;
      }

      return {
        success: true,
        cleanedCount,
        cutoffDate: new Date(cutoffTime)
      };
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default EventsStorageService;