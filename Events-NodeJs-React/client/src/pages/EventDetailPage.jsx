import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, ExternalLink, CircleCheck, CircleAlert } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [isFavorite, setIsFavorite] = useState(false);
  const [artistData, setArtistData] = useState(null);
  const [artistAlbums, setArtistAlbums] = useState([]);
  const [loadingArtist, setLoadingArtist] = useState(false);

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/event/${id}`);
        
        if (!response.ok) {
          throw new Error('Event not found');
        }
        
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  // Check if event is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      if (event) {
        try {
          const response = await fetch('/api/favorites');
          if (response.ok) {
            const favorites = await response.json();
            setIsFavorite(favorites.some(fav => fav.id === event.id));
          }
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };
    
    checkFavorite();
  }, [event]);

  // Toggle favorite
  const handleFavoriteClick = async () => {
    if (isFavorite) {
      // Remove from favorites
      setIsFavorite(false);
      
      toast(`${event.name} removed from favorites!`, {
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
        if (!response.ok) {
          setIsFavorite(true); // Revert on error
        }
      } catch (error) {
        console.error('Error removing favorite:', error);
        setIsFavorite(true); // Revert on error
      }
    } else {
      // Add to favorites
      // Update backend first - store complete event object
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
          
          toast(`${event.name} added to favorites!`, {
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
      }
    }
  };

  const handleUndoRemove = async () => {
    setIsFavorite(true);
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        toast(`${event.name} re-added to favorites!`, {
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
        setIsFavorite(false);
      }
    } catch (error) {
      console.error('Error re-adding favorite:', error);
      setIsFavorite(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    // Check if we came from favorites or search
    const fromFavorites = location.state?.fromFavorites;
    
    if (fromFavorites) {
      // Navigate to empty search page when coming from favorites
      navigate('/');
    } else {
      // Preserve search state when coming from search results
      navigate('/', { state: { preserveSearch: true } });
    }
  };

  // Format date and time
  const formatDateTime = () => {
    if (!event?.dates?.start?.localDate) return '';
    
    const dateStr = event.dates.start.localDate;
    const timeStr = event.dates.start.localTime;
    
    const date = new Date(dateStr + (timeStr ? `T${timeStr}` : ''));
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    if (timeStr) {
      const formattedTime = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${formattedDate}, ${formattedTime}`;
    }
    
    return formattedDate;
  };

  // Get artists/teams
  const getArtists = () => {
    const attractions = event?._embedded?.attractions || [];
    return attractions.map(attr => attr.name).join(', ');
  };

  // Get venue
  const getVenue = () => {
    return event?._embedded?.venues?.[0]?.name || '';
  };

  // Get genres in the correct order
  const getGenres = () => {
    const classification = event?.classifications?.[0];
    if (!classification) return '';
    
    const genres = [];
    if (classification.segment?.name) genres.push(classification.segment.name);
    if (classification.genre?.name) genres.push(classification.genre.name);
    if (classification.subGenre?.name) genres.push(classification.subGenre.name);
    if (classification.type?.name) genres.push(classification.type.name);
    if (classification.subType?.name) genres.push(classification.subType.name);
    
    return genres.join(', ');
  };

  // Check if event is music related
  const isMusicEvent = () => {
    const segment = event?.classifications?.[0]?.segment?.name;
    return segment?.toLowerCase() === 'music';
  };

  // Get first artist name for Spotify search
  const getFirstArtistName = () => {
    const attractions = event?._embedded?.attractions;
    return attractions?.[0]?.name || null;
  };

  // Fetch artist data from Spotify
  useEffect(() => {
    if (activeTab === 'artist' && event && !artistData) {
      // Check if music event
      const segment = event?.classifications?.[0]?.segment?.name;
      if (segment?.toLowerCase() !== 'music') return;
      
      const fetchArtistData = async () => {
        // Get first artist name
        const attractions = event?._embedded?.attractions;
        const artistName = attractions?.[0]?.name;
        if (!artistName) {
          console.log('No artist name found');
          setLoadingArtist(false);
          return;
        }

        console.log('Fetching artist data for:', artistName);
        setLoadingArtist(true);
        try {
          // Fetch artist details
          console.log('Calling /api/spotify/artist?name=' + artistName);
          const artistResponse = await fetch(`/api/spotify/artist?name=${encodeURIComponent(artistName)}`);
          console.log('Artist response status:', artistResponse.status);
          
          if (artistResponse.ok) {
            const data = await artistResponse.json();
            console.log('Artist data received:', data);
            setArtistData(data);
          } else {
            const errorText = await artistResponse.text();
            console.error('Artist fetch failed:', artistResponse.status, errorText);
          }

          // Fetch artist albums
          console.log('Calling /api/spotify/albums?name=' + artistName);
          const albumsResponse = await fetch(`/api/spotify/albums?name=${encodeURIComponent(artistName)}`);
          console.log('Albums response status:', albumsResponse.status);
          
          if (albumsResponse.ok) {
            const albums = await albumsResponse.json();
            console.log('Albums data received:', albums.length, 'albums');
            setArtistAlbums(albums);
          } else {
            const errorText = await albumsResponse.text();
            console.error('Albums fetch failed:', albumsResponse.status, errorText);
          }
        } catch (error) {
          console.error('Error fetching artist data:', error);
        } finally {
          setLoadingArtist(false);
        }
      };

      fetchArtistData();
    }
  }, [activeTab, event, artistData]);

  // Get price ranges
  const getPriceRanges = () => {
    const priceRanges = event?.priceRanges;
    if (!priceRanges || priceRanges.length === 0) return '';
    
    const range = priceRanges[0];
    if (range.min !== undefined && range.max !== undefined) {
      return `$${range.min} - $${range.max}`;
    } else if (range.min !== undefined) {
      return `From $${range.min}`;
    } else if (range.max !== undefined) {
      return `Up to $${range.max}`;
    }
    return '';
  };

  // Get ticket status with color
  const getTicketStatus = () => {
    const status = event?.dates?.status?.code;
    
    const statusMap = {
      'onsale': { label: 'On Sale', color: 'bg-green-600' },
      'offsale': { label: 'Off Sale', color: 'bg-red-600' },
      'cancelled': { label: 'Canceled', color: 'bg-black' },
      'canceled': { label: 'Canceled', color: 'bg-black' },
      'postponed': { label: 'Postponed', color: 'bg-orange-500' },
      'rescheduled': { label: 'Rescheduled', color: 'bg-orange-500' }
    };
    
    return statusMap[status?.toLowerCase()] || { label: 'N/A', color: 'bg-gray-600' };
  };

  // Get seat map image
  const getSeatMap = () => {
    return event?.seatmap?.staticUrl || '';
  };

  // Get buy tickets URL
  const getBuyTicketsUrl = () => {
    return event?.url || '';
  };

  // Share on Facebook
  const shareOnFacebook = () => {
    const url = getBuyTicketsUrl();
    if (url) {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }
  };

  // Share on Twitter
  const shareOnTwitter = () => {
    const url = getBuyTicketsUrl();
    const text = `Check ${event?.name} on Ticketmaster.`;
    if (url) {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-600">Loading event details...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-600">Error: {error || 'Event not found'}</div>
        </div>
      </div>
    );
  }

  const ticketStatus = getTicketStatus();

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-20 py-2 sm:py-3 md:py-4">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center text-gray-900 hover:text-gray-700 mb-1 text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Search
        </button>

        {/* Event name and actions */}
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold flex-1 min-w-0 w-full sm:w-auto">{event.name}</h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto justify-end">
            <a
              href={getBuyTicketsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white px-3 py-1.5 sm:px-4 sm:py-1.5 text-xs sm:text-sm rounded hover:bg-gray-800 transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
            >
              Buy Tickets
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
            <button
              onClick={handleFavoriteClick}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-150 rounded-md mb-4 sm:mb-6 p-1" style={{ backgroundColor: '#e8e8e8' }}>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-1 text-xs font-medium transition-all rounded ${
                activeTab === 'info'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => isMusicEvent() && setActiveTab('artist')}
              disabled={!isMusicEvent()}
              className={`py-1 text-xs font-medium transition-all rounded ${
                activeTab === 'artist'
                  ? 'bg-white text-gray-900'
                  : isMusicEvent()
                  ? 'text-gray-700 hover:text-gray-900'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              Artist
            </button>
            <button
              onClick={() => setActiveTab('venue')}
              className={`py-1 text-xs font-medium transition-all rounded ${
                activeTab === 'venue'
                  ? 'bg-white text-gray-900'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Venue
            </button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Left column - Info */}
            <div className="space-y-3 sm:space-y-4">
              {/* Date */}
              {formatDateTime() && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1 text-sm">Date</h3>
                  <p className="text-gray-900 text-sm">{formatDateTime()}</p>
                </div>
              )}

              {/* Artist/Team */}
              {getArtists() && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1 text-sm">Artist/Team</h3>
                  <p className="text-gray-900 text-sm">{getArtists()}</p>
                </div>
              )}

              {/* Venue */}
              {getVenue() && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1 text-sm">Venue</h3>
                  <p className="text-gray-900 text-sm">{getVenue()}</p>
                </div>
              )}

              {/* Genres */}
              {getGenres() && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1 text-sm">Genres</h3>
                  <p className="text-gray-900 text-sm">{getGenres()}</p>
                </div>
              )}

              {/* Price Ranges */}
              {getPriceRanges() && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1 text-sm">Price Ranges</h3>
                  <p className="text-gray-900 text-sm">{getPriceRanges()}</p>
                </div>
              )}

              {/* Ticket Status */}
              {event?.dates?.status?.code && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1 text-sm">Ticket Status</h3>
                  <span className={`${ticketStatus.color} text-white px-3 py-1 rounded-md text-xs font-medium inline-block`}>
                    {ticketStatus.label}
                  </span>
                </div>
              )}

              {/* Share - only show if we have a URL to share */}
              {getBuyTicketsUrl() && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm">Share</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={shareOnFacebook}
                      className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Share on Facebook"
                    >
                      <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </button>
                    <button
                      onClick={shareOnTwitter}
                      className="p-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Share on Twitter"
                    >
                      <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right column - Seat Map */}
            <div>
              {getSeatMap() && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 text-sm">Seatmap</h3>
                  <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white">
                    <img 
                      src={getSeatMap()} 
                      alt="Seat Map" 
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'artist' && (
          <div>
            {loadingArtist ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : artistData ? (
              <div>
                {/* Artist Profile */}
                <div className="mb-3">
                  <div className="flex items-start gap-4">
                    {/* Artist Image */}
                    {artistData.image && (
                      <img 
                        src={artistData.image} 
                        alt={artistData.name}
                        className="w-32 sm:w-24 h-32 sm:h-24 rounded object-cover flex-shrink-0"
                      />
                    )}
                    
                    {/* Artist Info */}
                    <div className="flex-1 flex flex-col">
                      <div>
                        <h2 className="text-xl sm:text-lg font-bold mb-0.5">{artistData.name}</h2>
                        
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-12 sm:gap-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                              <span className="text-gray-700 font-medium text-sm sm:text-xs">Followers:</span>
                              <span className="text-gray-900 text-sm sm:text-xs">{artistData.followers.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                              <span className="text-gray-700 font-medium text-sm sm:text-xs">Popularity:</span>
                              <span className="text-gray-900 text-sm sm:text-xs">{artistData.popularity}%</span>
                            </div>
                          </div>
                          
                          {artistData.genres && artistData.genres.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-700 font-medium text-sm sm:text-xs">Genres:</span>
                              <span className="text-gray-900 text-sm sm:text-xs">{artistData.genres.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 md:mt-1">
                        <a
                          href={artistData.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-black text-white px-3.5 py-1.5 sm:px-2.5 sm:py-0.5 rounded text-sm sm:text-[10px] hover:bg-gray-800 transition-colors font-medium"
                        >
                          Open in Spotify
                          <ExternalLink className="w-4 h-4 sm:w-3 sm:h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Albums Section */}
                {artistAlbums.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-base font-bold mb-3">Albums</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {artistAlbums.map((album, index) => (
                        <a
                          key={index}
                          href={album.spotifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          {album.image && (
                            <img 
                              src={album.image} 
                              alt={album.name}
                              className="w-full aspect-square object-cover"
                            />
                          )}
                          <div className="p-1.5">
                            <h4 className="font-medium text-xs text-gray-900 line-clamp-1 mb-0.5">
                              {album.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {album.releaseDate ? new Date(album.releaseDate).getFullYear() : ''}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {album.totalTracks} track{album.totalTracks !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-600 py-12">
                No artist information available
              </div>
            )}
          </div>
        )}

        {activeTab === 'venue' && (
          <div>
            {(() => {
              const venue = event?._embedded?.venues?.[0];
              if (!venue) {
                return <div className="text-center text-gray-600 py-12">No venue information available</div>;
              }

              const venueName = venue.name;
              const venueImage = venue.images?.[0]?.url;
              
              // Build address from available fields (line1, city, state code only)
              const addressParts = [];
              if (venue.address?.line1) addressParts.push(venue.address.line1);
              if (venue.city?.name) addressParts.push(venue.city.name);
              if (venue.state?.stateCode) addressParts.push(venue.state.stateCode);
              const addressText = addressParts.length > 0 ? addressParts.join(', ') : null;
              
              // Build Google Maps search query using venue name and address for better accuracy
              const searchQuery = [venueName, addressText].filter(Boolean).join(', ');
              const googleMapsUrl = searchQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}` : null;
              
              // Get "See Events" URL from venue
              const seeEventsUrl = venue.url;
              
              // Get venue details
              const parkingDetail = venue.parkingDetail;
              const generalRule = venue.generalInfo?.generalRule;
              const childRule = venue.generalInfo?.childRule;

              return (
                <div className="space-y-4">
                  {/* Venue Name, Address and See Events Button */}
                  <div className="mb-4">
                    {/* Mobile Layout - Stacked */}
                    <div className="block md:hidden">
                      <div className="mb-2">
                        {venueName && (
                          <h2 className="text-xl font-bold mb-1">{venueName}</h2>
                        )}
                        
                        {/* Address with link */}
                        {addressText && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 text-sm">{addressText}</span>
                            {googleMapsUrl && (
                              <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-800 flex-shrink-0"
                                title="Open in Google Maps"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* See Events Button - Full width on mobile */}
                      {seeEventsUrl && (
                        <a
                          href={seeEventsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 bg-white text-gray-900 px-2.5 py-2 rounded text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors w-full"
                        >
                          See Events
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    
                    {/* Desktop Layout - Side by side */}
                    <div className="hidden md:flex md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        {venueName && (
                          <h2 className="text-xl font-bold mb-1">{venueName}</h2>
                        )}
                        
                        {/* Address with link */}
                        {addressText && (
                          <div className="flex items-start gap-2">
                            <span className="text-gray-600 text-sm">{addressText}</span>
                            {googleMapsUrl && (
                              <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-800 flex-shrink-0"
                                title="Open in Google Maps"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* See Events Button - Inline on desktop */}
                      {seeEventsUrl && (
                        <a
                          href={seeEventsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-white text-gray-900 px-2.5 py-1 rounded text-xs font-medium border border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          See Events
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Image and Info Section */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Venue Image - full width on mobile, 1/3 width on desktop */}
                    {venueImage && (
                      <div className="w-full md:w-1/3 flex-shrink-0">
                        <div className="flex items-start justify-center bg-white border border-gray-200 rounded p-4">
                          <img 
                            src={venueImage} 
                            alt={venueName || 'Venue'}
                            className="max-w-full h-auto object-contain"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Parking, General Rule, and Child Rule - full width on mobile, 2/3 width on desktop */}
                    <div className={`w-full space-y-4 ${!venueImage ? 'md:w-full' : 'md:w-2/3'}`}>
                      {/* Parking Info */}
                      {parkingDetail && (
                        <div>
                          <h3 className="font-semibold text-gray-600 mb-2 text-sm md:text-xs">Parking</h3>
                          <p className="text-sm md:text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{parkingDetail}</p>
                        </div>
                      )}
                      
                      {/* General Rule */}
                      {generalRule && (
                        <div>
                          <h3 className="font-semibold text-gray-600 mb-2 text-sm md:text-xs">General Rule</h3>
                          <p className="text-sm md:text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{generalRule}</p>
                        </div>
                      )}
                      
                      {/* Child Rule */}
                      {childRule && (
                        <div>
                          <h3 className="font-semibold text-gray-600 mb-2 text-sm md:text-xs">Child Rule</h3>
                          <p className="text-sm md:text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{childRule}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </>
  );
}
