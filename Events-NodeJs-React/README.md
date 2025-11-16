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
- **Google Cloud account** (for deployment)

### 1. Clone the Repository
```bash
git clone https://github.com/navya2392/hw3-navya.git
cd hw3-navya
```

### 2. Setup Backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=8080
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
TICKETMASTER_KEY=your_ticketmaster_api_key
GOOGLE_KEY=your_google_maps_api_key
IPINFO_TOKEN=your_ipinfo_token
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DB=hw3db
MONGODB_COLLECTION=favorites
```

### 3. Setup Frontend

```bash
cd ../client
npm install
```

### 4. Run Locally

**Option A: Run Both Simultaneously (Development)**

Terminal 1 - Backend:
```bash
cd server
node index.js
```
Server runs on `http://localhost:8080`

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```
Frontend runs on `http://localhost:5173` (with API proxy to port 8080)

**Option B: Run Production Build Locally**

1. Build the frontend:
```bash
cd client
npm run build
```

2. Copy built files to server:
```bash
# Windows
xcopy /E /I /Y dist\* ..\server\public\

# Mac/Linux
cp -r dist/* ../server/public/
```

3. Start the server:
```bash
cd ../server
node index.js
```

Visit `http://localhost:8080`

### 5. Deploy to Google App Engine

1. Make sure you have Google Cloud SDK installed and authenticated:
```bash
gcloud auth login
gcloud config set project your-project-id
```

2. Build and copy frontend to server:
```bash
cd client
npm run build
xcopy /E /I /Y dist\* ..\server\public\
```

3. Deploy from server directory:
```bash
cd ../server
gcloud app deploy
```

4. View deployed app:
```bash
gcloud app browse
```

## 🔑 API Keys Required

You'll need to obtain API keys from:
1. **Ticketmaster API** - https://developer.ticketmaster.com/
2. **Spotify API** - https://developer.spotify.com/
3. **Google Maps API** - https://console.cloud.google.com/
4. **IPInfo** - https://ipinfo.io/
5. **MongoDB Atlas** - https://www.mongodb.com/cloud/atlas

## 🌐 Routes

- `/` or `/search` - Search for events
- `/event/:id` - Event details page
- `/favorites` - View favorite events

## 📝 Features

- ✅ Event search with keyword, category, location, and distance filters
- ✅ Auto-detect user location
- ✅ Event details with tabs (Info, Artist, Venue)
- ✅ Spotify integration for artist information and albums
- ✅ Google Maps integration for venue location
- ✅ Add/remove events to/from favorites
- ✅ Persistent favorites stored in MongoDB
- ✅ Responsive design for mobile and desktop
- ✅ Share events on Facebook and Twitter
- ✅ Toast notifications for user actions
- ✅ Loading states and error handling

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB Atlas allows connections from `0.0.0.0/0` (Network Access)
- Check that environment variables are set correctly in `.env` and `app.yaml`

### Build Issues
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist` (in client folder)

### Deployment Issues
- Ensure `server/public/` contains the built frontend files
- Check Google App Engine logs: `gcloud app logs tail -s default`

## 📄 License

This project is for educational purposes as part of CSCI 571 at USC.