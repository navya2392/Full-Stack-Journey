// routes/spotify.js
// Handles routes related to Spotify API calls (e.g., artist search, albums, etc.)

import { Router } from "express";
import { searchArtist, getArtistAlbums } from "../services/spotifyService.js";

const router = Router();

// Get artist details: /api/spotify/artist?name=Taylor Swift
router.get("/artist", async (req, res) => {
  try {
    const { name } = req.query;
    
    console.log('Received artist request for:', name);
    
    if (!name) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    const artist = await searchArtist(name);
    
    console.log('Artist search result:', artist ? 'Found' : 'Not found');
    
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    res.json(artist);
  } catch (error) {
    console.error('Error in /api/spotify/artist:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get artist albums: /api/spotify/albums?name=Taylor Swift
router.get("/albums", async (req, res) => {
  try {
    const { name } = req.query;
    
    console.log('Received albums request for:', name);
    
    if (!name) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    const albums = await getArtistAlbums(name);
    console.log('Albums found:', albums.length);
    res.json(albums);
  } catch (error) {
    console.error('Error in /api/spotify/albums:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;