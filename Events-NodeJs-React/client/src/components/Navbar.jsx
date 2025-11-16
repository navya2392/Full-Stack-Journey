import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isSearchPage = location.pathname === '/' || location.pathname === '/search';
  const isFavoritesPage = location.pathname === '/favorites';

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-20">
        <div className="flex justify-between items-center h-12">
          {/* Logo/Title */}
          <Link to="/search" className="text-lg font-bold text-gray-900">
            Events Around
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/search"
              className={`flex items-center gap-1.5 transition-colors ${
                isSearchPage ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Search size={16} />
              <span className="font-medium text-sm">Search</span>
            </Link>
            <Link
              to="/favorites"
              className={`flex items-center gap-1.5 transition-colors ${
                isFavoritesPage ? 'text-black' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Heart size={16} />
              <span className="font-medium text-sm">Favorites</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <Link
              to="/search"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 hover:bg-gray-50 rounded-md transition-colors ${
                isSearchPage ? 'text-black' : 'text-gray-400'
              }`}
            >
              <Search size={20} />
              <span className="font-medium">Search</span>
            </Link>
            <Link
              to="/favorites"
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-3 hover:bg-gray-50 rounded-md transition-colors mt-2 ${
                isFavoritesPage ? 'text-black' : 'text-gray-400'
              }`}
            >
              <Heart size={20} />
              <span className="font-medium">Favorites</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
