// src/pages/AboutPage.js
import React from 'react';
import './AboutPage.css';

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="container">
        
        {/* Hero Section */}
        <section className="about-hero">
          <h1>About Sydney Events</h1>
          <p className="hero-subtitle">
            Your ultimate guide to discovering amazing events in Sydney, Australia
          </p>
        </section>

        {/* Main Content */}
        <section className="about-content">
          <div className="content-grid">
            
            <div className="content-section">
              <h2>What We Do</h2>
              <p>
                Sydney Events is an automated event discovery platform that aggregates and displays 
                the best events happening in Sydney, Australia. We scrape data from multiple popular 
                event platforms including Eventbrite, Meetup, and Facebook Events to bring you a 
                comprehensive view of what's happening in the city.
              </p>
              <p>
                Our platform automatically updates every hour, ensuring you never miss out on the 
                latest events, whether they're concerts, workshops, business networking events, 
                cultural festivals, or community gatherings.
              </p>
            </div>

            <div className="content-section">
              <h2>How It Works</h2>
              <div className="features-list">
                <div className="feature-item">
                  <span className="feature-icon">🔍</span>
                  <div>
                    <h3>Automated Scraping</h3>
                    <p>Our system continuously monitors multiple event platforms for new Sydney events</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <span className="feature-icon">🔄</span>
                  <div>
                    <h3>Real-time Updates</h3>
                    <p>Events are updated hourly to ensure accuracy and freshness of information</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <span className="feature-icon">🎯</span>
                  <div>
                    <h3>Smart Categorization</h3>
                    <p>Events are automatically categorized and tagged for easy discovery</p>
                  </div>
                </div>
                
                <div className="feature-item">
                  <span className="feature-icon">📧</span>
                  <div>
                    <h3>Email Integration</h3>
                    <p>Get notified about events you're interested in before being redirected to buy tickets</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-section">
              <h2>Event Sources</h2>
              <p>We aggregate events from trusted platforms including:</p>
              <ul className="sources-list">
                <li><strong>Eventbrite:</strong> Professional events, workshops, and conferences</li>
                <li><strong>Meetup:</strong> Community gatherings, networking, and interest groups</li>
                <li><strong>Facebook Events:</strong> Social events and community activities</li>
                <li><strong>Local Venues:</strong> Direct partnerships with Sydney venues</li>
              </ul>
            </div>
                        <div className="content-section">
              <h2>Privacy & Data</h2>
              <p>
                We respect your privacy and only collect email addresses when you voluntarily 
                provide them to get event tickets. We do not store personal data unnecessarily 
                and follow best practices for data protection.
              </p>
              <p>
                All event data is publicly available information sourced from the original 
                event platforms. We provide attribution to original sources and redirect 
                users to official ticketing pages.
              </p>
            </div>

            <div className="content-section">
              <h2>Technology Stack</h2>
              <div className="tech-grid">
                <div className="tech-item">
                  <h4>Frontend</h4>
                  <ul>
                    <li>React.js</li>
                    <li>React Query</li>
                    <li>React Router</li>
                    <li>CSS3</li>
                  </ul>
                </div>
                <div className="tech-item">
                  <h4>Backend</h4>
                  <ul>
                    <li>Node.js</li>
                    <li>Express.js</li>
                    <li>MongoDB</li>
                    <li>Mongoose</li>
                  </ul>
                </div>
                <div className="tech-item">
                  <h4>Scraping</h4>
                  <ul>
                    <li>Puppeteer</li>
                    <li>Cheerio</li>
                    <li>Axios</li>
                    <li>Node-cron</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-cta">
          <div className="cta-content">
            <h2>Ready to Discover Events?</h2>
            <p>Start exploring the amazing events happening in Sydney today!</p>
            <a href="/" className="btn btn-primary btn-large">
              Browse Events
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;