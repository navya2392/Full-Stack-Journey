from flask import Flask, render_template, jsonify, request
import os
import requests
import geohash2
from dotenv import load_dotenv

# Load environment variables from .env.txt file
load_dotenv('.env.txt')

app = Flask(__name__)

# Category mapping for Ticketmaster
CATEGORY_MAPPING = {
    'Music': 'KZFzniwnSyZfZ7v7nJ',
    'Sports': 'KZFzniwnSyZfZ7v7nE', 
    'Arts': 'KZFzniwnSyZfZ7v7na',
    'Theatre': 'KZFzniwnSyZfZ7v7na',
    'Film': 'KZFzniwnSyZfZ7v7nn',
    'Miscellaneous': 'KZFzniwnSyZfZ7v7n1'
}

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('index.html')

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({"ok": True})

@app.route('/api/config')
def config():
    """Expose browser-safe API keys for client-side calls"""
    return jsonify({
        "ipinfo_token": os.getenv('IPINFO_TOKEN', ''),
        "google_geocoding_key": os.getenv('GOOGLE_KEY', '')
    })

@app.route('/api/search')
def search():
    """Search for events using Ticketmaster API"""
    try:
        # Get parameters from request
        keyword = request.args.get('keyword', '')
        distance = request.args.get('distance', '10')
        category = request.args.get('category', 'Default')
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
        
        # Convert lat/lng to geohash for Ticketmaster
        geo_point = geohash2.encode(lat, lng, precision=5)
        
        # Prepare Ticketmaster API parameters
        tm_params = {
            'apikey': os.getenv('TICKETMASTER_KEY'),
            'keyword': keyword,
            'geoPoint': geo_point,
            'radius': distance,
            'unit': 'miles',
            'size': 20  # Max 20 results
        }
        
        # Add segment ID if category is not Default
        if category != 'Default' and category in CATEGORY_MAPPING:
            tm_params['segmentId'] = CATEGORY_MAPPING[category]
        
        # Call Ticketmaster API
        tm_url = 'https://app.ticketmaster.com/discovery/v2/events.json'
        response = requests.get(tm_url, params=tm_params, timeout=10)
        
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch events', 'events': []})
        
        data = response.json()
        events = []
        
        if '_embedded' in data and 'events' in data['_embedded']:
            for event in data['_embedded']['events']:
                # Extract required fields for table
                event_data = {
                    'id': event.get('id', ''),
                    'name': event.get('name', 'N/A'),
                    'localDate': event['dates']['start'].get('localDate', 'N/A') if 'dates' in event and 'start' in event['dates'] else 'N/A',
                    'localTime': event['dates']['start'].get('localTime', 'N/A') if 'dates' in event and 'start' in event['dates'] else 'N/A',
                    'genre': 'N/A',
                    'venue': 'N/A',
                    'image': ''
                }
                
                # Get genre from classifications
                if 'classifications' in event and len(event['classifications']) > 0:
                    classification = event['classifications'][0]
                    if 'segment' in classification and 'name' in classification['segment']:
                        event_data['genre'] = classification['segment']['name']
                
                # Get venue name
                if '_embedded' in event and 'venues' in event['_embedded'] and len(event['_embedded']['venues']) > 0:
                    venue = event['_embedded']['venues'][0]
                    event_data['venue'] = venue.get('name', 'N/A')
                
                # Get image URL
                if 'images' in event and len(event['images']) > 0:
                    # Find a suitable thumbnail image
                    for img in event['images']:
                        if img.get('width', 0) >= 100 and img.get('width', 0) <= 300:
                            event_data['image'] = img.get('url', '')
                            break
                    # If no suitable size found, use the first image
                    if not event_data['image'] and event['images']:
                        event_data['image'] = event['images'][0].get('url', '')
                
                events.append(event_data)
        
        return jsonify({'events': events})
        
    except Exception as e:
        print(f"Search error: {e}")
        return jsonify({'error': str(e), 'events': []})

@app.route('/api/event/<event_id>')
def event_details(event_id: str):
    """Get detailed information for a specific event and its venue.

    Returns a trimmed JSON with only fields needed by the UI. If the event
    cannot be fetched or parsed, returns { ok: False }.
    """
    try:
        api_key = os.getenv('TICKETMASTER_KEY')
        if not api_key:
            return jsonify({"ok": False, "error": "Missing API key"}), 500

        # Event details
        event_url = f'https://app.ticketmaster.com/discovery/v2/events/{event_id}.json'
        eresp = requests.get(event_url, params={'apikey': api_key}, timeout=10)
        if eresp.status_code != 200:
            return jsonify({"ok": False, "error": "Failed to fetch event"})

        ejson = eresp.json()
        if not ejson or 'id' not in ejson:
            return jsonify({"ok": False, "error": "Invalid event payload"})

        # Helpers
        def get_name(o):
            return (o or {}).get('name')

        # Date/time
        local_date = None
        local_time = None
        if 'dates' in ejson and 'start' in ejson['dates']:
            local_date = ejson['dates']['start'].get('localDate')
            local_time = ejson['dates']['start'].get('localTime')

        # Artists/Team (attractions)
        artists = []
        if '_embedded' in ejson and 'attractions' in ejson['_embedded']:
            for a in ejson['_embedded']['attractions']:
                nm = a.get('name')
                url = a.get('url')
                if nm:
                    artists.append({"name": nm, "url": url})

        # Venue basic (use embedded first)
        venue_name = None
        venue_id = None
        venue_info = {}
        if '_embedded' in ejson and 'venues' in ejson['_embedded'] and ejson['_embedded']['venues']:
            v = ejson['_embedded']['venues'][0]
            venue_name = v.get('name')
            venue_id = v.get('id')
            venue_info = v

        # Fetch venue details if we have an id, to enrich the future "Show Venue Details"
        venue_details = {}
        if venue_id:
            vurl = f'https://app.ticketmaster.com/discovery/v2/venues/{venue_id}.json'
            vresp = requests.get(vurl, params={'apikey': api_key}, timeout=10)
            if vresp.status_code == 200:
                venue_details = vresp.json() or {}

        # Genre chain: subGenre → genre → segment → subType → type
        chain_order = ['subGenre', 'genre', 'segment', 'subType', 'type']
        genre_chain_parts = []
        try:
            if 'classifications' in ejson and ejson['classifications']:
                cls = ejson['classifications'][0]
                for key in chain_order:
                    val = cls.get(key)
                    nm = (val or {}).get('name')
                    if nm and nm.lower() != 'undefined':
                        genre_chain_parts.append(nm)
        except Exception:
            pass
        genre_chain = ' | '.join(genre_chain_parts) if genre_chain_parts else None

        # Ticket status mapping
        status_raw = None
        if 'dates' in ejson and 'status' in ejson['dates']:
            status_raw = (ejson['dates']['status'] or {}).get('code')
        status_map = {
            'onsale': ('On Sale', 'onsale'),
            'offsale': ('Off Sale', 'offsale'),
            'cancelled': ('Canceled', 'canceled'),
            'postponed': ('Postponed', 'postponed'),
            'rescheduled': ('Rescheduled', 'rescheduled')
        }
        status_label, status_key = None, None
        if status_raw:
            key = status_raw.lower()
            if key in status_map:
                status_label, status_key = status_map[key]

        # Buy ticket at (Ticketmaster)
        buy_url = ejson.get('url')

        # Price Range
        price_range = None
        print(f"Debug - priceRanges in ejson: {'priceRanges' in ejson}")
        if 'priceRanges' in ejson:
            print(f"Debug - priceRanges value: {ejson['priceRanges']}")
            
        if 'priceRanges' in ejson and ejson['priceRanges']:
            price_info = ejson['priceRanges'][0]  # Take first price range
            print(f"Debug - price_info: {price_info}")
            min_price = price_info.get('min')
            max_price = price_info.get('max')
            currency = price_info.get('currency', 'USD')
            print(f"Debug - min: {min_price}, max: {max_price}, currency: {currency}")
            if min_price is not None and max_price is not None:
                price_range = f"{min_price} - {max_price} {currency}"
                print(f"Debug - final price_range: {price_range}")
        
        print(f"Debug - final price_range result: {price_range}")

        # Seatmap
        seatmap_url = None
        if 'seatmap' in ejson and isinstance(ejson['seatmap'], dict):
            seatmap_url = ejson['seatmap'].get('staticUrl')

        payload = {
            "ok": True,
            "id": ejson.get('id'),
            "name": ejson.get('name'),
            "localDate": local_date,
            "localTime": local_time,
            "artists": artists,  # [{name, url?}]
            "venue": venue_name,
            "genreChain": genre_chain,
            "priceRange": price_range,
            "statusLabel": status_label,
            "statusKey": status_key,
            "buyUrl": buy_url,
            "seatmapUrl": seatmap_url,
            "venueDetails": {
                "name": venue_details.get('name') or venue_name,
                "address": (venue_details.get('address') or {}).get('line1'),
                "city": ((venue_details.get('city') or {}).get('name')),
                "state": ((venue_details.get('state') or {}).get('name')),
                "postalCode": venue_details.get('postalCode'),
                "url": venue_details.get('url')
            }
        }

        return jsonify(payload)
    except Exception as e:
        print(f"Event details error: {e}")
        return jsonify({"ok": False, "error": str(e)})

@app.route('/api/venue-search')
def venue_search():
    """Search for venue details using Ticketmaster Venue Search API"""
    try:
        # Get parameters from request
        keyword = request.args.get('keyword', '')
        if not keyword:
            return jsonify({"ok": False, "error": "Keyword is required"})
        
        # Get API key from environment
        api_key = os.getenv('TICKETMASTER_KEY')
        if not api_key:
            return jsonify({"ok": False, "error": "API key not configured"})
        
        # Make request to Ticketmaster Venue Search API
        url = 'https://app.ticketmaster.com/discovery/v2/venues'
        params = {
            'apikey': api_key,
            'keyword': keyword
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            return jsonify({"ok": False, "error": f"API request failed with status {response.status_code}"})
        
        data = response.json()
        
        # Extract venue information
        venues = []
        if '_embedded' in data and 'venues' in data['_embedded']:
            for venue in data['_embedded']['venues']:
                # Extract logo/image information
                logo_url = 'N/A'
                if 'images' in venue and venue['images']:
                    # Look for logo or similar image types
                    for image in venue['images']:
                        # Prefer smaller images for logos, usually ratio close to 1:1 or 3:2
                        if image.get('width', 0) <= 200 and image.get('height', 0) <= 200:
                            logo_url = image.get('url', 'N/A')
                            break
                    # If no small image found, use the first available image
                    if logo_url == 'N/A' and venue['images']:
                        logo_url = venue['images'][0].get('url', 'N/A')

                venue_info = {
                    "name": venue.get('name', 'N/A'),
                    "address": venue.get('address', {}).get('line1', 'N/A'),
                    "city": venue.get('city', {}).get('name', 'N/A'),
                    "state": venue.get('state', {}).get('name', 'N/A'),
                    "postalCode": venue.get('postalCode', 'N/A'),
                    "url": venue.get('url', 'N/A'),
                    "phoneNumber": venue.get('phoneNumber', 'N/A'),
                    "boxOfficeInfo": venue.get('boxOfficeInfo', {}).get('phoneNumberDetail', 'N/A'),
                    "generalRule": venue.get('generalInfo', {}).get('generalRule', 'N/A'),
                    "childRule": venue.get('generalInfo', {}).get('childRule', 'N/A'),
                    "logoUrl": logo_url
                }
                venues.append(venue_info)
        
        return jsonify({
            "ok": True,
            "venues": venues
        })
        
    except Exception as e:
        print(f"Venue search error: {e}")
        return jsonify({"ok": False, "error": str(e)})

if __name__ == '__main__':
    # Run on port 8080 with debug enabled for local development
    app.run(host='0.0.0.0', port=8080, debug=True)