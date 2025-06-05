// src/services/utils.js

/**
 * Utility functions for the Sydney Events application
 */

/**
 * Date and Time Utilities
 */
export const DateUtils = {
  /**
   * Format date for display
   */
  formatDate: (date, format = 'medium') => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';

      const options = {
        short: { month: 'short', day: 'numeric' },
        medium: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
        long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
        datetime: { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        }
      };

      return d.toLocaleDateString('en-AU', options[format] || options.medium);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date Error';
    }
  },

  /**
   * Get relative time (e.g., "2 hours ago", "in 3 days")
   */
  getRelativeTime: (date) => {
    try {
      const now = new Date();
      const eventDate = new Date(date);
      const diffMs = eventDate.getTime() - now.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (Math.abs(diffMinutes) < 60) {
        return diffMinutes > 0 ? `in ${diffMinutes} minutes` : `${Math.abs(diffMinutes)} minutes ago`;
      } else if (Math.abs(diffHours) < 24) {
        return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
      } else if (Math.abs(diffDays) < 7) {
        return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
      } else {
        return DateUtils.formatDate(date, 'medium');
      }
    } catch (error) {
      return DateUtils.formatDate(date, 'medium');
    }
  },

  /**
   * Check if date is today
   */
  isToday: (date) => {
    try {
      const today = new Date();
      const checkDate = new Date(date);
      return today.toDateString() === checkDate.toDateString();
    } catch (error) {
      return false;
    }
  },

  /**
   * Check if date is tomorrow
   */
  isTomorrow: (date) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const checkDate = new Date(date);
      return tomorrow.toDateString() === checkDate.toDateString();
    } catch (error) {
      return false;
    }
  },

  /**
   * Check if date is this week
   */
  isThisWeek: (date) => {
    try {
      const now = new Date();
      const checkDate = new Date(date);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return checkDate >= weekStart && checkDate <= weekEnd;
    } catch (error) {
      return false;
    }
  }
};

/**
 * URL and Navigation Utilities
 */
export const URLUtils = {
  /**
   * Create a URL-friendly slug
   */
  createSlug: (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  },

  /**
   * Parse query parameters from URL
   */
  parseQueryParams: (search = window.location.search) => {
    const params = new URLSearchParams(search);
    const result = {};
    
    for (const [key, value] of params.entries()) {
      // Handle arrays (e.g., ?tags=music&tags=arts becomes tags: ['music', 'arts'])
      if (result[key]) {
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }
    
    return result;
  },

  /**
   * Build query string from object
   */
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    return searchParams.toString();
  },

  /**
   * Update URL without page reload
   */
  updateURL: (params, replace = false) => {
    try {
      const queryString = URLUtils.buildQueryString(params);
      const newURL = `${window.location.pathname}${queryString ? '?' + queryString : ''}`;
      
      if (replace) {
        window.history.replaceState({}, '', newURL);
      } else {
        window.history.pushState({}, '', newURL);
      }
    } catch (error) {
      console.error('Error updating URL:', error);
    }
  }
};

/**
 * Text and Content Utilities
 */
export const TextUtils = {
  /**
   * Truncate text to specified length
   */
  truncate: (text, maxLength = 100, suffix = '...') => {
    if (!text || text.length <= maxLength) return text || '';
    
    const truncated = text.substring(0, maxLength).trim();
    
    // Try to break at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + suffix;
    }
    
    return truncated + suffix;
  },

  /**
   * Extract keywords from text
   */
  extractKeywords: (text, minLength = 3) => {
    if (!text) return [];
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= minLength)
      .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));
    
    // Count frequency and return unique words
    const frequency = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.keys(frequency).sort((a, b) => frequency[b] - frequency[a]);
  },

  /**
   * Highlight search terms in text
   */
  highlightSearchTerms: (text, searchTerms, className = 'highlight') => {
    if (!text || !searchTerms) return text;
    
    const terms = Array.isArray(searchTerms) ? searchTerms : [searchTerms];
    let highlightedText = text;
    
    terms.forEach(term => {
      if (term.trim()) {
        const regex = new RegExp(`(${term.trim()})`, 'gi');
        highlightedText = highlightedText.replace(
          regex, 
          `<span class="${className}">$1</span>`
        );
      }
    });
    
    return highlightedText;
  },

  /**
   * Convert text to title case
   */
  toTitleCase: (text) => {
    if (!text) return '';
    
    return text.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }
};

/**
 * Validation Utilities
 */
export const ValidationUtils = {
  /**
   * Validate email address
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL
   */
  isValidURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Validate phone number (basic)
   */
  isValidPhone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },

  /**
   * Sanitize HTML input
   */
  sanitizeHTML: (html) => {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  }
};

/**
 * Browser and Device Utilities
 */
export const BrowserUtils = {
  /**
   * Check if running on mobile device
   */
  isMobile: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Check if running on iOS
   */
  isIOS: () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  /**
   * Check if browser supports a feature
   */
  supportsFeature: (feature) => {
    const features = {
      localStorage: () => {
        try {
          const test = '__test__';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch (e) {
          return false;
        }
      },
      geolocation: () => 'geolocation' in navigator,
      webShare: () => 'share' in navigator,
      serviceWorker: () => 'serviceWorker' in navigator,
      webPush: () => 'PushManager' in window,
      clipboard: () => 'clipboard' in navigator
    };
    
    return features[feature] ? features[feature]() : false;
  },

  /**
   * Copy text to clipboard
   */
  copyToClipboard: async (text) => {
    try {
      if (BrowserUtils.supportsFeature('clipboard')) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  },

  /**
   * Share content using Web Share API or fallback
   */
  shareContent: async (shareData) => {
    try {
      if (BrowserUtils.supportsFeature('webShare')) {
        await navigator.share(shareData);
        return { success: true, method: 'native' };
      } else {
        // Fallback: copy URL to clipboard
        const url = shareData.url || window.location.href;
        const success = await BrowserUtils.copyToClipboard(url);
        return { success, method: 'clipboard' };
      }
    } catch (error) {
      console.error('Error sharing content:', error);
      return { success: false, error: error.message };
    }
  }
};

/**
 * Performance and Optimization Utilities
 */
export const PerformanceUtils = {
  /**
   * Debounce function calls
   */
  debounce: (func, wait, immediate = false) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  },

  /**
   * Throttle function calls
   */
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Lazy load images
   */
  lazyLoadImage: (img, src, placeholder = null) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = src;
          if (placeholder) {
            image.style.background = 'none';
          }
          observer.unobserve(image);
        }
      });
    });
    
    if (placeholder) {
      img.style.background = `url(${placeholder}) center/cover`;
    }
    
    observer.observe(img);
    return observer;
  }
};

/**
 * Event Specific Utilities
 */
export const EventUtils = {
  /**
   * Get category color
   */
  getCategoryColor: (category) => {
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
  },

  /**
   * Format event price
   */
  formatPrice: (price) => {
    if (!price || price.isFree) return 'Free';
    
    const currency = price.currency || 'AUD';
    
    if (price.min === price.max) {
      return `$${price.min} ${currency}`;
    }
    
    return `$${price.min} - $${price.max} ${currency}`;
  },

  /**
   * Generate event sharing text
   */
  generateShareText: (event) => {
    if (!event) return '';
    
    const date = DateUtils.formatDate(event.date, 'medium');
    const venue = event.venue?.name || 'TBA';
    
    return `Check out "${event.title}" on ${date} at ${venue}!`;
  },

  /**
   * Calculate event popularity score
   */
  calculatePopularityScore: (event) => {
    let score = 0;
    
    // Base score from category popularity
    const categoryWeights = {
      'Technology': 5,
      'Business': 4,
      'Music': 5,
      'Arts': 3,
      'Sports': 4,
      'Food': 3,
      'Health': 2,
      'Education': 2,
      'Other': 1
    };
    
    score += categoryWeights[event.category] || 1;
    
    // Add points for free events
    if (event.price?.isFree) score += 2;
    
    // Add points for events with images
    if (event.imageUrl) score += 1;
    
    // Add points for events with detailed descriptions
    if (event.description && event.description.length > 100) score += 1;
    
    // Add points for events with tags
    if (event.tags && event.tags.length > 0) score += 1;
    
    return Math.min(score, 10); // Cap at 10
  }
};

// Export all utilities as a combined object
export const Utils = {
  Date: DateUtils,
  URL: URLUtils,
  Text: TextUtils,
  Validation: ValidationUtils,
  Browser: BrowserUtils,
  Performance: PerformanceUtils,
  Event: EventUtils
};

export default Utils;