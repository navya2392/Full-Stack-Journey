import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchPage from './pages/SearchPage';
import EventDetailPage from './pages/EventDetailPage';
import FavoritesPage from './pages/FavoritesPage';

function App() {
  useEffect(() => {
    const handleClick = (e) => {
      // Get the actual click coordinates
      const x = e.clientX;
      const y = e.clientY;
      
      const ripple = document.createElement('div');
      ripple.className = 'click-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      // Append to body to avoid positioning context issues
      document.body.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 400);
    };

    // Listen to both mousedown and click events to catch all interactions
    document.addEventListener('mousedown', handleClick, { capture: true, passive: true });
    
    return () => {
      document.removeEventListener('mousedown', handleClick, { capture: true });
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
