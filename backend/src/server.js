// server.js

// ---------------------------
// Imports
// ---------------------------
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
//routes imports
import authRoutes from './routes/auth.routes.js';

// ---------------------------
// Load environment variables
// ---------------------------
dotenv.config();

// ---------------------------
// Create Express app
// ---------------------------
const app = express();

// ---------------------------
// Middleware
// ---------------------------
app.use(cors());
app.use(express.json());
//auth routes
app.use("/api/auth", authRoutes);


// ---------------------------
// Log environment info
// ---------------------------
console.log("Environment variables loaded successfully.");
console.log(`Running in ${process.env.NODE_ENV || "development"} mode`);
console.log(`Frontend URL: ${process.env.CLIENT_URL || "Not defined"}`);

// ---------------------------
// MongoDB Connection
// ---------------------------
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is missing in your .env file!");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'degree-plan-assistant', // replace with your DB name if needed
    });
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// ---------------------------
// Health check route
// ---------------------------
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend and .env variables are working correctly ✅",
    status: "ok",
    env: {
      NODE_ENV: process.env.NODE_ENV || "development",
      CLIENT_URL: process.env.CLIENT_URL || "undefined",
    },
  });
});

// ---------------------------
// Start server
// ---------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
