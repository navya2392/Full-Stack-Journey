import { MongoClient } from "mongodb";

let client;
let clientPromise;

export async function getMongoClient() {
  if (!client) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI in .env");
    
    console.log('Creating new MongoDB client...');
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for cold starts
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    });
    
    // Store the connection promise
    if (!clientPromise) {
      console.log('Connecting to MongoDB...');
      clientPromise = client.connect();
    }
  }
  
  try {
    await clientPromise;
    console.log('MongoDB connected successfully');
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Reset client on error so it can be retried
    client = null;
    clientPromise = null;
    throw error;
  }
}

export async function getDb() {
  const dbName = process.env.MONGODB_DB || "hw3db";
  const cli = await getMongoClient();
  return cli.db(dbName);
}