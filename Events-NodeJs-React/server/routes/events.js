// routes/events.js
// Handles routes related to event search via Ticketmaster API.

import { Router } from "express";
import geohash from "ngeohash";
const router = Router();

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_KEY || 'AIzaSyBwpB2e3eNjXDLiw1YZYCHZf0mP9bjLJmk';

// Autocomplete suggestions endpoint
router.get("/suggest", async (req, res) => {
  try {
    const { keyword } = req.query;
    
    console.log("Suggest API called with keyword:", keyword);
    
    if (!keyword) {
      return res.status(400).json({ error: "Keyword parameter is required" });
    }

    const url = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=${TICKETMASTER_API_KEY}&keyword=${encodeURIComponent(keyword)}`;
    
    console.log("Fetching from Ticketmaster:", url.replace(TICKETMASTER_API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("Ticketmaster response:", JSON.stringify(data, null, 2));
    
    // Extract attraction names from the response
    const suggestions = data._embedded?.attractions?.map(attr => attr.name) || [];
    
    console.log("Returning suggestions:", suggestions);
    
    res.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Search events endpoint - using GET as required
router.get("/searchEvents", async (req, res) => {
  try {
    const { keyword, category, distance, lat, lng } = req.query;
    
    console.log("=== SEARCH EVENTS API CALLED ===");
    console.log("Params:", { keyword, category, distance, lat, lng });
    console.log("API Key exists:", !!TICKETMASTER_API_KEY);
    console.log("API Key length:", TICKETMASTER_API_KEY?.length);
    
    // Validate required parameters
    if (!keyword) {
      console.log("ERROR: Missing keyword");
      return res.status(400).json({ error: "Keyword parameter is required" });
    }
    
    if (!lat || !lng) {
      console.log("ERROR: Missing lat/lng");
      return res.status(400).json({ error: "Location (lat/lng) is required" });
    }
    
    // Convert lat/lng to geohash
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    console.log("Converting coordinates to geohash:", { lat: latNum, lng: lngNum });
    
    // Use precision 5 for geohash (approximately 5km x 5km)
    // Ticketmaster expects less precise geohashes for broader search areas
    const geoHash = geohash.encode(latNum, lngNum, 5);
    console.log("Generated geohash (precision 5):", geoHash);
    
    // Build Ticketmaster API URL
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      keyword: keyword,
      geoPoint: geoHash,
      radius: distance || '10',
      unit: 'miles',
      sort: 'date,asc', // Default sort by date ascending
      size: 200 // Get more results to ensure we have at least 20
    });
    
    // Add category if not "All"
    if (category && category !== 'All') {
      // Map category to Ticketmaster segment ID
      const categoryMap = {
        'Music': 'KZFzniwnSyZfZ7v7nJ',
        'Sports': 'KZFzniwnSyZfZ7v7nE',
        'Arts & Theatre': 'KZFzniwnSyZfZ7v7na',
        'Film': 'KZFzniwnSyZfZ7v7nn',
        'Miscellaneous': 'KZFzniwnSyZfZ7v7n1'
      };
      
      if (categoryMap[category]) {
        params.append('segmentId', categoryMap[category]);
        console.log("Added segment filter:", category);
      }
    }
    
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
    console.log("Calling Ticketmaster API:", url.replace(TICKETMASTER_API_KEY, 'API_KEY_HIDDEN'));
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("Ticketmaster response status:", response.status);
    console.log("Number of events found:", data._embedded?.events?.length || 0);
    
    if (data.page) {
      console.log("Page info:", data.page);
    }
    
    if (data.errors) {
      console.error("Ticketmaster API errors:", data.errors);
    }
    
    res.json(data);
  } catch (error) {
    console.error("Error searching events:", error);
    res.status(500).json({ error: "Failed to search events" });
  }
});

// Geocode location endpoint
router.get("/geocode", async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ error: "Location parameter is required" });
    }
    
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      res.json({ 
        lat: location.lat, 
        lng: location.lng 
      });
    } else {
      res.status(400).json({ error: "Invalid location" });
    }
  } catch (error) {
    console.error("Error geocoding location:", error);
    res.status(500).json({ error: "Failed to geocode location" });
  }
});

// Test endpoint to verify API is working
router.get("/test", async (req, res) => {
  try {
    // Test with a known good query
    const testUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&keyword=music&geoPoint=dr5reg&radius=10&unit=miles`;
    console.log("Testing Ticketmaster API...");
    const response = await fetch(testUrl);
    const data = await response.json();
    console.log("Test response:", JSON.stringify(data, null, 2));
    res.json({ 
      success: true, 
      eventCount: data._embedded?.events?.length || 0,
      data: data 
    });
  } catch (error) {
    console.error("Test error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get user location from IP
router.get("/ipLocation", async (req, res) => {
  try {
    const response = await fetch('https://ipinfo.io/json?token=de5d09082712ed');
    const data = await response.json();
    const [lat, lng] = data.loc.split(',');
    
    res.json({ 
      lat: parseFloat(lat), 
      lng: parseFloat(lng) 
    });
  } catch (error) {
    console.error("Error fetching IP location:", error);
    res.status(500).json({ error: "Failed to fetch IP location" });
  }
});

// Get event details by ID
router.get("/event/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Event ID is required" });
    }
    
    const url = `https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=${TICKETMASTER_API_KEY}`;
    console.log("Fetching event details for ID:", id);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json({ error: "Event not found" });
    }
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({ error: "Failed to fetch event details" });
  }
});

export default router;