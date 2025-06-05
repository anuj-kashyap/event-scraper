// src/pages/EventDetailPage.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { eventsAPI } from '../services/api';
import EmailModal from '../components/EmailModal';
import LoadingSpinner from '../components/LoadingSpinner';
import './EventDetailPage.css';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const { 
    data: event, 
    isLoading, 
    error 
  } = useQuery(
    ['event', id],
    () => eventsAPI.getEvent(id).then(res => res.data),
    {
      enabled: !!id,
    }
  );

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM do, yyyy');
    } catch (error) {
      return 'Date TBA';
    }
  };

  const formatPrice = (price) => {
    if (price.isFree) return 'Free Event';
    if (price.min === price.max) return `$${price.min} ${price.currency}`;
    return `$${price.min} - $${price.max} ${price.currency}`;
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

  const handleGetTickets = () => {
    setIsEmailModalOpen(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <LoadingSpinner />
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Event Not Found</h2>
        <p>The event you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Back to Events
        </button>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="event-detail-page">
      <div className="container">
        
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <button onClick={() => navigate('/')} className="breadcrumb-link">
            ← Back to Events
          </button>
        </nav>

        {/* Event Header */}
        <header className="event-header">
          <div className="event-image-container">
            <img 
              src={event.imageUrl || '/api/placeholder/800/400'} 
              alt={event.title}
              className="event-image"
              onError={(e) => {
                e.target.src = '/api/placeholder/800/400';
              }}
            />
            <div 
              className="category-badge large" 
              style={{ backgroundColor: getCategoryColor(event.category) }}
            >
              {event.category}
            </div>
          </div>

          <div className="event-info">
            <h1 className="event-title">{event.title}</h1>
            
            <div className="event-meta">
              <div className="meta-item">
                <span className="icon">📅</span>
                <div>
                  <strong>Date & Time</strong>
                  <p>{formatDate(event.date)} at {event.time}</p>
                </div>
              </div>
                            <div className="meta-item">
                <span className="icon">📍</span>
                <div>
                  <strong>Venue</strong>
                  <p>{event.venue.name}</p>
                  <p className="venue-address">{event.venue.address}</p>
                </div>
              </div>

              <div className="meta-item">
                <span className="icon">💰</span>
                <div>
                  <strong>Price</strong>
                  <p>{formatPrice(event.price)}</p>
                </div>
              </div>

              <div className="meta-item">
                <span className="icon">👥</span>
                <div>
                  <strong>Organizer</strong>
                  <p>{event.organizer.name}</p>
                </div>
              </div>
            </div>

            <div className="event-actions">
              <button 
                onClick={handleGetTickets}
                className="btn btn-primary btn-large"
              >
                Get Tickets
              </button>
              <button 
                onClick={handleShare}
                className="btn btn-secondary"
              >
                Share Event
              </button>
            </div>
          </div>
        </header>

        {/* Event Details */}
        <section className="event-details">
          <div className="details-grid">
            
            {/* Description */}
            <div className="description-section">
              <h2>About This Event</h2>
              <div className="description-content">
                {event.description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Event Information Sidebar */}
            <aside className="event-sidebar">
              <div className="sidebar-section">
                <h3>Event Information</h3>
                <ul className="info-list">
                  <li>
                    <strong>Source:</strong> 
                    <span className="source-badge">{event.source}</span>
                  </li>
                  <li>
                    <strong>Last Updated:</strong> 
                    {format(new Date(event.updatedAt), 'MMM dd, yyyy')}
                  </li>
                  {event.endDate && (
                    <li>
                      <strong>End Date:</strong> 
                      {format(new Date(event.endDate), 'MMM dd, yyyy')}
                    </li>
                  )}
                </ul>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div className="sidebar-section">
                  <h3>Tags</h3>
                  <div className="tags-container">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Map Placeholder */}
              <div className="sidebar-section">
                <h3>Location</h3>
                <div className="map-placeholder">
                  <p>📍 {event.venue.name}</p>
                  <p>{event.venue.address}</p>
                  <p>{event.venue.city}, {event.venue.state}</p>
                  <a 
                    href={`https://maps.google.com/?q=${encodeURIComponent(event.venue.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>
                {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Join?</h2>
            <p>Don't miss out on this amazing event!</p>
            <button 
              onClick={handleGetTickets}
              className="btn btn-primary btn-large"
            >
              Get Your Tickets Now
            </button>
          </div>
        </section>
      </div>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        event={event}
      />
    </div>
  );
};

export default EventDetailPage;