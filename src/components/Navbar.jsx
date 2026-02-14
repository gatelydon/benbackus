import React from "react";
import { Link, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar() {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '';

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="navbar-container">
        <div className="navbar">
            {isHomePage ? (
              <>
                <a className="nav-link" href="#about" onClick={(e) => scrollToSection(e, 'about')}>About</a>
                <a className="nav-link" href="#coding" onClick={(e) => scrollToSection(e, 'coding')}>Coding</a>
                <a className="nav-link" href="#art" onClick={(e) => scrollToSection(e, 'art')}>Art</a>
                <a className="nav-link" href="#writing" onClick={(e) => scrollToSection(e, 'writing')}>Writing</a>
                <a className="nav-link" href="#study" onClick={(e) => scrollToSection(e, 'study')}>Study</a>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/">Home</Link>
              </>
            )}
        </div>
    </div>
  );
}

export default Navbar;
