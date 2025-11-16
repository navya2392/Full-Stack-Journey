import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export default function EventCard({ event, onFavoriteChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract event data
  const eventName = event.name || 'Untitled Event';
  const eventDate = event.dates?.start?.localDate || '';
  const eventTime = event.dates?.start?.localTime || '';
  const venueName = event._embedded?.venues?.[0]?.name || 'TBA';
  const category = event.classifications?.[0]?.segment?.name || 'Miscellaneous';
  const imageUrl = event.images?.[0]?.url || '';

  // Format date and time
  const formatDateTime = () => {
    if (!eventDate) return '';
    
    const date = new Date(eventDate + (eventTime ? `T${eventTime}` : ''));
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    if (eventTime) {
      const timeStr = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${dateStr}, ${timeStr}`;
    }
    
    return dateStr;
  };

  // Check if event is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const favorites = await response.json();
          setIsFavorite(favorites.some(fav => fav.id === event.id));
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    checkFavorite();
  }, [event.id]);

  // Undo remove favorite
  const handleUndoRemove = async () => {
    setIsFavorite(true);
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        toast(`${eventName} re-added to favorites!`, {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="black"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ),
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #e5e7eb'
          }
        });
        
        // Call parent callback if provided
        if (onFavoriteChange) {
          onFavoriteChange();
        }
      }
    } catch (error) {
      console.error('Error re-adding favorite:', error);
      setIsFavorite(false);
    }
  };

  // Toggle favorite
  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    
    // Prevent duplicate calls
    if (isProcessing) return;
    
    if (isFavorite) {
      // Remove from favorites
      setIsFavorite(false);
      
      toast(`${eventName} removed from favorites!`, {
        duration: 5000,
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="black"/>
            <path d="M12 8v4m0 4h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ),
        action: {
          label: 'Undo',
          onClick: () => handleUndoRemove()
        },
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb'
        },
        actionButtonStyle: {
          background: '#1f2937',
          color: 'white',
          fontWeight: '500',
          padding: '4px 12px',
          borderRadius: '4px'
        }
      });
      
      // Update backend
      try {
        const response = await fetch(`/api/favorites/${event.id}`, { method: 'DELETE' });
        if (response.ok) {
          // Call parent callback if provided
          if (onFavoriteChange) {
            onFavoriteChange();
          }
        }
      } catch (error) {
        console.error('Error removing favorite:', error);
        setIsFavorite(true); // Revert on error
      }
    } else {
      // Add to favorites
      // Update backend first - store entire event object
      setIsProcessing(true);
      try {
        console.log('Adding to favorites:', event.id);
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event)
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
          // Only set favorite and show success toast if API call succeeded
          setIsFavorite(true);
          console.log('Successfully added to favorites');
          
          toast(`${eventName} added to favorites!`, {
            description: 'You can view it in the Favorites page.',
            icon: (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="black"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
            style: {
              background: 'white',
              color: 'black',
              border: '1px solid #e5e7eb'
            }
          });
        } else {
          // Show specific error message
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to add favorite:', response.status, errorData);
          
          if (response.status === 409) {
            toast.error('Event already in favorites');
          } else {
            toast.error(`Failed to add to favorites (Status: ${response.status})`);
          }
        }
      } catch (error) {
        console.error('Error adding favorite:', error);
        toast.error(`Failed to add to favorites: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCardClick = () => {
    // Check if we're in the favorites page
    const fromFavorites = location.pathname === '/favorites';
    navigate(`/event/${event.id}`, { state: { fromFavorites } });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer group border border-gray-200"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-200">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={eventName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-300">
            <span className="text-gray-500 text-sm">No Image</span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-white px-2 py-0.5 rounded text-xs font-medium text-gray-800 shadow-sm">
            {category}
          </span>
        </div>
        
        {/* Date Badge */}
        <div className="absolute top-2 right-2">
          <span className="bg-white px-2 py-0.5 rounded text-xs font-medium text-gray-800 shadow-sm">
            {formatDateTime()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 bg-white">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-0.5 line-clamp-1">
              {eventName}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-1">
              {venueName}
            </p>
          </div>
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="flex-shrink-0 p-1.5 rounded hover:bg-gray-50 transition-colors border border-gray-300"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart 
              size={16} 
              className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-gray-600'}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
