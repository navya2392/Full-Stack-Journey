// Event Finder App JavaScript
console.log('Event Finder app loaded');

// Configuration for API keys (loaded from backend)
let appConfig = {};

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, ready for user interactions');
    console.log('JavaScript is working!');
    
    // Load configuration from backend
    try {
        const response = await fetch('/api/config');
        appConfig = await response.json();
        console.log('App configuration loaded');
    } catch (error) {
        console.error('Failed to load app configuration:', error);
    }
    
    // Get form elements
    const form = document.getElementById('search-form');
    console.log('Form element found:', form);
    
    if (!form) {
        console.error('Form not found! Check HTML structure.');
        return;
    }
    
    const keywordInput = document.getElementById('keyword');
    const distanceInput = document.getElementById('distance');
    const categorySelect = document.getElementById('category');
    const locationInput = document.getElementById('location');
    const autoDetectCheckbox = document.getElementById('auto-detect');
    const clearBtn = document.getElementById('clear-btn');
    const keywordError = document.getElementById('keyword-error');
    const locationError = document.getElementById('location-error');
    const locationRequired = document.getElementById('location-required');
    const locationGroup = document.querySelector('.location-group');
    const locationInputGroup = document.querySelector('.location-input-group');
    const resultsContainer = document.getElementById('results-container');
    const detailsContainer = document.getElementById('details-container');

    // Sorting state
    let currentEvents = [];
    let sortState = { key: null, dir: 1 }; // dir: 1 = asc, -1 = desc

    // Helpers for stable, case-insensitive sorting
    function normalizeStr(v) {
        return (v ?? '').toString().trim().toLowerCase();
    }

    function sortByKeyStable(arr, key, dir) {
        // Decorate with original index to ensure stability
        const aCopy = [...arr];
        aCopy.sort((a, b) => {
            let av, bv, cmp = 0;
            
            // Special handling for date sorting
            if (key === 'date') {
                av = new Date(a[key]);
                bv = new Date(b[key]);
                if (av < bv) cmp = -1; else if (av > bv) cmp = 1; else cmp = 0;
            } else {
                // String comparison for other fields
                av = normalizeStr(a[key]);
                bv = normalizeStr(b[key]);
                if (av < bv) cmp = -1; else if (av > bv) cmp = 1; else cmp = 0;
            }
            
            if (cmp !== 0) return dir * cmp;
            // Stable: fall back to original index captured on fetch
            return a._i - b._i;
        });
        return aCopy;
    }

    function wireHeaderSortHandlers() {
        const tableEl = resultsContainer.querySelector('.results-table');
        if (!tableEl) return;
        const sortableHeaders = tableEl.querySelectorAll('th.sortable');
        sortableHeaders.forEach(th => {
            const triggerSort = () => {
                const key = th.dataset.sort;
                // Toggle direction if clicking same key; otherwise reset to ascending
                if (sortState.key === key) {
                    sortState.dir = sortState.dir === 1 ? -1 : 1;
                } else {
                    sortState.key = key;
                    sortState.dir = 1;
                }

                // Apply sort
                currentEvents = sortByKeyStable(currentEvents, key, sortState.dir);

                // Update aria-sort indicators
                sortableHeaders.forEach(h => h.setAttribute('aria-sort', 'none'));
                th.setAttribute('aria-sort', sortState.dir === 1 ? 'ascending' : 'descending');

                // Re-render with sorted data
                renderResultsTable(currentEvents);
            };

            th.addEventListener('click', triggerSort);
            th.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    triggerSort();
                }
            });
        });
    }

    // Geolocation functions
    async function getLocationFromIP() {
        try {
            const response = await fetch(`https://ipinfo.io/?token=${appConfig.ipinfo_token}`);
            const data = await response.json();
            
            console.log('IPInfo response:', data);
            console.log(`IP-based location detected: ${data.city}, ${data.region}, ${data.country}`);
            console.log(`ISP: ${data.org}`);
            console.log('Note: IP geolocation shows your ISP routing location, not your actual location');
            
            if (data.loc) {
                const [lat, lng] = data.loc.split(',');
                console.log(`Coordinates: ${lat}, ${lng}`);
                return {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng)
                };
            }
            throw new Error('Location not found in IP info response');
        } catch (error) {
            console.error('Error getting location from IP:', error);
            throw error;
        }
    }

    async function getLocationFromAddress(address) {
        try {
            const encodedAddress = encodeURIComponent(address);
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${appConfig.google_geocoding_key}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'OK' && data.results.length > 0) {
                const location = data.results[0].geometry.location;
                return {
                    lat: location.lat,
                    lng: location.lng
                };
            }
            throw new Error(`Geocoding failed: ${data.status}`);
        } catch (error) {
            console.error('Error getting location from address:', error);
            throw error;
        }
    }

    function renderResultsTable(events) {
        if (!events || events.length === 0) {
            // Show "No records found" message
            resultsContainer.innerHTML = `
                <div class="no-records">
                    No records found
                </div>
            `;
            return;
        }

        // Create results table
        let tableHTML = `
            <table class="results-table">
                <thead>
                    <tr>
                        <th class="col-date">Date</th>
                        <th class="col-icon">Icon</th>
                        <th class="col-event sortable" data-sort="name" aria-sort="none" role="button" tabindex="0">Event</th>
                        <th class="col-genre sortable" data-sort="genre" aria-sort="none" role="button" tabindex="0">Genre</th>
                        <th class="col-venue sortable" data-sort="venue" aria-sort="none" role="button" tabindex="0">Venue</th>
                    </tr>
                </thead>
                <tbody>
        `;

        events.forEach(event => {
            const date = event.localDate !== 'N/A' ? event.localDate : '';
            const time = event.localTime !== 'N/A' ? event.localTime : '';
            const dateTime = date && time ? `${date}<br>${time}` : (date || time || 'N/A');
            
            const imageUrl = event.image || '';
            const imageHTML = imageUrl ? 
                `<img src="${imageUrl}" alt="${event.name}" class="event-thumbnail">` : 
                '<div class="no-image">No Image</div>';

            tableHTML += `
                <tr class="event-row" data-event-id="${event.id}">
                    <td class="col-date">${dateTime}</td>
                    <td class="col-icon">${imageHTML}</td>
                    <td class="col-event"><span class="event-name">${event.name}</span></td>
                    <td class="col-genre">${event.genre}</td>
                    <td class="col-venue">${event.venue}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

    resultsContainer.innerHTML = tableHTML;

    // Wire sorting after table render
    wireHeaderSortHandlers();

        // Add click handlers only on event name spans to fetch details
        const eventNameSpans = resultsContainer.querySelectorAll('.event-row .event-name');
        eventNameSpans.forEach(span => {
            span.addEventListener('click', async function(e) {
                e.stopPropagation();
                const tr = this.closest('tr');
                const eventId = tr.getAttribute('data-event-id');
                if (!eventId) return;

                try {
                    this.classList.add('loading');
                    const resp = await fetch(`/api/event/${eventId}`);
                    const data = await resp.json();
                    this.classList.remove('loading');
                    if (!data || data.ok === false) {
                        // Make text non-clickable if not ok
                        this.classList.add('disabled');
                        this.style.pointerEvents = 'none';
                        this.style.color = 'black';
                        return;
                    }
                    renderEventCard(data);
                } catch (err) {
                    console.error('Failed to load event details', err);
                    this.classList.remove('loading');
                    this.classList.add('disabled');
                    this.style.pointerEvents = 'none';
                    this.style.color = 'black';
                }
            });
        });
    }

    function renderEventCard(detail) {
        // Build left-side fields conditionally
        const parts = [];
        const dt = (detail.localDate || '') + (detail.localTime ? (' ' + detail.localTime) : '');
        if (dt.trim()) {
            parts.push(`<div class="ec-field"><div class="ec-label">Date</div><div class="ec-val">${dt}</div></div>`);
        }

        if (detail.artists && detail.artists.length) {
            const links = detail.artists.map(a => {
                const nm = a.name;
                const url = a.url ? `${a.url}` : '';
                return url ? `<a href="${url}" target="_blank" rel="noopener" class="ec-link">${nm}</a>` : `<span>${nm}</span>`;
            }).join(' | ');
            parts.push(`<div class="ec-field"><div class="ec-label">Artist/Team</div><div class="ec-val">${links}</div></div>`);
        }

        if (detail.venue) {
            parts.push(`<div class="ec-field"><div class="ec-label">Venue</div><div class="ec-val">${detail.venue}</div></div>`);
        }

        if (detail.genreChain) {
            parts.push(`<div class="ec-field"><div class="ec-label">Genres</div><div class="ec-val">${detail.genreChain}</div></div>`);
        }

        if (detail.priceRange) {
            parts.push(`<div class="ec-field"><div class="ec-label">Price Ranges</div><div class="ec-val">${detail.priceRange}</div></div>`);
        }

        if (detail.statusLabel && detail.statusKey) {
            parts.push(`<div class="ec-field"><div class="ec-label">Ticket Status</div><div class="ec-val"><span class="badge badge-${detail.statusKey}">${detail.statusLabel}</span></div></div>`);
        }

        if (detail.buyUrl) {
            parts.push(`<div class="ec-field"><div class="ec-label">Buy Ticket At</div><div class="ec-val"><a class="ec-link" href="${detail.buyUrl}" target="_blank" rel="noopener">Ticketmaster</a></div></div>`);
        }

        const leftHtml = parts.join('');
        const rightHtml = detail.seatmapUrl ? `<img src="${detail.seatmapUrl}" alt="Seat map" class="ec-seatmap"/>` : '';

        const v = detail.venueDetails || {};
        const venueBlock = (v.name || v.address || v.city || v.state || v.postalCode || v.url)
            ? `
                <div class="venue-details" hidden>
                    ${v.name ? `<div class="ec-field"><div class="ec-label">Venue</div><div class="ec-val">${v.name}</div></div>` : ''}
                    ${v.address ? `<div class="ec-field"><div class="ec-label">Address</div><div class="ec-val">${v.address}</div></div>` : ''}
                    ${(v.city || v.state || v.postalCode) ? `<div class="ec-field"><div class="ec-label">City</div><div class="ec-val">${[v.city, v.state, v.postalCode].filter(Boolean).join(', ')}</div></div>` : ''}
                    ${v.url ? `<div class="ec-field"><div class="ec-label">More</div><div class="ec-val"><a class="ec-link" href="${v.url}" target="_blank" rel="noopener">Venue Page</a></div></div>` : ''}
                </div>
            ` : '';

        const cardHtml = `
            <div class="event-card show">
                <div class="ec-title">${detail.name || ''}</div>
                <div class="ec-body">
                    <div class="ec-left">${leftHtml}</div>
                    <div class="ec-right">${rightHtml}</div>
                </div>
            </div>
            <div class="venue-toggle-container">
                <button type="button" class="venue-toggle" data-venue="${detail.venue || ''}">
                    <span class="venue-text">Show Venue Details</span>
                    <span class="venue-arrow"></span>
                </button>
            </div>
            <div class="venue-details-card" style="display: none;">
                <!-- Venue details will be loaded here -->
            </div>
        `;

        const container = document.getElementById('details-container');
        container.classList.add('show');
        container.innerHTML = cardHtml;

        // Smooth scroll to card
        setTimeout(() => {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);

        // Add venue details toggle functionality
        const venueToggleBtn = container.querySelector('.venue-toggle');
        const venueDetailsCard = container.querySelector('.venue-details-card');
        
        if (venueToggleBtn && venueDetailsCard) {
            venueToggleBtn.addEventListener('click', async function() {
                const venueName = this.getAttribute('data-venue');
                
                if (venueDetailsCard.style.display === 'none') {
                    // Show venue details
                    try {
                        console.log('Fetching venue details for:', venueName);
                        // Fetch venue details from API
                        const response = await fetch(`/api/venue-search?keyword=${encodeURIComponent(venueName)}`);
                        console.log('Response status:', response.status);
                        const venueData = await response.json();
                        console.log('Venue data received:', venueData);
                        
                        if (venueData.ok && venueData.venues && venueData.venues.length > 0) {
                            const venue = venueData.venues[0]; // Use first result
                            
                            // Create Google Maps URL
                            const addressParts = [
                                venue.name !== 'N/A' ? venue.name : '',
                                venue.address !== 'N/A' ? venue.address : '',
                                venue.city !== 'N/A' ? venue.city : '',
                                venue.state !== 'N/A' ? venue.state : '',
                                venue.postalCode !== 'N/A' ? venue.postalCode : ''
                            ].filter(part => part !== '');
                            
                            const googleMapsQuery = encodeURIComponent(addressParts.join(', '));
                            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`;
                            
                            // Create more events URL (using venue name)
                            const moreEventsUrl = `https://www.ticketmaster.com/search?q=${encodeURIComponent(venueName)}`;
                            
                            // Generate venue details HTML matching the screenshot design
                            const displayName = venue.name !== 'N/A' ? venue.name : 'N/A';
                            const fullAddress = [
                                venue.address !== 'N/A' ? venue.address : '',
                                venue.city !== 'N/A' ? venue.city : '',
                                venue.state !== 'N/A' ? venue.state : '',
                                venue.postalCode !== 'N/A' ? venue.postalCode : ''
                            ].filter(part => part !== '').join(', ') || 'N/A';
                            
                            // Create logo text (first two letters of venue name) - fallback for when no logo image available
                            const logoText = displayName !== 'N/A' ? displayName.substring(0, 2).toUpperCase() : 'NA';
                            const hasLogo = venue.logoUrl && venue.logoUrl !== 'N/A';
                            
                            // Parse address components for 3-line format
                            let addressLine1 = '', addressLine2 = '', addressLine3 = '';
                            if (venue.address !== 'N/A') {
                                addressLine1 = venue.address;
                            } else {
                                addressLine1 = 'N/A';
                            }
                            if (venue.city !== 'N/A' || venue.state !== 'N/A') {
                                addressLine2 = [venue.city !== 'N/A' ? venue.city : '', venue.state !== 'N/A' ? venue.state : ''].filter(Boolean).join(', ');
                            }
                            if (venue.postalCode !== 'N/A') addressLine3 = venue.postalCode;
                            
                            venueDetailsCard.innerHTML = `
                                <div class="venue-card">
                                    <!-- Top Section: Venue Name + Logo (centered) -->
                                    <div class="venue-header">
                                        <h3 class="venue-name">${displayName}</h3>
                                        <div class="venue-logo">
                                            <div class="venue-logo-container">
                                                ${hasLogo ? 
                                                    `<img src="${venue.logoUrl}" alt="${displayName} Logo" class="venue-logo-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                                     <div class="venue-logo-text-fallback" style="display: none;">
                                                         <div class="logo-text-line1">${logoText}</div>
                                                         <div class="logo-text-line2">${displayName.split(' ').slice(-1)[0] || 'Center'}</div>
                                                     </div>` :
                                                    `<div class="venue-logo-text-fallback">
                                                         <div class="logo-text-line1">${logoText}</div>
                                                         <div class="logo-text-line2">${displayName.split(' ').slice(-1)[0] || 'Center'}</div>
                                                     </div>`
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Bottom Section: Address + More Events -->
                                    <div class="venue-bottom-layout">
                                        <!-- Left Section: Address -->
                                        <div class="venue-left">
                                            <div class="venue-address-lines">
                                                ${addressLine1 ? `<div class="address-line"><span class="venue-address-label">Address:</span> ${addressLine1}</div>` : '<div class="address-line"><span class="venue-address-label">Address:</span></div>'}
                                                ${addressLine2 ? `<div class="address-line address-line-indent">${addressLine2}</div>` : ''}
                                                ${addressLine3 ? `<div class="address-line address-line-indent">${addressLine3}</div>` : ''}
                                            </div>
                                            <a href="${googleMapsUrl}" target="_blank" class="venue-link">Open in Google Maps</a>
                                        </div>
                                        
                                        <!-- Vertical Divider -->
                                        <div class="venue-vertical-divider"></div>
                                        
                                        <!-- Right Section: More Events Link -->
                                        <div class="venue-right">
                                            ${displayName !== 'N/A' && displayName !== '' ? `<a href="${moreEventsUrl}" target="_blank" class="venue-link-right">More events at this venue</a>` : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        } else {
                            venueDetailsCard.innerHTML = `
                                <div class="venue-error">
                                    No venue details available for "${venueName}"
                                </div>
                            `;
                        }
                    } catch (error) {
                        console.error('Error fetching venue details:', error);
                        venueDetailsCard.innerHTML = `
                            <div class="venue-error">
                                Error loading venue details. Please try again.
                            </div>
                        `;
                    }
                    
                    // Show venue details card
                    venueDetailsCard.style.display = 'block';
                    
                    // Update button text (no arrow when hiding)
                    this.innerHTML = '<span class="venue-text">Hide Venue Details</span>';
                    
                    // Scroll to venue details card
                    setTimeout(() => {
                        venueDetailsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                    
                } else {
                    // Hide venue details
                    venueDetailsCard.style.display = 'none';
                    this.innerHTML = '<span class="venue-text">Show Venue Details</span><span class="venue-arrow"></span>';
                }
            });
        }
    }

    // Auto-detect checkbox functionality
    autoDetectCheckbox.addEventListener('change', function() {
        if (this.checked) {
            // Hide location input field and make it non-required
            locationInputGroup.classList.add('hidden');
            locationInput.removeAttribute('required');
            locationRequired.style.display = 'none';
            locationError.textContent = '';
        } else {
            // Show location input field and make it required
            locationInputGroup.classList.remove('hidden');
            locationInput.setAttribute('required', 'required');
            locationRequired.style.display = 'inline';
        }
    });

    // Form submission handler
    console.log('Adding submit event listener to form');
    form.addEventListener('submit', async function(e) {
        console.log('Form submit event triggered');
        e.preventDefault();
        
        // Clear previous error messages
        keywordError.textContent = '';
        locationError.textContent = '';
        
        let hasErrors = false;

        // Validate keyword (required)
        if (!keywordInput.value.trim()) {
            keywordError.textContent = 'Please fill out this field.';
            hasErrors = true;
        }

        // Validate location (required only if auto-detect is not checked)
        if (!autoDetectCheckbox.checked && !locationInput.value.trim()) {
            locationError.textContent = 'Please fill out this field.';
            hasErrors = true;
        }

        // If there are validation errors, don't submit
        if (hasErrors) {
            return;
        }

        // Show loading state
        resultsContainer.classList.add('show');
        resultsContainer.innerHTML = '<p>Getting location and searching for events...</p>';
        
        // Clear any previous event details and venue details
        detailsContainer.innerHTML = '';
        detailsContainer.classList.remove('show');

        try {
            let coordinates;
            
            // Get coordinates based on auto-detect setting
            if (autoDetectCheckbox.checked) {
                console.log('Getting location from IP...');
                resultsContainer.innerHTML = '<p>Auto-detecting location... (Note: May detect ISP location, not your actual location)</p>';
                coordinates = await getLocationFromIP();
            } else {
                console.log('Getting location from address:', locationInput.value);
                coordinates = await getLocationFromAddress(locationInput.value.trim());
            }

            // Create normalized search object
            const searchParams = {
                keyword: keywordInput.value.trim(),
                distance: parseInt(distanceInput.value),
                category: categorySelect.value,
                autoDetect: autoDetectCheckbox.checked,
                lat: coordinates.lat,
                lng: coordinates.lng
            };

            console.log('Search parameters with coordinates:', searchParams);

            // Call backend search endpoint
            const searchUrl = new URL('/api/search', window.location.origin);
            Object.keys(searchParams).forEach(key => {
                searchUrl.searchParams.append(key, searchParams[key]);
            });

            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();

            if (searchData.error) {
                resultsContainer.innerHTML = `
                    <div style="color: #ff5252; text-align: center; padding: 20px;">
                        <h3>Search Error</h3>
                        <p>${searchData.error}</p>
                    </div>
                `;
                return;
            }

            // Attach stable original index and cache
            currentEvents = (searchData.events || []).map((e, i) => ({ ...e, _i: i }));
            
            // Sort events by date (soonest first)
            currentEvents = sortByKeyStable(currentEvents, 'date', 1);
            sortState = { key: 'date', dir: 1 };

            // Render results table
            renderResultsTable(currentEvents);

        } catch (error) {
            console.error('Error during location lookup:', error);
            resultsContainer.innerHTML = `
                <div style="color: #ff5252;">
                    <h3>Location Error</h3>
                    <p>Failed to get location coordinates. Please try again.</p>
                    <p>Error: ${error.message}</p>
                </div>
            `;
        }
    });

    // Clear button functionality
    clearBtn.addEventListener('click', function() {
        // Reset form to default values
        keywordInput.value = '';
        distanceInput.value = '10';
        categorySelect.value = 'Default';
        locationInput.value = '';
        autoDetectCheckbox.checked = false;
        
        // Clear error messages
        keywordError.textContent = '';
        locationError.textContent = '';
        
            // Show location input field and make it required (default state)
            locationInputGroup.classList.remove('hidden');
        locationInput.setAttribute('required', 'required');
        locationRequired.style.display = 'inline';
        
        // Hide results and details containers
        resultsContainer.classList.remove('show');
        detailsContainer.classList.remove('show');
        resultsContainer.innerHTML = '';
        detailsContainer.innerHTML = '';
        
        console.log('Form cleared to default state');
    });

    // Initialize default state
    locationInput.setAttribute('required', 'required');
});