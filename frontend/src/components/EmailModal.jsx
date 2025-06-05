// src/components/EmailModal.js
import React, { useState } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { eventsAPI } from '../services/api';
import './EmailModal.css';

// Set the app element for accessibility
Modal.setAppElement('#root');

const EmailModal = ({ isOpen, onClose, event }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await eventsAPI.subscribeAndRedirect({
        email,
        eventId: event._id,
        originalUrl: event.originalUrl
      });

      toast.success('Thank you for subscribing! Redirecting to get tickets...');
      
      // Close modal first
      onClose();
      
      // Handle different types of URLs
      const redirectUrl = response.data.redirectUrl || event.originalUrl;
      
      console.log('Redirecting to:', redirectUrl);
      
      // Try different redirect strategies
      setTimeout(() => {
        // Strategy 1: Try to use the original URL if it looks valid
        if (redirectUrl && (redirectUrl.startsWith('http://') || redirectUrl.startsWith('https://'))) {
          console.log('Opening external URL:', redirectUrl);
          window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        } 
        // Strategy 2: If it's a mock URL or invalid, redirect to a placeholder
        else if (redirectUrl && redirectUrl.includes('example.com')) {
          toast.info('This is a demo event. In a real application, you would be redirected to the actual ticketing page.');
          console.log('Mock event detected, showing demo message');
        }
        // Strategy 3: Fallback for any other URLs
        else {
          console.log('Invalid URL, using fallback message');
          toast.info('Event details saved! You will receive ticket information via email.');
        }
      }, 1000);

    } catch (error) {
      console.error('Subscription error:', error);
      toast.error(error.response?.data?.message || 'Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setErrors({});
      onClose();
    }
  };

  // Helper function to check if URL is valid
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="email-modal"
      overlayClassName="email-modal-overlay"
      shouldCloseOnOverlayClick={!isLoading}
      shouldCloseOnEsc={!isLoading}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2>Get Tickets</h2>
          <button 
            onClick={handleClose} 
            className="close-button"
            disabled={isLoading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="event-info">
            <h3>{event?.title}</h3>
            <p className="event-details">
              📅 {event?.date && new Date(event.date).toLocaleDateString()} at {event?.time}
            </p>
            <p className="event-details">
              📍 {event?.venue?.name}
            </p>
            {/* Show URL info for debugging */}
            {event?.originalUrl && (
              <p className="event-details" style={{ fontSize: '12px', opacity: 0.7 }}>
                🔗 Source: {event.source} | {isValidUrl(event.originalUrl) ? 'Valid URL' : 'Demo URL'}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="email-form">
            <div className="form-group">
              <label htmlFor="email">
                Enter your email to continue to tickets:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className={`email-input ${errors.email ? 'error' : ''}`}
                disabled={isLoading}
                autoFocus
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  'Get Tickets'
                )}
              </button>
            </div>
          </form>

          <div className="privacy-notice">
            <p>
              <small>
                By providing your email, you agree to receive updates about Sydney events. 
                We respect your privacy and won't spam you.
                {event?.source === 'mock' && (
                 <>
                  <br />
                  <strong>Note: This is a demo event for testing purposes.</strong>
                  </>
                )}
              </small>
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmailModal;