// src/components/EventCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import './EventCard.css';

const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'Date TBA';
    }
  };

  const formatPrice = (price) => {
    if (price.isFree) return 'Free';
    if (price.min === price.max) return `$${price.min}`;
    return `$${price.min} - $${price.max}`;
  };

  const getCategoryColor = (category) => {
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
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Generate a placeholder image based on event category
  const getPlaceholderImage = (category) => {
    const categoryImages = {
      'Technology': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=300&h=200&fit=crop',
      'Business': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop',
      'Arts': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=300&h=200&fit=crop',
      'Music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
      'Sports': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
      'Food': 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop',
      'Health': 'https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=300&h=200&fit=crop',
      'Education': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop',
      'Other': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&h=200&fit=crop'
    };
    return categoryImages[category] || categoryImages['Other'];
  };

  // Generate a fallback image using a reliable service
  const getFallbackImage = () => {
    // Using picsum.photos as a reliable placeholder service
    const seed = event._id || event.title || 'default';
    return `https://picsum.photos/300/200?random=${encodeURIComponent(seed)}`;
  };

  // Generate CSS gradient as ultimate fallback
  const getGradientBackground = (category) => {
    const gradients = {
      'Technology': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'Business': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'Arts': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'Music': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'Sports': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'Food': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'Health': 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
      'Education': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      'Other': 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)'
    };
    return gradients[category] || gradients['Other'];
  };

  const handleImageError = (e) => {
    console.log('Primary image failed, trying fallback for event:', event.title);
    
    // First fallback: try picsum
    if (!e.target.dataset.fallbackTried) {
      e.target.dataset.fallbackTried = 'true';
      e.target.src = getFallbackImage();
      return;
    }
    
    // Second fallback: try category-specific unsplash image
    if (!e.target.dataset.categoryTried) {
      e.target.dataset.categoryTried = 'true';
      e.target.src = getPlaceholderImage(event.category);
      return;
    }
    
    // Final fallback: hide image and show gradient background
    e.target.style.display = 'none';
    e.target.parentElement.style.background = getGradientBackground(event.category);
    e.target.parentElement.style.display = 'flex';
    e.target.parentElement.style.alignItems = 'center';
    e.target.parentElement.style.justifyContent = 'center';
    e.target.parentElement.innerHTML = `
      <div style="color: white; text-align: center; padding: 20px;">
        <div style="font-size: 24px; margin-bottom: 8px;">${getCategoryIcon(event.category)}</div>
        <div style="font-size: 14px; font-weight: 600;">${event.category}</div>
      </div>
    `;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Technology': '💻',
      'Business': '💼',
      'Arts': '🎨',
      'Music': '🎵',
      'Sports': '⚽',
      'Food': '🍽️',
      'Health': '💚',
      'Education': '📚',
      'Other': '🎭'
    };
    return icons[category] || icons['Other'];
  };

  return (
    <div className="event-card">
      <div className="event-image">
        <img 
          src={event.imageUrl || getPlaceholderImage(event.category)} 
          alt={event.title}
          onError={handleImageError}
          loading="lazy"
        />
        <div 
          className="category-badge" 
          style={{ backgroundColor: getCategoryColor(event.category) }}
        >
          {event.category}
        </div>
      </div>
      
      <div className="event-content">
        <div className="event-header">
          <h3 className="event-title">
            <Link to={`/event/${event._id}`}>
              {event.title}
            </Link>
          </h3>
          <span className="event-source">{event.source}</span>
        </div>
        
        <div className="event-meta">
          <div className="event-date">
            <span className="icon">📅</span>
            {formatDate(event.date)} at {event.time}
          </div>
          
          <div className="event-venue">
            <span className="icon">📍</span>
            {event.venue?.name || 'Venue TBA'}
          </div>
          
          <div className="event-price">
            <span className="icon">💰</span>
            {formatPrice(event.price)}
          </div>
        </div>
        
        <p className="event-description">
          {truncateText(event.description)}
        </p>
        
        {event.tags && event.tags.length > 0 && (
          <div className="event-tags">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="event-actions">
          <Link to={`/event/${event._id}`} className="btn btn-primary">
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;