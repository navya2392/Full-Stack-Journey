# Events Around - Full-Stack Event Search Application

A full-stack web application for searching and managing favorite events using the Ticketmaster API. Built with React (frontend) and Node.js/Express (backend), deployed on Google App Engine.

## 🚀 Live Demo

**Deployed Application:** [https://hw3-navya-2025.wl.r.appspot.com](https://hw3-navya-2025.wl.r.appspot.com)

## 🛠 Tech Stack

### Frontend
- **React** - UI library for building interactive interfaces
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **MongoDB Atlas** - Cloud database for storing favorites
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing
- **Helmet** - Security middleware
- **Compression** - Response compression middleware

### APIs & Services
- **Ticketmaster API** - Event search and details
- **Spotify API** - Artist information and albums
- **Google Maps API** - Venue location and maps
- **IPInfo API** - Geolocation for auto-detect location

### Deployment
- **Google App Engine** - Cloud hosting platform
- **MongoDB Atlas** - Cloud database service

## 📁 Folder Structure

```
hw3/
├── client/                      # React frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── assets/             # Images and static files
│   │   ├── components/         # React components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── CustomDropdown.jsx
│   │   │   ├── CustomDropdownMobile.jsx
│   │   │   ├── EventCard.jsx
│   │   │   └── Navbar.jsx
│   │   ├── lib/               # Utility functions
│   │   │   └── utils.js
│   │   ├── pages/             # Page components
│   │   │   ├── EventDetailPage.jsx
│   │   │   ├── FavoritesPage.jsx
│   │   │   └── SearchPage.jsx
│   │   ├── App.css
│   │   ├── App.jsx            # Main app component
│   │   ├── index.css          # Global styles
│   │   └── main.jsx           # App entry point
│   ├── components.json         # shadcn/ui config
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                      # Node.js backend
│   ├── controllers/            # Request handlers (if needed)
│   ├── db/
│   │   └── mongo.js           # MongoDB connection
│   ├── public/                # Built frontend files (for deployment)
│   │   ├── assets/
│   │   └── index.html
│   ├── routes/                # API route handlers
│   │   ├── events.js          # Event search endpoints
│   │   ├── favorites.js       # Favorites CRUD endpoints
│   │   └── spotify.js         # Spotify API endpoints
│   ├── services/
│   │   └── spotifyService.js  # Spotify API service
│   ├── .env                   # Environment variables (not in git)
│   ├── app.yaml               # Google App Engine config
│   ├── index.js               # Server entry point
│   └── package.json
│
├── package.json                # Root package.json
├── process_log.txt            # Development notes
└── README.md                  # This file
```

## 🚦 How to Launch

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB Atlas account** (for database)
**- **Google Cloud account** (for deployment)
**1. Clone the repository**
git clone https://github.com/navya2392/Full-Stack-Journey.git
cd Full-Stack-Journey/Events-NodeJs-React

**2. ▶️ Frontend Setup (React + Vite)**
cd client
npm install
npm run dev


Runs at:
http://localhost:5173

**3.🖥 Backend Setup (Node.js + Express)**
cd server
npm install
npm run dev


Runs at:
http://localhost:8080

**4.🔑 Environment Variables**

Create a .env file under server/:

TICKETMASTER_API_KEY=your_key
GOOGLE_GEOCODING_API_KEY=your_key
SPOTIFY_CLIENT_ID=your_id
SPOTIFY_CLIENT_SECRET=your_secret
MONGODB_URI=your_atlas_connection_string

## 🔗 API Endpoints

- Autosuggest: /api/suggest

- Event search: /api/search

- Event details: /api/event/:id

- Venue details: /api/venue/:venueId

- Artist info (Spotify): /api/artist/:name

Favorites:

- GET /api/favorites

- POST /api/favorites

- DELETE /api/favorites/:id

## 🎨 Main Features

- Event Search: Search events by keyword, category, distance, and location (manual or auto-detect).

- Autocomplete Suggestions: Real-time Ticketmaster keyword suggestions with debounced API calls.

- Responsive Event Cards: Display up to 20 events with category, date/time, venue, image, and favorite toggle.

- Event Details Page: Includes ticket info, genres, seat map, ticket status, social sharing, and Ticketmaster link.

- Artist/Team Info (Spotify): Shows popularity, follower count, albums, and Spotify links for music events.

- Venue Details: Displays address, Google Maps link, parking info, general/child rules, and “See Events.”

- Favorites System: Add/remove favorites with MongoDB persistence and Sonner notifications (add/remove/undo).

- Fully Responsive UI: Built with React, Vite, Tailwind, and shadcn components for desktop & mobile.

- Secure Backend Proxy: All Ticketmaster calls routed through Node.js/Express to protect API keys.

 ## ☁️ Deployment

Backend can be deployed on:

Google App Engine

Google Cloud Run

Frontend is served from the backend (express.static), so everything runs on a single domain to avoid CORS issues.
## 📄 License

This project is for educational purposes as part of CSCI 571 at USC.
