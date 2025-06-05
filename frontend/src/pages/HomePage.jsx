// src/pages/HomePage.js
import React, { useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { eventsAPI } from '../services/api';
import EventCard from '../components/EventCard';
import EventFilters from '../components/EventFilters';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import './HomePage.css';

const HomePage = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    category: 'all',
    startDate: null,
    endDate: null,
    sortBy: 'date',
    sortOrder: 'asc'
  });

  // Fetch events with current filters
  const { 
    data: eventsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['events', filters],
    () => eventsAPI.getEvents(filters).then(res => res.data),
    {
      keepPreviousData: true,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );

  // Fetch stats for the header
  const { data: stats } = useQuery(
    'eventStats',
    () => eventsAPI.getStats().then(res => res.data),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  }, []);

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    
    // Scroll to top of events section
    document.getElementById('events-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const events = eventsData?.events || [];
  const pagination = {
    currentPage: eventsData?.currentPage || 1,
    totalPages: eventsData?.totalPages || 1,
    total: eventsData?.total || 0,
    hasNext: eventsData?.hasNext || false,
    hasPrev: eventsData?.hasPrev || false
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>Oops! Something went wrong</h2>
        <p>We couldn't load the events. Please try again.</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Discover Amazing Events in Sydney</h1>
            <p>Find the best events happening in Sydney, Australia. From concerts and festivals to workshops and networking events.</p>
            
            {stats && (
              <div className="stats">
                <div className="stat-item">
                  <span className="stat-number">{stats.upcomingEvents}</span>
                  <span className="stat-label">Upcoming Events</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{stats.categoryCounts?.length || 0}</span>
                  <span className="stat-label">Categories</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Live</span>
                  <span className="stat-label">Auto-Updated</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="filters-section">
        <div className="container">
          <EventFilters onFiltersChange={handleFiltersChange} />
        </div>
      </section>

      {/* Events Section */}
      <section id="events-section" className="events-section">
        <div className="container">
          <div className="section-header">
            <h2>
              {filters.search ? `Search Results` : 'Upcoming Events'}
              {pagination.total > 0 && (
                <span className="results-count">({pagination.total} events found)</span>
              )}
            </h2>
            
            {isLoading && <LoadingSpinner />}
          </div>
                    {isLoading ? (
            <div className="loading-container">
              <LoadingSpinner />
              <p>Loading amazing events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="no-events">
              <div className="no-events-content">
                <h3>No events found</h3>
                <p>
                  {filters.search || filters.category !== 'all' || filters.startDate ? 
                    'Try adjusting your filters to find more events.' :
                    'Check back soon for new events!'
                  }
                </p>
                {(filters.search || filters.category !== 'all' || filters.startDate) && (
                  <button 
                    onClick={() => handleFiltersChange({ 
                      search: '', 
                      category: 'all', 
                      startDate: null, 
                      endDate: null 
                    })}
                    className="btn btn-primary"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Events Grid */}
              <div className="events-grid">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                />
              )}
            </>
          )}
        </div>
      </section>

      {/* Category Highlights */}
      {stats?.categoryCounts && stats.categoryCounts.length > 0 && (
        <section className="categories-section">
          <div className="container">
            <h2>Popular Categories</h2>
            <div className="categories-grid">
              {stats.categoryCounts.slice(0, 6).map((category) => (
                <div 
                  key={category._id} 
                  className="category-card"
                  onClick={() => handleFiltersChange({ category: category._id })}
                >
                  <h3>{category._id}</h3>
                  <p>{category.count} events</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;