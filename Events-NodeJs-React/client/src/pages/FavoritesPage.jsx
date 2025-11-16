import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import EventCard from '../components/EventCard';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites from backend
  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      } else {
        console.error('Failed to fetch favorites');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Handle favorite removal - refetch the list
  const handleFavoriteChange = () => {
    // Refetch favorites after a short delay to allow DB operation to complete
    setTimeout(() => {
      fetchFavorites();
    }, 500);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-8">
        <h1 className="text-xl font-semibold mb-6">Favorites</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 md:px-20 py-8">
        <h1 className="text-xl font-semibold mb-6">Favorites</h1>
        
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-lg font-medium">No favorite events yet</p>
            <p className="text-gray-600 mt-2">Add events to your favorites by clicking the heart icon on any event.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((event) => (
              <EventCard 
                key={event.id} 
                event={event}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
