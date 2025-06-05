// src/components/EventFilters.js
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { useQuery } from 'react-query';
import { eventsAPI } from '../services/api';
import 'react-datepicker/dist/react-datepicker.css';
import './EventFilters.css';

const EventFilters = ({ onFiltersChange, initialFilters = {} }) => {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    startDate: null,
    endDate: null,
    sortBy: 'date',
    sortOrder: 'asc',
    ...initialFilters
  });

  // Fetch categories
  const { data: categories = [] } = useQuery(
    'categories',
    () => eventsAPI.getCategories().then(res => res.data),
    {
      staleTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  // Update parent component when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleInputChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    const defaultFilters = {
      search: '',
      category: 'all',
      startDate: null,
      endDate: null,
      sortBy: 'date',
      sortOrder: 'asc'
    };
    setFilters(defaultFilters);
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.category !== 'all' || 
           filters.startDate || 
           filters.endDate ||
           filters.sortBy !== 'date' ||
           filters.sortOrder !== 'asc';
  };

  return (
    <div className="event-filters">
      <div className="filters-container">
        
        {/* Search Input */}
        <div className="filter-group">
          <label htmlFor="search">Search Events</label>
          <input
            id="search"
            type="text"
            placeholder="Search by title, description, or venue..."
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        {/* Category Filter */}
        <div className="filter-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="filter-group date-group">
          <label>Date Range</label>
          <div className="date-inputs">
            <DatePicker
              selected={filters.startDate}
              onChange={(date) => handleInputChange('startDate', date)}
              placeholderText="Start Date"
              className="date-input"
              minDate={new Date()}
              selectsStart
              startDate={filters.startDate}
              endDate={filters.endDate}
            />
            <DatePicker
              selected={filters.endDate}
              onChange={(date) => handleInputChange('endDate', date)}
              placeholderText="End Date"
              className="date-input"
              minDate={filters.startDate || new Date()}
              selectsEnd
              startDate={filters.startDate}
              endDate={filters.endDate}
            />
          </div>
        </div>
                {/* Sort Options */}
        <div className="filter-group">
          <label htmlFor="sortBy">Sort By</label>
          <div className="sort-controls">
            <select
              id="sortBy"
              value={filters.sortBy}
              onChange={(e) => handleInputChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="category">Category</option>
              <option value="price.min">Price</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleInputChange('sortOrder', e.target.value)}
              className="filter-select"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <div className="filter-group">
            <button 
              onClick={clearFilters}
              className="btn btn-secondary clear-filters-btn"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventFilters;