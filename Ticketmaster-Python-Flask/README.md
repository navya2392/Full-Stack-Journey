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
- Deploy easily using **Google App Engine**
- Backend using **Python/Flask**


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


