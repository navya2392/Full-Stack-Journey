// routes/favorites.js
// Handles CRUD (Create, Read, Delete) operations for user favorites in MongoDB.

import { Router } from "express";
import { getDb } from "../db/mongo.js";
const router = Router();

// GET /api/favorites → list all saved favorites
router.get("/", async (req, res) => {
  console.log('GET /api/favorites - Fetching favorites...');
  try {
    // Add timeout to the database operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 10000)
    );
    
    const dbPromise = (async () => {
      const db = await getDb();
      const collection = db.collection(process.env.MONGODB_COLLECTION || "favorites");
      
      // Fetch all favorites, sorted by the order they were added (oldest first)
      return await collection.find({}).sort({ addedAt: 1 }).toArray();
    })();
    
    const favorites = await Promise.race([dbPromise, timeoutPromise]);
    console.log(`Found ${favorites.length} favorites`);
    
    res.json(favorites);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    
    // Send empty array instead of error to allow page to load
    if (error.message === 'Database operation timeout') {
      res.status(504).json([]);
    } else {
      res.status(500).json([]);
    }
  }
});

// POST /api/favorites → add a new favorite event
router.post("/", async (req, res) => {
  console.log('POST /api/favorites - Adding favorite...');
  try {
    const eventData = req.body;
    console.log('Event ID:', eventData?.id);
    
    // Validate that we have event data and an id
    if (!eventData || !eventData.id) {
      console.error('Missing event data or id');
      return res.status(400).json({ error: "Event data with id is required" });
    }
    
    const db = await getDb();
    const collection = db.collection(process.env.MONGODB_COLLECTION || "favorites");
    
    // Check if event already exists in favorites
    const existing = await collection.findOne({ id: eventData.id });
    if (existing) {
      console.log('Event already exists in favorites');
      return res.status(409).json({ error: "Event already in favorites" });
    }
    
    // Add timestamp for ordering
    const favoriteDoc = {
      ...eventData,
      addedAt: new Date()
    };
    
    const result = await collection.insertOne(favoriteDoc);
    console.log('Successfully added to favorites:', result.insertedId);
    
    res.status(201).json({ 
      message: "Event added to favorites",
      id: eventData.id,
      _id: result.insertedId
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({ error: "Failed to add to favorites" });
  }
});

// DELETE /api/favorites/:id → delete a favorite by event ID
router.delete("/:id", async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const db = await getDb();
    const collection = db.collection(process.env.MONGODB_COLLECTION || "favorites");
    
    // Delete by event id (not MongoDB _id)
    const result = await collection.deleteOne({ id: eventId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Event not found in favorites" });
    }
    
    res.json({ 
      message: "Event removed from favorites",
      id: eventId
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ error: "Failed to remove from favorites" });
  }
});

export default router;