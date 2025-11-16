// index.js — main entry for your backend
// Loads env vars, starts Express, mounts route stubs, and (later) serves React build.

import "dotenv/config";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// Routers (the stubs you just created)
import eventsRouter from "./routes/events.js";
import spotifyRouter from "./routes/spotify.js";
import favoritesRouter from "./routes/favorites.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middlewares: security headers, gzip, logs, JSON body parsing
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://ipinfo.io", "https://maps.googleapis.com", "https://app-ticketmaster.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      fontSrc: ["'self'", "data:"],
    },
  },
}));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());

// Health check for quick "is server up?" tests
app.get("/health", (_req, res) => res.json({ ok: true }));

// MongoDB health check
app.get("/health/db", async (_req, res) => {
  try {
    const { getDb } = await import("./db/mongo.js");
    const db = await getDb();
    await db.admin().ping();
    res.json({ ok: true, mongodb: "connected" });
  } catch (error) {
    console.error("MongoDB health check failed:", error);
    res.status(500).json({ ok: false, mongodb: "disconnected", error: error.message });
  }
});

// Mount API routes
app.use("/api", eventsRouter);            // /api/searchEvents
app.use("/api/spotify", spotifyRouter);   // /api/spotify/artist
app.use("/api/favorites", favoritesRouter);

// ===== Serve React build in production (after you run `npm run build` in client/) =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// For GAE deployment, serve from ./public (copied from ../client/dist)
// For local dev, serve from ../client/dist
const clientDist = path.join(__dirname, "public");

// Serve static files if a build exists with proper MIME types
app.use(express.static(clientDist, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// SPA fallback: for non-API routes, return index.html so React Router can handle it
// This should only catch routes that don't match static files
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith("/api")) return next();
  
  // Skip if it's a request for a static asset (has file extension)
  if (req.path.match(/\.[a-zA-Z0-9]+$/)) return next();
  
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      // If index.html doesn't exist yet (dev mode), just return a simple message
      res.status(404).send("Frontend not built yet. Run 'npm run build' in client folder.");
    }
  });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start the server (GAE injects PORT in production)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});