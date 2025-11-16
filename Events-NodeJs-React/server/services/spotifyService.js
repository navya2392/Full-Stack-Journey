// services/spotifyService.js
// Handles Spotify API authentication and requests using official SDK

import { SpotifyApi } from '@spotify/web-api-ts-sdk';

// Create Spotify client instance with Client Credentials
function getSpotifyClient() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  // Using Client Credentials flow as recommended in the SDK documentation
  return SpotifyApi.withClientCredentials(clientId, clientSecret);
}

// Search for an artist on Spotify
export async function searchArtist(artistName) {
  try {
    console.log('SpotifyService: Searching for artist:', artistName);
    const sdk = getSpotifyClient();
    
    // Search with type "artist" and limit 1
    const searchResults = await sdk.search(artistName, ['artist'], undefined, 1);
    console.log('SpotifyService: Search completed, items found:', searchResults.artists.items.length);

    if (!searchResults.artists.items || searchResults.artists.items.length === 0) {
      console.log('SpotifyService: No artist found');
      return null;
    }

    const artist = searchResults.artists.items[0];
    console.log('SpotifyService: Artist found:', artist.name);
    return {
      name: artist.name,
      followers: artist.followers.total,
      popularity: artist.popularity,
      spotifyUrl: artist.external_urls.spotify,
      image: artist.images[0]?.url || null,
      genres: artist.genres || []
    };
  } catch (error) {
    console.error('Error searching artist:', error.message);
    console.error('Full error:', error);
    throw new Error('Failed to search artist on Spotify');
  }
}

// Get artist's albums
export async function getArtistAlbums(artistName) {
  try {
    console.log('SpotifyService: Getting albums for artist:', artistName);
    const sdk = getSpotifyClient();
    
    // First, search for the artist to get their ID
    const searchResults = await sdk.search(artistName, ['artist'], undefined, 1);

    if (!searchResults.artists.items || searchResults.artists.items.length === 0) {
      console.log('SpotifyService: No artist found for albums');
      return [];
    }

    const artistId = searchResults.artists.items[0].id;
    console.log('SpotifyService: Artist ID:', artistId);

    // Get artist's albums (only album group, limit 50)
    const albumsResponse = await sdk.artists.albums(artistId, 'album', undefined, 50);
    console.log('SpotifyService: Albums found:', albumsResponse.items.length);

    return albumsResponse.items.map(album => ({
      name: album.name,
      releaseDate: album.release_date,
      totalTracks: album.total_tracks,
      image: album.images[0]?.url || null,
      spotifyUrl: album.external_urls.spotify
    }));
  } catch (error) {
    console.error('Error getting artist albums:', error.message);
    console.error('Full error:', error);
    throw new Error('Failed to get artist albums from Spotify');
  }
}
