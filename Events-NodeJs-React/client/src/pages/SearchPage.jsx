import React, { useState, useEffect } from 'react';
import { X, Search as SearchIcon, ChevronDown, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import EventCard from '../components/EventCard';
import CustomDropdown from '../components/CustomDropdown';
import CustomDropdownMobile from '../components/CustomDropdownMobile';

// Store search state globally to persist across navigation
let savedSearchState = null;
let savedScrollPosition = 0;

export default function SearchPage() {
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    keyword: '',
    category: 'All',
    location: '',
    autoDetect: false,
    distance: '10'
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isKeywordFocused, setIsKeywordFocused] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [errors, setErrors] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restore search state when coming back from event details
  useEffect(() => {
    if (location.state?.preserveSearch && savedSearchState) {
      setFormData(savedSearchState.formData);
      setSearchResults(savedSearchState.results);
      setUserLocation(savedSearchState.userLocation);
      
      // Restore scroll position after render
      setTimeout(() => {
        window.scrollTo(0, savedScrollPosition);
      }, 0);
    } else if (!location.state?.preserveSearch) {
      // Clear saved state if navigating without preserve flag (e.g., from favorites)
      savedSearchState = null;
      savedScrollPosition = 0;
    }
  }, [location.state]);

  // Save search state before navigating away
  useEffect(() => {
    const handleScroll = () => {
      savedScrollPosition = window.scrollY;
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (searchResults) {
        savedSearchState = {
          formData,
          results: searchResults,
          userLocation
        };
      }
    };
  }, [formData, searchResults, userLocation]);

  const categories = [
    'All',
    'Music',
    'Sports',
    'Arts & Theatre',
    'Film',
    'Miscellaneous'
  ];

  const fetchUserLocation = async () => {
    try {
      console.log('Fetching user location from ipinfo.io...');
      const response = await fetch('https://ipinfo.io/json?token=de5d09082712ed');
      console.log('IPInfo fetch response status:', response.status);
      
      if (!response.ok) {
        console.error('IPInfo API returned error status:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('IPInfo response:', data);
      
      if (data.loc) {
        const [lat, lng] = data.loc.split(',');
        const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
        console.log('Parsed location:', location);
        setUserLocation(location);
        return location;
      } else {
        console.error('No location data in ipinfo response');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user location:', error);
      console.error('Error details:', error.message);
      return null;
    }
  };

  // Auto-detect user location using ipinfo.io
  useEffect(() => {
    if (formData.autoDetect && !userLocation) {
      fetchUserLocation();
    }
  }, [formData.autoDetect, userLocation]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear location if auto-detect is enabled
    if (name === 'autoDetect' && checked) {
      setFormData(prev => ({ ...prev, location: '' }));
      // Clear location error when auto-detect is enabled
      setErrors(prev => ({ ...prev, location: null }));
    }

    // Real-time validation for distance field
    if (name === 'distance') {
      const distance = parseFloat(value);
      if (value && isNaN(distance)) {
        setErrors(prev => ({ ...prev, distance: 'Distance must be a number' }));
      } else if (distance > 100) {
        setErrors(prev => ({ ...prev, distance: 'Distance cannot exceed 100 miles' }));
      } else {
        setErrors(prev => ({ ...prev, distance: null }));
      }
    } else {
      // Clear errors when user types in other fields
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    }
  };

  const handleDistanceBlur = (e) => {
    const value = e.target.value.trim();
    if (value === '') {
      setErrors(prev => ({ ...prev, distance: 'Distance must be a number' }));
    } else {
      const distance = parseFloat(value);
      if (isNaN(distance)) {
        setErrors(prev => ({ ...prev, distance: 'Distance must be a number' }));
      } else if (distance > 100) {
        setErrors(prev => ({ ...prev, distance: 'Distance cannot exceed 100 miles' }));
      } else {
        setErrors(prev => ({ ...prev, distance: null }));
      }
    }
  };

  const handleKeywordChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, keyword: value }));
    
    // Clear errors when user types
    if (errors.keyword) {
      setErrors(prev => ({ ...prev, keyword: null }));
    }

    // Only hide suggestions if the field is completely empty
    if (value.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoadingSuggestions(false);
      return;
    }

    // Fetch suggestions for any non-empty value
    setIsLoadingSuggestions(true);
    try {
      console.log('Fetching suggestions for:', value);
      const response = await fetch(`/api/suggest?keyword=${encodeURIComponent(value)}`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Received data:', data);
      const apiSuggestions = data.suggestions || [];
      
      // Always add the entered value as the first suggestion
      // Filter out if it already exists in the API suggestions to avoid duplicates
      const filteredSuggestions = apiSuggestions.filter(
        s => s.toLowerCase().trim() !== value.toLowerCase().trim()
      );
      
      // Ensure the typed value is always first
      const newSuggestions = [value, ...filteredSuggestions];
      
      console.log('Final suggestions with typed value first:', newSuggestions);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Even on error, show the typed value as a suggestion
      setSuggestions([value]);
      setShowSuggestions(true);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setFormData(prev => ({ ...prev, keyword: suggestion }));
    setShowSuggestions(false);
  };

  const clearKeyword = () => {
    setFormData(prev => ({ ...prev, keyword: '' }));
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.keyword.trim()) {
      newErrors.keyword = 'Please enter some keywords';
    }

    if (!formData.autoDetect && !formData.location.trim()) {
      newErrors.location = 'Location is required when auto-detect is disabled';
    }

    // Validate distance
    const distance = parseFloat(formData.distance);
    if (isNaN(distance)) {
      newErrors.distance = 'Distance must be a number';
    } else if (distance > 100) {
      newErrors.distance = 'Distance cannot exceed 100 miles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Hide suggestions dropdown when submitting
    setShowSuggestions(false);

    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }

    console.log('Form validated, starting search...');
    console.log('Auto-detect enabled:', formData.autoDetect);
    console.log('User location:', userLocation);

    try {
      let lat, lng;

      // Get coordinates based on auto-detect or manual location
      if (formData.autoDetect) {
        console.log('Using auto-detect for location');
        // Use ipinfo.io to get user location
        if (userLocation) {
          console.log('Using cached user location:', userLocation);
          lat = userLocation.lat;
          lng = userLocation.lng;
        } else {
          console.log('Fetching user location...');
          // Fetch location if not already fetched
          const location = await fetchUserLocation();
          console.log('Fetched location:', location);
          if (location) {
            lat = location.lat;
            lng = location.lng;
          } else {
            console.error('Failed to detect location');
            setErrors({ location: 'Failed to detect location' });
            return;
          }
        }
        console.log('Using coordinates from auto-detect:', { lat, lng });
      } else {
        // Use Google Geocoding API to convert location to lat/lng
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.location)}&key=AIzaSyBwpB2e3eNjXDLiw1YZYCHZf0mP9bjLJmk`;
        console.log('Calling Geocoding API for location:', formData.location);
        const geocodeResponse = await fetch(geocodeUrl);
        const geocodeData = await geocodeResponse.json();
        console.log('Geocoding response:', geocodeData);

        if (geocodeData.status === 'OK' && geocodeData.results.length > 0) {
          lat = geocodeData.results[0].geometry.location.lat;
          lng = geocodeData.results[0].geometry.location.lng;
          console.log('Geocoded coordinates:', { lat, lng });
        } else {
          console.error('Geocoding failed:', geocodeData.status, geocodeData.error_message);
          setErrors({ location: `Invalid location: ${geocodeData.status}` });
          return;
        }
      }

      // Build query parameters
      const params = new URLSearchParams({
        keyword: formData.keyword,
        distance: formData.distance,
        lat: lat.toString(),
        lng: lng.toString()
      });

      // Add category if not "All"
      if (formData.category !== 'All') {
        params.append('category', formData.category);
      }

      // Call backend API
      console.log('Calling backend with params:', params.toString());
      console.log('Full API URL:', `/api/searchEvents?${params.toString()}`);
      setIsLoading(true);
      setSearchResults(null);
      
      const response = await fetch(`/api/searchEvents?${params.toString()}`);
      console.log('API Response status:', response.status);
      console.log('API Response ok:', response.ok);
      
      const data = await response.json();

      console.log('Search results:', data);
      console.log('Number of events:', data._embedded?.events?.length || 0);
      setSearchResults(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error during search:', error);
      setErrors({ submit: 'Search failed. Please try again.' });
      setIsLoading(false);
    }
  };

  // Sort events by date/time (ascending)
  const getSortedEvents = () => {
    if (!searchResults?._embedded?.events) return [];
    
    const events = [...searchResults._embedded.events];
    
    // Sort by local date and time in ascending order
    return events.sort((a, b) => {
      const dateA = new Date(a.dates?.start?.localDate + 'T' + (a.dates?.start?.localTime || '00:00:00'));
      const dateB = new Date(b.dates?.start?.localDate + 'T' + (b.dates?.start?.localTime || '00:00:00'));
      return dateA - dateB;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-20 py-1.5">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap items-start gap-3">
              {/* Keyword Field */}
              <div className="flex-1 min-w-[200px] relative">
                <label className={`block text-xs font-medium mb-1 ${errors.keyword ? 'text-red-700' : 'text-gray-700'}`}>
                  Keywords <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="keyword"
                    value={formData.keyword}
                    onChange={handleKeywordChange}
                    onFocus={() => setIsKeywordFocused(true)}
                    onBlur={() => setTimeout(() => setIsKeywordFocused(false), 200)}
                    placeholder="Search for events..."
                    className={`w-full px-2.5 py-1.5 pr-14 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs ${
                      errors.keyword ? 'border-red-700' : 'border-gray-300'
                    }`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isLoadingSuggestions && (
                      <Loader2 size={16} className="text-gray-400 animate-spin" />
                    )}
                    {formData.keyword && !isLoadingSuggestions && (
                      <button
                        type="button"
                        onClick={clearKeyword}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                    {!isLoadingSuggestions && (
                      <button
                        type="button"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown size={16} />
                      </button>
                    )}
                  </div>
                </div>
                {/* Show suggestions when there are results OR when focused with empty field */}
                {(showSuggestions && suggestions.length > 0 && formData.keyword.length > 0) || (isKeywordFocused && formData.keyword.length === 0) ? (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {formData.keyword.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Start typing to see options
                      </div>
                    ) : (
                      suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                          {suggestion}
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
                {errors.keyword && (
                  <p className="mt-1 text-xs text-red-700">{errors.keyword}</p>
                )}
              </div>

              {/* Category Field */}
              <CustomDropdown
                className="w-[160px]"
                label="Category"
                name="category"
                value={formData.category}
                options={categories}
                onChange={handleInputChange}
                required
              />

              {/* Location Field */}
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs font-medium ${errors.location ? 'text-red-700' : 'text-gray-700'}`}>
                    Location {!formData.autoDetect && <span className="text-red-700">*</span>}
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <span className={`text-xs font-medium ${errors.location ? 'text-red-700' : 'text-gray-700'}`}>Auto-detect Location</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.autoDetect}
                      onClick={() => handleInputChange({ target: { name: 'autoDetect', type: 'checkbox', checked: !formData.autoDetect } })}
                      className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 ${
                        formData.autoDetect ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                          formData.autoDetect ? 'translate-x-3.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </label>
                </div>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder={formData.autoDetect ? "Location will be autodetected" : "Enter city, district or street..."}
                  disabled={formData.autoDetect}
                  className={`w-full px-2.5 py-1.5 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs ${
                    formData.autoDetect ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${errors.location ? 'border-red-700' : 'border-gray-300'}`}
                />
                {errors.location && (
                  <p className="mt-1 text-xs text-red-700">{errors.location}</p>
                )}
              </div>

              {/* Distance Field */}
              <div className="w-[150px]">
                <label className={`block text-xs font-medium mb-0.5 ${errors.distance ? 'text-red-700' : 'text-gray-700'}`}>
                  Distance <span className="text-red-700">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="distance"
                    value={formData.distance}
                    onChange={handleInputChange}
                    onBlur={handleDistanceBlur}
                    min="0"
                    className={`w-full px-2.5 py-1.5 pr-12 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-xs ${
                      errors.distance ? 'border-red-700' : 'border-gray-300'
                    }`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-600 pointer-events-none">miles</span>
                </div>
                {errors.distance && (
                  <p className="mt-1 text-xs text-red-700">{errors.distance}</p>
                )}
              </div>

              {/* Search Button */}
              <div className="flex flex-col justify-end">
                <label className="block text-xs font-medium text-gray-700 mb-0.5 invisible">
                  Search
                </label>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-xs font-medium whitespace-nowrap"
                >
                  <SearchIcon size={14} />
                  <span>Search Events</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Keywords Field */}
            <div className="relative">
              <label className={`block text-sm font-medium mb-1.5 ${errors.keyword ? 'text-red-700' : 'text-gray-700'}`}>
                Keywords <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="keyword"
                  value={formData.keyword}
                  onChange={handleKeywordChange}
                  onFocus={() => setIsKeywordFocused(true)}
                  onBlur={() => setTimeout(() => setIsKeywordFocused(false), 200)}
                  placeholder="Search for events..."
                  className={`w-full px-3 py-2.5 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.keyword ? 'border-red-700' : 'border-gray-300'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isLoadingSuggestions && (
                    <Loader2 size={18} className="text-gray-400 animate-spin" />
                  )}
                  {formData.keyword && !isLoadingSuggestions && (
                    <button
                      type="button"
                      onClick={clearKeyword}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  )}
                  {!isLoadingSuggestions && (
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown size={18} />
                    </button>
                  )}
                </div>
              </div>
              {/* Show suggestions when there are results OR when focused with empty field */}
              {(showSuggestions && suggestions.length > 0 && formData.keyword.length > 0) || (isKeywordFocused && formData.keyword.length === 0) ? (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {formData.keyword.length === 0 ? (
                    <div className="px-3 py-2.5 text-gray-500 border-b last:border-b-0">
                      Start typing to see options
                    </div>
                  ) : (
                    suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        {suggestion}
                      </div>
                    ))
                  )}
                </div>
              ) : null}
              {errors.keyword && (
                <p className="mt-1.5 text-sm text-red-700">{errors.keyword}</p>
              )}
            </div>

            {/* Category Field */}
            <CustomDropdownMobile
              label="Category"
              name="category"
              value={formData.category}
              options={categories}
              onChange={handleInputChange}
              required
            />

            {/* Location Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-sm font-medium ${errors.location ? 'text-red-700' : 'text-gray-700'}`}>
                  Location {!formData.autoDetect && <span className="text-red-700">*</span>}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className={`text-sm ${errors.location ? 'text-red-700' : 'text-gray-700'}`}>Auto-detect Location</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.autoDetect}
                    onClick={() => handleInputChange({ target: { name: 'autoDetect', type: 'checkbox', checked: !formData.autoDetect } })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 ${
                      formData.autoDetect ? 'bg-black' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        formData.autoDetect ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>
              </div>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={formData.autoDetect ? "Location will be autodetected" : "Enter city, district or street..."}
                disabled={formData.autoDetect}
                className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formData.autoDetect ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${errors.location ? 'border-red-700' : 'border-gray-300'}`}
              />
              {errors.location && (
                <p className="mt-1.5 text-sm text-red-700">{errors.location}</p>
              )}
            </div>

            {/* Distance Field */}
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${errors.distance ? 'text-red-700' : 'text-gray-700'}`}>
                Distance <span className="text-red-700">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="distance"
                  value={formData.distance}
                  onChange={handleInputChange}
                  onBlur={handleDistanceBlur}
                  min="0"
                  className={`w-full px-3 py-2.5 pr-14 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.distance ? 'border-red-700' : 'border-gray-300'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 pointer-events-none">miles</span>
              </div>
              {errors.distance && (
                <p className="mt-1.5 text-sm text-red-700">{errors.distance}</p>
              )}
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              <SearchIcon size={18} />
              <span>Search Events</span>
            </button>
          </form>
        </div>
      </div>

      {/* Results section */}
      <div className="mt-1">
        <div className="max-w-7xl mx-auto px-4 md:px-20 py-1">
          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Loading events...</p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && searchResults && (!searchResults._embedded || !searchResults._embedded.events || searchResults._embedded.events.length === 0) && (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-20 h-20 mb-6">
                <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-600 text-xl font-semibold mb-2">Nothing found</p>
              <p className="text-gray-500 text-base">Update the query the to find events near you</p>
            </div>
          )}

          {/* Results Grid */}
          {!isLoading && searchResults?._embedded?.events && searchResults._embedded.events.length > 0 && (
            <div>
              {/* Events Grid - Max 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSortedEvents().slice(0, 20).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>

              {/* Show message if there are more than 20 results */}
              {searchResults._embedded.events.length > 20 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                  Showing 20 of {searchResults._embedded.events.length} events
                </div>
              )}
            </div>
          )}

          {/* Initial State - No Search Yet */}
          {!isLoading && !searchResults && (
            <div className="flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 mb-4">
                <svg className="w-full h-full text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm md:text-base">
                Enter search criteria and click the Search button to find events.
              </p>
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
