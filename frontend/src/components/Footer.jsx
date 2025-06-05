// src/components/Footer.js
import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          
          <div className="footer-section">
            <h3>Sydney Events</h3>
            <p>Discover the best events happening in Sydney, Australia. Automatically updated from multiple sources.</p>
          </div>

          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="/">All Events</a></li>
              <li><a href="/?category=Technology">Tech Events</a></li>
              <li><a href="/?category=Business">Business Events</a></li>
              <li><a href="/?category=Arts">Arts & Culture</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Categories</h4>
            <ul>
              <li><a href="/?category=Music">Music</a></li>
              <li><a href="/?category=Sports">Sports</a></li>
              <li><a href="/?category=Food">Food & Dining</a></li>
              <li><a href="/?category=Health">Health & Wellness</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Information</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p>&copy; {currentYear} Sydney Events. All rights reserved.</p>
            <div className="footer-meta">
              <p>Data sourced from Eventbrite, Meetup, and other event platforms</p>
              <p>Events update automatically every hour</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;