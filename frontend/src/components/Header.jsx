// src/components/Header.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <h1>Sydney Events</h1>
            <span className="tagline">Discover Amazing Events in Sydney</span>
          </Link>
          
          <nav className="nav">
            <Link to="/" className="nav-link">Events</Link>
            <Link to="/about" className="nav-link">About</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;