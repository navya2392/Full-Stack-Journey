# Ticketmaster Event Discovery App (Python + Flask)


A full-stack web application that allows users to search for live events using the Ticketmaster API. The app integrates Google Maps for event location visualization and dynamically updates search results with responsive front-end design.


---


## 🌐 Live Demo
**Hosted on Google Cloud App Engine:** [https://hw2-navya-2025.wl.r.appspot.com/](https://hw2-navya-2025.wl.r.appspot.com/)


---


## 🧠 Overview
This web application enables users to:
- Search for events based on **keywords, categories, location, and radius**.
- Retrieve event details using the **Ticketmaster Discovery API**.
- Display event location using **Google Maps embedding**.
- Use a responsive UI built with **HTML, CSS, and JavaScript (Vanilla JS)**.
- Deploy easily using **Google App Engine** with **Python/Flask** backend. 


---


## 🗂 Folder Structure
```
Ticketmaster-Python-Flask/
│
├── static/ # Contains CSS, JS, and images
│ ├── css/style.css
│ ├── js/app.js
│ └── images/background.jpg
│
├── templates/ # HTML templates rendered by Flask
│ └── index.html
│
├── app.yaml # GCP App Engine deployment config
├── main.py # Flask backend (routes, API integration)
├── .env # Environment variables (API keys)
├── requirements.txt # Python dependencies
├── README.md # Project documentation
└── .gcloudignore # Excludes unnecessary files from deployment
```


---


## ⚙️ How to Run Locally
- **Step 1:** Clone the repository
```bash
git clone https://github.com/navya2392/Full-Stack-Journey.git
cd Full-Stack-Journey/Ticketmaster-Python-Flask
```
- **Step 2:** Install dependencies
```bash
pip install -r requirements.txt
```
- **Step 3:** Create a `.env` file with your Ticketmaster API key:
```bash
TICKETMASTER_API_KEY=your_api_key_here
```
- **Step 4:** Run the Flask app
```bash
python main.py
```
- **Step 5:** Open your browser at `http://127.0.0.1:8080`


---


## 🧩 Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python (Flask)
- **APIs:** Ticketmaster Discovery API, Google Maps API
- **Deployment:** Google Cloud App Engine

## ⚙️ How It Works (Code Flow)

### **Frontend (index.html + app.js)**
- The search form captures:
  - Keyword, distance, category, and location.
  - An optional checkbox for **auto-detect location** using IP.
- On form submission:
  - JavaScript intercepts the event and validates required fields.
  - If auto-detect is checked, it calls the **IPInfo API** to get approximate coordinates.
  - Otherwise, it uses the **Google Geocoding API** to convert the entered address into latitude and longitude.
- Once coordinates are obtained:
  - The app sends a **GET request** to the Flask backend (`/api/search`) with all parameters.
  - The backend calls the **Ticketmaster Discovery API** and returns a list of events in JSON.
  - The JS script dynamically builds a **results table** with date, event name, genre, and venue.
  - Clicking an event calls another backend route (`/api/event/<id>`) to fetch event details and render a detail card.
  - “Show Venue Details” triggers another fetch (`/api/venue-search`) to display address and Google Maps + Ticketmaster links.

### **Backend (Flask)**
- Handles all API routing:
  - `/api/search` → Calls Ticketmaster Discovery API for nearby events.
  - `/api/event/<id>` → Fetches specific event details.
  - `/api/venue-search` → Retrieves venue info and related links.
- Merges data into JSON responses consumed by `app.js`.
- Uses environment variables (`.env`) for all API keys to keep them secure.

---

## 🎨 Frontend Features
- Built entirely with **custom CSS and Vanilla JavaScript** — no Bootstrap or frameworks.
- Responsive, centered layout with transparent panels and styled event tables.
- Hover effects, custom buttons, and themed badges for event status (On Sale, Off Sale, etc.).
- Scroll animations and toggle buttons for venue details.
- Background image configured through CSS with fixed positioning.




